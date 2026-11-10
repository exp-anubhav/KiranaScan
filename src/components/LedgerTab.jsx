import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Plus, Camera, User, Phone, MapPin,
  ChevronRight, ChevronDown, Clock, Hash,
  ArrowDownCircle, MessageCircle, Trash2, RefreshCw, Sparkles, FileText,
  ExternalLink, X, Check, Edit3, Eye, Copy, Upload, AlertCircle
} from 'lucide-react';
import {
  scanBahiKhataImage,
  parseBahiKhataOcrText,
  createSampleNotebookImageFile,
} from '../utils/bahiKhataOcr.js';

function Backdrop({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#16202A] text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-[#E2D9C8] dark:border-[#2A3644]"
           onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ───── scan-line keyframe (injected once) ───── */
const SCAN_STYLE_ID = 'ledger-scan-style';
if (typeof document !== 'undefined' && !document.getElementById(SCAN_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = SCAN_STYLE_ID;
  style.textContent = `
    @keyframes scanLine {
      0%   { top: 4px; opacity: 0.95; }
      100% { top: calc(100% - 6px); opacity: 0.95; }
    }
    .scan-line {
      position: absolute;
      left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, #22c55e 20%, #16a34a 50%, #22c55e 80%, transparent 100%);
      box-shadow: 0 0 12px 3px rgba(34,197,94,0.5);
      animation: scanLine 1.5s ease-in-out infinite alternate;
      z-index: 10;
      border-radius: 2px;
    }
  `;
  document.head.appendChild(style);
}

export default function LedgerTab({ store, isOnline, lang, labels }) {
  const L = labels;

  /* ───── state ───── */
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Modals
  const [showNewCust, setShowNewCust] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showWasooli, setShowWasooli] = useState(null);        // custId
  const [showWhatsApp, setShowWhatsApp] = useState(null);      // customer obj

  // New Customer form
  const [newName, setNewName] = useState('');
  const [newPehchan, setNewPehchan] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBalance, setNewBalance] = useState('');

  // Wasooli form
  const [wasooliAmt, setWasooliAmt] = useState('');
  const [wasooliMode, setWasooliMode] = useState('CASH');

  // OCR state (populated strictly from user's uploaded photo)
  const [ocrStage, setOcrStage] = useState('idle'); // idle | scanning | review
  const [ocrImageFile, setOcrImageFile] = useState(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState('');
  const [ocrData, setOcrData] = useState([]);
  const [ocrRawText, setOcrRawText] = useState('');
  const [ocrProgress, setOcrProgress] = useState({ progress: 0, status: '' });
  const [ocrEngineUsed, setOcrEngineUsed] = useState('');
  const [ocrNotice, setOcrNotice] = useState('');
  const [ocrLang, setOcrLang] = useState('eng+hin');
  const [showRawText, setShowRawText] = useState(false);
  const [showPhotoZoom, setShowPhotoZoom] = useState(false);
  const [showGeminiConfig, setShowGeminiConfig] = useState(false);
  const [geminiKeyDraft, setGeminiKeyDraft] = useState(() => localStorage.getItem('kiranascan_gemini_key') || '');
  const ocrScanIdRef = useRef(0);

  // Clean up Object URLs on change / unmount
  useEffect(() => {
    return () => {
      if (ocrPreviewUrl) URL.revokeObjectURL(ocrPreviewUrl);
    };
  }, [ocrPreviewUrl]);

  // WhatsApp tone
  const [whatsappTone, setWhatsappTone] = useState('polite');
  const [copyFeedback, setCopyFeedback] = useState('');

  /* ───── helpers ───── */
  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const today = new Date().toLocaleDateString('hi-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const uniqueCustomers = useMemo(() => {
    const seenIds = new Set();
    const seenNames = new Set();
    return (store.customers || []).filter(c => {
      const idKey = (c.id || '').trim();
      const nameKey = (c.name || '').trim().toLowerCase();
      if ((idKey && seenIds.has(idKey)) || (nameKey && seenNames.has(nameKey))) return false;
      if (idKey) seenIds.add(idKey);
      if (nameKey) seenNames.add(nameKey);
      return true;
    });
  }, [store.customers]);

  const filtered = uniqueCustomers
    .filter(c => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        (c.phone || '').includes(s) ||
        (c.pehchan || '').toLowerCase().includes(s)
      );
    })
    .sort((a, b) => b.balance - a.balance);

  /* ───── modal helpers ───── */
  const handleSaveCustomer = () => {
    if (!newName.trim()) return;
    store.addCustomer({
      name: newName.trim(),
      pehchan: newPehchan.trim(),
      phone: newPhone.trim(),
      openingBalance: Number(newBalance) || 0,
    });
    setNewName(''); setNewPehchan(''); setNewPhone(''); setNewBalance('');
    setShowNewCust(false);
  };

  const handleWasooli = () => {
    const amt = Number(wasooliAmt);
    if (!amt || amt <= 0) return;
    store.recordWasooli(showWasooli, amt, wasooliMode, isOnline);
    setWasooliAmt(''); setWasooliMode('CASH'); setShowWasooli(null);
  };

  const handleSelectOcrFile = (file) => {
    if (!file) return;
    setOcrPreviewUrl(URL.createObjectURL(file));
    setOcrImageFile(file);
    setOcrData([]);
    setOcrRawText('');
    setOcrNotice('');
    setOcrEngineUsed('');
    setShowRawText(false);
    setShowPhotoZoom(false);
    setOcrStage('idle');
  };

  const resetOcrModal = () => {
    ocrScanIdRef.current += 1;
    setShowOCR(false);
    setOcrStage('idle');
    setOcrImageFile(null);
    setOcrPreviewUrl('');
    setOcrData([]);
    setOcrRawText('');
    setOcrNotice('');
    setOcrProgress({ progress: 0, status: '' });
    setShowRawText(false);
    setShowPhotoZoom(false);
  };

  const startOCRScan = async (fileOverride = null) => {
    const targetFile = fileOverride || ocrImageFile;
    if (!targetFile) {
      setOcrNotice('Kripya pehle Gallery se ya Camera se apna Bahi-Khata photo chunein.');
      return;
    }

    const scanId = ++ocrScanIdRef.current;
    setOcrStage('scanning');
    setOcrNotice('');
    setOcrProgress({ progress: 5, status: 'Preparing your uploaded image...' });

    try {
      const apiKey = (localStorage.getItem('kiranascan_gemini_key') || geminiKeyDraft || '').trim();
      const result = await scanBahiKhataImage(targetFile, {
        geminiApiKey: apiKey,
        ocrLang,
        onProgress: (info) => {
          if (ocrScanIdRef.current === scanId) {
            setOcrProgress({ progress: info.progress || 0, status: info.status || 'Scanning...' });
          }
        },
      });

      if (ocrScanIdRef.current !== scanId) return;

      setOcrRawText(result.rawText || '');
      setOcrData(result.entries || []);
      setOcrEngineUsed(result.engine || '');
      const hasEntries = (result.entries || []).length > 0;
      const hasRaw = Boolean(result.rawText);
      // Always show warning (shadow / tips) if present
      if (result.warning) {
        setOcrNotice(result.warning);
      }
      if (!hasEntries) {
        // Show raw text editor automatically so user can see what was scanned
        if (hasRaw) setShowRawText(true);
        // If no existing warning set, set a helpful one
        if (!result.warning) {
          setOcrNotice(
            hasRaw
              ? 'Text padha gaya par clear Name + ₹ Balance rows nahi bane. Neeche Raw Text edit karein ya manual rows jodein.'
              : 'Is photo se clear text nahi mil paya. Photo mein shadow ho sakta hai ya handwriting bahut cursive hai. Neeche tips dekhein.'
          );
        }
      }
      setOcrStage('review');
    } catch (err) {
      if (ocrScanIdRef.current !== scanId) return;
      setOcrStage('idle');
      setOcrNotice(err?.message || 'Image scan nahi ho paya. Kripya clear photo dubara chunein.');
    }
  };

  const handleLoadSamplePhoto = async () => {
    try {
      const sampleFile = await createSampleNotebookImageFile();
      handleSelectOcrFile(sampleFile);
    } catch (err) {
      setOcrNotice(err?.message || 'Sample photo create nahi ho paya.');
    }
  };

  const handleReparseRawText = () => {
    const parsed = parseBahiKhataOcrText(ocrRawText);
    setOcrData(parsed);
    if (parsed.length === 0) {
      setOcrNotice('Har line mein "Naam - Pehchan - ₹Balance" likh kar dubara Re-parse karein.');
    } else {
      setOcrNotice('');
    }
  };

  const handleSaveGeminiKeyInline = () => {
    const trimmed = geminiKeyDraft.trim();
    if (trimmed) {
      localStorage.setItem('kiranascan_gemini_key', trimmed);
      setOcrNotice('Gemini Vision key saved! Ab Scan dabayein.');
    } else {
      localStorage.removeItem('kiranascan_gemini_key');
    }
    setShowGeminiConfig(false);
  };

  const handleOCRImport = () => {
    const validRows = ocrData.filter((d) => (d.name || '').trim());
    if (validRows.length === 0) return;
    store.importOCRCustomers(validRows);
    resetOcrModal();
  };

  const getWhatsAppMsg = (cust, tone) => {
    const name = cust.name;
    const bal = cust.balance;
    if (tone === 'polite')
      return `Namaste ${name} ji! Aapke Gupta Kirana Store mein ₹${bal} baaki hai. Jab bhi aapko suvidha ho, wasooli kar dijiye. Dhanyavaad! 🙏`;
    if (tone === 'standard')
      return `Gupta Kirana Store - Hisab Slip\nGrahak: ${name}\nBaaki Raashi: ₹${bal}\nDinank: ${today}\nKripya jald se jald bhugtaan karein.\nUPI: gupta.kirana@upi`;
    return `Namaste ${name} ji, mahine ka ant aa raha hai. Aapke khate mein ₹${bal} baaki hai. Kripya restocking ke liye dues clear kar dijiye. Shukriya! 🙏`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 1500);
    });
  };

  const waLink = (phone, msg) =>
    `https://wa.me/${phone ? '91' + phone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(msg)}`;

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="space-y-4">

      {/* ──── TOP ACTION BAR ──── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={L.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 bg-white dark:bg-[#11181F] text-slate-900 dark:text-white border-[#E2D9C8] dark:border-[#2A3644] focus:ring-[#1B7A43]"
          />
        </div>

        {/* Buttons in clean 2-col grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setShowNewCust(true)}
            className="text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap text-white bg-[#1B7A43] hover:bg-[#156336] shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 shrink-0" /> {L.newCustomer}
          </button>
          <button
            onClick={() => {
              setGeminiKeyDraft(localStorage.getItem('kiranascan_gemini_key') || '');
              setShowOCR(true);
            }}
            className="text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B] shadow-sm transition-all active:scale-[0.98]"
          >
            <Camera className="w-4 h-4 shrink-0" /> {L.scanOCR}
          </button>
        </div>
      </div>

      {/* ──── CUSTOMER LIST ──── */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Koi grahak nahi mila</p>
          </div>
        )}

        {filtered.map(cust => {
          const isExpanded = expandedId === cust.id;
          return (
            <div key={cust.id} className="rounded-2xl border overflow-hidden bg-white dark:bg-[#16202A] border-[#E2D9C8] dark:border-[#2A3644] shadow-sm">

              {/* ── Card Header (2 Clean Stacked Rows) ── */}
              <button
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50/60 dark:hover:bg-[#1E293B]/60 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : cust.id)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm bg-[#1B7A43]">
                  {(cust.name || 'G').charAt(0)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {/* Top Row: Customer Name on left, Balance pill on right */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                      {cust.name}
                    </p>
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg shrink-0 border ${
                      cust.balance > 0
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    }`}>
                      {fmt(cust.balance)}
                    </span>
                  </div>

                  {/* Bottom Row: Pehchan Tag badge + Phone number */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {cust.pehchan ? (
                        <span className="bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-md truncate max-w-[170px]">
                          {cust.pehchan}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                          No pehchan
                        </span>
                      )}
                      {cust.phone && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                          <Phone className="w-3 h-3 text-slate-400" /> {cust.phone}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 dark:text-slate-500 shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </button>

              {/* ── Expanded Profile ── */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 space-y-4 border-[#E2D9C8] dark:border-[#2A3644] bg-[#F9F7F4] dark:bg-[#11181F]">

                  {/* Profile header */}
                  <div className="pt-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {cust.pehchan}
                    </div>
                    {cust.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {cust.phone}
                      </div>
                    )}
                    <p className={`text-2xl font-bold pt-1 ${cust.balance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {fmt(cust.balance)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">baaki</span>
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowWasooli(cust.id); setWasooliAmt(''); setWasooliMode('CASH'); }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1 bg-[#1B7A43] hover:bg-[#145E33] transition-colors"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" /> ₹ Wasooli Darj Karein
                    </button>
                    <button
                      onClick={() => { setShowWhatsApp(cust); setWhatsappTone('polite'); }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 bg-green-100 dark:bg-green-950/50 text-[#1B7A43] dark:text-green-300 hover:bg-green-200 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Reminder
                    </button>
                  </div>

                  {/* Audit Trail */}
                  <div>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> Complete Audit Trail
                    </p>
                    {(!cust.history || cust.history.length === 0) && (
                      <p className="text-xs italic py-3 text-center text-slate-500 dark:text-slate-400">
                        Koi transaction nahi hai abhi tak
                      </p>
                    )}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {(cust.history || []).slice().reverse().map(txn => (
                        <div key={txn.id} className="rounded-lg p-3 space-y-1.5 border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#1E252D]">

                          {/* Row 1: ID + timestamp */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-[#252E38] text-slate-700 dark:text-gray-300">
                              <Hash className="w-3 h-3 inline -mt-0.5" /> {txn.id}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {new Date(txn.date).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Row 2: Type + Sync + Amount */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              txn.type === 'WASOOLI'
                                ? 'bg-green-100 dark:bg-green-950/60 text-[#1B7A43] dark:text-green-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-[#B36B00] dark:text-amber-300'
                            }`}>
                              {txn.type === 'WASOOLI' ? '↓ WASOOLI' : '↑ UDHAAR'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              txn.synced
                                ? 'bg-green-50 dark:bg-green-950/30 text-[#1B7A43] dark:text-green-300'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-[#B36B00] dark:text-amber-300'
                            }`}>
                              {txn.synced ? '✓ Synced' : '⏳ Queued'}
                            </span>
                            {txn.editedBeforeConfirm && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-[#5B21B6] dark:text-purple-300">
                                ✏️ Edited before confirm
                              </span>
                            )}
                            <span className="text-xs font-bold ml-auto text-gray-900 dark:text-white">
                              {fmt(txn.total)}
                            </span>
                          </div>

                          {/* Row 3: Items or wasooli */}
                          {txn.items && txn.items.length > 0 && (
                            <div className="text-[11px] text-gray-600 dark:text-gray-300 pl-1 space-y-0.5">
                              {txn.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{it.name} ({it.qty} {it.unit} × {fmt(it.price)})</span>
                                  <span>{fmt(it.total)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Row 4: Voice transcript */}
                          {txn.transcript && (
                            <p className="text-[10px] italic text-slate-500 dark:text-slate-400 pl-1 pt-0.5 border-t border-dashed border-gray-200 dark:border-gray-700">
                              🎙️ &ldquo;{txn.transcript}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ════════════════════ MODALS ════════════════════ */}

      {/* ── New Customer Modal ── */}
      {showNewCust && (
        <Backdrop onClose={() => setShowNewCust(false)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                <Plus className="w-4 h-4 inline -mt-0.5 mr-1 text-emerald-600 dark:text-emerald-400" /> Naya Grahak Jodein
              </h3>
              <button onClick={() => setShowNewCust(false)}>
                <X className="w-5 h-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  Naam (Name) <span className="text-red-500">*</span>
                </label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                       placeholder="e.g. Suresh Kumar"
                       className="w-full px-3 py-2 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  Pehchan / Landmark Tag (optional)
                </label>
                <input value={newPehchan} onChange={e => setNewPehchan(e.target.value)}
                       placeholder="e.g. Chai wala, Gali No. 4"
                       className="w-full px-3 py-2 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  WhatsApp Phone (optional)
                </label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                       placeholder="e.g. 9876543210"
                       className="w-full px-3 py-2 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  Opening Balance ₹ (optional)
                </label>
                <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)}
                       placeholder="0"
                       className="w-full px-3 py-2 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <button onClick={handleSaveCustomer}
                    disabled={!newName.trim()}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1.5 bg-[#1B7A43] hover:bg-[#145E33] transition-colors shadow-sm">
              <Check className="w-4 h-4" /> Save Grahak
            </button>
          </div>
        </Backdrop>
      )}

      {/* ── OCR Import Modal ── */}
      {showOCR && (
        <Backdrop onClose={resetOcrModal}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Bahi-Khata Photo OCR
              </h3>
              <button onClick={resetOcrModal} title="Close OCR">
                <X className="w-5 h-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
              </button>
            </div>

            {/* Uploaded Image Preview OR Empty Upload Dropzone (No hardcoded fake notebook!) */}
            {ocrPreviewUrl && ocrStage !== 'review' && (
              <div className="relative rounded-xl overflow-hidden border-2 border-[#E2D9C8] dark:border-[#2A3644] bg-stone-100 dark:bg-[#11181F]">
                <img
                  src={ocrPreviewUrl}
                  alt="Uploaded Bahi-Khata page"
                  className="w-full max-h-64 object-contain mx-auto block"
                />
                {ocrStage === 'scanning' && <div className="scan-line" />}
                {ocrStage === 'idle' && (
                  <button
                    type="button"
                    onClick={() => {
                      setOcrImageFile(null);
                      setOcrPreviewUrl('');
                      setOcrNotice('');
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/85 text-white text-[11px] font-semibold flex items-center gap-1 shadow"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
            )}

            {/* Idle Stage */}
            {ocrStage === 'idle' && (
              <div className="space-y-3">
                {/* Upload dropzone */}
                <label className="border-2 border-dashed border-[#E2D9C8] dark:border-[#2A3644] hover:border-[#1B7A43] rounded-xl p-5 text-center cursor-pointer transition-colors block bg-[#FAF6F0]/60 dark:bg-[#11181F]/60">
                  <Upload className="w-7 h-7 mx-auto mb-2 text-[#1B7A43] dark:text-emerald-400" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {ocrImageFile ? 'Choose a Different Photo from Gallery' : 'Upload Photo from Gallery or Camera'}
                  </p>
                  <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                    JPG, PNG, WEBP · Best results: bright, even lighting — no finger shadows
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const picked = e.target.files?.[0];
                      if (picked) handleSelectOcrFile(picked);
                      e.target.value = '';
                    }}
                  />
                  {ocrImageFile && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 max-w-full">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{ocrImageFile.name}</span>
                    </div>
                  )}
                </label>

                {/* Gemini AI Boost — prominent card when no key is set */}
                {!geminiKeyDraft.trim() && (
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
                          ✨ Gemini Vision AI — Best for shadows & cursive handwriting
                        </p>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed">
                          Built-in OCR (Tesseract) struggles with heavy shadows, dim lighting, or cursive mixed Hindi+English. Gemini Vision reads these accurately. Free tier: 1,500 scans/day — no credit card needed.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGeminiConfig(true)}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Add Free Gemini API Key →
                    </button>
                  </div>
                )}

                {/* Language & AI Engine Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Script:</span>
                    {[
                      { id: 'eng+hin', label: 'Hindi + Eng' },
                      { id: 'eng', label: 'Fast Eng' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOcrLang(opt.id)}
                        className={`px-2 py-0.5 rounded-md font-semibold border transition-colors ${
                          ocrLang === opt.id
                            ? 'bg-[#1B7A43] text-white border-[#1B7A43]'
                            : 'bg-stone-100 dark:bg-[#11181F] text-slate-600 dark:text-slate-300 border-[#E2D9C8] dark:border-[#2A3644]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {geminiKeyDraft.trim() && (
                    <button
                      type="button"
                      onClick={() => setShowGeminiConfig((v) => !v)}
                      className="text-[11px] font-semibold text-[#1B7A43] dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Gemini AI Active ✓
                    </button>
                  )}
                </div>

                {showGeminiConfig && (
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                    <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold">
                      🔑 Gemini API Key — Free at{' '}
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                        aistudio.google.com/apikey
                      </a>{' '}
                      (no credit card, 1,500 scans/day free)
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Gemini Vision AI reads cursive handwriting, shadows, mixed Hindi+English, and dim photos much better than built-in OCR.
                    </p>
                    <div className="flex gap-1.5">
                      <input
                        type="password"
                        value={geminiKeyDraft}
                        onChange={(e) => setGeminiKeyDraft(e.target.value)}
                        placeholder="Paste Gemini API Key (starts with AIza…)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                      />
                      <button
                        type="button"
                        onClick={handleSaveGeminiKeyInline}
                        className="px-3 py-1.5 rounded-lg bg-[#1B7A43] text-white text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {ocrNotice && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ocrNotice}</span>
                  </div>
                )}

                {/* Gemini upsell when no entries extracted and no Gemini key */}
                {ocrData.length === 0 && ocrEngineUsed !== 'gemini' && !geminiKeyDraft.trim() && (
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Try Gemini Vision AI — handles shadows & cursive</p>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed">
                          Shadows, dim light, or cursive handwriting confuse built-in OCR. Gemini Vision AI reads these accurately (free: 1,500 scans/day at{' '}
                          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                            aistudio.google.com
                          </a>).
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOcrStage('idle'); setShowGeminiConfig(true); }}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Add Gemini Key & Re-scan →
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => startOCRScan()}
                  disabled={!ocrImageFile}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 bg-[#1B7A43] hover:bg-[#145E33] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4" /> Scan Uploaded Photo & Extract Balances
                </button>

                {!ocrImageFile && (
                  <button
                    type="button"
                    onClick={handleLoadSamplePhoto}
                    className="w-full py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#1B7A43] dark:hover:text-emerald-400 transition-colors"
                  >
                    No photo right now? Generate a Sample Notebook Image to test OCR →
                  </button>
                )}
              </div>
            )}

            {/* Scanning Stage */}
            {ocrStage === 'scanning' && (
              <div className="text-center py-3 space-y-2.5">
                <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-[#11181F] overflow-hidden">
                  <div
                    className="h-full bg-[#1B7A43] transition-all duration-200"
                    style={{ width: `${Math.max(8, ocrProgress.progress)}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {ocrProgress.status || 'Reading your Bahi-Khata image...'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  First scan may take a few seconds to load OCR language data
                </p>
              </div>
            )}

            {/* Review Stage */}
            {ocrStage === 'review' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                      {ocrData.length} {ocrData.length === 1 ? 'entry' : 'entries'} extracted
                      {ocrEngineUsed === 'gemini' ? ' · Gemini AI' : ' · Browser OCR'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ocrPreviewUrl && (
                      <button
                        type="button"
                        onClick={() => setShowPhotoZoom((v) => !v)}
                        className="text-[11px] font-semibold text-[#1B7A43] dark:text-emerald-400 hover:underline"
                      >
                        {showPhotoZoom ? 'Hide Photo' : 'View Photo'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowRawText((v) => !v)}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-0.5"
                    >
                      <FileText className="w-3 h-3" /> Raw Text
                    </button>
                  </div>
                </div>

                {showPhotoZoom && ocrPreviewUrl && (
                  <div className="rounded-xl overflow-hidden border border-[#E2D9C8] dark:border-[#2A3644] bg-stone-100 dark:bg-[#11181F]">
                    <img
                      src={ocrPreviewUrl}
                      alt="Uploaded reference"
                      className="w-full max-h-56 object-contain mx-auto block"
                    />
                  </div>
                )}

                {ocrNotice && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ocrNotice}</span>
                  </div>
                )}

                {/* Gemini upsell when no entries extracted and no Gemini key */}
                {ocrData.length === 0 && ocrEngineUsed !== 'gemini' && !geminiKeyDraft.trim() && (
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Try Gemini Vision AI — handles shadows & cursive</p>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5 leading-relaxed">
                          Shadows, dim light, or cursive handwriting confuse built-in OCR. Gemini Vision AI reads these accurately (free: 1,500 scans/day at{' '}
                          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                            aistudio.google.com
                          </a>).
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOcrStage('idle'); setShowGeminiConfig(true); }}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Add Gemini Key & Re-scan →
                    </button>
                  </div>
                )}

                {showRawText && (
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#11181F] border border-[#E2D9C8] dark:border-[#2A3644] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Extracted Raw Text (edit any typo & click Re-parse):
                      </span>
                      <button
                        type="button"
                        onClick={handleReparseRawText}
                        className="px-2 py-0.5 rounded bg-[#1B7A43] text-white text-[11px] font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-parse
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={ocrRawText}
                      onChange={(e) => setOcrRawText(e.target.value)}
                      placeholder="1. Ramesh - Gali 4 - 450"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <Edit3 className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                    Review & Edit Before Import
                  </p>
                  <button
                    type="button"
                    onClick={() => setOcrData([...ocrData, { name: '', pehchan: '', phone: '', balance: 0 }])}
                    className="text-xs font-semibold text-[#1B7A43] dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#11181F]">
                        <th className="text-left px-2.5 py-2 font-semibold text-slate-600 dark:text-slate-400">Name *</th>
                        <th className="text-left px-2.5 py-2 font-semibold text-slate-600 dark:text-slate-400">Pehchan</th>
                        <th className="text-right px-2.5 py-2 font-semibold text-slate-600 dark:text-slate-400 w-24">Balance ₹</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {ocrData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                            No rows parsed automatically. Tap <strong>+ Add Row</strong> above or edit <strong>Raw Text</strong>.
                          </td>
                        </tr>
                      ) : (
                        ocrData.map((row, idx) => (
                          <tr key={idx} className="border-t border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A]">
                            <td className="px-1.5 py-1.5">
                              <input
                                value={row.name}
                                placeholder="Customer name"
                                onChange={(e) => {
                                  const copy = [...ocrData];
                                  copy[idx] = { ...copy[idx], name: e.target.value };
                                  setOcrData(copy);
                                }}
                                className="w-full px-2 py-1 rounded border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-1.5 py-1.5">
                              <input
                                value={row.pehchan || ''}
                                placeholder="Tag / landmark"
                                onChange={(e) => {
                                  const copy = [...ocrData];
                                  copy[idx] = { ...copy[idx], pehchan: e.target.value };
                                  setOcrData(copy);
                                }}
                                className="w-full px-2 py-1 rounded border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                              {row.phone && (
                                <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                  <Phone className="w-2.5 h-2.5" /> {row.phone}
                                </span>
                              )}
                            </td>
                            <td className="px-1.5 py-1.5">
                              <input
                                type="number"
                                value={row.balance}
                                onChange={(e) => {
                                  const copy = [...ocrData];
                                  copy[idx] = { ...copy[idx], balance: Number(e.target.value) || 0 };
                                  setOcrData(copy);
                                }}
                                className="w-full px-2 py-1 rounded border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-1 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => setOcrData(ocrData.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                title="Remove Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOcrStage('idle')}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-[#1E293B]"
                  >
                    Scan Another
                  </button>
                  <button
                    type="button"
                    onClick={handleOCRImport}
                    disabled={!ocrData.some((d) => (d.name || '').trim())}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 bg-[#1B7A43] hover:bg-[#145E33] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4" /> Approve & Import to Ledger
                  </button>
                </div>
              </div>
            )}
          </div>
        </Backdrop>
      )}

      {/* ── Wasooli Modal ── */}
      {showWasooli && (() => {
        const cust = store.customers.find(c => c.id === showWasooli);
        if (!cust) return null;
        return (
          <Backdrop onClose={() => setShowWasooli(null)}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  ₹ Wasooli Darj Karein
                </h3>
                <button onClick={() => setShowWasooli(null)}>
                  <X className="w-5 h-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-100 dark:bg-[#11181F] border border-[#E2D9C8] dark:border-[#2A3644]">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-[#1B7A43]">
                  {(cust.name || 'G').charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{cust.name}</p>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Baaki: {fmt(cust.balance)}</p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">
                  Wasooli Amount (₹)
                </label>
                <input type="number" value={wasooliAmt} onChange={e => setWasooliAmt(e.target.value)}
                       placeholder="Enter amount"
                       className="w-full px-3 py-2.5 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />

                {/* Quick presets */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[100, 200, 500].map(v => (
                    <button key={v} onClick={() => setWasooliAmt(String(v))}
                            className="px-3 py-1 rounded-lg text-xs font-semibold border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A] text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#1E293B]">
                      ₹{v}
                    </button>
                  ))}
                  <button onClick={() => setWasooliAmt(String(cust.balance))}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-[#1B7A43] hover:bg-[#145E33]">
                    Full ₹{cust.balance}
                  </button>
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">
                  Payment Mode
                </label>
                <div className="flex gap-2">
                  {[
                    { key: 'CASH', label: '💵 Cash', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60', active: 'bg-[#1B7A43] text-white' },
                    { key: 'UPI',  label: '📱 UPI',  bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60', active: 'bg-indigo-600 text-white' },
                  ].map(m => (
                    <button key={m.key}
                            onClick={() => setWasooliMode(m.key)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${wasooliMode === m.key ? m.active : m.bg}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleWasooli}
                      disabled={!Number(wasooliAmt) || Number(wasooliAmt) <= 0}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1.5 bg-[#1B7A43] hover:bg-[#145E33] transition-colors shadow-sm">
                <Check className="w-4 h-4" /> Confirm Wasooli {wasooliAmt ? fmt(wasooliAmt) : ''}
              </button>
            </div>
          </Backdrop>
        );
      })()}

      {/* ── WhatsApp Reminder Modal ── */}
      {showWhatsApp && (
        <Backdrop onClose={() => setShowWhatsApp(null)}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                WhatsApp Udhaar Reminder
              </h3>
              <button onClick={() => setShowWhatsApp(null)}>
                <X className="w-5 h-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
              </button>
            </div>

            {/* Customer info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-100 dark:bg-[#11181F] border border-[#E2D9C8] dark:border-[#2A3644]">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-[#1B7A43]">
                {(showWhatsApp.name || 'G').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{showWhatsApp.name}</p>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Baaki: {fmt(showWhatsApp.balance)}</p>
              </div>
            </div>

            {/* Tone pills */}
            <div className="flex gap-1.5">
              {[
                { key: 'polite',   label: '🙏 Polite (Vinamra)' },
                { key: 'standard', label: '📋 Standard (Hisab Slip)' },
                { key: 'urgent',   label: '🔴 Month-End Urgent' },
              ].map(t => (
                <button key={t.key}
                        onClick={() => setWhatsappTone(t.key)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${whatsappTone === t.key
                          ? 'bg-[#1B7A43] text-white border-[#1B7A43]'
                          : 'bg-white dark:bg-[#16202A] text-slate-600 dark:text-slate-400 border-[#E2D9C8] dark:border-[#2A3644]'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Message preview */}
            <div className="rounded-lg p-3 border border-[#E2D9C8] dark:border-[#2A3644] bg-[#FAFAF8] dark:bg-[#11181F]">
              <p className="text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">Preview:</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-900 dark:text-white font-mono text-xs">
                {getWhatsAppMsg(showWhatsApp, whatsappTone)}
              </p>
            </div>

            {/* Copy feedback */}
            {copyFeedback && (
              <div className="text-center text-xs font-semibold py-1 text-emerald-600 dark:text-emerald-400">
                ✓ {copyFeedback}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <a href={waLink(showWhatsApp.phone, getWhatsAppMsg(showWhatsApp, whatsappTone))}
                 target="_blank" rel="noopener noreferrer"
                 className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 no-underline bg-[#25D366] hover:bg-[#20ba59] transition-colors">
                <ExternalLink className="w-4 h-4" /> Send on WhatsApp
              </a>
              <button onClick={() => copyToClipboard(getWhatsAppMsg(showWhatsApp, whatsappTone))}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A] text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#1E293B] flex items-center justify-center gap-1.5">
                <Copy className="w-4 h-4" /> Copy Reminder
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </div>
  );
}
