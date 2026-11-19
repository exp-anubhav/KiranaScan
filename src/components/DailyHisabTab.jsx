import { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Wallet,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  BarChart2,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

/**
 * Formats a number in Indian comma style (e.g., 1,85,600)
 */
function formatIndian(num) {
  if (num == null || isNaN(num)) return '0';
  const n = Math.abs(Math.round(num));
  const s = String(n);
  if (s.length <= 3) return (num < 0 ? '-' : '') + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  return (num < 0 ? '-' : '') + formatted;
}

function fmt(n) {
  return `₹${formatIndian(n)}`;
}

/**
 * TAB 3: Aaj Ka Hisab — Daily Summary + Night-Time Galla Check
 * Obsidian + Volt Lime High-Craft Fintech Theme
 */
export default function DailyHisabTab({ store, lang, labels }) {
  const {
    dailyHisab = {},
    sessionStats = {},
    totalOutstandingCredit = 0,
    expectedGalla = 0,
    gallaActual,
    setGallaActual,
    avgEntrySpeed = 0,
    parserAccuracy = 0,
    editPercentage = 0,
  } = store || {};

  const {
    cashSales = 0,
    upiSales = 0,
    creditIssued = 0,
    collectionsReceived = 0,
    baseMarketCredit = 0,
    openingGalla = 0,
  } = dailyHisab;

  const [gallaInput, setGallaInput] = useState(gallaActual != null ? String(gallaActual) : '');
  const [gallaSubmitted, setGallaSubmitted] = useState(gallaActual != null);
  const [gallaPresetChoice, setGallaPresetChoice] = useState(null); // 'exact' | 'short' | null
  const [detailViewTab, setDetailViewTab] = useState('customers'); // 'customers' | 'breakdown'

  // Session deltas (how much this session added to each metric)
  const sessionCashDelta = sessionStats?.cashSalesDelta ?? 0;
  const sessionUpiDelta = sessionStats?.upiSalesDelta ?? 0;
  const sessionCreditDelta = sessionStats?.creditIssuedDelta ?? 0;
  const sessionCollectionDelta = sessionStats?.collectionsReceivedDelta ?? 0;
  const sessionOutstandingDelta = sessionStats?.outstandingDelta ?? 0;

  // Galla reconciliation
  const shortGallaAmount = Math.max(0, expectedGalla - 250);
  const gallaActualVal = gallaActual != null ? Number(gallaActual) : null;
  const gallaDiff = gallaActualVal != null ? gallaActualVal - expectedGalla : null;
  const effectiveGallaInput = gallaInput.trim() !== '' ? Number(gallaInput) : gallaActualVal;
  const hasGallaValue = effectiveGallaInput != null && !isNaN(effectiveGallaInput) && (gallaSubmitted || gallaInput.trim() !== '');
  const isExactSelected =
    hasGallaValue &&
    effectiveGallaInput === expectedGalla &&
    (gallaPresetChoice === 'exact' || gallaPresetChoice === null);
  const isShortSelected =
    hasGallaValue &&
    effectiveGallaInput === shortGallaAmount &&
    (gallaPresetChoice === 'short' || (gallaPresetChoice === null && expectedGalla > 0));

  const handleGallaSubmit = (amount, presetChoice = null) => {
    const val = Number(amount);
    if (isNaN(val) || val < 0) return;
    setGallaPresetChoice(presetChoice);
    setGallaActual?.(val);
    setGallaInput(String(val));
    setGallaSubmitted(true);
  };

  // ---------- Daily Turnover & Store Health ----------
  const totalTurnover = cashSales + upiSales + creditIssued;
  const totalInflow = cashSales + upiSales + collectionsReceived;
  const cashShare = totalTurnover > 0 ? Math.round((cashSales / totalTurnover) * 100) : 0;
  const upiShare = totalTurnover > 0 ? Math.round((upiSales / totalTurnover) * 100) : 0;
  const creditShare = totalTurnover > 0 ? Math.round((creditIssued / totalTurnover) * 100) : 0;
  const activeUdhaarCustomers = (store.customers || []).filter(c => c.balance > 0).length;

  // Collect today's customer visits
  const todayVisits = [];
  (store.customers || []).forEach(cust => {
    (cust.history || []).forEach(h => {
      todayVisits.push({
        id: h.id,
        customerId: cust.id,
        customerName: cust.name,
        customerPehchan: cust.pehchan,
        customerPhone: cust.phone,
        date: h.date,
        type: h.type,
        mode: h.mode,
        total: h.total,
        items: h.items || [],
        transcript: h.transcript,
        currentBalance: cust.balance
      });
    });
  });
  todayVisits.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-4 pb-6">

      {/* ═══════════ 1. HERO TOTAL SALES BENTO CARD (OBSIDIAN + VOLT LIME) ═══════════ */}
      <div className="bg-[#111315] dark:bg-[#161A22] rounded-3xl p-5 text-white border border-white/10 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8F53B] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              {lang === 'hi' ? 'दैनिक सारांश' : 'Daily Sales Overview'}
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 tabular-nums">
            {todayVisits.length} {lang === 'hi' ? 'लेन-देन' : 'Transactions'}
          </span>
        </div>

        <div className="pt-1">
          <p className="text-xs text-slate-400 font-medium mb-1">
            {lang === 'hi' ? 'आज की कुल बिक्री (टर्नओवर)' : 'Aaj Ki Kul Bikri (Turnover)'}
          </p>
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#C8F53B] tabular-nums tracking-tight">
              {fmt(totalTurnover)}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Rokad Inflow: <strong className="text-white tabular-nums">{fmt(totalInflow)}</strong></span>
            </div>
          </div>
        </div>

        {/* Minimal Proportion Strip */}
        {totalTurnover > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/10">
              <div style={{ width: `${cashShare}%` }} className="bg-[#C8F53B] transition-all duration-500" title={`Cash: ${cashShare}%`} />
              <div style={{ width: `${upiShare}%` }} className="bg-indigo-400 transition-all duration-500" title={`UPI: ${upiShare}%`} />
              <div style={{ width: `${creditShare}%` }} className="bg-rose-400 transition-all duration-500" title={`Udhaar: ${creditShare}%`} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C8F53B]" /> {cashShare}% Cash
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400" /> {upiShare}% UPI
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> {creditShare}% Udhaar
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ 2. 2x2 METRIC BENTO GRID ═══════════ */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cash Sales Card */}
        <div className="bg-white dark:bg-[#12151C] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-sm relative transition-all">
          {sessionCashDelta > 0 && (
            <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 tabular-nums">
              +{fmt(sessionCashDelta)}
            </span>
          )}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-[#C8F53B] mb-2.5">
            <Wallet size={16} />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {lang === 'hi' ? 'आज की नकद बिक्री' : 'Cash Sales Today'}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-[#111315] dark:text-white tabular-nums mt-0.5">
            {fmt(cashSales)}
          </p>
        </div>

        {/* UPI Sales Card */}
        <div className="bg-white dark:bg-[#12151C] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-sm relative transition-all">
          {sessionUpiDelta > 0 && (
            <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 tabular-nums">
              +{fmt(sessionUpiDelta)}
            </span>
          )}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2.5">
            <CreditCard size={16} />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {lang === 'hi' ? 'आज की UPI बिक्री' : 'UPI Sales Today'}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-[#111315] dark:text-white tabular-nums mt-0.5">
            {fmt(upiSales)}
          </p>
        </div>

        {/* Udhaar Given Card */}
        <div className="bg-white dark:bg-[#12151C] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-sm relative transition-all">
          {sessionCreditDelta > 0 && (
            <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 tabular-nums">
              +{fmt(sessionCreditDelta)}
            </span>
          )}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-2.5">
            <ArrowUpRight size={16} />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {lang === 'hi' ? 'आज का उधार दिया' : 'Credit Given Today'}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
            {fmt(creditIssued)}
          </p>
        </div>

        {/* Wasooli Received Card */}
        <div className="bg-white dark:bg-[#12151C] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-sm relative transition-all">
          {sessionCollectionDelta > 0 && (
            <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 tabular-nums">
              +{fmt(sessionCollectionDelta)}
            </span>
          )}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-[#C8F53B] mb-2.5">
            <ArrowDownRight size={16} />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {lang === 'hi' ? 'वसूली आई' : 'Wasooli Received'}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-[#C8F53B] tabular-nums mt-0.5">
            {fmt(collectionsReceived)}
          </p>
        </div>
      </div>

      {/* ─── Total Outstanding Credit Banner ─── */}
      <div className="bg-white dark:bg-[#12151C] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 sm:p-5 shadow-sm relative">
        {sessionOutstandingDelta !== 0 && (
          <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 tabular-nums">
            {sessionOutstandingDelta > 0 ? '+' : ''}{fmt(sessionOutstandingDelta)}
          </span>
        )}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-slate-400">
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {lang === 'hi' ? 'कुल बकाया उधार' : 'Total Outstanding Credit'}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {fmt(totalOutstandingCredit)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {lang === 'hi'
                ? `मार्केट बेस ${fmt(baseMarketCredit)} + ग्राहकों का बकाया ${fmt(totalOutstandingCredit - baseMarketCredit)}`
                : `Base market credit ${fmt(baseMarketCredit)} + customer balances`}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 shrink-0">
            {activeUdhaarCustomers} Grahak Due
          </span>
        </div>
      </div>

      {/* ═══════════ 3. NIGHT-TIME GALLA RECONCILIATION CARD ═══════════ */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.09] overflow-hidden bg-white dark:bg-[#12151C] shadow-sm">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#111315] dark:bg-[#C8F53B]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'hi' ? 'रात का गल्ला चेक (Drawer Cash)' : 'Night-Time Galla Check (Cash Reconciliation)'}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Daily Audit
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Calculation breakdown */}
          <div className="rounded-2xl p-4 text-xs space-y-2 bg-slate-50 dark:bg-[#181C25] border border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center tabular-nums">
              <span>{lang === 'hi' ? 'सुबह का गल्ला' : 'Opening Cash in Drawer'}</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {fmt(openingGalla)}
              </span>
            </div>
            <div className="flex justify-between items-center tabular-nums">
              <span>{lang === 'hi' ? '+ आज की नकद बिक्री' : '+ Cash Sales Today'}</span>
              <span className="font-bold text-emerald-600 dark:text-[#C8F53B]">
                +{fmt(cashSales)}
              </span>
            </div>
            <div className="flex justify-between items-center tabular-nums">
              <span>{lang === 'hi' ? '+ नकद वसूली (Wasooli)' : '+ Cash Wasooli Received'}</span>
              <span className="font-bold text-emerald-600 dark:text-[#C8F53B]">
                +{fmt(collectionsReceived)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5 mt-1 border-t border-slate-200 dark:border-white/10 font-bold text-sm text-[#111315] dark:text-white tabular-nums">
              <span>{lang === 'hi' ? 'Expected गल्ला (हिसाब से)' : 'Expected Drawer Cash'}</span>
              <span className="text-base text-[#111315] dark:text-[#C8F53B] font-extrabold">
                {fmt(expectedGalla)}
              </span>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">
              {lang === 'hi'
                ? 'रात को गल्ले में कितना Cash गिना? (Actual Cash Counted)'
                : 'Raat ko Galla mein kitna Cash mila? (Actual Cash Counted)'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#C8F53B]"
                  placeholder={lang === 'hi' ? 'रुपये डालें...' : 'Enter actual counted cash...'}
                  value={gallaInput}
                  onChange={(e) => {
                    setGallaInput(e.target.value);
                    setGallaPresetChoice(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && gallaInput) handleGallaSubmit(gallaInput, null);
                  }}
                />
              </div>
              <button
                type="button"
                className="px-5 py-2.5 rounded-2xl text-[#111315] text-xs font-extrabold bg-[#C8F53B] hover:bg-[#b8e62b] transition-all shadow-sm active:scale-95 cursor-pointer"
                onClick={() => gallaInput && handleGallaSubmit(gallaInput, null)}
              >
                {lang === 'hi' ? 'चेक करो' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Quick simulation buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={isExactSelected}
              className={`py-2 px-3 rounded-full border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 text-center leading-tight active:scale-[0.98] cursor-pointer tabular-nums ${
                isExactSelected
                  ? 'bg-[#111315] text-[#C8F53B] dark:bg-[#C8F53B] dark:text-[#111315] border-transparent shadow-xs'
                  : 'bg-slate-50 dark:bg-[#181C25] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
              onClick={() => handleGallaSubmit(expectedGalla, 'exact')}
            >
              <CheckCircle2 size={13} className="shrink-0" />
              <span>Exact Match ({fmt(expectedGalla)})</span>
            </button>
            <button
              type="button"
              aria-pressed={isShortSelected}
              className={`py-2 px-3 rounded-full border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 text-center leading-tight active:scale-[0.98] cursor-pointer tabular-nums ${
                isShortSelected
                  ? 'bg-rose-600 text-white border-transparent shadow-xs'
                  : 'bg-slate-50 dark:bg-[#181C25] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
              onClick={() => handleGallaSubmit(shortGallaAmount, 'short')}
            >
              <AlertTriangle size={13} className="shrink-0" />
              <span>Simulate -₹250 ({fmt(shortGallaAmount)})</span>
            </button>
          </div>

          {/* Verdict Banner */}
          {gallaSubmitted && gallaActualVal != null && (
            <div
              className={`rounded-2xl p-4 border transition-all ${
                gallaDiff === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : gallaDiff < 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              {gallaDiff === 0 && (
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="mt-0.5 text-emerald-600 dark:text-[#C8F53B] shrink-0" />
                  <div>
                    <p className="font-extrabold text-sm">
                      {lang === 'hi' ? 'गल्ला मैच! (₹0 Difference)' : 'Galla Matched · ₹0 Difference'}
                    </p>
                    <p className="text-xs mt-0.5 opacity-85">
                      {lang === 'hi'
                        ? 'Cash drawer पूरी तरह बैलेंस है। कोई अंतर नहीं मिला।'
                        : 'Cash drawer is perfectly reconciled. Zero discrepancy.'}
                    </p>
                  </div>
                </div>
              )}
              {gallaDiff < 0 && (
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="mt-0.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <div>
                    <p className="font-extrabold text-sm tabular-nums">
                      {fmt(Math.abs(gallaDiff))} {lang === 'hi' ? 'Cash कमी पाई गई!' : 'Cash Shortage Detected!'}
                    </p>
                    <p className="text-xs mt-0.5 opacity-85">
                      {lang === 'hi'
                        ? 'शायद कोई loose खर्चा या छुट्टे में गलती हुई।'
                        : 'Possible unrecorded loose cash expense or change error.'}
                    </p>
                  </div>
                </div>
              )}
              {gallaDiff > 0 && (
                <div className="flex items-start gap-2.5">
                  <DollarSign size={18} className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <p className="font-extrabold text-sm tabular-nums">
                      +{fmt(gallaDiff)} {lang === 'hi' ? 'Extra Cash मिला' : 'Extra Cash in Drawer'}
                    </p>
                    <p className="text-xs mt-0.5 opacity-85">
                      {lang === 'hi'
                        ? 'शायद कोई cash sale रिकॉर्ड नहीं हुई।'
                        : 'Possible unrecorded cash sale during rush hour.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ 4. TODAY'S CUSTOMER VISITS & SALES BREAKDOWN ═══════════ */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/[0.09] overflow-hidden bg-white dark:bg-[#12151C] shadow-sm">
        {/* Dual Tab Switcher */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 bg-slate-50/60 dark:bg-[#181C25]/50">
          <div className="flex bg-slate-200/80 dark:bg-[#111315] p-1 rounded-full">
            <button
              onClick={() => setDetailViewTab('customers')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                detailViewTab === 'customers'
                  ? 'bg-white dark:bg-[#181C25] text-[#111315] dark:text-[#C8F53B] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Aaj Ke Grahak ({todayVisits.length})
            </button>
            <button
              onClick={() => setDetailViewTab('breakdown')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                detailViewTab === 'breakdown'
                  ? 'bg-white dark:bg-[#181C25] text-[#111315] dark:text-[#C8F53B] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Math Breakdown
            </button>
          </div>

          <span className="text-xs font-extrabold text-[#111315] dark:text-[#C8F53B] tabular-nums">
            Turnover: {fmt(totalTurnover)}
          </span>
        </div>

        {/* View 1: Aaj Ke Grahak (Today's Customer Visits) */}
        {detailViewTab === 'customers' && (
          <div className="p-3 divide-y divide-slate-100 dark:divide-white/[0.06]">
            {todayVisits.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                Koi entry nahi mili. Bol Kar tab se pehli voice entry karein!
              </p>
            ) : (
              todayVisits.slice(0, 8).map((visit, i) => {
                const isWasooli = visit.type === 'WASOOLI';
                const isUdhaar = visit.mode === 'UDHAAR' && !isWasooli;
                const isCash = visit.mode === 'CASH' && !isWasooli;
                const isUpi = visit.mode === 'UPI' && !isWasooli;

                const modeBadge = isWasooli
                  ? { label: 'Wasooli (Jama)', bg: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' }
                  : isUdhaar
                  ? { label: 'Udhaar', bg: 'bg-rose-500/15 text-rose-800 dark:text-rose-300' }
                  : isUpi
                  ? { label: 'UPI', bg: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300' }
                  : { label: 'Cash', bg: 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200' };

                return (
                  <div key={i} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#111315] text-[#C8F53B] dark:bg-[#181C25] flex items-center justify-center font-extrabold text-xs shrink-0 border border-black/10 dark:border-white/10">
                        {visit.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-[#111315] dark:text-white truncate">
                            {visit.customerName}
                          </span>
                          {visit.customerPehchan && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              ({visit.customerPehchan})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {isWasooli
                            ? 'Wasooli Jama'
                            : visit.items.map(it => `${it.qty} ${it.unit} ${it.name}`).join(', ') || 'Sale Item'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-xs text-[#111315] dark:text-white block tabular-nums">
                        {fmt(visit.total)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${modeBadge.bg}`}>
                        {modeBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* View 2: Clear Hisab Math Breakdown */}
        {detailViewTab === 'breakdown' && (
          <div className="p-4 space-y-4">
            {/* Clear Math Explainer */}
            <div className="rounded-2xl p-4 bg-slate-50 dark:bg-[#181C25] border border-slate-200/80 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 tabular-nums">
                <span className="font-medium">Total Goods Sold (Turnover)</span>
                <span className="font-bold text-[#111315] dark:text-[#C8F53B]">
                  {fmt(totalTurnover)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                Cash {fmt(cashSales)} + UPI {fmt(upiSales)} + Udhaar {fmt(creditIssued)}
              </p>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-white/10 tabular-nums">
                <span className="font-medium">Actual Money Inflow Today</span>
                <span className="font-bold text-emerald-600 dark:text-[#C8F53B]">
                  {fmt(totalInflow)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                Cash {fmt(cashSales)} + UPI {fmt(upiSales)} + Wasooli {fmt(collectionsReceived)}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase tracking-wider">Cash Inflow</span>
                <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 tabular-nums">
                  {fmt(cashSales + collectionsReceived)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold block uppercase tracking-wider">UPI Inflow</span>
                <span className="text-sm font-extrabold text-indigo-800 dark:text-indigo-300 tabular-nums">
                  {fmt(upiSales)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block uppercase tracking-wider">Active Udhaar</span>
                <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300 tabular-nums">
                  {activeUdhaarCustomers} Grahak
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
