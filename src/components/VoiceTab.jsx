import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { parseHinglishTransaction } from '../utils/hinglishParser.js';
import { hindiToHinglish } from '../utils/devanagariTransliterator.js';
import { DEMO_CHIPS } from '../data/seedData.js';
import {
  Mic, MicOff, Send, Plus, Minus, Edit3, Check, X,
  AlertTriangle, ChevronDown, MessageCircle, Copy, Undo2, Volume2
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────
function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

function buildReceiptText(shopName, txnId, timestamp, items, total, oldBal, newBal, customer, mode) {
  const date = new Date(timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  let lines = [
    `🧾 *${shopName}*`,
    `📅 ${date}`,
    `🆔 ${txnId}`,
    `👤 ${customer?.name || 'Walk-in'}`,
    `────────────────`,
  ];
  if (items.length > 0) {
    items.forEach(it => {
      lines.push(`▸ ${it.name}  ${it.qty} ${it.unit} × ${fmt(it.unitPrice)} = ${fmt(it.total)}`);
    });
  } else {
    lines.push(`▸ Wasooli (Jama)`);
  }
  lines.push(`────────────────`);
  lines.push(`💰 *Total: ${fmt(total)}*  (${mode})`);
  if (oldBal !== undefined && newBal !== undefined) {
    lines.push(`📊 Old Balance: ${fmt(oldBal)}`);
    lines.push(`📊 New Balance: ${fmt(newBal)}`);
  }
  lines.push(`\n_Powered by KiranaScan_`);
  return lines.join('\n');
}

// ─── COMPONENT ──────────────────────────────────────────────────
export default function VoiceTab({ store, isOnline, soundboxEnabled, lang, labels }) {
  // ──── state ─────────────────────
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [draft, setDraft] = useState(null);
  const [parseTimeMs, setParseTimeMs] = useState(null);
  const [wasEdited, setWasEdited] = useState(false);
  const [entryStartMs, setEntryStartMs] = useState(null);
  const [showChips, setShowChips] = useState(false);

  // new-customer form
  const [ncName, setNcName] = useState('');
  const [ncPehchan, setNcPehchan] = useState('');
  const [ncPhone, setNcPhone] = useState('');
  const [ncOpenBal, setNcOpenBal] = useState('');

  // post-confirm
  const [confirmedTxn, setConfirmedTxn] = useState(null);
  const [undoSecs, setUndoSecs] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);

  // manual-item addition
  const [showCustomPrice, setShowCustomPrice] = useState({});   // idx -> bool
  const [customPrices, setCustomPrices] = useState({});          // idx -> string

  const recognitionRef = useRef(null);
  const undoTimerRef = useRef(null);

  const [speechNotice, setSpeechNotice] = useState('');

  // ──── speech recognition ────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechNotice('Speech Recognition not supported in this browser. Please type or use Demo chips below.');
      setTimeout(() => setSpeechNotice(''), 4000);
      return;
    }
    try {
      const rec = new SR();
      rec.lang = 'hi-IN';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (e) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        const spoken = final || interim;
        if (spoken) {
          const hinglish = hindiToHinglish(spoken);
          setTranscript(hinglish);
          if (final) {
            setTimeout(() => doParse(hinglish), 60);
          }
        }
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (err) {
      setIsListening(false);
      setSpeechNotice('Microphone permission needed or busy.');
      setTimeout(() => setSpeechNotice(''), 3000);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ──── parse ─────────────────────
  const doParse = useCallback((text) => {
    if (!text.trim()) return;
    const result = parseHinglishTransaction(text.trim(), store.catalogue, store.customers);
    setDraft(result);
    setParseTimeMs(result.parseTimeMs);
    setWasEdited(false);
    setEntryStartMs(Date.now());
    setShowCustomPrice({});
    setCustomPrices({});

    // Pre-fill new-customer form if applicable
    if (result.isNewCustomer && result.customer) {
      setNcName(result.customer.name || '');
      setNcPehchan('');
      setNcPhone('');
      setNcOpenBal('');
    }
  }, [store.catalogue, store.customers]);

  // ──── chip click ────────────────
  const onChipClick = useCallback((chip) => {
    setTranscript(chip.text);
    // setTimeout so the textarea visually updates first
    setTimeout(() => doParse(chip.text), 50);
  }, [doParse]);

  // ──── draft mutations ───────────
  const markEdited = () => { if (!wasEdited) setWasEdited(true); };

  const setSelectedCustomer = (cust) => {
    markEdited();
    setDraft(prev => prev ? { ...prev, customer: cust, customerAmbiguous: false } : prev);
  };

  const setPaymentMode = (mode) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const isWasooli = mode === 'WASOOLI';
      return { ...prev, mode: isWasooli ? prev.mode : mode, type: isWasooli ? 'WASOOLI' : 'SALE', needsModeConfirmation: false };
    });
  };

  const updateItemQty = (idx, delta) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      const it = { ...items[idx] };
      const step = (it.unit === 'kg' || it.unit === 'L') ? 0.25 : 1;
      it.qty = Math.max(step, it.qty + delta * step);
      it.total = Math.round(it.qty * it.unitPrice * 100) / 100;
      items[idx] = it;
      return { ...prev, items, total: items.reduce((s, i) => s + i.total, 0) };
    });
  };

  const updateItemPrice = (idx, price) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      const it = { ...items[idx], unitPrice: price, needsPriceSelection: false };
      it.total = Math.round(it.qty * it.unitPrice * 100) / 100;
      items[idx] = it;
      return { ...prev, items, total: items.reduce((s, i) => s + i.total, 0) };
    });
  };

  const removeItem = (idx) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items, total: items.reduce((s, i) => s + i.total, 0) };
    });
  };

  const addManualItem = () => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const blank = { name: '', catalogueId: null, qty: 1, unit: 'pc', unitPrice: 0, total: 0, needsPriceSelection: false, isMultiBrand: false, variants: null, suggestedVariantIndex: null, isManual: true };
      return { ...prev, items: [...prev.items, blank] };
    });
  };

  const updateManualItemName = (idx, name) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[idx] = { ...items[idx], name };
      return { ...prev, items };
    });
  };

  const updateWasooliAmount = (amount) => {
    markEdited();
    setDraft(prev => prev ? { ...prev, total: amount } : prev);
  };

  // ──── confirm ───────────────────
  const canConfirm = useMemo(() => {
    if (!draft) return false;
    // Items resolved?
    if (draft.type === 'SALE' && draft.items.some(it => it.needsPriceSelection)) return false;
    // Customer must be known or new-customer name provided
    if (draft.isNewCustomer) {
      if (!ncName.trim()) return false;
    } else if (!draft.customer) return false;
    return true;
  }, [draft, ncName]);

  const needsClarification = useMemo(() => {
    if (!draft) return false;
    return draft.items?.some(it => it.needsPriceSelection) || draft.isNewCustomer || draft.needsModeConfirmation;
  }, [draft]);

  const handleConfirm = useCallback(() => {
    if (!draft || !canConfirm) return;

    // Prepare customer reference
    let finalDraft = { ...draft };

    if (draft.isNewCustomer) {
      const custData = {
        name: ncName.trim(),
        pehchan: ncPehchan.trim() || 'General Customer',
        phone: ncPhone.trim(),
        openingBalance: parseFloat(ncOpenBal) || 0
      };
      finalDraft.customer = { ...custData, id: null, isNew: true, balance: custData.openingBalance };
    }

    finalDraft.wasEdited = wasEdited;
    const result = store.confirmTransaction(finalDraft, isOnline);

    // Compute balances for receipt
    const cust = store.customers.find(c => c.name === (finalDraft.customer?.name));
    const oldBal = (cust?.balance || finalDraft.customer?.balance || finalDraft.customer?.openingBalance || 0);
    let newBal = oldBal;
    if (finalDraft.type === 'WASOOLI') newBal = Math.max(0, oldBal - finalDraft.total);
    else if (finalDraft.mode === 'UDHAAR') newBal = oldBal + finalDraft.total;

    // Stats
    const entryMs = entryStartMs ? Date.now() - entryStartMs : 2000;
    store.updateSessionStats({
      totalParsed: (store.sessionStats?.totalParsed || 0) + 1,
      firstTryAccurate: (store.sessionStats?.firstTryAccurate || 0) + (wasEdited ? 0 : 1),
      totalEntryTimeMs: (store.sessionStats?.totalEntryTimeMs || 0) + entryMs,
      draftsEdited: (store.sessionStats?.draftsEdited || 0) + (wasEdited ? 1 : 0),
    });

    // Soundbox TTS - Accurate situation-aware voice feedback
    if (soundboxEnabled && window.speechSynthesis) {
      const cName = finalDraft.customer?.name ? finalDraft.customer.name.split(' ')[0] : 'Grahak';
      let speechText = '';
      if (finalDraft.type === 'WASOOLI' || finalDraft.mode === 'WASOOLI') {
        speechText = `${cName} ji ne ${finalDraft.total} rupaye jama kiye. Ab baaki bache ${newBal} rupaye.`;
      } else if (finalDraft.mode === 'UPI') {
        speechText = `${cName} ji ne ${finalDraft.total} rupaye UPI se diye.`;
      } else if (finalDraft.mode === 'CASH') {
        speechText = `${cName} ji ne ${finalDraft.total} rupaye cash diye.`;
      } else { // UDHAAR
        speechText = `${cName} ji ke khate mein ${finalDraft.total} rupaye udhaar darj hue. Kul baaki ${newBal} rupaye.`;
      }
      const utt = new SpeechSynthesisUtterance(speechText);
      utt.lang = 'hi-IN';
      window.speechSynthesis.speak(utt);
    }

    setConfirmedTxn({ ...result, draft: finalDraft, oldBal, newBal });
    setShowReceipt(true);

    // Undo countdown
    setUndoSecs(5);
    let sec = 5;
    clearInterval(undoTimerRef.current);
    undoTimerRef.current = setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(undoTimerRef.current);
        setUndoSecs(0);
      } else setUndoSecs(sec);
    }, 1000);
  }, [draft, canConfirm, ncName, ncPehchan, ncPhone, ncOpenBal, wasEdited, entryStartMs, isOnline, soundboxEnabled, store]);

  const handleUndo = useCallback(() => {
    store.undoLastTransaction();
    clearInterval(undoTimerRef.current);
    setUndoSecs(0);
    setConfirmedTxn(null);
    setShowReceipt(false);
  }, [store]);

  const resetAll = useCallback(() => {
    setDraft(null);
    setTranscript('');
    setParseTimeMs(null);
    setConfirmedTxn(null);
    setShowReceipt(false);
    setWasEdited(false);
    setEntryStartMs(null);
    setShowCustomPrice({});
    setCustomPrices({});
  }, []);

  // Cleanup
  useEffect(() => () => clearInterval(undoTimerRef.current), []);

  // ──── computed ──────────────────
  const customer = draft?.customer;
  const oldBal = useMemo(() => {
    if (!draft?.customer?.id) return draft?.customer?.openingBalance || parseFloat(ncOpenBal) || 0;
    const c = store.customers.find(c => c.id === draft.customer.id);
    return c?.balance || 0;
  }, [draft, store.customers, ncOpenBal]);

  const newBal = useMemo(() => {
    if (!draft) return 0;
    if (draft.type === 'WASOOLI') return Math.max(0, oldBal - draft.total);
    if (draft.mode === 'UDHAAR') return oldBal + draft.total;
    return oldBal;
  }, [draft, oldBal]);

  const shopName = store?.shopName || labels?.appName || 'Gupta Kirana & General Store';

  // ── payment pills config ──
  const paymentModes = [
    { key: 'UDHAAR', label: labels?.udhaar || 'Udhaar', color: 'bg-amber-bg text-amber-text border-amber', activeColor: 'bg-[#E68A00] text-white border-[#E68A00]' },
    { key: 'CASH', label: labels?.cash || 'Cash', color: 'bg-trust-light text-trust border-trust-light', activeColor: 'bg-trust text-white border-trust' },
    { key: 'UPI', label: labels?.upi || 'UPI', color: 'bg-upi-bg text-upi border-upi-bg', activeColor: 'bg-upi text-white border-upi' },
    { key: 'WASOOLI', label: labels?.wasooli || 'Wasooli (Jama)', color: 'bg-trust-light text-trust border-trust-light', activeColor: 'bg-trust text-white border-trust' },
  ];

  // ─────────────────────────────── RENDER ───────────────────────────
  return (
    <div className="flex flex-col min-h-full justify-between pb-24">

      {/* ── TOP SECTION: SAMPLE VOICE CHIPS (COLLAPSIBLE) ── */}
      <div className="pt-1">
        <button
          onClick={() => setShowChips(prev => !prev)}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-stone-100/80 dark:bg-[#182026] text-xs font-semibold text-stone-700 dark:text-gray-300 hover:bg-stone-200/80 dark:hover:bg-[#222C35] transition-colors mb-1.5"
        >
          <span className="flex items-center gap-1.5">
            ⚡ {labels?.demoChips || 'Sample Voice Commands (Tap to Test)'}
          </span>
          <ChevronDown size={14} className={`transform transition-transform duration-200 ${showChips ? 'rotate-180' : ''}`} />
        </button>

        {showChips && (
          <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 scrollbar-hide animate-fade-in">
            {DEMO_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => {
                  onChipClick(chip);
                  setShowChips(false);
                }}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1E252D] border border-stone-200 dark:border-[#2F3844] text-xs font-medium text-stone-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500 transition-all shadow-sm whitespace-nowrap active:scale-95"
              >
                {chip.emoji} {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MIDDLE SECTION: HERO SPEAK OR CONFIRMATION CARD ── */}
      <div className="flex-1 flex flex-col justify-center my-4">
        {!draft || confirmedTxn ? (
          /* Centered Big Voice Counter (Hero Middle State) */
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center fade-in">
            {/* Ripple rings around mic */}
            <div className="relative flex items-center justify-center mb-5">
              {isListening && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-red-500/20 animate-ping" />
                  <div className="absolute w-44 h-44 rounded-full bg-red-500/10 animate-pulse" />
                </>
              )}
              {!isListening && (
                <div className="absolute w-32 h-32 rounded-full bg-trust/10 dark:bg-trust/20 animate-pulse" />
              )}

              <button
                onClick={isListening ? stopListening : startListening}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isListening
                    ? 'bg-danger text-white mic-pulse ring-4 ring-red-300 dark:ring-red-900'
                    : 'bg-[#1B7A43] text-white hover:bg-[#145E33] hover:scale-105 active:scale-95 ring-4 ring-green-100 dark:ring-green-950/40'
                }`}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
              >
                {isListening ? (
                  /* Animated waveform bars */
                  <div className="flex items-center gap-1 h-10">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <span
                        key={i}
                        className="wave-bar w-1.5 rounded-full bg-white inline-block"
                        style={{ animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <Mic size={44} />
                )}
              </button>
            </div>

            <h3 className="text-base font-bold text-text dark:text-white mb-1">
              {isListening ? '🔴 Listening… Bolna Shuru Karein' : 'Bol Kar Likhein (Tap to Speak)'}
            </h3>

            <p className="text-xs text-text-secondary dark:text-gray-400 max-w-xs leading-relaxed">
              {isListening
                ? 'Hindi ya Hinglish mein bolein, jaise: "Ramesh ko 2 kilo aata aur 1 soap udhaar"'
                : 'Hinglish ya Hindi mein bolein — bill turant draft ho jayega'}
            </p>

            {speechNotice && (
              <div className="mt-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 animate-fade-in max-w-xs">
                ℹ️ {speechNotice}
              </div>
            )}

            {parseTimeMs !== null && (
              <div className="mt-3">
                <span className="text-[11px] bg-trust-light dark:bg-trust/20 text-trust dark:text-green-400 font-semibold px-2.5 py-1 rounded-full border border-trust/20">
                  ⚡ Parsed in {parseTimeMs}ms
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Confirmation Card when draft is active */
          <div className="bg-white dark:bg-[#151F28] rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] shadow-md overflow-hidden fade-in">
            {/* Card header */}
            <div className="bg-emerald-50 dark:bg-[#1E293B] px-4 py-2.5 flex items-center justify-between border-b border-[#E2D9C8] dark:border-[#2A3644]">
              <span className="text-xs font-bold text-[#1B7A43] dark:text-emerald-400 tracking-wide uppercase">
                {labels?.approvalRequired || 'APPROVAL REQUIRED'}
              </span>
              <button
                onClick={resetAll}
                className="text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Discard draft"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* ── a. Customer badge ──────────── */}
              {customer && !draft.isNewCustomer && (
                <div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    customer.id
                      ? 'bg-trust-light dark:bg-trust/20 text-trust dark:text-green-300'
                      : 'bg-amber-bg dark:bg-amber-950/40 text-amber-text dark:text-amber-300'
                  }`}>
                    <span>👤 {customer.name}</span>
                    {customer.pehchan && (
                      <span className="text-[11px] opacity-80 font-normal">· {customer.pehchan}</span>
                    )}
                    {customer.phone && (
                      <span className="text-[11px] opacity-70 font-normal">📞 {customer.phone}</span>
                    )}
                  </div>

                  {/* Ambiguous customer switcher */}
                  {draft.customerAmbiguous && draft.customerCandidates?.length > 1 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-[11px] text-amber-text dark:text-amber-400 font-medium w-full">
                        ⚠️ Multiple matches — tap to select:
                      </span>
                      {draft.customerCandidates.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCustomer(c)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            customer.id === c.id
                              ? 'bg-trust text-white border-trust'
                              : 'bg-white dark:bg-[#242C35] text-text dark:text-gray-200 border-border dark:border-[#2F3844] hover:border-trust'
                          }`}
                        >
                          {c.name} <span className="opacity-70">({c.pehchan} · {fmt(c.balance)})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── b. New customer inline form ── */}
              {draft.isNewCustomer && (
                <div className="bg-amber-bg/50 dark:bg-amber-950/30 rounded-xl p-3 border border-[#E68A00]/20 dark:border-amber-800/40">
                  <p className="text-xs font-bold text-amber-text dark:text-amber-400 mb-2">🆕 New Customer — Fill Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] text-text-secondary dark:text-gray-400">Name (नाम) *</label>
                      <input
                        value={ncName}
                        onChange={e => setNcName(e.target.value)}
                        className="w-full border border-border dark:border-[#2F3844] rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#151B22] text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-trust/40"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] text-text-secondary dark:text-gray-400">Pehchan / Landmark Tag (Optional)</label>
                      <input
                        value={ncPehchan}
                        onChange={e => setNcPehchan(e.target.value)}
                        placeholder="e.g. Chai wala, Gali No. 4 (optional)"
                        className="w-full border border-border dark:border-[#2F3844] rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#151B22] text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-trust/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-text-secondary dark:text-gray-400">WhatsApp Phone (optional)</label>
                      <input
                        value={ncPhone}
                        onChange={e => setNcPhone(e.target.value)}
                        placeholder="98765…"
                        className="w-full border border-border dark:border-[#2F3844] rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#151B22] text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-trust/40"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-text-secondary dark:text-gray-400">Opening Balance ₹ (optional)</label>
                      <input
                        type="number"
                        value={ncOpenBal}
                        onChange={e => setNcOpenBal(e.target.value)}
                        placeholder="0"
                        className="w-full border border-border dark:border-[#2F3844] rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#151B22] text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-trust/40"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── c. Payment mode selector ──── */}
              <div>
                <p className="text-[11px] text-text-secondary dark:text-gray-400 font-medium mb-1.5">Payment Mode</p>
                <div className={`flex gap-2 flex-wrap rounded-xl p-1 ${
                  draft.needsModeConfirmation ? 'ring-2 ring-[#E68A00] ring-offset-1 animate-pulse' : ''
                }`}>
                  {paymentModes.map(pm => {
                    const isActive = (draft.type === 'WASOOLI' && pm.key === 'WASOOLI') ||
                                     (draft.type !== 'WASOOLI' && draft.mode === pm.key && pm.key !== 'WASOOLI');
                    return (
                      <button
                        key={pm.key}
                        onClick={() => setPaymentMode(pm.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isActive ? pm.activeColor : pm.color
                        }`}
                      >
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── d. Clarification banner ───── */}
              {needsClarification && (
                <div className="flex items-center gap-2 bg-warn-bg dark:bg-amber-950/50 border border-warn-border dark:border-amber-700 rounded-xl px-3 py-2 text-xs text-[#92400E] dark:text-amber-200">
                  <AlertTriangle size={14} className="text-warn-border flex-shrink-0" />
                  <span>⚠️ Please resolve highlighted items before confirming</span>
                </div>
              )}

              {/* ── e. Editable line items ────── */}
              {draft.type === 'WASOOLI' ? (
                /* Wasooli amount */
                <div className="bg-trust-light/50 dark:bg-trust/10 rounded-xl p-3 border border-trust/10 dark:border-trust/30">
                  <p className="text-xs font-medium text-trust dark:text-green-400 mb-1">Wasooli (Jama) Amount</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-trust dark:text-green-400">₹</span>
                    <input
                      type="number"
                      value={draft.total || ''}
                      onChange={e => updateWasooliAmount(parseFloat(e.target.value) || 0)}
                      className="w-28 border border-trust/20 rounded-lg px-2.5 py-1.5 text-lg font-bold text-trust dark:text-green-400 bg-white dark:bg-[#151B22] focus:outline-none focus:ring-2 focus:ring-trust/40"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-text-secondary dark:text-gray-400 font-medium">Line Items</p>
                  {draft.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3 transition-colors ${
                        item.needsPriceSelection
                          ? 'border-[#E68A00] bg-amber-bg/30 dark:bg-amber-950/20'
                          : 'border-border dark:border-[#2F3844] bg-[#FAFAF7] dark:bg-[#151B22]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {item.isManual ? (
                          <input
                            value={item.name}
                            onChange={e => updateManualItemName(idx, e.target.value)}
                            placeholder="Item name"
                            className="text-sm font-semibold text-text dark:text-white bg-transparent border-b border-dashed border-text-secondary focus:outline-none focus:border-trust w-32"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-text dark:text-white">{item.name}</span>
                        )}
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-text-secondary dark:text-gray-400 hover:text-danger dark:hover:text-red-400 transition-colors p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 bg-white dark:bg-[#242C35] rounded-lg border border-border dark:border-[#2F3844]">
                          <button
                            onClick={() => updateItemQty(idx, -1)}
                            className="p-1.5 text-text-secondary dark:text-gray-400 hover:text-danger transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold min-w-[32px] text-center text-text dark:text-white">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateItemQty(idx, 1)}
                            className="p-1.5 text-text-secondary dark:text-gray-400 hover:text-trust transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-[11px] text-text-secondary dark:text-gray-400">{item.unit}</span>
                        <span className="text-xs text-text-secondary dark:text-gray-400 ml-auto">× {fmt(item.unitPrice)}</span>
                        <span className="text-sm font-bold text-text dark:text-white">= {fmt(item.total)}</span>
                      </div>

                      {/* Price selection for multi-brand */}
                      {item.needsPriceSelection && item.isMultiBrand && item.variants && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.variants.map((v, vi) => (
                            <button
                              key={vi}
                              onClick={() => updateItemPrice(idx, v.price)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                                vi === item.suggestedVariantIndex
                                  ? 'bg-trust-light dark:bg-trust/30 border-trust text-trust dark:text-green-300 font-semibold'
                                  : 'bg-white dark:bg-[#242C35] border-border dark:border-[#2F3844] text-text dark:text-gray-200 hover:border-trust'
                              }`}
                            >
                              {v.label}
                            </button>
                          ))}
                          {/* Custom price chip */}
                          {!showCustomPrice[idx] ? (
                            <button
                              onClick={() => setShowCustomPrice(p => ({ ...p, [idx]: true }))}
                              className="text-[11px] px-2.5 py-1 rounded-full border border-dashed border-text-secondary text-text-secondary hover:border-trust hover:text-trust transition-colors"
                            >
                              Custom ₹
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                autoFocus
                                value={customPrices[idx] || ''}
                                onChange={e => setCustomPrices(p => ({ ...p, [idx]: e.target.value }))}
                                placeholder="₹"
                                className="w-16 text-[11px] border border-trust rounded-lg px-2 py-1 bg-white dark:bg-[#151B22] text-text dark:text-white focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  updateItemPrice(idx, parseFloat(customPrices[idx]) || 0);
                                  setShowCustomPrice(p => ({ ...p, [idx]: false }));
                                }}
                                className="text-trust hover:text-trust-hover"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Editable price for non multi-brand */}
                      {!item.isMultiBrand && !item.isManual && (
                        <div className="flex items-center gap-1 mt-1">
                          <Edit3 size={11} className="text-text-secondary dark:text-gray-400" />
                          <span className="text-[11px] text-text-secondary dark:text-gray-400">Price: ₹</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-16 text-[11px] border border-border dark:border-[#2F3844] bg-white dark:bg-[#151B22] text-text dark:text-white rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-trust/40"
                          />
                        </div>
                      )}

                      {/* Manual item price input */}
                      {item.isManual && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-text-secondary dark:text-gray-400">Price: ₹</span>
                          <input
                            type="number"
                            value={item.unitPrice || ''}
                            onChange={e => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 text-[11px] border border-border dark:border-[#2F3844] bg-white dark:bg-[#151B22] text-text dark:text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-trust/40"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add manual item */}
                  <button
                    onClick={addManualItem}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-trust dark:text-green-400 border border-dashed border-trust/40 rounded-xl py-2 hover:bg-trust-light dark:hover:bg-trust/10 transition-colors"
                  >
                    <Plus size={14} /> Add Manual Item
                  </button>
                </div>
              )}

              {/* ── f. Balance impact preview ── */}
              {customer && (
                <div
                  className={`rounded-xl px-3 py-2.5 text-xs font-medium balance-flash ${
                    draft.type === 'WASOOLI'
                      ? 'bg-trust-light dark:bg-trust/20 text-trust dark:text-green-300'
                      : (draft.mode === 'UDHAAR'
                          ? 'bg-amber-bg dark:bg-amber-950/40 text-amber-text dark:text-amber-300'
                          : 'bg-[#F3F4F6] dark:bg-[#242C35] text-text-secondary dark:text-gray-300')
                  }`}
                >
                  {draft.type === 'WASOOLI' || draft.mode === 'WASOOLI' ? (
                    <span>
                      Customer Balance: {fmt(oldBal)} → <strong>{fmt(newBal)}</strong>{' '}
                      <span className="text-trust dark:text-green-400">(-{fmt(draft.total)} Jama)</span>
                    </span>
                  ) : draft.mode === 'UDHAAR' ? (
                    <span>
                      Customer Balance: {fmt(oldBal)} → <strong>{fmt(newBal)}</strong>{' '}
                      <span className="text-[#B36B00] dark:text-amber-400">(+{fmt(draft.total)} Udhaar)</span>
                    </span>
                  ) : (
                    <span>{fmt(draft.total)} {draft.mode} Sale — No credit impact</span>
                  )}
                </div>
              )}

              {/* ── g. Confirm button ────────── */}
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  canConfirm
                    ? 'bg-trust text-white hover:bg-trust-hover active:scale-[0.98]'
                    : 'bg-amber-bg dark:bg-amber-950/40 text-amber-text dark:text-amber-300 cursor-not-allowed'
                }`}
              >
                {canConfirm
                  ? (labels?.confirm || '✓ Confirm Transaction (Save to Ledger)')
                  : (labels?.pendingConfirm || '⚠️ Select Missing Price Above to Confirm')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM PINNED SECTION: CHAT-STYLE TEXT INPUT BAR ── */}
      <div className="pt-2 sticky bottom-0 bg-[#FAF6F0] dark:bg-[#0B1116] pb-1 z-30">
        <div className="flex items-center gap-2 bg-white dark:bg-[#151F28] rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] shadow-md p-2">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-100 dark:bg-emerald-950/60 text-[#1B7A43] dark:text-emerald-400 hover:bg-[#1B7A43] hover:text-white'
            }`}
            title={isListening ? 'Stop Mic' : 'Start Mic'}
          >
            <Mic size={20} />
          </button>

          <input
            type="text"
            className="flex-1 px-3 py-2 text-sm bg-transparent border-0 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') doParse(transcript);
            }}
            placeholder={isListening ? 'Listening… (speak in Hindi or Hinglish)' : 'Type or speak: e.g. Ramesh ko 2kg aata udhaar...'}
          />

          {transcript && (
            <button
              onClick={() => setTranscript('')}
              className="text-text-secondary dark:text-gray-400 hover:text-danger p-1"
            >
              <X size={16} />
            </button>
          )}

          <button
            onClick={() => doParse(transcript)}
            disabled={!transcript.trim()}
            className="w-10 h-10 rounded-xl bg-trust hover:bg-trust-hover text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 shrink-0"
            title="Parse / Process"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* ── 4. POST-CONFIRM: UNDO BANNER ─────────────── */}
      {confirmedTxn && undoSecs > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md slide-up">
          <button
            onClick={handleUndo}
            className="w-full flex items-center justify-between bg-slate-900 dark:bg-slate-800 text-white rounded-xl px-4 py-3 shadow-xl border border-slate-700/50"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Undo2 size={16} /> {labels?.undoToast || '↩️ Undo Last Entry'}
            </span>
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{undoSecs}s</span>
          </button>
        </div>
      )}

      {/* ── 5. WHATSAPP RECEIPT MODAL ─────────────────── */}
      {showReceipt && confirmedTxn && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setShowReceipt(false); resetAll(); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden fade-in" onClick={e => e.stopPropagation()}>
            {/* Receipt header */}
            <div className="bg-trust px-4 py-3 flex items-center justify-between">
              <span className="text-white text-sm font-bold">🧾 Receipt / Raseed</span>
              <button onClick={() => { setShowReceipt(false); resetAll(); }} className="text-white/80 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-4 text-sm space-y-2">
              <p className="font-bold text-trust text-center">{shopName}</p>
              <p className="text-[11px] text-text-secondary text-center">
                {new Date(confirmedTxn.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                <span className="ml-2 opacity-70">{confirmedTxn.txnId}</span>
              </p>

              <div className="border-t border-dashed border-border my-2" />

              <p className="text-xs font-semibold">👤 {confirmedTxn.draft.customer?.name || 'Walk-in'}</p>

              {/* Items */}
              {confirmedTxn.draft.items.length > 0 ? (
                <div className="space-y-1">
                  {confirmedTxn.draft.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{it.name} ({it.qty} {it.unit} × {fmt(it.unitPrice)})</span>
                      <span className="font-semibold">{fmt(it.total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-trust font-medium">Wasooli (Jama) — {fmt(confirmedTxn.draft.total)}</p>
              )}

              <div className="border-t border-dashed border-border my-2" />

              <div className="flex justify-between text-sm font-bold">
                <span>Total ({confirmedTxn.draft.mode})</span>
                <span>{fmt(confirmedTxn.draft.total)}</span>
              </div>

              {confirmedTxn.oldBal !== undefined && (
                <div className="bg-[#F9FAFB] rounded-lg p-2 space-y-0.5 text-xs">
                  <div className="flex justify-between"><span>Old Balance</span><span>{fmt(confirmedTxn.oldBal)}</span></div>
                  <div className="flex justify-between font-bold"><span>New Balance</span><span>{fmt(confirmedTxn.newBal)}</span></div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <a
                  href={`https://wa.me/91${confirmedTxn.draft.customer?.phone || ''}?text=${encodeURIComponent(
                    buildReceiptText(shopName, confirmedTxn.txnId, confirmedTxn.timestamp, confirmedTxn.draft.items, confirmedTxn.draft.total, confirmedTxn.oldBal, confirmedTxn.newBal, confirmedTxn.draft.customer, confirmedTxn.draft.mode)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white font-semibold text-xs rounded-xl py-2.5 hover:bg-[#1EBE5D] transition-colors"
                >
                  <MessageCircle size={14} /> {labels?.sendWhatsApp || '📲 Send on WhatsApp'}
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      buildReceiptText(shopName, confirmedTxn.txnId, confirmedTxn.timestamp, confirmedTxn.draft.items, confirmedTxn.draft.total, confirmedTxn.oldBal, confirmedTxn.newBal, confirmedTxn.draft.customer, confirmedTxn.draft.mode)
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#F3F4F6] text-text font-semibold text-xs rounded-xl py-2.5 hover:bg-border transition-colors"
                >
                  {copied ? <><Check size={14} className="text-trust" /> Copied!</> : <><Copy size={14} /> {labels?.copyReceipt || '📋 Copy Receipt'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
