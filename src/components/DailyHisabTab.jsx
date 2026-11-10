import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Clock,
  Zap,
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

/**
 * TAB 3: Aaj Ka Hisab — Daily Summary + Night-Time Galla Check
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

  // ---------- Metric Cards Config ----------
  const metricCards = [
    {
      id: 'cash',
      label: lang === 'hi' ? 'आज की नकद बिक्री' : 'Cash Sales Today',
      value: cashSales,
      icon: Wallet,
      borderLeftClass: 'border-l-emerald-600',
      iconBoxClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
      valueClass: 'text-slate-900 dark:text-white',
      badgeBg: 'bg-emerald-600',
      delta: sessionCashDelta,
    },
    {
      id: 'upi',
      label: lang === 'hi' ? 'आज की UPI बिक्री' : 'UPI Sales Today',
      value: upiSales,
      icon: CreditCard,
      borderLeftClass: 'border-l-indigo-600',
      iconBoxClass: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400',
      valueClass: 'text-slate-900 dark:text-white',
      badgeBg: 'bg-indigo-600',
      delta: sessionUpiDelta,
    },
    {
      id: 'credit',
      label: lang === 'hi' ? 'आज का उधार दिया' : 'Credit Issued (Udhaar)',
      value: creditIssued,
      icon: TrendingUp,
      borderLeftClass: 'border-l-amber-500',
      iconBoxClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400',
      valueClass: 'text-amber-700 dark:text-amber-400',
      badgeBg: 'bg-amber-500',
      delta: sessionCreditDelta,
    },
    {
      id: 'collection',
      label: lang === 'hi' ? 'वसूली आई' : 'Collections (Wasooli)',
      value: collectionsReceived,
      icon: ArrowRight,
      borderLeftClass: 'border-l-teal-600',
      iconBoxClass: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400',
      valueClass: 'text-teal-700 dark:text-teal-400',
      badgeBg: 'bg-teal-600',
      delta: sessionCollectionDelta,
    },
  ];

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
    <div className="space-y-5 pb-6">
      {/* ─── Section Title ─── */}
      <div className="flex items-center gap-2 px-1">
        <BarChart3 size={20} className="text-[#1B7A43] dark:text-emerald-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {lang === 'hi' ? 'आज का हिसाब' : 'Aaj Ka Hisab'}
        </h2>
      </div>

      {/* ═══════════ 1. Live Metric Cards (2-col grid) ═══════════ */}
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`relative bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] border-l-4 ${card.borderLeftClass} shadow-sm rounded-2xl p-4 transition-colors`}
            >
              {/* Session delta badge */}
              {card.delta > 0 && (
                <span
                  className={`absolute -top-2 -right-2 text-xs font-semibold px-2 py-0.5 rounded-full text-white shadow-sm ${card.badgeBg}`}
                >
                  +₹{formatIndian(card.delta)}
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBoxClass}`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">
                {card.label}
              </p>
              <p className={`text-2xl font-bold ${card.valueClass}`}>
                ₹{formatIndian(card.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* ─── Total Outstanding Credit (full-width) ─── */}
      <div
        className="relative rounded-2xl p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 border-l-4 border-l-rose-600 shadow-sm transition-colors"
      >
        {sessionOutstandingDelta !== 0 && (
          <span
            className="absolute -top-2 -right-2 text-xs font-semibold px-2 py-0.5 rounded-full text-white bg-rose-600 shadow-sm"
          >
            {sessionOutstandingDelta > 0 ? '+' : ''}₹{formatIndian(sessionOutstandingDelta)}
          </span>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-rose-200">
                {lang === 'hi' ? 'कुल बकाया उधार' : 'Total Outstanding Credit'}
              </p>
            </div>
            <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              ₹{formatIndian(totalOutstandingCredit)}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-rose-300/80 mt-1">
              {lang === 'hi'
                ? `मार्केट बेस ₹${formatIndian(baseMarketCredit)} + ग्राहकों का ₹${formatIndian(totalOutstandingCredit - baseMarketCredit)}`
                : `Base market credit ₹${formatIndian(baseMarketCredit)} + customer balances`}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {lang === 'hi' ? 'जोखिम अलर्ट' : 'High Risk'}
          </span>
        </div>
      </div>

      {/* ═══════════ 2. Night-Time Galla Reconciliation ═══════════ */}
      <div className="rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] overflow-hidden bg-white dark:bg-[#16202A] shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E2D9C8] dark:border-[#2A3644] bg-[#F9F7F4] dark:bg-[#1E293B]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            🌙 {lang === 'hi' ? 'रात का गल्ला चेक' : 'Night-Time Galla Check'}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Calculation breakdown */}
          <div className="rounded-xl p-3 text-sm space-y-1 bg-[#F9F7F4] dark:bg-[#1E293B] border border-[#E2D9C8] dark:border-[#2A3644] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>{lang === 'hi' ? 'सुबह का गल्ला' : 'Opening Galla'}</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ₹{formatIndian(openingGalla)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'hi' ? '+ नकद बिक्री' : '+ Cash Sales'}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                +₹{formatIndian(cashSales)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'hi' ? '+ नकद वसूली' : '+ Cash Wasooli'}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                +₹{formatIndian(collectionsReceived)}
              </span>
            </div>
            <div className="flex justify-between pt-2 mt-2 border-t border-[#E2D9C8] dark:border-[#2A3644] font-bold text-slate-900 dark:text-white">
              <span>{lang === 'hi' ? 'Expected गल्ला' : 'Expected Galla'}</span>
              <span>₹{formatIndian(expectedGalla)}</span>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-900 dark:text-white">
              {lang === 'hi'
                ? 'रात को गल्ले में कितना Cash मिला?'
                : 'Raat ko Galla mein kitna Cash mila?'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-sm text-slate-500 dark:text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                  placeholder={lang === 'hi' ? 'राशि डालें...' : 'Enter amount...'}
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
                className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-[#1B7A43] hover:bg-[#145E33] transition-colors shadow-sm"
                onClick={() => gallaInput && handleGallaSubmit(gallaInput, null)}
              >
                {lang === 'hi' ? 'चेक करो' : 'Check'}
              </button>
            </div>
          </div>

          {/* Quick test buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={isExactSelected}
              className={`py-2 px-2.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-center leading-tight active:scale-[0.98] ${
                isExactSelected
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-[#1B7A43] dark:border-emerald-400 text-[#1B7A43] dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-[#FAF6F0] dark:bg-[#11181F] border-[#E2D9C8] dark:border-[#2A3644] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => handleGallaSubmit(expectedGalla, 'exact')}
            >
              <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isExactSelected ? 'text-[#1B7A43] dark:text-emerald-400' : 'text-emerald-600/80 dark:text-emerald-400/70'}`} />
              <span>Match Exact (₹{formatIndian(expectedGalla)})</span>
            </button>
            <button
              type="button"
              aria-pressed={isShortSelected}
              className={`py-2 px-2.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 text-center leading-tight active:scale-[0.98] ${
                isShortSelected
                  ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-500 dark:border-amber-400 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-[#FAF6F0] dark:bg-[#11181F] border-[#E2D9C8] dark:border-[#2A3644] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => handleGallaSubmit(shortGallaAmount, 'short')}
            >
              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isShortSelected ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600/80 dark:text-amber-400/70'}`} />
              <span>Simulate ₹250 Short (₹{formatIndian(shortGallaAmount)})</span>
            </button>
          </div>

          {/* Result */}
          {gallaSubmitted && gallaActualVal != null && (
            <div
              className={`rounded-lg p-3 border ${
                gallaDiff === 0
                  ? 'bg-[#E8F5EE] dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-[#1B7A43] dark:text-green-300'
                  : gallaDiff < 0
                  ? 'bg-[#FEF2F2] dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-600 dark:text-red-300'
                  : 'bg-[#FFF4E0] dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-[#B36B00] dark:text-amber-300'
              }`}
            >
              {gallaDiff === 0 && (
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm">
                      {lang === 'hi' ? '✅ गल्ला मैच!' : '✅ Galla Match!'}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80">
                      {lang === 'hi'
                        ? 'Cash drawer पूरी तरह बैलेंस है।'
                        : 'Cash drawer is perfectly balanced.'}
                    </p>
                  </div>
                </div>
              )}
              {gallaDiff < 0 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm">
                      ⚠️ ₹{formatIndian(Math.abs(gallaDiff))}{' '}
                      {lang === 'hi' ? 'Cash कमी पाई गई!' : 'Cash Shortage Flagged!'}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80">
                      {lang === 'hi'
                        ? 'शायद कोई loose खर्चा या छुट्टे में गलती हुई।'
                        : 'Possible unrecorded loose expense or change error.'}
                    </p>
                  </div>
                </div>
              )}
              {gallaDiff > 0 && (
                <div className="flex items-start gap-2">
                  <DollarSign size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm">
                      ℹ️ ₹{formatIndian(gallaDiff)}{' '}
                      {lang === 'hi' ? 'Extra Cash मिला।' : 'Extra Cash Found.'}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80">
                      {lang === 'hi'
                        ? 'शायद कोई cash sale रिकॉर्ड नहीं हुई।'
                        : 'Possible unrecorded cash sale.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ 3. Today's Customer Visits & Sales Breakdown ═══════════ */}
      <div className="rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] overflow-hidden bg-white dark:bg-[#16202A] shadow-sm">
        {/* Dual Tab Switcher */}
        <div className="px-4 py-2.5 border-b border-[#E2D9C8] dark:border-[#2A3644] flex items-center justify-between flex-wrap gap-2 bg-[#F9F7F4] dark:bg-[#1E293B]">
          <div className="flex bg-slate-200/80 dark:bg-[#11181F] p-0.5 rounded-lg">
            <button
              onClick={() => setDetailViewTab('customers')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                detailViewTab === 'customers'
                  ? 'bg-white dark:bg-[#16202A] text-[#1B7A43] dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              👥 Aaj Ke Grahak ({todayVisits.length})
            </button>
            <button
              onClick={() => setDetailViewTab('breakdown')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                detailViewTab === 'breakdown'
                  ? 'bg-white dark:bg-[#16202A] text-[#1B7A43] dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📊 Hisab Math Breakdown
            </button>
          </div>

          <span className="text-xs font-bold text-[#1B7A43] dark:text-emerald-400">
            Turnover: ₹{formatIndian(totalTurnover)}
          </span>
        </div>

        {/* View 1: Aaj Ke Grahak (Today's Customer Visits) */}
        {detailViewTab === 'customers' && (
          <div className="p-3 divide-y divide-gray-100 dark:divide-gray-800">
            {todayVisits.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                Koi entry nahi mili. Bol Kar tab se pehli voice entry karein!
              </p>
            ) : (
              todayVisits.slice(0, 8).map((visit, i) => {
                const isWasooli = visit.type === 'WASOOLI';
                const isUdhaar = visit.mode === 'UDHAAR' && !isWasooli;
                const isCash = visit.mode === 'CASH' && !isWasooli;
                const isUpi = visit.mode === 'UPI' && !isWasooli;

                const modeBadge = isWasooli
                  ? { label: 'Wasooli (Jama)', bg: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300' }
                  : isUdhaar
                  ? { label: 'Udhaar', bg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' }
                  : isUpi
                  ? { label: 'UPI Sale', bg: 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300' }
                  : { label: 'Cash Sale', bg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' };

                return (
                  <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#1B7A43] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {visit.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                            {visit.customerName}
                          </span>
                          {visit.customerPehchan && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              ({visit.customerPehchan})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {isWasooli
                            ? 'Wasooli Jama'
                            : visit.items.map(it => `${it.qty} ${it.unit} ${it.name}`).join(', ') || 'Sale Item'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-gray-900 dark:text-white block">
                        ₹{formatIndian(visit.total)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${modeBadge.bg}`}>
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
            {/* Proportion Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-gray-600 dark:text-gray-300">
                <span>Payment Mode Distribution</span>
                <span>{cashShare}% Cash · {upiShare}% UPI · {creditShare}% Udhaar</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
                <div
                  style={{ width: `${cashShare}%`, backgroundColor: '#1B7A43' }}
                  title={`Cash: ₹${cashSales}`}
                  className="transition-all duration-500"
                />
                <div
                  style={{ width: `${upiShare}%`, backgroundColor: '#5B21B6' }}
                  title={`UPI: ₹${upiSales}`}
                  className="transition-all duration-500"
                />
                <div
                  style={{ width: `${creditShare}%`, backgroundColor: '#E68A00' }}
                  title={`Udhaar: ₹${creditIssued}`}
                  className="transition-all duration-500"
                />
              </div>
            </div>

            {/* Clear Math Explainer */}
            <div className="rounded-xl p-3 bg-[#F9F7F4] dark:bg-[#11181F] border border-[#E2D9C8] dark:border-[#2A3644] space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>📦 Total Goods Sold Today (Turnover)</span>
                <span className="font-bold">
                  ₹{formatIndian(cashSales)} (Cash) + ₹{formatIndian(upiSales)} (UPI) + ₹{formatIndian(creditIssued)} (Udhaar) = <span className="text-[#1B7A43] dark:text-emerald-400">₹{formatIndian(totalTurnover)}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 pt-1 border-t border-[#E2D9C8] dark:border-[#2A3644]">
                <span>💰 Actual Money Received Today (Inflow)</span>
                <span className="font-bold">
                  ₹{formatIndian(cashSales)} (Cash) + ₹{formatIndian(upiSales)} (UPI) + ₹{formatIndian(collectionsReceived)} (Wasooli) = <span className="text-emerald-700 dark:text-emerald-400">₹{formatIndian(totalInflow)}</span>
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <span className="text-[10px] text-green-700 dark:text-green-400 font-medium block">💵 Cash Inflow</span>
                <span className="text-sm font-bold text-green-800 dark:text-green-300">
                  ₹{formatIndian(cashSales + collectionsReceived)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium block">📱 UPI Inflow</span>
                <span className="text-sm font-bold text-purple-800 dark:text-purple-300">
                  ₹{formatIndian(upiSales)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block">👥 Active Udhaar</span>
                <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
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
