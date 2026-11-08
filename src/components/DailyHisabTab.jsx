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

  const [gallaInput, setGallaInput] = useState('');
  const [gallaSubmitted, setGallaSubmitted] = useState(gallaActual != null);
  const [detailViewTab, setDetailViewTab] = useState('customers'); // 'customers' | 'breakdown'

  // Session deltas (how much this session added to each metric)
  const sessionCashDelta = sessionStats?.cashSalesDelta ?? 0;
  const sessionUpiDelta = sessionStats?.upiSalesDelta ?? 0;
  const sessionCreditDelta = sessionStats?.creditIssuedDelta ?? 0;
  const sessionCollectionDelta = sessionStats?.collectionsReceivedDelta ?? 0;
  const sessionOutstandingDelta = sessionStats?.outstandingDelta ?? 0;

  // Galla reconciliation
  const gallaActualVal = gallaActual != null ? Number(gallaActual) : null;
  const gallaDiff = gallaActualVal != null ? gallaActualVal - expectedGalla : null;

  const handleGallaSubmit = (amount) => {
    const val = Number(amount);
    if (isNaN(val) || val < 0) return;
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
      bgColor: '#E8F5EE',
      iconColor: '#1B7A43',
      borderColor: '#1B7A43',
      delta: sessionCashDelta,
    },
    {
      id: 'upi',
      label: lang === 'hi' ? 'आज की UPI बिक्री' : 'UPI Sales Today',
      value: upiSales,
      icon: CreditCard,
      bgColor: '#EDE9FE',
      iconColor: '#5B21B6',
      borderColor: '#5B21B6',
      delta: sessionUpiDelta,
    },
    {
      id: 'credit',
      label: lang === 'hi' ? 'आज का उधार दिया' : 'Credit Issued (Udhaar)',
      value: creditIssued,
      icon: TrendingUp,
      bgColor: '#FFF4E0',
      iconColor: '#E68A00',
      borderColor: '#E68A00',
      delta: sessionCreditDelta,
    },
    {
      id: 'collection',
      label: lang === 'hi' ? 'वसूली आई' : 'Collections (Wasooli)',
      value: collectionsReceived,
      icon: ArrowRight,
      bgColor: '#E8F5EE',
      iconColor: '#1B7A43',
      borderColor: '#1B7A43',
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
        <BarChart3 size={20} style={{ color: '#1B7A43' }} />
        <h2 className="text-lg font-bold" style={{ color: '#1E242B' }}>
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
              className="relative rounded-xl p-3 border"
              style={{
                backgroundColor: card.bgColor,
                borderColor: card.borderColor + '33',
              }}
            >
              {/* Session delta badge */}
              {card.delta > 0 && (
                <span
                  className="absolute -top-2 -right-2 text-xs font-semibold px-1.5 py-0.5 rounded-full text-white shadow-sm"
                  style={{ backgroundColor: card.iconColor }}
                >
                  +₹{formatIndian(card.delta)}
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.iconColor + '1A' }}
                >
                  <Icon size={16} style={{ color: card.iconColor }} />
                </div>
              </div>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#5A6573' }}>
                {card.label}
              </p>
              <p className="text-xl font-bold" style={{ color: '#1E242B' }}>
                ₹{formatIndian(card.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* ─── Total Outstanding Credit (full-width) ─── */}
      <div
        className="relative rounded-xl p-4 border"
        style={{
          backgroundColor: totalOutstandingCredit > 15000 ? '#FEF2F2' : '#FFF4E0',
          borderColor: totalOutstandingCredit > 15000 ? '#DC262633' : '#E68A0033',
        }}
      >
        {sessionOutstandingDelta !== 0 && (
          <span
            className="absolute -top-2 -right-2 text-xs font-semibold px-1.5 py-0.5 rounded-full text-white shadow-sm"
            style={{
              backgroundColor: totalOutstandingCredit > 15000 ? '#DC2626' : '#E68A00',
            }}
          >
            {sessionOutstandingDelta > 0 ? '+' : ''}₹{formatIndian(sessionOutstandingDelta)}
          </span>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {totalOutstandingCredit > 15000 ? (
                <AlertTriangle size={18} style={{ color: '#DC2626' }} />
              ) : (
                <TrendingUp size={18} style={{ color: '#E68A00' }} />
              )}
              <p className="text-sm font-medium" style={{ color: '#5A6573' }}>
                {lang === 'hi' ? 'कुल बकाया उधार' : 'Total Outstanding Credit'}
              </p>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: totalOutstandingCredit > 15000 ? '#DC2626' : '#B36B00' }}
            >
              ₹{formatIndian(totalOutstandingCredit)}
            </p>
          </div>
          {totalOutstandingCredit > 15000 && (
            <div
              className="px-2 py-1 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: '#DC262615', color: '#DC2626' }}
            >
              {lang === 'hi' ? 'ज़्यादा!' : 'High!'}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ 2. Night-Time Galla Reconciliation ═══════════ */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: '#E6DFD3', backgroundColor: 'white' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: '#E6DFD3', backgroundColor: '#F9F7F4' }}>
          <h3 className="text-base font-bold" style={{ color: '#1E242B' }}>
            🌙 {lang === 'hi' ? 'रात का गल्ला चेक' : 'Night-Time Galla Check'}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Calculation breakdown */}
          <div
            className="rounded-lg p-3 text-sm space-y-1"
            style={{ backgroundColor: '#F9F7F4', color: '#5A6573' }}
          >
            <div className="flex justify-between">
              <span>{lang === 'hi' ? 'सुबह का गल्ला' : 'Opening Galla'}</span>
              <span className="font-semibold" style={{ color: '#1E242B' }}>
                ₹{formatIndian(openingGalla)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'hi' ? '+ नकद बिक्री' : '+ Cash Sales'}</span>
              <span className="font-semibold" style={{ color: '#1B7A43' }}>
                +₹{formatIndian(cashSales)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{lang === 'hi' ? '+ नकद वसूली' : '+ Cash Wasooli'}</span>
              <span className="font-semibold" style={{ color: '#1B7A43' }}>
                +₹{formatIndian(collectionsReceived)}
              </span>
            </div>
            <div
              className="flex justify-between pt-2 mt-2 border-t font-bold"
              style={{ borderColor: '#E6DFD3', color: '#1E242B' }}
            >
              <span>{lang === 'hi' ? 'Expected गल्ला' : 'Expected Galla'}</span>
              <span>₹{formatIndian(expectedGalla)}</span>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1E242B' }}>
              {lang === 'hi'
                ? 'रात को गल्ले में कितना Cash मिला?'
                : 'Raat ko Galla mein kitna Cash mila?'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-sm"
                  style={{ color: '#5A6573' }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{
                    borderColor: '#E6DFD3',
                    color: '#1E242B',
                    '--tw-ring-color': '#1B7A43',
                  }}
                  placeholder={lang === 'hi' ? 'राशि डालें...' : 'Enter amount...'}
                  value={gallaInput}
                  onChange={(e) => setGallaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && gallaInput) handleGallaSubmit(gallaInput);
                  }}
                />
              </div>
              <button
                className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors"
                style={{ backgroundColor: '#1B7A43' }}
                onClick={() => gallaInput && handleGallaSubmit(gallaInput)}
              >
                {lang === 'hi' ? 'चेक करो' : 'Check'}
              </button>
            </div>
          </div>

          {/* Quick test buttons */}
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors hover:opacity-80"
              style={{ borderColor: '#1B7A4333', color: '#1B7A43', backgroundColor: '#E8F5EE' }}
              onClick={() => handleGallaSubmit(expectedGalla)}
            >
              ✅ Match Exact (₹{formatIndian(expectedGalla)})
            </button>
            <button
              className="flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors hover:opacity-80"
              style={{ borderColor: '#E68A0033', color: '#B36B00', backgroundColor: '#FFF4E0' }}
              onClick={() => handleGallaSubmit(Math.max(0, expectedGalla - 250))}
            >
              ⚠️ Simulate ₹250 Short (₹{formatIndian(Math.max(0, expectedGalla - 250))})
            </button>
          </div>

          {/* Result */}
          {gallaSubmitted && gallaActualVal != null && (
            <div
              className="rounded-lg p-3 border"
              style={
                gallaDiff === 0
                  ? { backgroundColor: '#E8F5EE', borderColor: '#1B7A4333', color: '#1B7A43' }
                  : gallaDiff < 0
                    ? { backgroundColor: '#FEF2F2', borderColor: '#DC262633', color: '#DC2626' }
                    : { backgroundColor: '#FFF4E0', borderColor: '#E68A0033', color: '#B36B00' }
              }
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
      <div
        className="rounded-xl border overflow-hidden bg-white dark:bg-[#1E252D] dark:border-[#2F3844]"
        style={{ borderColor: '#E6DFD3' }}
      >
        {/* Dual Tab Switcher */}
        <div className="px-4 py-2.5 border-b flex items-center justify-between flex-wrap gap-2 bg-[#F9F7F4] dark:bg-[#151B22] dark:border-[#2F3844]" style={{ borderColor: '#E6DFD3' }}>
          <div className="flex bg-gray-200 dark:bg-[#242C35] p-0.5 rounded-lg">
            <button
              onClick={() => setDetailViewTab('customers')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                detailViewTab === 'customers'
                  ? 'bg-white dark:bg-[#1E252D] text-[#1B7A43] dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              👥 Aaj Ke Grahak ({todayVisits.length})
            </button>
            <button
              onClick={() => setDetailViewTab('breakdown')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                detailViewTab === 'breakdown'
                  ? 'bg-white dark:bg-[#1E252D] text-[#1B7A43] dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 Hisab Math Breakdown
            </button>
          </div>

          <span className="text-xs font-bold text-[#1B7A43] dark:text-green-400">
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
            <div className="rounded-lg p-3 bg-gray-50 dark:bg-[#151B22] border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                <span>📦 Total Goods Sold Today (Turnover)</span>
                <span className="font-bold">
                  ₹{formatIndian(cashSales)} (Cash) + ₹{formatIndian(upiSales)} (UPI) + ₹{formatIndian(creditIssued)} (Udhaar) = <span className="text-[#1B7A43] dark:text-green-400">₹{formatIndian(totalTurnover)}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 pt-1 border-t border-gray-200 dark:border-gray-700">
                <span>💰 Actual Money Received Today (Inflow)</span>
                <span className="font-bold">
                  ₹{formatIndian(cashSales)} (Cash) + ₹{formatIndian(upiSales)} (UPI) + ₹{formatIndian(collectionsReceived)} (Wasooli) = <span className="text-green-700 dark:text-green-400">₹{formatIndian(totalInflow)}</span>
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
