import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Plus, Camera, User, Phone, MapPin,
  ChevronRight, ChevronDown, Clock, Hash,
  ArrowDownCircle, MessageCircle, Trash2, RefreshCw, Sparkles, FileText,
  ExternalLink, X, Check, Edit3, Eye, Copy, Upload, AlertCircle,
  Mic, Info, AlertTriangle, ShieldCheck
} from 'lucide-react';
import {
  scanBahiKhataImage,
  parseBahiKhataOcrText,
  createSampleNotebookImageFile,
  getActiveGeminiKey,
  hasBuiltInGeminiKey,
} from '../utils/bahiKhataOcr.js';

function Backdrop({ children, onClose, sizeClass = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-md" onClick={onClose}>
      <div className={`w-full ${sizeClass} max-h-[92vh] overflow-y-auto bg-white dark:bg-[#12151C] text-slate-900 dark:text-white rounded-[1.75rem] shadow-2xl border border-slate-200/90 dark:border-white/10`}
           onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function getInitials(name) {
  if (!name) return 'C';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && words[0].length >= 1) return words[0].slice(0, 2).toUpperCase();
  return 'C';
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
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'due' | 'settled'
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
  const [wasooliPreset, setWasooliPreset] = useState(null); // 100 | 200 | 500 | 'full' | null
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
  const [ocrEngineMode, setOcrEngineMode] = useState(() =>
    getActiveGeminiKey() ? 'gemini' : 'offline'
  );
  const [showRawText, setShowRawText] = useState(false);
  const [showPhotoZoom, setShowPhotoZoom] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [editingGeminiKey, setEditingGeminiKey] = useState(false);
  const [geminiKeyDraft, setGeminiKeyDraft] = useState('');
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

  const totalOutstanding = useMemo(() => {
    return uniqueCustomers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  }, [uniqueCustomers]);

  const filtered = uniqueCustomers
    .filter(c => {
      if (filterMode === 'due' && c.balance <= 0) return false;
      if (filterMode === 'settled' && c.balance > 0) return false;
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
    setWasooliAmt(''); setWasooliPreset(null); setWasooliMode('CASH'); setShowWasooli(null);
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
    setEditingGeminiKey(false);
    setShowHowItWorks(false);
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
      const draftKey = geminiKeyDraft.trim();
      const activeKey = draftKey || getActiveGeminiKey();
      if (ocrEngineMode === 'gemini' && draftKey) {
        localStorage.setItem('kiranascan_gemini_key', draftKey);
      }

      const result = await scanBahiKhataImage(targetFile, {
        geminiApiKey: ocrEngineMode === 'gemini' ? activeKey : '',
        preferOffline: ocrEngineMode === 'offline',
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
      setOcrEngineMode('gemini');
      setEditingGeminiKey(false);
      setOcrNotice('');
    } else {
      localStorage.removeItem('kiranascan_gemini_key');
      setEditingGeminiKey(false);
    }
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

      {/* ──── TOP SUMMARY BENTO CARD (OBSIDIAN + VOLT LIME) ──── */}
      <div className="bg-[#111315] dark:bg-[#161A22] border border-white/10 rounded-3xl p-5 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8F53B] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Bahi-Khata Ledger
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 tabular-nums">
            {uniqueCustomers.length} Grahak Khata
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3 pt-1">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Total Outstanding Udhaar (कुल बकाया)</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-[#C8F53B] tabular-nums tracking-tight">
              {fmt(totalOutstanding)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (getActiveGeminiKey()) {
                  setOcrEngineMode('gemini');
                }
                setEditingGeminiKey(false);
                setShowOCR(true);
              }}
              className="bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-full px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-[#C8F53B]" />
              <span>Scan Bahi-Khata</span>
            </button>

            <button
              onClick={() => setShowNewCust(true)}
              className="bg-[#C8F53B] hover:bg-[#b8e62b] text-[#111315] rounded-full px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Naya Grahak</span>
            </button>
          </div>
        </div>
      </div>

      {/* ──── SEARCH & FILTER ROW ──── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Grahak ka naam, phone ya pehchan search karein..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-1 bg-white dark:bg-[#12151C] text-[#111315] dark:text-white border-slate-200/80 dark:border-white/[0.08] focus:border-[#111315] dark:focus:border-[#C8F53B] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { key: 'all', label: `All (${uniqueCustomers.length})` },
            { key: 'due', label: `Udhaar Due (${uniqueCustomers.filter(c => c.balance > 0).length})` },
            { key: 'settled', label: `Settled (${uniqueCustomers.filter(c => c.balance <= 0).length})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterMode(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterMode === f.key
                  ? 'bg-[#111315] text-[#C8F53B] dark:bg-[#C8F53B] dark:text-[#111315] shadow-xs'
                  : 'bg-white dark:bg-[#12151C] border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-[#111315] dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──── CUSTOMER LIST ──── */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-white dark:bg-[#12151C] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-6">
            <User className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#111315] dark:text-[#C8F53B]" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Koi grahak nahi mila</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Search badlein ya + Naya Grahak button dabayein</p>
          </div>
        )}

        {filtered.map(cust => {
          const isExpanded = expandedId === cust.id;
          return (
            <div key={cust.id} className="rounded-2xl border overflow-hidden bg-white dark:bg-[#12151C] border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm">

              {/* ── Card Header (2 Clean Stacked Rows) ── */}
              <button
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : cust.id)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-extrabold text-xs tracking-wider bg-[#111315] dark:bg-[#C8F53B] text-[#C8F53B] dark:text-[#111315] shadow-sm">
                  {getInitials(cust.name)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {/* Top Row: Customer Name on left, Balance pill on right */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#111315] dark:text-white truncate text-sm">
                      {cust.name}
                    </p>
                    <span className={`text-base font-extrabold tabular-nums shrink-0 ${
                      cust.balance > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {fmt(cust.balance)}
                    </span>
                  </div>

                  {/* Bottom Row: Pehchan Tag badge + Phone number */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {cust.pehchan ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 truncate max-w-[170px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.pehchan}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">
                          No pehchan
                        </span>
                      )}
                      {cust.phone && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
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
                <div className="border-t px-4 pb-4 space-y-4 border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">

                  {/* Profile header */}
                  <div className="pt-3.5 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {cust.pehchan || 'General Customer'}
                    </div>
                    {cust.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {cust.phone}
                      </div>
                    )}
                    <p className={`text-2xl font-extrabold pt-1 tabular-nums ${cust.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {fmt(cust.balance)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">baaki</span>
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowWasooli(cust.id); setWasooliAmt(''); setWasooliPreset(null); setWasooliMode('CASH'); }}
                      className="flex-1 py-2.5 rounded-full text-xs font-bold text-[#111315] bg-[#C8F53B] hover:bg-[#b8e62b] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      <span>Wasooli (Jama)</span>
                    </button>
                    <button
                      onClick={() => { setShowWhatsApp(cust); setWhatsappTone('polite'); }}
                      className="flex-1 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer active:scale-98"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Reminder</span>
                    </button>
                  </div>

                  {/* Audit Trail */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Complete Audit Trail
                    </p>
                    {(!cust.history || cust.history.length === 0) && (
                      <p className="text-xs italic py-3 text-center text-slate-500 dark:text-slate-400">
                        Koi transaction nahi hai abhi tak
                      </p>
                    )}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                      {(cust.history || []).slice().reverse().map(txn => (
                        <div key={txn.id} className="rounded-2xl p-3 space-y-2 border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#12151C] shadow-2xs">

                          {/* Row 1: ID + timestamp */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-medium">
                              <Hash className="w-3 h-3 inline -mt-0.5 text-slate-400" /> {txn.id}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 tabular-nums">
                              {new Date(txn.date).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Row 2: Type + Sync + Amount */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              txn.type === 'WASOOLI'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            }`}>
                              {txn.type === 'WASOOLI' ? '↓ WASOOLI' : '↑ UDHAAR'}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              txn.synced
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                            }`}>
                              {txn.synced ? <><Check size={11} /> Synced</> : <><Clock size={11} /> Queued</>}
                            </span>
                            {txn.editedBeforeConfirm && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                <Edit3 size={11} /> Edited
                              </span>
                            )}
                            <span className="text-xs font-extrabold ml-auto text-[#111315] dark:text-white tabular-nums">
                              {fmt(txn.total)}
                            </span>
                          </div>

                          {/* Row 3: Items or wasooli */}
                          {txn.items && txn.items.length > 0 && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 pl-1 space-y-0.5">
                              {txn.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between tabular-nums">
                                  <span>{it.name} ({it.qty} {it.unit} × {fmt(it.price)})</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{fmt(it.total)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Row 4: Voice transcript */}
                          {txn.transcript && (
                            <p className="text-[11px] italic text-slate-500 dark:text-slate-400 pl-1 pt-1 border-t border-dashed border-slate-200 dark:border-white/10 flex items-center gap-1">
                              <Mic className="w-3 h-3 text-[#111315] dark:text-[#C8F53B] shrink-0" />
                              <span>&ldquo;{txn.transcript}&rdquo;</span>
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
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#111315] dark:text-[#C8F53B]" /> Naya Grahak Jodein
              </h3>
              <button onClick={() => setShowNewCust(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  Naam (Name) <span className="text-rose-500">*</span>
                </label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                       placeholder="e.g. Suresh Kumar"
                       className="w-full px-3 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8F53B]" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  Pehchan / Landmark Tag (optional)
                </label>
                <input value={newPehchan} onChange={e => setNewPehchan(e.target.value)}
                       placeholder="e.g. Chai wala, Gali No. 4"
                       className="w-full px-3 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8F53B]" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  WhatsApp Phone (optional)
                </label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                       placeholder="e.g. 9876543210"
                       className="w-full px-3 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8F53B]" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  Opening Balance ₹ (optional)
                </label>
                <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)}
                       placeholder="0"
                       className="w-full px-3 py-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#C8F53B]" />
              </div>
            </div>

            <button onClick={handleSaveCustomer}
                    disabled={!newName.trim()}
                    className="w-full py-2.5 rounded-full text-sm font-extrabold text-[#111315] disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-white/[0.08] dark:disabled:text-slate-500 disabled:border disabled:border-slate-300/60 dark:disabled:border-white/10 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-1.5 bg-[#C8F53B] hover:bg-[#b8e62b] transition-all shadow-md active:scale-[0.99] cursor-pointer">
              <Check className="w-4 h-4" /> Save Grahak
            </button>
          </div>
        </Backdrop>
      )}

      {/* ── OCR Import Modal ── */}
      {showOCR && (() => {
        const hasSavedKey = Boolean(getActiveGeminiKey() || geminiKeyDraft.trim());
        const showPhotoPanelInReview = showPhotoZoom;
        return (
          <Backdrop onClose={resetOcrModal} sizeClass="max-w-lg md:max-w-3xl">
            <div className="p-4 sm:p-5 space-y-4">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#111315] dark:text-[#C8F53B] shrink-0" />
                    Bahi-Khata Photo OCR
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    1. Upload photo → 2. Read text → 3. Review rows &amp; import
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetOcrModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Close OCR"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Responsive 2-column workspace on web/tablet (md+), clean vertical flow on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

                {/* ── LEFT COLUMN: Photo Dropzone / Preview + How It Works ── */}
                <div className={`md:col-span-5 space-y-2.5 ${ocrStage === 'review' && !showPhotoPanelInReview ? 'hidden md:block' : 'block'}`}>
                  {ocrPreviewUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25]">
                      <div className="relative">
                        <img
                          src={ocrPreviewUrl}
                          alt="Uploaded Bahi-Khata page"
                          className="w-full max-h-52 md:max-h-72 object-contain mx-auto block"
                        />
                        {ocrStage === 'scanning' && <div className="scan-line" />}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white dark:bg-[#12151C] border-t border-slate-200 dark:border-white/10 text-xs">
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 min-w-0">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C8F53B] shrink-0" />
                          <span className="truncate">{ocrImageFile?.name || 'Photo ready'}</span>
                        </span>
                        {ocrStage !== 'scanning' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <label className="text-[#111315] dark:text-[#C8F53B] font-bold hover:underline cursor-pointer">
                              Change
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
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setOcrImageFile(null);
                                setOcrPreviewUrl('');
                                setOcrNotice('');
                                setOcrStage('idle');
                              }}
                              className="text-slate-400 hover:text-rose-500 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="border-2 border-dashed border-slate-200 dark:border-white/15 hover:border-[#C8F53B] rounded-2xl p-5 text-center cursor-pointer transition-colors block bg-slate-50 dark:bg-[#181C25]">
                        <Upload className="w-7 h-7 mx-auto mb-2 text-[#111315] dark:text-[#C8F53B]" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Upload Photo from Gallery or Camera
                        </p>
                        <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                          JPG, PNG, WEBP · Clear photo without heavy shadows
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
                      </label>
                      <button
                        type="button"
                        onClick={handleLoadSamplePhoto}
                        className="w-full py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="whitespace-nowrap">No photo? Load Sample Notebook →</span>
                      </button>
                    </div>
                  )}

                  {/* Compact transparent "How parsing works" accordion */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] px-3.5 py-2.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowHowItWorks((v) => !v)}
                      className="w-full flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>How KiranaScan reads your page</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
                    </button>
                    {showHowItWorks && (
                      <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed list-disc pl-4">
                        <li>Finds lines matching <strong className="text-slate-800 dark:text-slate-200">Name - Note - ₹Amount</strong> (e.g. <code>1. Ramesh - Gali 4 - ₹450</code>).</li>
                        <li>Ignores serial numbers, dates, and address numbers like <code>Makan 8</code>; extracts 10-digit phone numbers automatically.</li>
                        <li><strong className="text-slate-800 dark:text-slate-200">Built-in OCR</strong> runs offline in your browser. <strong className="text-slate-800 dark:text-slate-200">Gemini AI</strong> reads cursive handwriting &amp; shadows accurately.</li>
                      </ul>
                    )}
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Controls / Scanning Progress / Editable Review Table ── */}
                <div className="md:col-span-7 space-y-3 min-w-0">

                  {/* IDLE STAGE */}
                  {ocrStage === 'idle' && (
                    <div className="space-y-3">
                      {/* Single Engine Selector (Strictly ONE control — zero duplicate Gemini cards) */}
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                          Choose Scan Engine
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setOcrEngineMode('offline')}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              ocrEngineMode === 'offline'
                                ? 'bg-[#111315] text-[#C8F53B] dark:bg-[#181C25] border-black/20 dark:border-[#C8F53B]/50'
                                : 'bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold">Built-in OCR</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10">
                                No Key
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                              Offline · Clear print or block letters
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOcrEngineMode('gemini')}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              ocrEngineMode === 'gemini'
                                ? 'bg-[#111315] text-[#C8F53B] dark:bg-[#181C25] border-black/20 dark:border-[#C8F53B]/50'
                                : 'bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                Gemini AI
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10">
                                {hasSavedKey ? 'Ready ✓' : 'Free Key'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                              Best for cursive handwriting &amp; shadows
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Contextual Options for Built-in OCR */}
                      {ocrEngineMode === 'offline' && (
                        <div className="flex items-center justify-between gap-2 flex-wrap p-2.5 rounded-xl bg-slate-50 dark:bg-[#181C25] border border-slate-200 dark:border-white/10 text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Script language:</span>
                          <div className="flex items-center gap-1.5">
                            {[
                              { id: 'eng+hin', label: 'Hindi + Eng' },
                              { id: 'eng', label: 'Fast Eng' },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setOcrLang(opt.id)}
                                className={`px-2.5 py-1 rounded-full font-semibold border transition-colors cursor-pointer ${
                                  ocrLang === opt.id
                                    ? 'bg-[#111315] text-[#C8F53B] dark:bg-[#C8F53B] dark:text-[#111315] border-transparent shadow-xs'
                                    : 'bg-white dark:bg-[#12151C] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Single Contextual Config for Gemini AI */}
                      {ocrEngineMode === 'gemini' && (
                        hasSavedKey && !editingGeminiKey ? (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Gemini Vision AI Active</span>
                            </span>
                            {!hasBuiltInGeminiKey() && (
                              <button
                                type="button"
                                onClick={() => setEditingGeminiKey(true)}
                                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
                              >
                                Change / Clear
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#181C25] border border-slate-200 dark:border-white/10 space-y-2">
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              Get a free key (no credit card) at{' '}
                              <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-bold text-[#111315] dark:text-[#C8F53B]"
                              >
                                aistudio.google.com/apikey
                              </a>
                              . Saved only in this browser.
                            </p>
                            <div className="flex gap-1.5">
                              <input
                                type="password"
                                value={geminiKeyDraft}
                                onChange={(e) => setGeminiKeyDraft(e.target.value)}
                                placeholder="Paste Gemini API Key (AIza…)"
                                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12151C] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                              />
                              <button
                                type="button"
                                onClick={handleSaveGeminiKeyInline}
                                className="px-3.5 py-2 rounded-xl bg-[#111315] dark:bg-[#C8F53B] text-[#C8F53B] dark:text-[#111315] text-xs font-bold shrink-0 cursor-pointer"
                              >
                                {geminiKeyDraft.trim() ? 'Save' : 'Clear'}
                              </button>
                            </div>
                          </div>
                        )
                      )}

                      {ocrNotice && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{ocrNotice}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => startOCRScan()}
                        disabled={!ocrImageFile || (ocrEngineMode === 'gemini' && !hasSavedKey)}
                        className="w-full py-3 rounded-full text-sm font-extrabold text-[#111315] flex items-center justify-center gap-1.5 bg-[#C8F53B] hover:bg-[#b8e62b] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99] cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        {ocrEngineMode === 'gemini'
                          ? 'Scan Uploaded Photo with Gemini AI'
                          : 'Scan Uploaded Photo & Extract Balances'}
                      </button>
                    </div>
                  )}

                  {/* SCANNING STAGE */}
                  {ocrStage === 'scanning' && (
                    <div className="text-center py-6 px-3 rounded-2xl bg-slate-50 dark:bg-[#181C25] border border-slate-200 dark:border-white/10 space-y-3">
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-[#C8F53B] transition-all duration-200"
                          style={{ width: `${Math.max(8, ocrProgress.progress)}%` }}
                        />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {ocrProgress.status || 'Reading your Bahi-Khata image...'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ocrEngineMode === 'gemini'
                          ? 'Analyzing handwriting & amounts with Gemini Vision AI...'
                          : 'Normalizing shadows locally · first scan caches OCR model (~10s once)'}
                      </p>
                    </div>
                  )}

                  {/* REVIEW STAGE */}
                  {ocrStage === 'review' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-[#C8F53B] shrink-0" />
                          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                            {ocrData.length} {ocrData.length === 1 ? 'entry' : 'entries'} extracted
                            {ocrEngineUsed === 'gemini' ? ' · Gemini AI' : ' · Built-in OCR'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {ocrPreviewUrl && (
                            <button
                              type="button"
                              onClick={() => setShowPhotoZoom((v) => !v)}
                              className="md:hidden text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:underline cursor-pointer"
                            >
                              {showPhotoZoom ? 'Hide Photo' : 'View Photo'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowRawText((v) => !v)}
                            className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <FileText className="w-3 h-3" /> Raw Text
                          </button>
                        </div>
                      </div>

                      {ocrNotice && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{ocrNotice}</span>
                          </div>
                          {ocrData.length === 0 && ocrEngineUsed !== 'gemini' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOcrStage('idle');
                                setOcrEngineMode('gemini');
                              }}
                              className="text-[11px] font-bold text-slate-900 dark:text-[#C8F53B] hover:underline whitespace-nowrap cursor-pointer"
                            >
                              Switch to ✨ Gemini AI →
                            </button>
                          )}
                        </div>
                      )}

                      {showRawText && (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#181C25] border border-slate-200 dark:border-white/10 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              Raw Text Read (edit typos &amp; tap Re-parse):
                            </span>
                            <button
                              type="button"
                              onClick={handleReparseRawText}
                              className="px-2.5 py-1 rounded-full bg-[#111315] dark:bg-[#C8F53B] text-[#C8F53B] dark:text-[#111315] text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Re-parse
                            </button>
                          </div>
                          <textarea
                            rows={4}
                            value={ocrRawText}
                            onChange={(e) => setOcrRawText(e.target.value)}
                            placeholder="1. Ramesh - Gali 4 - 450"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12151C] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <Edit3 className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                          Review &amp; Edit Rows
                        </p>
                        <button
                          type="button"
                          onClick={() => setOcrData([...ocrData, { name: '', pehchan: '', phone: '', balance: 0 }])}
                          className="text-xs font-semibold text-slate-800 dark:text-[#C8F53B] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Row
                        </button>
                      </div>

                      {/* Responsive single-DOM row editor */}
                      <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                        <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-2 bg-slate-50 dark:bg-[#181C25] text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                          <div className="col-span-4">Name *</div>
                          <div className="col-span-4">Pehchan</div>
                          <div className="col-span-3 text-right">Balance ₹</div>
                          <div className="col-span-1" />
                        </div>

                        {ocrData.length === 0 ? (
                          <div className="px-3 py-5 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#12151C]">
                            No rows matched automatically. Tap <strong>+ Add Row</strong> above or edit <strong>Raw Text</strong>.
                          </div>
                        ) : (
                          <div className="ocr-rows-list divide-y divide-slate-100 dark:divide-white/10 bg-white dark:bg-[#12151C]">
                            {ocrData.map((row, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 items-start">
                                <div className="col-span-7 sm:col-span-4 order-1">
                                  <input
                                    value={row.name}
                                    placeholder="Customer name"
                                    onChange={(e) => {
                                      const copy = [...ocrData];
                                      copy[idx] = { ...copy[idx], name: e.target.value };
                                      setOcrData(copy);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                                  />
                                </div>

                                <div className="col-span-12 sm:col-span-4 order-4 sm:order-2">
                                  <input
                                    value={row.pehchan || ''}
                                    placeholder="Pehchan / landmark (optional)"
                                    onChange={(e) => {
                                      const copy = [...ocrData];
                                      copy[idx] = { ...copy[idx], pehchan: e.target.value };
                                      setOcrData(copy);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                                  />
                                  {row.phone && (
                                    <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                      <Phone className="w-2.5 h-2.5" /> {row.phone}
                                    </span>
                                  )}
                                </div>

                                <div className="col-span-4 sm:col-span-3 order-2 sm:order-3">
                                  <input
                                    type="number"
                                    value={row.balance}
                                    onChange={(e) => {
                                      const copy = [...ocrData];
                                      copy[idx] = { ...copy[idx], balance: Number(e.target.value) || 0 };
                                      setOcrData(copy);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-xs font-bold tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                                  />
                                </div>

                                <div className="col-span-1 order-3 sm:order-4 text-center pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setOcrData(ocrData.filter((_, i) => i !== idx))}
                                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                    title="Remove Row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setOcrStage('idle')}
                          className="px-4 py-2.5 rounded-full text-xs font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181C25] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#222733] transition-colors cursor-pointer"
                        >
                          Scan Another
                        </button>
                        <button
                          type="button"
                          onClick={handleOCRImport}
                          disabled={!ocrData.some((d) => (d.name || '').trim())}
                          className="flex-1 py-2.5 rounded-full text-xs sm:text-sm font-extrabold text-[#111315] flex items-center justify-center gap-1.5 bg-[#C8F53B] hover:bg-[#b8e62b] disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-white/[0.08] dark:disabled:text-slate-500 disabled:border disabled:border-slate-300/60 dark:disabled:border-white/10 disabled:cursor-not-allowed disabled:shadow-none transition-all shadow-md active:scale-[0.99] cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Approve &amp; Import to Ledger
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Backdrop>
        );
      })()}

      {/* ── Wasooli Modal ── */}
      {showWasooli && (() => {
        const cust = store.customers.find(c => c.id === showWasooli);
        if (!cust) return null;
        const numAmt = Number(wasooliAmt);
        const fullBal = Number(cust.balance) || 0;
        const isFullSelected =
          wasooliAmt !== '' &&
          fullBal > 0 &&
          numAmt === fullBal &&
          (wasooliPreset === 'full' || wasooliPreset === null);
        const isPresetSelected = (v) =>
          wasooliAmt !== '' &&
          numAmt === v &&
          (wasooliPreset === v || (wasooliPreset === null && !isFullSelected));
        const presetBaseClass =
          'px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer';
        const presetInactiveClass =
          'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#181C25] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20';
        const presetActiveClass =
          'border-[#111315] dark:border-white/20 bg-[#111315] text-[#C8F53B] dark:bg-[#C8F53B] dark:text-[#111315] shadow-sm';
        const closeWasooli = () => {
          setShowWasooli(null);
          setWasooliPreset(null);
        };

        return (
          <Backdrop onClose={closeWasooli}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C8F53B]" /> ₹ Wasooli Darj Karein
                </h3>
                <button type="button" onClick={closeWasooli} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181C25] border border-slate-200/80 dark:border-white/10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs text-[#111315] bg-[#C8F53B] shrink-0 shadow-sm">
                  {getInitials(cust.name)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{cust.name}</p>
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    Baki Udhaar: {fmt(cust.balance)}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">
                  Wasooli Amount (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={wasooliAmt}
                    onChange={e => {
                      setWasooliAmt(e.target.value);
                      setWasooliPreset(null);
                    }}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-lg font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#C8F53B]"
                  />
                </div>

                {/* Quick presets */}
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  {[100, 200, 500].map(v => {
                    const selected = isPresetSelected(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setWasooliAmt(String(v));
                          setWasooliPreset(v);
                        }}
                        className={`${presetBaseClass} ${selected ? presetActiveClass : presetInactiveClass}`}
                      >
                        ₹{v}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    aria-pressed={isFullSelected}
                    onClick={() => {
                      setWasooliAmt(String(fullBal));
                      setWasooliPreset('full');
                    }}
                    className={`${presetBaseClass} ${isFullSelected ? presetActiveClass : presetInactiveClass}`}
                  >
                    Full {fmt(cust.balance)}
                  </button>
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      key: 'CASH',
                      label: 'Cash (Rokad)',
                    },
                    {
                      key: 'UPI',
                      label: 'UPI / Online',
                    },
                  ].map(m => {
                    const active = wasooliMode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setWasooliMode(m.key)}
                        className={`py-2.5 rounded-full text-xs font-bold transition-all active:scale-[0.99] cursor-pointer ${
                          active
                            ? 'bg-[#111315] text-[#C8F53B] dark:bg-[#C8F53B] dark:text-[#111315] shadow-sm'
                            : 'bg-slate-100 dark:bg-[#181C25] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-slate-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={handleWasooli}
                      disabled={!Number(wasooliAmt) || Number(wasooliAmt) <= 0}
                      className="w-full py-3 rounded-full text-sm font-extrabold text-[#111315] disabled:opacity-40 flex items-center justify-center gap-1.5 bg-[#C8F53B] hover:bg-[#b8e62b] transition-all shadow-md active:scale-[0.99] cursor-pointer">
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
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                WhatsApp Udhaar Reminder
              </h3>
              <button onClick={() => setShowWhatsApp(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer info */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#181C25] border border-slate-200/80 dark:border-white/10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs text-[#111315] bg-[#C8F53B] shrink-0 shadow-sm">
                {getInitials(showWhatsApp.name)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{showWhatsApp.name}</p>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  Baki Udhaar: {fmt(showWhatsApp.balance)}
                </p>
              </div>
            </div>

            {/* Tone pills */}
            <div className="flex gap-1.5">
              {[
                { key: 'polite',   label: 'Vinamra (Polite)' },
                { key: 'standard', label: 'Hisab Slip' },
                { key: 'urgent',   label: 'Month-End Urgent' },
              ].map(t => {
                const active = whatsappTone === t.key;
                return (
                  <button key={t.key}
                          onClick={() => setWhatsappTone(t.key)}
                          className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
                            active
                              ? 'bg-[#111315] text-[#C8F53B] dark:bg-[#C8F53B] dark:text-[#111315] border-transparent shadow-sm'
                              : 'bg-white dark:bg-[#181C25] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300'
                          }`}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Message preview */}
            <div className="rounded-2xl p-3.5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Message Preview:</p>
              <p className="text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-mono">
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
                 className="flex-1 py-2.5 rounded-full text-xs font-bold text-white flex items-center justify-center gap-1.5 no-underline bg-[#25D366] hover:bg-[#20ba59] transition-all shadow-md cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" /> Send on WhatsApp
              </a>
              <button onClick={() => copyToClipboard(getWhatsAppMsg(showWhatsApp, whatsappTone))}
                      className="flex-1 py-2.5 rounded-full text-xs font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181C25] text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#222733] flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                <Copy className="w-3.5 h-3.5" /> Copy Reminder
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </div>
  );
}
