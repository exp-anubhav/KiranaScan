import { useState, useMemo } from 'react';
import {
  Search, Plus, Camera, User, Phone, MapPin,
  ChevronRight, ChevronDown, Clock, Hash,
  ArrowDownCircle, ArrowUpCircle, MessageCircle,
  ExternalLink, X, Check, Edit3, Eye
} from 'lucide-react';

/* ───── scan-line keyframe (injected once) ───── */
const SCAN_STYLE_ID = 'ledger-scan-style';
if (typeof document !== 'undefined' && !document.getElementById(SCAN_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = SCAN_STYLE_ID;
  style.textContent = `
    @keyframes scanLine {
      0%   { top: 0; opacity: 1; }
      90%  { top: calc(100% - 4px); opacity: 1; }
      100% { top: calc(100% - 4px); opacity: 0; }
    }
    .scan-line {
      position: absolute;
      left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, #22c55e 20%, #16a34a 50%, #22c55e 80%, transparent 100%);
      box-shadow: 0 0 12px 3px rgba(34,197,94,0.5);
      animation: scanLine 1.2s ease-in-out forwards;
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

  // OCR state
  const [ocrStage, setOcrStage] = useState('idle'); // idle | scanning | review
  const [ocrImageFile, setOcrImageFile] = useState(null);
  const [ocrData, setOcrData] = useState([
    { name: 'Suresh', pehchan: 'चाय वाला', balance: 340 },
    { name: 'Anita',  pehchan: 'मकान 8',   balance: 620 },
    { name: 'Raju',   pehchan: 'नाई',      balance: 180 },
  ]);

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
      pehchan: newPehchan.trim() || 'General Customer',
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

  const startOCRScan = () => {
    setOcrStage('scanning');
    setTimeout(() => setOcrStage('review'), 1300);
  };

  const handleOCRImport = () => {
    store.importOCRCustomers(ocrData.filter(d => d.name.trim()));
    setShowOCR(false);
    setOcrStage('idle');
    setOcrImageFile(null);
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

  /* ───── Backdrop ───── */
  const Backdrop = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1E252D] text-gray-900 dark:text-white rounded-2xl shadow-2xl border border-transparent dark:border-[#2F3844]"
           onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="space-y-4">

      {/* ──── TOP ACTION BAR ──── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6573] dark:text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={L.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 bg-white dark:bg-[#1E252D] text-gray-900 dark:text-white border-[#E6DFD3] dark:border-[#2F3844] focus:ring-[#1B7A43]"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewCust(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#1B7A43' }}
          >
            <Plus className="w-4 h-4" /> {L.newCustomer}
          </button>
          <button
            onClick={() => setShowOCR(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: '#E6DFD3', color: '#1E242B' }}
          >
            <Camera className="w-4 h-4" /> {L.scanOCR}
          </button>
        </div>
      </div>

      {/* ──── CUSTOMER LIST ──── */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10" style={{ color: '#5A6573' }}>
            <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Koi grahak nahi mila</p>
          </div>
        )}

        {filtered.map(cust => {
          const isExpanded = expandedId === cust.id;
          return (
            <div key={cust.id} className="rounded-xl border overflow-hidden bg-white dark:bg-[#1E252D] border-[#E6DFD3] dark:border-[#2F3844] shadow-sm">

              {/* ── Card Header ── */}
              <button
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-gray-50/50 dark:hover:bg-[#252E38] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : cust.id)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm bg-[#1B7A43]">
                  {cust.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                    {cust.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full truncate bg-[#F3F0EB] dark:bg-[#252E38] text-[#5A6573] dark:text-gray-300">
                      {cust.pehchan}
                    </span>
                    {cust.phone && (
                      <span className="text-xs flex items-center gap-0.5 text-[#5A6573] dark:text-gray-400">
                        <Phone className="w-3 h-3" /> {cust.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Balance badge */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    cust.balance > 0
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-[#B36B00] dark:text-amber-300'
                      : 'bg-green-100 dark:bg-green-950/50 text-[#1B7A43] dark:text-green-300'
                  }`}>
                    {fmt(cust.balance)}
                  </span>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-[#5A6573] dark:text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-[#5A6573] dark:text-gray-400" />}
                </div>
              </button>

              {/* ── Expanded Profile ── */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 space-y-4 border-[#E6DFD3] dark:border-[#2F3844] bg-[#FAF9F6] dark:bg-[#151B22]">

                  {/* Profile header */}
                  <div className="pt-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-[#5A6573] dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5" /> {cust.pehchan}
                    </div>
                    {cust.phone && (
                      <div className="flex items-center gap-2 text-xs text-[#5A6573] dark:text-gray-400">
                        <Phone className="w-3.5 h-3.5" /> {cust.phone}
                      </div>
                    )}
                    <p className={`text-2xl font-bold pt-1 ${cust.balance > 0 ? 'text-[#B36B00] dark:text-amber-400' : 'text-[#1B7A43] dark:text-green-400'}`}>
                      {fmt(cust.balance)} <span className="text-xs font-normal text-[#5A6573] dark:text-gray-400">baaki</span>
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
                      <MessageCircle className="w-3.5 h-3.5" /> 📲 WhatsApp Reminder
                    </button>
                  </div>

                  {/* Audit Trail */}
                  <div>
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1 text-[#5A6573] dark:text-gray-400">
                      <Clock className="w-3.5 h-3.5" /> Complete Audit Trail
                    </p>
                    {(!cust.history || cust.history.length === 0) && (
                      <p className="text-xs italic py-3 text-center text-[#5A6573] dark:text-gray-400">
                        Koi transaction nahi hai abhi tak
                      </p>
                    )}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {(cust.history || []).slice().reverse().map(txn => (
                        <div key={txn.id} className="rounded-lg p-3 space-y-1.5 border border-[#E6DFD3] dark:border-[#2F3844] bg-white dark:bg-[#1E252D]">

                          {/* Row 1: ID + timestamp */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F3F0EB] dark:bg-[#252E38] text-[#5A6573] dark:text-gray-300">
                              <Hash className="w-3 h-3 inline -mt-0.5" /> {txn.id}
                            </span>
                            <span className="text-[10px] text-[#5A6573] dark:text-gray-400">
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
                            <p className="text-[10px] italic text-[#5A6573] dark:text-gray-400 pl-1 pt-0.5 border-t border-dashed border-gray-200 dark:border-gray-700">
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
              <h3 className="font-bold text-base" style={{ color: '#1E242B' }}>
                <Plus className="w-4 h-4 inline -mt-0.5 mr-1" /> Naya Grahak Jodein
              </h3>
              <button onClick={() => setShowNewCust(false)}><X className="w-5 h-5" style={{ color: '#5A6573' }} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#5A6573' }}>
                  Naam (Name) <span className="text-red-500">*</span>
                </label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                       placeholder="e.g. Suresh Kumar"
                       className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                       style={{ borderColor: '#E6DFD3' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#5A6573' }}>
                  Pehchan / Landmark Tag (optional)
                </label>
                <input value={newPehchan} onChange={e => setNewPehchan(e.target.value)}
                       placeholder="e.g. Chai wala, Gali No. 4"
                       className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                       style={{ borderColor: '#E6DFD3' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#5A6573' }}>
                  WhatsApp Phone (optional)
                </label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                       placeholder="e.g. 9876543210"
                       className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                       style={{ borderColor: '#E6DFD3' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#5A6573' }}>
                  Opening Balance ₹ (optional)
                </label>
                <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)}
                       placeholder="0"
                       className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                       style={{ borderColor: '#E6DFD3' }} />
              </div>
            </div>

            <button onClick={handleSaveCustomer}
                    disabled={!newName.trim()}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                    style={{ background: '#1B7A43' }}>
              <Check className="w-4 h-4" /> Save Grahak
            </button>
          </div>
        </Backdrop>
      )}

      {/* ── OCR Import Modal ── */}
      {showOCR && (
        <Backdrop onClose={() => { setShowOCR(false); setOcrStage('idle'); setOcrImageFile(null); }}>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ color: '#1E242B' }}>
                📸 Bahi-Khata Photo OCR
              </h3>
              <button onClick={() => { setShowOCR(false); setOcrStage('idle'); setOcrImageFile(null); }}>
                <X className="w-5 h-5" style={{ color: '#5A6573' }} />
              </button>
            </div>

            {/* Notebook mockup */}
            <div className="relative rounded-lg overflow-hidden"
                 style={{ background: '#FEF9E7', border: '2px solid #D4C9A8' }}>

              {/* Ruled lines + handwriting */}
              <div className="p-4 space-y-0" style={{ position: 'relative' }}>
                {/* Red margin line */}
                <div className="absolute top-0 bottom-0 left-10" style={{ borderLeft: '2px solid #E8B4B4' }} />

                {[
                  '1. सुरेश (Suresh) - चाय वाला - पुराना बाकी ₹340',
                  '2. अनीता (Anita) - मकान 8 - बाकी ₹620',
                  '3. राजू (Raju) - नाई - बाकी ₹180',
                ].map((line, i) => (
                  <div key={i} className="pl-8 py-2"
                       style={{
                         borderBottom: '1px solid #C9D6E3',
                         fontFamily: "'Caveat', 'Segoe Script', 'Comic Sans MS', cursive",
                         fontSize: '15px',
                         color: '#1a3760',
                         transform: `rotate(${i % 2 === 0 ? '-0.4' : '0.3'}deg)`,
                         fontStyle: 'italic',
                       }}>
                    {line}
                  </div>
                ))}

                {/* Scan line animation */}
                {ocrStage === 'scanning' && <div className="scan-line" />}
              </div>

              {/* Spiral holes decoration */}
              <div className="absolute top-0 left-1 bottom-0 flex flex-col justify-around py-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#B0A080', background: '#F5EDD6' }} />
                ))}
              </div>
            </div>

            {/* Upload area */}
            {ocrStage === 'idle' && (
              <>
                <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer"
                     style={{ borderColor: '#E6DFD3' }}>
                  <label className="cursor-pointer block">
                    <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: '#5A6573' }} />
                    <p className="text-sm font-semibold" style={{ color: '#1E242B' }}>Upload Your Image</p>
                    <p className="text-xs mt-1" style={{ color: '#5A6573' }}>Photo of your handwritten bahi-khata page</p>
                    <input type="file" accept="image/*" className="hidden"
                           onChange={e => {
                             if (e.target.files?.[0]) setOcrImageFile(e.target.files[0]);
                           }} />
                  </label>
                  {ocrImageFile && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: '#1B7A43' }}>
                      <Check className="w-4 h-4" /> {ocrImageFile.name}
                    </div>
                  )}
                </div>

                <button onClick={startOCRScan}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5"
                        style={{ background: '#1B7A43' }}>
                  <Eye className="w-4 h-4" /> Run OCR & Extract Balances
                </button>
              </>
            )}

            {/* Scanning state */}
            {ocrStage === 'scanning' && (
              <div className="text-center py-4 space-y-2">
                <div className="w-8 h-8 mx-auto border-3 rounded-full animate-spin"
                     style={{ borderColor: '#E8F5EE', borderTopColor: '#1B7A43', borderWidth: '3px' }} />
                <p className="text-sm font-semibold" style={{ color: '#1B7A43' }}>Scanning & extracting text...</p>
                <p className="text-xs" style={{ color: '#5A6573' }}>AI is reading your bahi-khata page</p>
              </div>
            )}

            {/* Review stage */}
            {ocrStage === 'review' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#E8F5EE' }}>
                  <Check className="w-4 h-4" style={{ color: '#1B7A43' }} />
                  <span className="text-xs font-semibold" style={{ color: '#1B7A43' }}>
                    3 entries extracted successfully!
                  </span>
                </div>

                <p className="text-xs font-semibold" style={{ color: '#5A6573' }}>
                  <Edit3 className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                  Review & Edit Before Import
                </p>

                <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E6DFD3' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: '#F3F0EB' }}>
                        <th className="text-left px-3 py-2 font-semibold" style={{ color: '#5A6573' }}>Name</th>
                        <th className="text-left px-3 py-2 font-semibold" style={{ color: '#5A6573' }}>Pehchan</th>
                        <th className="text-right px-3 py-2 font-semibold" style={{ color: '#5A6573' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ocrData.map((row, idx) => (
                        <tr key={idx} className="border-t" style={{ borderColor: '#E6DFD3' }}>
                          <td className="px-2 py-1.5">
                            <input value={row.name}
                                   onChange={e => {
                                     const copy = [...ocrData];
                                     copy[idx] = { ...copy[idx], name: e.target.value };
                                     setOcrData(copy);
                                   }}
                                   className="w-full px-2 py-1 rounded border text-xs focus:outline-none focus:ring-1"
                                   style={{ borderColor: '#E6DFD3' }} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.pehchan}
                                   onChange={e => {
                                     const copy = [...ocrData];
                                     copy[idx] = { ...copy[idx], pehchan: e.target.value };
                                     setOcrData(copy);
                                   }}
                                   className="w-full px-2 py-1 rounded border text-xs focus:outline-none focus:ring-1"
                                   style={{ borderColor: '#E6DFD3' }} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" value={row.balance}
                                   onChange={e => {
                                     const copy = [...ocrData];
                                     copy[idx] = { ...copy[idx], balance: Number(e.target.value) || 0 };
                                     setOcrData(copy);
                                   }}
                                   className="w-full px-2 py-1 rounded border text-xs text-right focus:outline-none focus:ring-1"
                                   style={{ borderColor: '#E6DFD3' }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={handleOCRImport}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5"
                        style={{ background: '#1B7A43' }}>
                  <Check className="w-4 h-4" /> Approve & Import to Ledger
                </button>
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
                <h3 className="font-bold text-base" style={{ color: '#1E242B' }}>
                  ₹ Wasooli Darj Karein
                </h3>
                <button onClick={() => setShowWasooli(null)}>
                  <X className="w-5 h-5" style={{ color: '#5A6573' }} />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#F3F0EB' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                     style={{ background: '#1B7A43' }}>
                  {cust.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1E242B' }}>{cust.name}</p>
                  <p className="text-xs" style={{ color: '#B36B00' }}>Baaki: {fmt(cust.balance)}</p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A6573' }}>
                  Wasooli Amount (₹)
                </label>
                <input type="number" value={wasooliAmt} onChange={e => setWasooliAmt(e.target.value)}
                       placeholder="Enter amount"
                       className="w-full px-3 py-2.5 rounded-lg border text-base font-bold focus:outline-none focus:ring-2"
                       style={{ borderColor: '#E6DFD3', color: '#1E242B' }} />

                {/* Quick presets */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[100, 200, 500].map(v => (
                    <button key={v} onClick={() => setWasooliAmt(String(v))}
                            className="px-3 py-1 rounded-lg text-xs font-semibold border"
                            style={{ borderColor: '#E6DFD3', color: '#1E242B' }}>
                      ₹{v}
                    </button>
                  ))}
                  <button onClick={() => setWasooliAmt(String(cust.balance))}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                          style={{ background: '#1B7A43' }}>
                    Full ₹{cust.balance}
                  </button>
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5A6573' }}>
                  Payment Mode
                </label>
                <div className="flex gap-2">
                  {[
                    { key: 'CASH', label: '💵 Cash', bg: '#E8F5EE', active: '#1B7A43' },
                    { key: 'UPI',  label: '📱 UPI',  bg: '#EDE9FE', active: '#5B21B6' },
                  ].map(m => (
                    <button key={m.key}
                            onClick={() => setWasooliMode(m.key)}
                            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={wasooliMode === m.key
                              ? { background: m.active, color: 'white' }
                              : { background: m.bg, color: m.active }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleWasooli}
                      disabled={!Number(wasooliAmt) || Number(wasooliAmt) <= 0}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                      style={{ background: '#1B7A43' }}>
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
              <h3 className="font-bold text-base" style={{ color: '#1E242B' }}>
                📲 WhatsApp Udhaar Reminder
              </h3>
              <button onClick={() => setShowWhatsApp(null)}>
                <X className="w-5 h-5" style={{ color: '#5A6573' }} />
              </button>
            </div>

            {/* Customer info */}
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#F3F0EB' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                   style={{ background: '#1B7A43' }}>
                {showWhatsApp.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1E242B' }}>{showWhatsApp.name}</p>
                <p className="text-xs" style={{ color: '#B36B00' }}>Baaki: {fmt(showWhatsApp.balance)}</p>
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
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all border"
                        style={whatsappTone === t.key
                          ? { background: '#1B7A43', color: 'white', borderColor: '#1B7A43' }
                          : { background: 'white', color: '#5A6573', borderColor: '#E6DFD3' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Message preview */}
            <div className="rounded-lg p-3 border" style={{ background: '#FAFAF8', borderColor: '#E6DFD3' }}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#5A6573' }}>Preview:</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#1E242B' }}>
                {getWhatsAppMsg(showWhatsApp, whatsappTone)}
              </p>
            </div>

            {/* Copy feedback */}
            {copyFeedback && (
              <div className="text-center text-xs font-semibold py-1" style={{ color: '#1B7A43' }}>
                ✓ {copyFeedback}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <a href={waLink(showWhatsApp.phone, getWhatsAppMsg(showWhatsApp, whatsappTone))}
                 target="_blank" rel="noopener noreferrer"
                 className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 no-underline"
                 style={{ background: '#25D366' }}>
                <ExternalLink className="w-4 h-4" /> Send on WhatsApp
              </a>
              <button onClick={() => copyToClipboard(getWhatsAppMsg(showWhatsApp, whatsappTone))}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border flex items-center justify-center gap-1.5"
                      style={{ borderColor: '#E6DFD3', color: '#1E242B' }}>
                📋 Copy
              </button>
            </div>
          </div>
        </Backdrop>
      )}
    </div>
  );
}
