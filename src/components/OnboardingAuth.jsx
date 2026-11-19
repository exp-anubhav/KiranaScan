import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, Camera, Shield, WifiOff, Zap, ArrowRight, Sun, Moon,
  Phone, Store as StoreIcon, User, MapPin, ChevronRight, Wallet,
  AlertCircle, CheckCircle2, Sparkles
} from 'lucide-react';

// ─── Slide Data ──────────────────────────────────────────────
const SLIDES = [
  {
    headline: 'Speak in Hinglish. Bill in 3 seconds.',
    subtext: 'Say items naturally in Hindi or English\u2014no tapping through 5 menus during store rush.',
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

// ─── 4-Circle PIN Input ─────────────────────────────────────
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
            value={filled ? '\u2022' : ''}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-13 h-13 rounded-full text-center text-lg font-bold border-2 outline-none transition-all bg-white dark:bg-[#1E222B] ${
              filled
                ? 'border-[#C8F53B] text-[#111315] dark:text-white shadow-[0_0_0_3px_rgba(200,245,59,0.15)]'
                : 'border-slate-200 dark:border-[#2A2F3A] text-slate-400'
            } focus:border-[#6366F1] dark:focus:border-[#C8F53B] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(200,245,59,0.2)]`}
            aria-label={`PIN digit ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

// ─── Slide 0: Voice Billing Hero ─────────────────────────────
function VoiceHero() {
  return (
    <div className="relative w-full h-full rounded-[2rem] bg-[#111315] overflow-hidden flex items-center justify-center">
      {/* Concentric pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-56 rounded-full border border-[#C8F53B]/10 animate-[logo-ripple_3s_ease-in-out_infinite]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-40 h-40 rounded-full border border-[#C8F53B]/15 animate-[logo-ripple_3s_ease-in-out_infinite_0.6s]" />
      </div>

      {/* Core mic icon */}
      <div className="relative z-10 w-20 h-20 rounded-full bg-[#C8F53B] flex items-center justify-center shadow-[0_0_60px_rgba(200,245,59,0.4)]">
        <Mic className="w-9 h-9 text-[#111315]" strokeWidth={2.5} />
      </div>

      {/* Orbiting micro-pills */}
      <div className="absolute top-[14%] left-[8%] animate-float-orbit">
        <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-semibold text-white/90 border border-white/10">5kg Aata</span>
      </div>
      <div className="absolute top-[18%] right-[10%] animate-float-orbit" style={{ animationDelay: '0.8s' }}>
        <span className="px-3 py-1.5 rounded-full bg-[#C8F53B]/15 backdrop-blur-sm text-[11px] font-semibold text-[#C8F53B] border border-[#C8F53B]/20 tabular-nums">₹225</span>
      </div>
      <div className="absolute bottom-[18%] left-[12%] animate-float-orbit" style={{ animationDelay: '1.6s' }}>
        <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-semibold text-white/90 border border-white/10">Soundbox ON</span>
      </div>
      <div className="absolute bottom-[14%] right-[8%] animate-float-orbit" style={{ animationDelay: '2.4s' }}>
        <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-semibold text-white/90 border border-white/10">Hinglish AI</span>
      </div>

      {/* Soundwave bars at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1 h-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="w-1 rounded-full bg-[#C8F53B]/60 animate-wave-pulse" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Slide 1: Parchi OCR Hero ────────────────────────────────
function ParchiHero() {
  return (
    <div className="relative w-full h-full rounded-[2rem] bg-gradient-to-br from-[#FF5C35] via-[#F97316] to-[#6366F1] overflow-hidden flex items-center justify-center p-6">
      {/* Paper slip */}
      <div className="relative w-48 bg-white rounded-2xl shadow-2xl p-4 rotate-[-4deg] border border-black/5">
        {/* Laser sweep */}
        <div className="absolute left-0 right-0 h-0.5 bg-[#C8F53B] shadow-[0_0_12px_#C8F53B,0_0_24px_#C8F53B] animate-laser-sweep pointer-events-none z-20" />

        <div className="space-y-2.5 font-mono text-[11px] text-slate-700 leading-tight">
          <div className="border-b border-dashed border-slate-300 pb-1.5 text-center font-bold text-xs text-slate-800">PARCHI</div>
          <div className="flex justify-between"><span>Maggi ×5</span><span>₹70</span></div>
          <div className="flex justify-between"><span>Aata 5kg</span><span>₹225</span></div>
          <div className="flex justify-between"><span>Tel 1L</span><span>₹160</span></div>
          <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-xs"><span>Total</span><span>₹455</span></div>
        </div>
      </div>

      {/* Floating extracted chips */}
      <div className="absolute top-[12%] right-[8%] animate-float-orbit" style={{ animationDelay: '0.3s' }}>
        <span className="px-3 py-1.5 rounded-full bg-white/90 text-[11px] font-bold text-[#111315] shadow-lg">Maggi ×5</span>
      </div>
      <div className="absolute bottom-[16%] right-[12%] animate-float-orbit" style={{ animationDelay: '1.2s' }}>
        <span className="px-3 py-1.5 rounded-full bg-[#C8F53B] text-[11px] font-bold text-[#111315] shadow-lg">Auto-Priced</span>
      </div>
    </div>
  );
}

// ─── Slide 2: Trust & Offline Hero ───────────────────────────
function TrustHero() {
  return (
    <div className="relative w-full h-full rounded-[2rem] bg-gradient-to-br from-[#0D3320] via-[#111315] to-[#111315] overflow-hidden flex items-center justify-center">
      {/* Floating credit card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl max-w-[220px] w-full space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white text-xs font-bold">Ramesh Kumar</span>
          <span className="w-2 h-2 rounded-full bg-[#C8F53B] animate-pulse" />
        </div>
        <div className="text-[#C8F53B] text-sm font-bold tabular-nums">
          ₹420 → ₹550
        </div>
        <div className="text-white/50 text-[10px]">Udhaar Updated · Just Now</div>
      </div>

      {/* Shield badge */}
      <div className="absolute top-[14%] left-[10%] animate-float-orbit">
        <span className="px-3 py-1.5 rounded-xl bg-[#C8F53B]/15 backdrop-blur-sm text-[11px] font-bold text-[#C8F53B] border border-[#C8F53B]/20 flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          Approval Zaroori Hai
        </span>
      </div>

      {/* Offline pill */}
      <div className="absolute bottom-[14%] right-[10%] animate-float-orbit" style={{ animationDelay: '1.5s' }}>
        <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-semibold text-white/90 border border-white/10 flex items-center gap-1.5">
          <WifiOff className="w-3 h-3" />
          Works Offline
        </span>
      </div>
    </div>
  );
}

// ─── Slide Visual Hero (wraps the 3 heroes) ──────────────────
function SlideHero({ index }) {
  if (index === 0) return <VoiceHero />;
  if (index === 1) return <ParchiHero />;
  return <TrustHero />;
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
  const [showTour, setShowTour] = useState(false);

  // Auto-advance slides
  useEffect(() => {
    if (phase !== 'onboarding' && !showTour) return;
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, [phase, showTour]);

  const goToAuth = () => {
    setPhase('auth');
    setShowTour(false);
  };

  const replayTour = () => {
    setSlide(0);
    setShowTour(true);
  };

  // Desktop: always show split view (hero left + auth right)
  // Mobile: show onboarding slides first, then auth
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  // ─── Shared: Slide Hero + Text Content ─────────────────────
  const renderHeroSection = (forDesktop = false) => (
    <div className={`flex flex-col ${forDesktop ? 'gap-6 h-full' : 'gap-4'}`}>
      {/* Hero Visual */}
      <div className={`relative overflow-hidden ${forDesktop ? 'flex-1 min-h-[320px]' : 'aspect-[4/3] max-h-[52vh]'}`}>
        <div className="absolute inset-0 transition-all duration-500">
          <SlideHero index={slide} />
        </div>
      </div>

      {/* Headline + Subtext */}
      <div className={`${forDesktop ? 'px-0' : 'px-6'} space-y-2`}>
        <h2 className={`font-extrabold tracking-tight leading-snug text-[#111315] dark:text-white ${forDesktop ? 'text-2xl lg:text-3xl' : 'text-2xl'}`}>
          {SLIDES[slide].headline}
        </h2>
        <p className={`text-slate-500 dark:text-slate-400 leading-relaxed ${forDesktop ? 'text-sm' : 'text-sm'}`}>
          {SLIDES[slide].subtext}
        </p>
      </div>

      {/* Pagination Dots */}
      <div className={`flex items-center gap-2 ${forDesktop ? '' : 'px-6'}`}>
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              slide === i
                ? 'w-7 bg-[#111315] dark:bg-[#C8F53B]'
                : 'w-2 bg-slate-300 dark:bg-[#2A2F3A] hover:bg-slate-400 dark:hover:bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );

  // ─── Shared: Auth Card Content ─────────────────────────────
  const renderAuthCard = (inDesktopSplit = false) => (
    <div className={`bg-white dark:bg-[#16191F] border border-slate-200 dark:border-[#2A2F3A] rounded-[2rem] shadow-2xl ${inDesktopSplit ? 'p-6 lg:p-8' : 'p-6 sm:p-8'} space-y-5 relative overflow-hidden`}>
      {/* Grid background behind logo */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-auth-grid pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 text-center space-y-2 pt-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#111315] dark:bg-[#C8F53B] text-white dark:text-[#111315] flex items-center justify-center shadow-lg">
          <StoreIcon className="w-7 h-7" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#111315] dark:text-white">
            {authTab === 'login' ? 'Welcome back' : 'Open your shop'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            KiranaScan
          </p>
        </div>
      </div>

      {/* Segmented Pill Toggle */}
      <div className="relative z-10 flex p-1 rounded-full bg-slate-100 dark:bg-[#1E222B]">
        <button
          type="button"
          onClick={() => { setAuthTab('login'); setAuthError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authTab === 'login'
              ? 'bg-[#C8F53B] text-[#111315] shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Shop Login
        </button>
        <button
          type="button"
          onClick={() => { setAuthTab('signup'); setAuthError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authTab === 'signup'
              ? 'bg-[#C8F53B] text-[#111315] shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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
        <form onSubmit={handleLogin} className="relative z-10 space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-500 dark:text-slate-400">Mobile Number</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-slate-500 select-none">+91</span>
              <Phone size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="tel"
                maxLength={10}
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                className="w-full pl-12 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-[#2A2F3A] bg-white dark:bg-[#1E222B] text-sm text-[#111315] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] dark:focus:ring-[#C8F53B] tabular-nums"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-500 dark:text-slate-400">4-Digit PIN</label>
            <PinCircles value={loginPin} onChange={setLoginPin} id="login-pin" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              Demo: 9876543210 / PIN: 1234
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            Login to Shop
          </button>
        </form>
      )}

      {/* ── Sign Up Form ── */}
      {authTab === 'signup' && (
        <form onSubmit={handleSignup} className="relative z-10 space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Shop Name *</label>
            <input
              type="text"
              value={signupShopName}
              onChange={(e) => setSignupShopName(e.target.value)}
              placeholder="Sharma Grocery Store"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#2A2F3A] bg-white dark:bg-[#1E222B] text-sm text-[#111315] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] dark:focus:ring-[#C8F53B]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Owner Name *</label>
              <input
                type="text"
                value={signupOwnerName}
                onChange={(e) => setSignupOwnerName(e.target.value)}
                placeholder="Ramesh Sharma"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#2A2F3A] bg-white dark:bg-[#1E222B] text-sm text-[#111315] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] dark:focus:ring-[#C8F53B]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">City</label>
              <input
                type="text"
                value={signupArea}
                onChange={(e) => setSignupArea(e.target.value)}
                placeholder="Jaipur"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#2A2F3A] bg-white dark:bg-[#1E222B] text-sm text-[#111315] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] dark:focus:ring-[#C8F53B]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Mobile *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 select-none">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9811122233"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 dark:border-[#2A2F3A] bg-white dark:bg-[#1E222B] text-sm text-[#111315] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366F1] dark:focus:ring-[#C8F53B] tabular-nums"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">Opening Cash ₹</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={signupOpeningCash}
                  onChange={(e) => setSignupOpeningCash(e.target.value)}
                  placeholder="1000"
                  className="w-full pl-7 pr-3 py-2.5 rounded-2xl border border-slate-200 dark:border-[#2A2F3A] bg-white dark:bg-[#1E222B] text-sm text-[#111315] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366F1] dark:focus:ring-[#C8F53B] tabular-nums"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-500 dark:text-slate-400">4-Digit PIN *</label>
            <PinCircles value={signupPin} onChange={setSignupPin} id="signup-pin" />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer mt-1"
          >
            Create Shop
          </button>
        </form>
      )}

      {/* OR Divider + Instant Demo */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-[#2A2F3A]" />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-[#2A2F3A]" />
        </div>

        <button
          type="button"
          onClick={() => store.loginDemoMerchant()}
          className="w-full py-3 px-4 rounded-full bg-[#C8F53B] hover:bg-[#b8e62b] text-[#111315] font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Instant Demo: Gupta Kirana Store</span>
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Replay tour link */}
      {phase === 'auth' && !showTour && (
        <div className="relative z-10 text-center md:hidden">
          <button
            type="button"
            onClick={replayTour}
            className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-[#6366F1] dark:hover:text-[#C8F53B] font-medium cursor-pointer transition-colors"
          >
            View Feature Tour
          </button>
        </div>
      )}
    </div>
  );

  // ─── THEME TOGGLE (shared) ─────────────────────────────────
  const themeToggle = (
    <button
      type="button"
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="p-2.5 rounded-2xl bg-white/90 dark:bg-[#16191F]/90 backdrop-blur-sm border border-slate-200 dark:border-[#2A2F3A] text-slate-500 dark:text-slate-400 hover:text-[#111315] dark:hover:text-[#C8F53B] shadow-sm transition-all cursor-pointer"
      title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
    >
      {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );

  // ═══════════════════════════════════════════════════════════
  // DESKTOP & TABLET LAYOUT (md >= 768px): Split Canvas
  // ═══════════════════════════════════════════════════════════
  const desktopView = (
    <div className={`hidden md:flex w-full min-h-screen bg-[#F5F7FA] dark:bg-[#0E1013] items-center justify-center p-6 lg:p-10 transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {/* Theme toggle */}
      <div className="fixed top-5 right-5 z-50">{themeToggle}</div>

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left: Hero Showcase */}
        <div className="md:col-span-6 flex flex-col gap-5">
          {renderHeroSection(true)}
        </div>

        {/* Right: Auth Card */}
        <div className="md:col-span-6 w-full max-w-md mx-auto slide-in-up">
          {renderAuthCard(true)}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // MOBILE LAYOUT (< 768px)
  // ═══════════════════════════════════════════════════════════
  const showOnboarding = phase === 'onboarding' || showTour;

  const mobileOnboarding = (
    <div className={`flex md:hidden flex-col min-h-screen bg-[#F5F7FA] dark:bg-[#0E1013] transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#111315] dark:bg-[#C8F53B] text-white dark:text-[#111315] flex items-center justify-center">
            <StoreIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-[#111315] dark:text-white">KiranaScan</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToAuth}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#1E222B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2A2F3A] transition-colors cursor-pointer"
          >
            Skip <ChevronRight className="w-3 h-3 inline" />
          </button>
          {themeToggle}
        </div>
      </div>

      {/* Hero Visual Stage */}
      <div className="flex-1 px-4 pt-2 pb-0">
        {renderHeroSection(false)}
      </div>

      {/* Bottom Controls */}
      <div className="px-6 pb-8 pt-4 space-y-3">
        {slide < 2 ? (
          <button
            type="button"
            onClick={() => setSlide((s) => s + 1)}
            className="w-full py-3.5 rounded-full bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-bold text-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            Next
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={goToAuth}
              className="w-full py-3.5 rounded-full bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-bold text-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={() => { goToAuth(); setTimeout(() => store.loginDemoMerchant(), 50); }}
              className="w-full text-center text-xs font-semibold text-[#6366F1] dark:text-[#C8F53B] hover:underline cursor-pointer py-1"
            >
              Try Instant Demo Store →
            </button>
          </>
        )}
      </div>
    </div>
  );

  const mobileAuth = (
    <div className={`flex md:hidden flex-col min-h-screen bg-[#F5F7FA] dark:bg-[#0E1013] transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {/* Top bar */}
      <div className="flex items-center justify-end px-5 pt-5 pb-2 relative z-20">
        {themeToggle}
      </div>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md slide-in-up">
          {renderAuthCard(false)}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {desktopView}
      {showOnboarding ? mobileOnboarding : mobileAuth}
    </>
  );
}

