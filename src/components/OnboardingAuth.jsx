import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, Check, ArrowRight, Sun, Moon, Phone,
  Store as StoreIcon, Shield, WifiOff, CheckCircle2,
  ChevronRight, ChevronLeft, AlertCircle
} from 'lucide-react';

// ─── Slide Content Data ──────────────────────────────────────
const SLIDES = [
  {
    headline: 'Speak in Hinglish. Bill in 3 seconds.',
    subtext: 'Say items naturally in Hindi or English—no tapping through 5 menus during store rush.',
  },
  {
    headline: 'Snap any parchi. Instant digital bill.',
    subtext: 'Point your camera at handwritten customer slips and convert them into verified bills.',
  },
  {
    headline: 'Zero-error khata. Even without internet.',
    subtext: 'Every rupee needs your tap to confirm, with instant WhatsApp slips and safe local sync.',
  },
];

// ─── Tactile 4-Circle PIN Input ──────────────────────────────
function PinCircles({ value, onChange, id }) {
  const digits = value.padEnd(4, ' ').split('').slice(0, 4);
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const focusIdx = useCallback((i) => {
    if (i >= 0 && i < 4) refs[i].current?.focus();
  }, []);

  const handleKey = (idx, e) => {
    const key = e.key;
    if (key === 'Backspace') {
      e.preventDefault();
      const arr = value.split('');
      if (arr[idx]) {
        arr[idx] = '';
        onChange(arr.join(''));
      } else if (idx > 0) {
        arr[idx - 1] = '';
        onChange(arr.join(''));
        focusIdx(idx - 1);
      }
      return;
    }
    if (key === 'ArrowLeft') { focusIdx(idx - 1); return; }
    if (key === 'ArrowRight') { focusIdx(idx + 1); return; }
    if (/^\d$/.test(key)) {
      e.preventDefault();
      const arr = value.split('');
      while (arr.length < 4) arr.push('');
      arr[idx] = key;
      onChange(arr.join('').replace(/\s/g, '').slice(0, 4));
      if (idx < 3) focusIdx(idx + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
    onChange(pasted);
    focusIdx(Math.min(pasted.length, 3));
  };

  return (
    <div className="flex items-center justify-center gap-3" id={id}>
      {digits.map((d, i) => {
        const filled = d.trim() !== '';
        return (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={filled ? '•' : ''}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-13 h-13 rounded-full text-center text-xl font-bold border-2 outline-none transition-all cursor-pointer ${
              filled
                ? 'bg-[#C8F53B]/20 border-[#111315]/20 dark:border-[#C8F53B]/50 text-[#111315] dark:text-white shadow-sm'
                : 'bg-slate-100/90 dark:bg-[#16191F] border-transparent text-slate-400'
            } focus:border-[#111315] dark:focus:border-[#C8F53B] focus:bg-white dark:focus:bg-[#16191F]`}
            aria-label={`PIN digit ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

// ─── Real Layered UI Mockup: Slide 0 (Hinglish Voice Billing) ──
function SlideVoice() {
  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Top Floating Dark-Glass Voice Bar */}
      <div className="bg-[#181C24]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-xl flex items-center gap-3">
        {/* Pulsing Volt-Lime mic circle */}
        <div className="w-9 h-9 rounded-full bg-[#C8F53B] text-[#111315] flex items-center justify-center shadow-[0_0_20px_rgba(200,245,59,0.35)] shrink-0 animate-pulse">
          <Mic className="w-4 h-4 text-[#111315]" strokeWidth={2.5} />
        </div>
        {/* 6 animated soundwave bars */}
        <div className="flex items-end gap-1 h-5 shrink-0">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-[#C8F53B] animate-wave-pulse"
              style={{ animationDelay: `${i * 0.14}s` }}
            />
          ))}
        </div>
        {/* Live Hinglish text */}
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-white/95 truncate">
            “Raju ne 5kg aata, 2 biscuit, 5 Maggi liya”
          </p>
        </div>
      </div>

      {/* Mini Draft Bill Card */}
      <div className="bg-[#181C24]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Draft Bill · Raju
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#C8F53B]/10 text-[#C8F53B] border border-[#C8F53B]/20 text-[10px] font-semibold">
            Voice Parsed
          </span>
        </div>

        {/* 3 clean tabular-nums rows */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-white/90 font-medium">Aata (Wheat Flour)</span>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-slate-300">5 kg</span>
              <span className="font-bold text-white tabular-nums">₹225</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/90 font-medium">Biscuit (Parle-G)</span>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-slate-300">2 pkt</span>
              <span className="font-bold text-white tabular-nums">₹20</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/90 font-medium">Maggi Noodles</span>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-slate-300">5 pkt</span>
              <span className="font-bold text-white tabular-nums">₹70</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Total:</span>
            <span className="text-lg font-extrabold text-white tabular-nums">₹315</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8F53B]/15 text-[#C8F53B] border border-[#C8F53B]/30 text-xs font-bold shadow-[0_0_12px_rgba(200,245,59,0.2)]">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            Approved · Soundbox ON
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Real Layered UI Mockup: Slide 1 (AI Handwritten Parchi Scan) ──
function SlideParchi() {
  return (
    <div className="w-full max-w-md mx-auto relative py-2">
      {/* Tilted warm-paper handwritten slip card */}
      <div className="relative w-64 sm:w-72 bg-[#FAF7F0] text-slate-800 rounded-2xl p-4 shadow-2xl border border-amber-200/50 rotate-[-2.5deg] overflow-hidden font-mono text-xs">
        {/* Animated sweeping emerald/lime laser scan line */}
        <div className="absolute left-0 right-0 h-0.5 bg-[#C8F53B] shadow-[0_0_12px_#C8F53B,0_0_24px_#C8F53B] animate-laser-sweep pointer-events-none z-20" />

        <div className="space-y-2 relative z-10">
          <div className="border-b border-dashed border-slate-300 pb-1.5 flex justify-between items-center text-[11px]">
            <span className="font-bold tracking-wider text-slate-700">PARCHI SLIP</span>
            <span className="text-[10px] text-slate-400">20 Nov</span>
          </div>
          <div className="font-bold text-slate-900 text-xs">Ramesh - Udhaar</div>
          <div className="space-y-1 text-slate-600 text-[11px]">
            <div className="flex justify-between">
              <span>2kg Aata</span>
              <span>₹90</span>
            </div>
            <div className="flex justify-between">
              <span>1 Sabun</span>
              <span>₹40</span>
            </div>
            <div className="flex justify-between">
              <span>1kg Chini</span>
              <span>₹44</span>
            </div>
          </div>
          <div className="border-t border-dashed border-slate-300 pt-1.5 flex justify-between font-bold text-slate-800 text-xs">
            <span>Total</span>
            <span>₹174</span>
          </div>
        </div>
      </div>

      {/* Floating Extracted Card overlapping bottom-right corner */}
      <div className="bg-[#181C24]/95 backdrop-blur-md border border-emerald-400/40 rounded-xl p-3.5 shadow-2xl w-60 sm:w-64 ml-auto -mt-10 mr-2 relative z-20 space-y-2">
        <div className="flex items-center gap-1.5 text-[#C8F53B] text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C8F53B]" />
          <span>✓ 3 Items Parsed</span>
        </div>
        <div className="text-[11px] text-slate-300 flex items-center justify-between">
          <span className="truncate max-w-[130px]">Aata, Sabun, Chini</span>
          <span className="font-bold text-white tabular-nums">₹174</span>
        </div>
        <div className="w-full text-center py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
          Ready to Confirm
        </div>
      </div>
    </div>
  );
}

// ─── Real Layered UI Mockup: Slide 2 (Zero-Error Bahi-Khata & Offline Sync) ──
function SlideTrust() {
  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Sleek Customer Ledger Card */}
      <div className="bg-[#181C24]/95 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3.5">
        {/* Customer Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center text-sm border border-white/10">
              RK
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                Ramesh Kumar
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
              </div>
              <div className="text-xs text-slate-400">Sector 4 · +91 98112 00000</div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Approval Zaroori Hai
          </span>
        </div>

        {/* Balance Box with Transition */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Udhaar Khata Balance
          </div>
          <div className="text-2xl font-extrabold text-[#C8F53B] tabular-nums tracking-tight flex items-center gap-2.5 animate-balance-pop">
            <span className="text-slate-400 line-through text-lg font-bold">₹420</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span>₹550</span>
          </div>
          <div className="text-[11px] text-slate-400">
            +₹130 New Bill Added · WhatsApp Slip Sent
          </div>
        </div>
      </div>

      {/* Floating Offline Queue Pill */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium shadow-lg">
          <WifiOff className="w-3.5 h-3.5 text-amber-300" />
          <span>Offline Queue · 100% Safe</span>
        </div>
      </div>
    </div>
  );
}

// ─── UI Mockup Dispatcher ────────────────────────────────────
function SlideMockup({ index }) {
  if (index === 0) return <SlideVoice />;
  if (index === 1) return <SlideParchi />;
  return <SlideTrust />;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function OnboardingAuth({
  store,
  isDarkMode,
  setIsDarkMode,
  authTab,
  setAuthTab,
  loginPhone,
  setLoginPhone,
  loginPin,
  setLoginPin,
  signupShopName,
  setSignupShopName,
  signupOwnerName,
  setSignupOwnerName,
  signupPhone,
  setSignupPhone,
  signupPin,
  setSignupPin,
  signupArea,
  setSignupArea,
  signupOpeningCash,
  setSignupOpeningCash,
  authError,
  setAuthError,
  handleLogin,
  handleSignup,
}) {
  const [slide, setSlide] = useState(0);
  const [phase, setPhase] = useState('onboarding'); // 'onboarding' | 'auth'

  // Auto-advance showcase slides every 4.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const goToAuth = () => {
    setPhase('auth');
  };

  const replayTour = () => {
    setSlide(0);
    setPhase('onboarding');
  };

  // ─── THEME TOGGLE BUTTON ──────────────────────────────────
  const themeToggle = (
    <button
      type="button"
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#16191F]/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:text-[#111315] dark:hover:text-white flex items-center justify-center shadow-sm hover:scale-105 transition-all cursor-pointer"
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
    </button>
  );

  // ─── EDITORIAL FORM CONTAINER (Right Column & Mobile Auth) ──
  const renderAuthForm = () => (
    <div className="w-full max-w-[380px] relative space-y-6">
      {/* Visible Architectural Grid Halo behind brand icon */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[220px] h-[110px] bg-auth-grid pointer-events-none" />

      {/* Layered Brand Mark */}
      <div className="relative z-10 text-center space-y-3 pt-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#111315] dark:bg-[#C8F53B] shadow-xl flex items-center justify-center ring-4 ring-slate-100 dark:ring-white/5 text-[#C8F53B] dark:text-[#111315] transition-all">
          <StoreIcon className="w-7 h-7" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {authTab === 'login' ? 'Welcome back' : 'Open your shop'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {authTab === 'login'
              ? 'Sign in to open your shop counter'
              : 'Register your counter in 30 seconds'}
          </p>
        </div>
      </div>

      {/* Segmented Pill Switcher */}
      <div className="relative z-10 flex p-1 rounded-full bg-slate-100 dark:bg-[#16191F] border border-slate-200/70 dark:border-white/10">
        <button
          type="button"
          onClick={() => { setAuthTab('login'); setAuthError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center cursor-pointer ${
            authTab === 'login'
              ? 'bg-[#C8F53B] text-[#111315] shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Shop Login
        </button>
        <button
          type="button"
          onClick={() => { setAuthTab('signup'); setAuthError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center cursor-pointer ${
            authTab === 'signup'
              ? 'bg-[#C8F53B] text-[#111315] shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          New Shop
        </button>
      </div>

      {/* Error Banner */}
      {authError && (
        <div className="relative z-10 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{authError}</span>
        </div>
      )}

      {/* ── Login Form ── */}
      {authTab === 'login' && (
        <form onSubmit={handleLogin} className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-500 dark:text-slate-400">
              Mobile Number
            </label>
            <div className="h-12 rounded-2xl bg-slate-50 dark:bg-[#16191F] border border-slate-200 dark:border-white/10 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B] focus-within:bg-white dark:focus-within:bg-[#16191F] transition-all flex items-center px-3.5 relative">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-2.5 select-none">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                className="w-full bg-transparent text-sm text-[#111315] dark:text-white font-medium outline-none tabular-nums placeholder:text-slate-400"
                required
              />
              <Phone size={15} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-500 dark:text-slate-400">
              4-Digit PIN
            </label>
            <PinCircles value={loginPin} onChange={setLoginPin} id="login-pin" />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              Demo: 9876543210 / PIN: 1234
            </p>
          </div>

          {/* Primary CTA: Jet Ink Black */}
          <button
            type="submit"
            className="w-full h-12 rounded-full bg-[#111315] hover:bg-black dark:bg-white dark:text-[#111315] text-white font-semibold text-sm shadow-lg shadow-black/15 flex items-center justify-center cursor-pointer active:scale-[0.98] transition-all"
          >
            Login to Shop
          </button>
        </form>
      )}

      {/* ── Sign Up Form ── */}
      {authTab === 'signup' && (
        <form onSubmit={handleSignup} className="relative z-10 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
              Shop Name *
            </label>
            <div className="h-11 rounded-2xl bg-slate-50 dark:bg-[#16191F] border border-slate-200 dark:border-white/10 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B] focus-within:bg-white dark:focus-within:bg-[#16191F] transition-all px-3.5 flex items-center">
              <input
                type="text"
                value={signupShopName}
                onChange={(e) => setSignupShopName(e.target.value)}
                placeholder="Sharma Grocery Store"
                className="w-full bg-transparent text-sm text-[#111315] dark:text-white outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                Owner Name *
              </label>
              <div className="h-11 rounded-2xl bg-slate-50 dark:bg-[#16191F] border border-slate-200 dark:border-white/10 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B] focus-within:bg-white dark:focus-within:bg-[#16191F] transition-all px-3.5 flex items-center">
                <input
                  type="text"
                  value={signupOwnerName}
                  onChange={(e) => setSignupOwnerName(e.target.value)}
                  placeholder="Ramesh Sharma"
                  className="w-full bg-transparent text-sm text-[#111315] dark:text-white outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                City / Area
              </label>
              <div className="h-11 rounded-2xl bg-slate-50 dark:bg-[#16191F] border border-slate-200 dark:border-white/10 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B] focus-within:bg-white dark:focus-within:bg-[#16191F] transition-all px-3.5 flex items-center">
                <input
                  type="text"
                  value={signupArea}
                  onChange={(e) => setSignupArea(e.target.value)}
                  placeholder="Jaipur"
                  className="w-full bg-transparent text-sm text-[#111315] dark:text-white outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                Mobile *
              </label>
              <div className="h-11 rounded-2xl bg-slate-50 dark:bg-[#16191F] border border-slate-200 dark:border-white/10 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B] focus-within:bg-white dark:focus-within:bg-[#16191F] transition-all px-3 flex items-center">
                <span className="text-[11px] font-bold text-slate-400 mr-1.5 select-none">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9811122233"
                  className="w-full bg-transparent text-sm text-[#111315] dark:text-white outline-none tabular-nums placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                Opening Cash ₹
              </label>
              <div className="h-11 rounded-2xl bg-slate-50 dark:bg-[#16191F] border border-slate-200 dark:border-white/10 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B] focus-within:bg-white dark:focus-within:bg-[#16191F] transition-all px-3 flex items-center">
                <span className="text-xs font-bold text-slate-400 mr-1.5">₹</span>
                <input
                  type="number"
                  value={signupOpeningCash}
                  onChange={(e) => setSignupOpeningCash(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-transparent text-sm text-[#111315] dark:text-white font-semibold outline-none tabular-nums placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-500 dark:text-slate-400">
              4-Digit PIN *
            </label>
            <PinCircles value={signupPin} onChange={setSignupPin} id="signup-pin" />
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-full bg-[#111315] hover:bg-black dark:bg-white dark:text-[#111315] text-white font-semibold text-sm shadow-lg shadow-black/15 flex items-center justify-center cursor-pointer active:scale-[0.98] transition-all mt-1"
          >
            Create Shop & Counter
          </button>
        </form>
      )}

      {/* Clean Divider & Refined Instant Demo Merchant Card */}
      <div className="relative z-10 space-y-3 pt-1">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
            OR TRY LIVE DEMO
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Merchant Quick-Access Card */}
        <button
          type="button"
          onClick={() => store.loginDemoMerchant()}
          className="w-full rounded-2xl p-3 bg-slate-50 hover:bg-[#C8F53B]/15 dark:bg-[#16191F] dark:hover:bg-[#C8F53B]/10 border border-slate-200 dark:border-white/10 hover:border-[#C8F53B] transition-all flex items-center justify-between text-left group cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8F53B] text-[#111315] font-extrabold flex items-center justify-center shrink-0 text-sm shadow-sm">
              GK
            </div>
            <div>
              <div className="font-bold text-sm text-[#111315] dark:text-white leading-tight">
                Gupta Kirana Store
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                Instant 1-Click Demo · PIN 1234
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 group-hover:bg-[#111315] group-hover:text-[#C8F53B] text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center shrink-0 shadow-sm">
            <ArrowRight size={15} />
          </div>
        </button>
      </div>
    </div>
  );

  // ─── DESKTOP LEFT PANEL: Obsidian Showcase Panel ───────────
  const renderLeftPanel = () => (
    <div className="w-full h-full min-h-[calc(100vh-2rem)] rounded-[2rem] bg-[#0F1217] relative overflow-hidden flex flex-col justify-between p-8 lg:p-10 text-white border border-white/10 shadow-2xl">
      {/* Mesh Glows & Architectural Grid */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C8F53B]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#6366F1]/15 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-auth-grid opacity-[0.06] pointer-events-none" />

      {/* Top Bar inside Panel */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#C8F53B] shadow-inner">
            <StoreIcon size={18} strokeWidth={2.2} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">KiranaScan</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10 text-xs font-medium backdrop-blur-sm">
          Offline-Ready Retail OS
        </span>
      </div>

      {/* Centerpiece: Real Layered UI Mockup Stage */}
      <div className="relative z-10 my-auto py-6">
        <SlideMockup index={slide} />
      </div>

      {/* Bottom Footer inside Panel */}
      <div className="relative z-10 space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            {SLIDES[slide].headline}
          </h2>
          <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-lg">
            {SLIDES[slide].subtext}
          </p>
        </div>

        {/* Clickable Progress Bars & Prev/Next Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  slide === i
                    ? 'w-10 bg-[#C8F53B]'
                    : 'w-3 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSlide((s) => (s - 1 + 3) % 3)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSlide((s) => (s + 1) % 3)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MOBILE ONBOARDING VIEW (< 768px) ──────────────────────
  const mobileOnboarding = (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0B0D11] text-slate-900 dark:text-white">
      {/* Top Hero Stage */}
      <div className="min-h-[55vh] rounded-b-[2.5rem] bg-[#0F1217] relative overflow-hidden flex flex-col justify-between p-6 text-white border-b border-white/10 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#C8F53B]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#6366F1]/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-auth-grid opacity-[0.06] pointer-events-none" />

        {/* Top Bar inside Stage */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#C8F53B]">
              <StoreIcon size={16} strokeWidth={2.2} />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">KiranaScan</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToAuth}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition-colors cursor-pointer"
            >
              Skip →
            </button>
            {themeToggle}
          </div>
        </div>

        {/* Active Mockup */}
        <div className="relative z-10 my-auto py-2">
          <SlideMockup index={slide} />
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="flex-1 flex flex-col justify-between p-6 space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            {SLIDES[slide].headline}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {SLIDES[slide].subtext}
          </p>
        </div>

        {/* Expanding Pagination Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                slide === i
                  ? 'w-8 bg-[#111315] dark:bg-[#C8F53B]'
                  : 'w-2 bg-slate-200 dark:bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-2 pt-2">
          {slide < 2 ? (
            <button
              type="button"
              onClick={() => setSlide((s) => s + 1)}
              className="w-full h-12 rounded-full bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-semibold text-sm shadow-md cursor-pointer active:scale-[0.98] transition-all"
            >
              Next
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={goToAuth}
                className="w-full h-12 rounded-full bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-semibold text-sm shadow-md cursor-pointer active:scale-[0.98] transition-all"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => { goToAuth(); setTimeout(() => store.loginDemoMerchant(), 50); }}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer py-1"
              >
                Try Instant Demo Store →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen w-full bg-white dark:bg-[#0B0D11] text-slate-900 dark:text-white transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {/* Mobile Onboarding Flow (active only on mobile when phase === 'onboarding') */}
      {phase === 'onboarding' ? (
        <div className="flex md:hidden flex-col min-h-screen">
          {mobileOnboarding}
        </div>
      ) : null}

      {/* Split Canvas Layout:
          - Desktop (md: >= 768px): Always rendered side-by-side regardless of phase
          - Mobile (< 768px): Rendered only when phase === 'auth' (occupying col-span-12) */}
      <div className={`w-full min-h-screen grid md:grid-cols-12 ${phase === 'onboarding' ? 'hidden md:grid' : 'grid'}`}>
        {/* Left Panel: Desktop Showcase */}
        <div className="hidden md:flex md:col-span-6 lg:col-span-7 p-4">
          {renderLeftPanel()}
        </div>

        {/* Right Panel: Editorial Auth Form */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 relative">
          {/* Top-Right Theme Toggle */}
          <div className="absolute top-6 right-6 z-20">
            {themeToggle}
          </div>

          {/* Mobile-only "← View App Tour" link when in auth view */}
          {phase === 'auth' && (
            <div className="absolute top-6 left-6 z-20 md:hidden">
              <button
                type="button"
                onClick={replayTour}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer py-1.5 px-3 rounded-full bg-slate-100 dark:bg-white/10 transition-colors"
              >
                ← View App Tour
              </button>
            </div>
          )}

          {renderAuthForm()}
        </div>
      </div>
    </div>
  );
}
