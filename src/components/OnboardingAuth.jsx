import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, Check, ArrowRight, Sun, Moon, Phone,
  Store as StoreIcon, Shield, WifiOff, CheckCircle2,
  ChevronRight, ChevronLeft, AlertCircle
} from 'lucide-react';
import heroVoiceImg from '../assets/hero-voice.jpg';
import heroKiranaImg from '../assets/hero-kirana.jpg';
import heroLedgerImg from '../assets/hero-ledger.jpg';

// ─── Hero Images & Slide Meta ────────────────────────────────
const HERO_IMAGES = [heroVoiceImg, heroKiranaImg, heroLedgerImg];
const SLIDE_BADGES = ['01 · VOICE', '02 · PARCHI AI', '03 · OFFLINE'];
const MOBILE_STEP_EYEBROWS = [
  '01 / HINGLISH VOICE',
  '02 / PARCHI VISION AI',
  '03 / OFFLINE BAHI-KHATA',
];

const SLIDES = [
  {
    subtext: 'Say items naturally in Hindi or English—no tapping through 5 menus during store rush.',
  },
  {
    subtext: 'Point your camera at handwritten customer slips and convert them into verified bills.',
  },
  {
    subtext: 'Every rupee needs your tap to confirm, with instant WhatsApp slips and safe local sync.',
  },
];

// ─── Tactile 4-Circle PIN Input (High Contrast Light + Dark) ──
function PinCircles({ value, onChange, id, isError = false }) {
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
    <div className={`flex items-center justify-center gap-3 ${isError ? 'animate-field-shake' : ''}`} id={id}>
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
            placeholder="•"
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-12 h-12 rounded-full text-center text-lg font-bold transition-all outline-none cursor-pointer placeholder:text-slate-400/60 dark:placeholder:text-white/25 ${
              isError
                ? 'border-rose-500/80 dark:border-rose-400/80 bg-rose-500/[0.06] text-rose-600 dark:text-rose-300 ring-2 ring-rose-500/20'
                : filled
                ? 'bg-[#C8F53B]/20 border border-[#111315]/40 dark:border-[#C8F53B]/60 text-[#111315] dark:text-white shadow-sm ring-2 ring-[#C8F53B]/30'
                : 'bg-slate-100/90 dark:bg-white/[0.06] border border-slate-300/80 dark:border-white/20 text-slate-400'
            } focus:border-[#111315] dark:focus:border-[#C8F53B] focus:ring-4 focus:ring-[#C8F53B]/20 focus:bg-white dark:focus:bg-[#141821]`}
            aria-label={`PIN digit ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

// ─── Slide 0: Luminous Silk + Frosted Voice Card ─────────────
function SlideVoiceFrosted() {
  return (
    <div className="w-full max-w-md mx-auto relative z-20">
      <div className="glass-frosted rounded-2xl p-4 sm:p-5 space-y-3.5">
        {/* Top Strip */}
        <div className="flex items-center gap-3 pb-2 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#C8F53B] text-[#111315] flex items-center justify-center shadow-[0_0_16px_rgba(200,245,59,0.4)] shrink-0 animate-pulse">
            <Mic className="w-4 h-4 text-[#111315]" strokeWidth={2.5} />
          </div>
          <div className="flex items-end gap-1 h-4 shrink-0">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-[#C8F53B] animate-wave-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white/95 truncate">
            “Raju ne 5kg aata, 2 biscuit, 5 Maggi liya”
          </p>
        </div>

        {/* Compact Itemized Glass Rows */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white/[0.05]">
            <span className="text-white/90 font-medium">Aata 5kg</span>
            <span className="font-bold text-white tabular-nums">₹225</span>
          </div>
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white/[0.05]">
            <span className="text-white/90 font-medium">Biscuit 2pkt</span>
            <span className="font-bold text-white tabular-nums">₹20</span>
          </div>
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white/[0.05]">
            <span className="text-white/90 font-medium">Maggi 5pkt</span>
            <span className="font-bold text-white tabular-nums">₹70</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-white/60 font-medium">Total:</span>
            <span className="text-base sm:text-lg font-extrabold text-white tabular-nums">₹315</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8F53B]/20 text-[#C8F53B] border border-[#C8F53B]/35 text-xs font-bold shadow-[0_0_12px_rgba(200,245,59,0.25)]">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            Approved · Soundbox ON
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Slide 1: Editorial Kirana Counter + Floating Vision Pill ──
function SlideParchiVision() {
  return (
    <div className="w-full h-full flex flex-col justify-end relative z-20">
      <div className="glass-frosted rounded-2xl p-4 sm:p-5 max-w-sm ml-auto mt-auto mb-2 sm:mb-6 w-full space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C8F53B] animate-pulse shadow-[0_0_8px_#C8F53B]" />
            <span className="text-xs font-bold text-white tracking-wide">
              Parchi Scanned · 0.9s
            </span>
          </div>
          <span className="text-[11px] text-[#C8F53B] font-mono font-semibold">
            AI Vision
          </span>
        </div>

        {/* 3 Crisp Item Chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white font-medium tabular-nums">
            2kg Aata <span className="font-bold text-[#C8F53B]">₹90</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white font-medium tabular-nums">
            1 Sabun <span className="font-bold text-[#C8F53B]">₹40</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-white font-medium tabular-nums">
            1kg Chini <span className="font-bold text-[#C8F53B]">₹44</span>
          </span>
        </div>

        {/* Footer Pill */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-white/70">
            Total <span className="font-bold text-white text-sm tabular-nums">₹174</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Ready to Confirm
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Slide 2: 3D-Tilted Multi-Card Dashboard Bleeding Off Edge ─
function SlideLedgerTilted() {
  return (
    <div className="w-full flex justify-end items-center relative z-20 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -rotate-6 translate-x-3 sm:translate-x-6 translate-y-3 sm:translate-y-4 scale-105 transition-transform duration-700 max-w-lg w-full">
        {/* Left Mini Column: Bahi-Khata Card */}
        <div className="glass-frosted rounded-2xl p-4 space-y-3 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xs sm:text-sm text-white">Ramesh Kumar</div>
              <div className="text-[10px] text-white/60">Sector 4 · #98112</div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34D399]" />
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-0.5">
            <div className="text-[10px] font-semibold text-white/60 uppercase">Khata Balance</div>
            <div className="text-base sm:text-lg font-extrabold text-[#C8F53B] tabular-nums tracking-tight flex items-center gap-1.5">
              <span className="text-white/40 line-through text-xs font-semibold">₹420</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/40" />
              <span>₹550</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold inline-flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              Approval Zaroori Hai
            </span>
            <div className="flex items-center gap-1 text-[10px] text-white/80">
              <WifiOff className="w-3 h-3 text-amber-300 shrink-0" />
              <span>Offline Queue · 100% Safe</span>
            </div>
          </div>
        </div>

        {/* Right Mini Column: Aaj Ka Hisab Card */}
        <div className="glass-frosted rounded-2xl p-4 space-y-3 border border-white/20 shadow-2xl hidden sm:block">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
              Aaj Ka Hisab
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#C8F53B]/20 text-[#C8F53B] border border-[#C8F53B]/30 text-[9px] font-bold">
              Live Counter
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-0.5">
            <div className="text-[10px] font-semibold text-white/60">Today's Sales</div>
            <div className="text-xl font-extrabold text-[#C8F53B] tabular-nums tracking-tight">
              ₹4,850
            </div>
          </div>

          <div className="space-y-1 text-xs text-white/80 pt-1 border-t border-white/10">
            <div className="flex justify-between text-[11px]">
              <span className="text-white/60">Cash</span>
              <span className="font-semibold text-white tabular-nums">₹2,400</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-white/60">UPI</span>
              <span className="font-semibold text-white tabular-nums">₹1,900</span>
            </div>
            <div className="pt-1">
              <span className="px-2 py-0.5 rounded-full bg-[#C8F53B]/20 text-[#C8F53B] border border-[#C8F53B]/30 text-[10px] font-bold inline-block">
                Galla Verified ✓
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UI Mockup Dispatcher (Desktop) ─────────────────────────
function SlideMockup({ index }) {
  if (index === 0) return <SlideVoiceFrosted />;
  if (index === 1) return <SlideParchiVision />;
  return <SlideLedgerTilted />;
}

// ─── Mobile Hero Cards (Sharper contrast, compact, non-muddy) ──
function MobileSlideVoice() {
  return (
    <div className="bg-[#0B0E14]/78 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl p-3.5 max-w-[310px] w-full text-xs space-y-2.5 mx-auto">
      {/* Top Strip */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
        <div className="w-7 h-7 rounded-full bg-[#C8F53B] text-[#111315] flex items-center justify-center shadow-[0_0_12px_rgba(200,245,59,0.35)] shrink-0 animate-pulse">
          <Mic className="w-3.5 h-3.5 text-[#111315]" strokeWidth={2.5} />
        </div>
        <div className="flex items-end gap-1 h-3.5 shrink-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-0.5 rounded-full bg-[#C8F53B] animate-wave-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-white/95 truncate flex-1">
          “Raju ne 5kg aata, 2 biscuit, 5 Maggi”
        </p>
      </div>

      {/* 3 Compact Rows */}
      <div className="space-y-1 text-[11px]">
        <div className="flex items-center justify-between py-0.5 px-2 rounded-lg bg-white/[0.05]">
          <span className="text-white/90">Aata 5kg</span>
          <span className="font-bold text-white tabular-nums">₹225</span>
        </div>
        <div className="flex items-center justify-between py-0.5 px-2 rounded-lg bg-white/[0.05]">
          <span className="text-white/90">Biscuit 2pkt</span>
          <span className="font-bold text-white tabular-nums">₹20</span>
        </div>
        <div className="flex items-center justify-between py-0.5 px-2 rounded-lg bg-white/[0.05]">
          <span className="text-white/90">Maggi 5pkt</span>
          <span className="font-bold text-white tabular-nums">₹70</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-1.5 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-baseline gap-1 text-[11px]">
          <span className="text-white/60">Total:</span>
          <span className="text-sm font-extrabold text-white tabular-nums">₹315</span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C8F53B]/20 text-[#C8F53B] border border-[#C8F53B]/35 text-[10px] font-bold">
          <Check className="w-3 h-3" strokeWidth={3} />
          Approved · Soundbox ON
        </span>
      </div>
    </div>
  );
}

function MobileSlideParchi() {
  return (
    <div className="bg-[#0B0E14]/78 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl p-3.5 max-w-[310px] w-full text-xs space-y-2.5 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C8F53B] animate-pulse shadow-[0_0_8px_#C8F53B]" />
          <span className="text-xs font-bold text-white tracking-wide">
            Parchi Scanned · 0.9s
          </span>
        </div>
        <span className="text-[10px] text-[#C8F53B] font-mono font-semibold">
          AI Vision
        </span>
      </div>

      {/* 3 Crisp Item Chips */}
      <div className="flex flex-wrap gap-1">
        <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[11px] text-white font-medium tabular-nums">
          2kg Aata <span className="font-bold text-[#C8F53B]">₹90</span>
        </span>
        <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[11px] text-white font-medium tabular-nums">
          1 Sabun <span className="font-bold text-[#C8F53B]">₹40</span>
        </span>
        <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[11px] text-white font-medium tabular-nums">
          1kg Chini <span className="font-bold text-[#C8F53B]">₹44</span>
        </span>
      </div>

      {/* Footer */}
      <div className="pt-1.5 border-t border-white/10 flex items-center justify-between">
        <div className="text-[11px] text-white/70">
          Total <span className="font-bold text-white text-xs tabular-nums">₹174</span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Ready to Confirm
        </span>
      </div>
    </div>
  );
}

function MobileSlideLedger() {
  return (
    <div className="max-w-[310px] w-full mx-auto relative space-y-2">
      {/* Straight-aligned Ramesh Kumar Khata Card */}
      <div className="bg-[#0B0E14]/78 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl p-3.5 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-white">Ramesh Kumar</div>
            <div className="text-[10px] text-white/60">Sector 4 · #98112</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            Approval Zaroori Hai
          </span>
        </div>

        <div className="p-2 rounded-xl bg-black/40 border border-white/10 space-y-0.5">
          <div className="text-[9px] font-semibold text-white/60 uppercase">Khata Balance</div>
          <div className="text-base font-extrabold text-[#C8F53B] tabular-nums tracking-tight flex items-center gap-1.5">
            <span className="text-white/40 line-through text-xs font-semibold">₹420</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/40" />
            <span>₹550</span>
          </div>
        </div>
      </div>

      {/* Floating overlapping mini pill at bottom-right */}
      <div className="-mt-3 ml-auto mr-1 relative z-20 w-fit bg-[#141923]/95 border border-[#C8F53B]/40 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2.5">
        <div>
          <div className="text-[9px] font-semibold text-white/60">Today's Sales</div>
          <div className="text-xs font-bold text-[#C8F53B] tabular-nums">₹4,850</div>
        </div>
        <div className="w-[1px] h-6 bg-white/15" />
        <div className="flex items-center gap-1 text-[10px] text-white/90">
          <WifiOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Offline Safe</span>
        </div>
      </div>
    </div>
  );
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
  const [userInteractedMobile, setUserInteractedMobile] = useState(false);

  // Auto-advance showcase slides:
  // On mobile (<768px): advance 0 -> 1 -> 2 and STOP permanently at slide 2 without looping.
  // Stop timer completely if user touched/swiped or tapped pagination.
  // On desktop (>=768px): loop indefinitely.
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile && (userInteractedMobile || slide >= 2)) {
      return;
    }
    const timer = setInterval(() => {
      setSlide((prev) => {
        const isMob = typeof window !== 'undefined' && window.innerWidth < 768;
        if (isMob) {
          if (prev >= 2) return 2;
          return prev + 1;
        }
        return (prev + 1) % 3;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [userInteractedMobile, slide]);

  const goToAuth = () => {
    setPhase('auth');
  };

  const replayTour = () => {
    setUserInteractedMobile(false);
    setSlide(0);
    setPhase('onboarding');
  };

  // ─── TOUCH SWIPE GESTURE SUPPORT (>45px Horizontal Drag) ──
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      setUserInteractedMobile(true);
      if (diffX < 0) {
        setSlide((prev) => (prev < 2 ? prev + 1 : prev));
      } else {
        setSlide((prev) => (prev > 0 ? prev - 1 : prev));
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // ─── ERROR HANDLING & INSTANT AUTO-CLEAR ──────────────────
  const errorField = typeof authError === 'object' && authError !== null ? (authError.field || '') : (authError ? 'form' : '');
  const errorMessage = typeof authError === 'object' && authError !== null ? (authError.message || '') : (authError || '');

  const clearErrors = () => {
    if (errorField || errorMessage) {
      setAuthError({ field: '', message: '' });
    }
  };

  // ─── THEME TOGGLE BUTTON (no ugly browser tooltip popup) ────
  const themeToggle = (
    <button
      type="button"
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#141821]/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:text-[#111315] dark:hover:text-white flex items-center justify-center shadow-sm hover:scale-105 transition-all cursor-pointer"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
    </button>
  );

  // ─── EDITORIAL FORM CONTAINER (Right Column & Mobile Auth) ──
  const renderAuthForm = () => (
    <div className="w-full max-w-[380px] relative space-y-6">
      {/* Architectural Grid Halo behind brand icon */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[220px] h-[110px] bg-auth-grid opacity-80 pointer-events-none" />

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
      <div className="relative z-10 flex p-1 rounded-full bg-slate-100 dark:bg-[#141821] border border-slate-200/70 dark:border-white/10">
        <button
          type="button"
          onClick={() => { setAuthTab('login'); clearErrors(); }}
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
          onClick={() => { setAuthTab('signup'); clearErrors(); }}
          className={`flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center cursor-pointer ${
            authTab === 'signup'
              ? 'bg-[#C8F53B] text-[#111315] shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          New Shop
        </button>
      </div>

      {/* ── Login Form ── */}
      {authTab === 'login' && (
        <form onSubmit={handleLogin} className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-500 dark:text-slate-400">
              Mobile Number
            </label>
            <div className={`h-12 rounded-2xl bg-slate-50 dark:bg-[#141821] border transition-all flex items-center px-3.5 relative ${
              errorField === 'phone'
                ? 'animate-field-shake border-rose-500 dark:border-rose-400 ring-4 ring-rose-500/10'
                : 'border-slate-200 dark:border-white/12 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B]'
            } focus-within:bg-white dark:focus-within:bg-[#141821]`}>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-2.5 select-none">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={loginPhone}
                onChange={(e) => {
                  clearErrors();
                  setLoginPhone(e.target.value.replace(/\D/g, ''));
                }}
                placeholder="98765 43210"
                className="w-full bg-transparent text-sm text-[#111315] dark:text-white font-medium outline-none tabular-nums placeholder:text-slate-400"
                required
              />
              <Phone size={15} className="text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
            </div>
            {errorField === 'phone' && (
              <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-500 dark:text-slate-400">
              4-Digit PIN
            </label>
            <PinCircles
              value={loginPin}
              onChange={(val) => {
                clearErrors();
                setLoginPin(val);
              }}
              id="login-pin"
              isError={errorField === 'pin'}
            />
            {errorField === 'pin' ? (
              <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 mt-2 text-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
                Demo: 9876543210 / PIN: 1234
              </p>
            )}
          </div>

          {errorField === 'form' && (
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 text-center">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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
            <div className={`h-11 rounded-2xl bg-slate-50 dark:bg-[#141821] border transition-all px-3.5 flex items-center ${
              errorField === 'shopName'
                ? 'animate-field-shake border-rose-500 dark:border-rose-400 ring-4 ring-rose-500/10'
                : 'border-slate-200 dark:border-white/12 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B]'
            } focus-within:bg-white dark:focus-within:bg-[#141821]`}>
              <input
                type="text"
                value={signupShopName}
                onChange={(e) => {
                  clearErrors();
                  setSignupShopName(e.target.value);
                }}
                placeholder="Sharma Grocery Store"
                className="w-full bg-transparent text-sm text-[#111315] dark:text-white outline-none placeholder:text-slate-400"
                required
              />
            </div>
            {errorField === 'shopName' && (
              <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                Owner Name *
              </label>
              <div className={`h-11 rounded-2xl bg-slate-50 dark:bg-[#141821] border transition-all px-3.5 flex items-center ${
                errorField === 'ownerName'
                  ? 'animate-field-shake border-rose-500 dark:border-rose-400 ring-4 ring-rose-500/10'
                  : 'border-slate-200 dark:border-white/12 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B]'
              } focus-within:bg-white dark:focus-within:bg-[#141821]`}>
                <input
                  type="text"
                  value={signupOwnerName}
                  onChange={(e) => {
                    clearErrors();
                    setSignupOwnerName(e.target.value);
                  }}
                  placeholder="Ramesh Sharma"
                  className="w-full bg-transparent text-sm text-[#111315] dark:text-white outline-none placeholder:text-slate-400"
                  required
                />
              </div>
              {errorField === 'ownerName' && (
                <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                City / Area
              </label>
              <div className="h-11 rounded-2xl bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-white/12 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B] focus-within:bg-white dark:focus-within:bg-[#141821] transition-all px-3.5 flex items-center">
                <input
                  type="text"
                  value={signupArea}
                  onChange={(e) => {
                    clearErrors();
                    setSignupArea(e.target.value);
                  }}
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
              <div className={`h-11 rounded-2xl bg-slate-50 dark:bg-[#141821] border transition-all px-3 flex items-center ${
                errorField === 'phone'
                  ? 'animate-field-shake border-rose-500 dark:border-rose-400 ring-4 ring-rose-500/10'
                  : 'border-slate-200 dark:border-white/12 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B]'
              } focus-within:bg-white dark:focus-within:bg-[#141821]`}>
                <span className="text-[11px] font-bold text-slate-400 mr-1.5 select-none">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={signupPhone}
                  onChange={(e) => {
                    clearErrors();
                    setSignupPhone(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="9811122233"
                  className="w-full bg-transparent text-sm text-[#111315] dark:text-white outline-none tabular-nums placeholder:text-slate-400"
                  required
                />
              </div>
              {errorField === 'phone' && (
                <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                Opening Cash ₹
              </label>
              <div className="h-11 rounded-2xl bg-slate-50 dark:bg-[#141821] border border-slate-200 dark:border-white/12 focus-within:border-[#111315] dark:focus-within:border-[#C8F53B] focus-within:bg-white dark:focus-within:bg-[#141821] transition-all px-3 flex items-center">
                <span className="text-xs font-bold text-slate-400 mr-1.5">₹</span>
                <input
                  type="number"
                  value={signupOpeningCash}
                  onChange={(e) => {
                    clearErrors();
                    setSignupOpeningCash(e.target.value);
                  }}
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
            <PinCircles
              value={signupPin}
              onChange={(val) => {
                clearErrors();
                setSignupPin(val);
              }}
              id="signup-pin"
              isError={errorField === 'pin'}
            />
            {errorField === 'pin' && (
              <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 mt-2 text-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {errorField === 'form' && (
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 text-center">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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
          className="w-full rounded-2xl p-3 bg-slate-50 hover:bg-[#C8F53B]/15 dark:bg-[#141821] dark:hover:bg-[#C8F53B]/10 border border-slate-200 dark:border-white/12 hover:border-[#C8F53B] transition-all flex items-center justify-between text-left group cursor-pointer shadow-sm"
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

  // ─── DESKTOP LEFT PANEL: Full-Bleed Cinematic Showcase ──────
  const renderLeftPanel = () => (
    <div className="w-full h-full min-h-[calc(100vh-2rem)] rounded-[2rem] relative overflow-hidden border border-black/10 dark:border-white/15 shadow-2xl flex flex-col justify-between p-8 lg:p-11 text-white">
      {/* Crossfading Full-Bleed Background Images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {HERO_IMAGES.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Slide ${i + 1} Visual`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              slide === i
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            }`}
          />
        ))}
        {/* Multi-stop cinematic scrim overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/85" />
      </div>

      {/* Top Eyebrow Row */}
      <div className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#C8F53B] shadow-inner backdrop-blur-md">
            <StoreIcon size={16} strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold tracking-[0.2em] text-white/90">
              KIRANASCAN
            </span>
            <span className="w-10 sm:w-14 h-[1px] bg-white/35" />
            <span className="text-[10px] font-bold tracking-widest text-[#C8F53B] uppercase">
              RETAIL OS
            </span>
          </div>
        </div>

        {/* Active Slide Badge Pill */}
        <span className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-xs text-white/90 font-mono">
          {SLIDE_BADGES[slide]}
        </span>
      </div>

      {/* Centerpiece: Real Layered UI Mockup Stage */}
      <div className="relative z-20 my-auto py-6">
        <SlideMockup index={slide} />
      </div>

      {/* Bottom Editorial Copy & Controls */}
      <div className="relative z-20 space-y-5">
        <div className="space-y-1.5">
          {slide === 0 && (
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Speak in Hinglish.{' '}
              <span className="font-editorial italic font-normal text-[#C8F53B] text-4xl lg:text-5xl">
                Bill in 3 seconds.
              </span>
            </h2>
          )}
          {slide === 1 && (
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Snap any parchi.{' '}
              <span className="font-editorial italic font-normal text-[#C8F53B] text-4xl lg:text-5xl">
                Instant digital bill.
              </span>
            </h2>
          )}
          {slide === 2 && (
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Zero-error khata.{' '}
              <span className="font-editorial italic font-normal text-[#C8F53B] text-4xl lg:text-5xl">
                Even offline.
              </span>
            </h2>
          )}
          <p className="text-white/75 text-sm lg:text-base leading-relaxed max-w-md">
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
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSlide((s) => (s + 1) % 3)}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── MOBILE ONBOARDING VIEW (< 768px): ZERO-SCROLL 100dvh LOCK ─
  const mobileOnboarding = (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="md:hidden fixed inset-0 h-[100dvh] w-full flex flex-col overflow-hidden bg-white dark:bg-[#090B0F] z-50 select-none"
    >
      {/* Fluid Full-Bleed Hero Stage */}
      <div className="flex-1 min-h-0 relative mx-2.5 mt-2.5 rounded-[1.75rem] overflow-hidden border border-black/10 dark:border-white/10 shadow-xl flex flex-col justify-between">
        {/* Crossfading Hero Background Images */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {HERO_IMAGES.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Slide ${i + 1} Visual`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                slide === i ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/85" />
        </div>

        {/* Clean, Uncrowded Top Overlay Bar */}
        <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#C8F53B] shadow-inner backdrop-blur-md">
              <StoreIcon size={14} strokeWidth={2.2} />
            </div>
            <span className="text-xs font-bold tracking-[0.16em] text-white">
              KIRANASCAN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToAuth}
              className="px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-xs font-medium text-white/90 hover:bg-black/60 transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-8 h-8 rounded-full border border-white/15 bg-black/45 backdrop-blur-md text-white/90 flex items-center justify-center shadow-sm hover:scale-105 transition-all cursor-pointer"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Centerpiece: Mobile Mockup */}
        <div className={`relative z-10 flex-1 flex flex-col px-3 ${slide === 1 ? 'justify-start pt-14' : 'justify-center my-auto'}`}>
          {slide === 0 && <MobileSlideVoice />}
          {slide === 1 && <MobileSlideParchi />}
          {slide === 2 && <MobileSlideLedger />}
        </div>
      </div>

      {/* Tight, Zero-Waste Bottom Deck */}
      <div className="shrink-0 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {/* Step Eyebrow */}
        <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#111315]/50 dark:text-[#C8F53B]/90 mb-1.5">
          {MOBILE_STEP_EYEBROWS[slide]}
        </div>

        {/* Headline & 2-Line Copy */}
        <div className="space-y-1">
          {slide === 0 && (
            <h2 className="text-[25px] leading-[1.15] font-extrabold tracking-tight text-[#111315] dark:text-white">
              Speak in Hinglish.{' '}
              <span className="font-editorial italic font-normal text-[28px] text-[#16A34A] dark:text-[#C8F53B]">
                Bill in 3 seconds.
              </span>
            </h2>
          )}
          {slide === 1 && (
            <h2 className="text-[25px] leading-[1.15] font-extrabold tracking-tight text-[#111315] dark:text-white">
              Snap any parchi.{' '}
              <span className="font-editorial italic font-normal text-[28px] text-[#16A34A] dark:text-[#C8F53B]">
                Instant digital bill.
              </span>
            </h2>
          )}
          {slide === 2 && (
            <h2 className="text-[25px] leading-[1.15] font-extrabold tracking-tight text-[#111315] dark:text-white">
              Zero-error khata.{' '}
              <span className="font-editorial italic font-normal text-[28px] text-[#16A34A] dark:text-[#C8F53B]">
                Even offline.
              </span>
            </h2>
          )}
          <p className="mt-1.5 text-[13.5px] leading-snug text-slate-600 dark:text-slate-400">
            {SLIDES[slide].subtext}
          </p>
        </div>

        {/* Unified Bottom Controls */}
        <div className="mt-4 space-y-3.5">
          {/* Pagination Dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setUserInteractedMobile(true);
                  setSlide(i);
                }}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  slide === i
                    ? 'w-8 bg-[#111315] dark:bg-[#C8F53B]'
                    : 'w-2 bg-slate-300 dark:bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Full-width tactile pill CTA */}
          {slide < 2 ? (
            <button
              type="button"
              onClick={() => {
                setUserInteractedMobile(true);
                setSlide((s) => s + 1);
              }}
              className="w-full h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer bg-[#111315] dark:bg-white text-white dark:text-[#111315]"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={goToAuth}
              className="w-full h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer bg-[#C8F53B] text-[#111315] shadow-lg shadow-[#C8F53B]/20"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen w-full bg-white dark:bg-[#090B0F] text-slate-900 dark:text-white transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {/* Mobile Onboarding Flow (active only on mobile when phase === 'onboarding') */}
      {phase === 'onboarding' ? mobileOnboarding : null}

      {/* Split Canvas Layout:
          - Desktop (md: >= 768px): Always rendered side-by-side regardless of phase
          - Mobile (< 768px): Rendered only when phase === 'auth' (occupying col-span-12) */}
      <div className={`w-full min-h-screen grid md:grid-cols-12 ${phase === 'onboarding' ? 'hidden md:grid' : 'grid'}`}>
        {/* Left Panel: Desktop Showcase */}
        <div className="hidden md:flex md:col-span-6 lg:col-span-7 p-3 lg:p-4">
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
