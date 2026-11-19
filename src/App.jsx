import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useStore } from './stores/useStore.js';
import { LABELS } from './data/seedData.js';
import VoiceTab from './components/VoiceTab.jsx';
import LedgerTab from './components/LedgerTab.jsx';
import DailyHisabTab from './components/DailyHisabTab.jsx';
import CatalogueTab from './components/CatalogueTab.jsx';
import {
  Mic, BookOpen, BarChart3, Store as StoreIcon,
  Wifi, WifiOff, Volume2, VolumeX, RotateCcw,
  Smartphone, Monitor, Globe, ChevronUp, ChevronDown, Zap,
  Sun, Moon, Edit2, Check, X, LogOut, ArrowRight, User, Phone, Lock, MapPin, Wallet, Sparkles, AlertCircle,
  KeyRound, Camera, FileText, CheckCircle2, MessageCircle
} from 'lucide-react';
import './index.css';

const TAB_ICONS = [Mic, BookOpen, BarChart3, StoreIcon];

function detectMobileDevice() {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  if (width < 768) return true;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  return isMobileUA && hasCoarsePointer && width < 900;
}

export default function App() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [soundboxEnabled, setSoundboxEnabled] = useState(true);
  const [lang, setLang] = useState('hinglish');
  const [isMobileFrame, setIsMobileFrame] = useState(() => detectMobileDevice());
  const manualViewOverrideRef = useRef(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-cycle live preview card on front screen
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const mobileTickerExamples = [
    '“Ramesh ko 2 kg aata, 1 sabun udhaar”',
    '“Parchi scan karein — instant digital hisab”',
    '“Offline bhi chalta hai — zero data loss”'
  ];

  // Auto-detect device & adapt layout automatically unless user manually toggled on desktop
  useEffect(() => {
    const syncDeviceMode = () => {
      const detectedMobile = detectMobileDevice();
      if (window.innerWidth < 640) {
        manualViewOverrideRef.current = false;
        setIsMobileFrame(true);
        return;
      }
      if (!manualViewOverrideRef.current) {
        setIsMobileFrame(detectedMobile);
      }
    };
    window.addEventListener('resize', syncDeviceMode);
    window.addEventListener('orientationchange', syncDeviceMode);
    return () => {
      window.removeEventListener('resize', syncDeviceMode);
      window.removeEventListener('orientationchange', syncDeviceMode);
    };
  }, []);

  const handleToggleViewMode = () => {
    const nextMobile = !isMobileFrame;
    const detectedMobile = detectMobileDevice();
    manualViewOverrideRef.current = nextMobile !== detectedMobile;
    setIsMobileFrame(nextMobile);
  };

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('kiranascan_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kiranascan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kiranascan_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync CSS --app-height to exact visible viewport height so real mobile browsers
  // with URL/address bars never stretch containers to 100lvh/100vh and push content off-screen.
  useLayoutEffect(() => {
    const syncAppHeight = () => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
      if (isTyping && window.innerHeight < window.screen.height * 0.72) return;
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    syncAppHeight();
    const onFocusOut = () => setTimeout(syncAppHeight, 120);
    window.addEventListener('resize', syncAppHeight);
    window.addEventListener('orientationchange', syncAppHeight);
    window.addEventListener('focusout', onFocusOut);
    window.visualViewport?.addEventListener('resize', syncAppHeight);
    return () => {
      window.removeEventListener('resize', syncAppHeight);
      window.removeEventListener('orientationchange', syncAppHeight);
      window.removeEventListener('focusout', onFocusOut);
      window.visualViewport?.removeEventListener('resize', syncAppHeight);
    };
  }, []);

  // Shop Name inline editing
  const [editingShopName, setEditingShopName] = useState(false);
  const [tempShopName, setTempShopName] = useState('');

  // Auth portal state
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'signup'
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Sign up state
  const [signupShopName, setSignupShopName] = useState('');
  const [signupOwnerName, setSignupOwnerName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [signupArea, setSignupArea] = useState('');
  const [signupOpeningCash, setSignupOpeningCash] = useState('1000');

  const labels = LABELS[lang] || LABELS.hinglish;

  // Sync animation
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOnline && store.pendingSyncCount > 0) {
      setSyncing(true);
      const timer = setTimeout(() => {
        store.syncOfflineQueue();
        setSyncing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, store.pendingSyncCount]);

  const handleLogin = (e) => {
    e?.preventDefault();
    setAuthError('');
    const res = store.loginMerchant(loginPhone, loginPin);
    if (!res.success) {
      setAuthError(res.error);
    } else {
      setLoginPhone('');
      setLoginPin('');
    }
  };

  const handleSignup = (e) => {
    e?.preventDefault();
    setAuthError('');
    const res = store.registerMerchant({
      shopName: signupShopName,
      ownerName: signupOwnerName,
      phone: signupPhone,
      pin: signupPin,
      area: signupArea,
      openingCash: signupOpeningCash
    });
    if (!res.success) {
      setAuthError(res.error);
    } else {
      setSignupShopName('');
      setSignupOwnerName('');
      setSignupPhone('');
      setSignupPin('');
      setSignupArea('');
      setSignupOpeningCash('1000');
    }
  };

  const currentMerchant = store.currentMerchant;
  const currentShopName = currentMerchant?.shopName || store.shopName || labels.appName;
  const tabLabels = [labels.tab1, labels.tab2, labels.tab3, labels.tab4];

  // ══════════════════════════════════════════════════════════════
  // AUTH PORTAL (when currentMerchant === null)
  // ══════════════════════════════════════════════════════════════
  if (!currentMerchant) {
    return (
      <div className={`min-h-screen relative overflow-hidden bg-[#FAF6F0] dark:bg-[#0B1116] bg-ledger-dots flex items-center justify-center p-4 sm:p-6 text-[#1E242B] dark:text-[#F3F4F6] transition-colors ${isDarkMode ? 'dark' : ''}`}>
        {/* Ambient Blurred Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#1B7A43]/10 dark:bg-[#1B7A43]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#E68A00]/10 dark:bg-[#E68A00]/10 blur-3xl pointer-events-none" />

        {/* Top Floating Controls */}
        <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-2xl bg-white/90 dark:bg-[#16202A]/90 backdrop-blur-sm border border-[#E2D9C8] dark:border-[#2A3644] text-[#5A6573] dark:text-[#9CA3AF] hover:text-[#1B7A43] dark:hover:text-emerald-400 shadow-sm transition-all cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>

        {/* Responsive Grid */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 py-6">
          {/* LEFT COLUMN: Desktop Minimal Brand Showcase */}
          <div className="hidden lg:flex lg:col-span-6 flex-col gap-6">
            {/* Trust Eyebrow Pill */}
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B7A43]/10 text-[#1B7A43] dark:text-emerald-400 text-xs font-semibold w-fit border border-[#1B7A43]/20 dark:border-emerald-800/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Built for Indian Kirana Stores
            </span>

            {/* Crisp Headline */}
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Bol Kar Likhein.
              </h1>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#1B7A43] dark:text-emerald-400 leading-tight">
                Confirm Karein. Trust Karein.
              </h2>
            </div>

            {/* 1-Sentence Subtitle */}
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Move from handwritten credit notebooks to verified digital hisab in under 5 seconds—offline or online.
            </p>

            {/* Interactive Auto-Cycling Live Preview Card */}
            <div className="bg-white/95 dark:bg-[#151F28]/95 backdrop-blur-md rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] p-5 shadow-lg relative min-h-[195px] flex flex-col justify-between overflow-hidden">
              {activeSlide === 0 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-[#1B7A43] dark:text-emerald-400">
                      <Mic className="w-3.5 h-3.5" />
                      Voice-to-Bill
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                      Hinglish NLP
                    </span>
                  </div>

                  <div className="bg-stone-50 dark:bg-[#0F171F] p-3 rounded-xl border border-stone-200 dark:border-slate-800 flex items-center gap-3">
                    <div className="flex items-center gap-0.5 h-4 px-1.5 py-1 rounded bg-[#1B7A43]/10 dark:bg-emerald-950/60 shrink-0">
                      <span className="w-1 bg-[#1B7A43] dark:bg-emerald-400 rounded-full soundwave-bar" />
                      <span className="w-1 bg-[#1B7A43] dark:bg-emerald-400 rounded-full soundwave-bar" />
                      <span className="w-1 bg-[#1B7A43] dark:bg-emerald-400 rounded-full soundwave-bar" />
                      <span className="w-1 bg-[#1B7A43] dark:bg-emerald-400 rounded-full soundwave-bar" />
                    </div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic">
                      &ldquo;Ramesh ko 2 kg aata aur 40 wala sabun udhaar&rdquo;
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Aata 2kg ₹90 · Soap ₹40
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#16202A] px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-xs">
                      Balance: ₹420 → ₹550
                    </span>
                  </div>
                </div>
              )}

              {activeSlide === 1 && (
                <div className="space-y-3 animate-fade-in relative">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-[#1B7A43] dark:text-emerald-400">
                      <Camera className="w-3.5 h-3.5" />
                      Parchi OCR & Vision AI
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                      Multi-Model
                    </span>
                  </div>

                  <div className="relative bg-[#FFFDF9] dark:bg-[#0F171F] p-3 rounded-xl border border-stone-300 dark:border-slate-800 overflow-hidden shadow-inner font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_#10B981] animate-scanline pointer-events-none" />
                    <div className="space-y-1.5 opacity-90">
                      <div className="flex justify-between border-b border-dashed border-stone-300 dark:border-slate-700 pb-0.5">
                        <span>1. Sarson Tel 1L</span>
                        <span>₹160</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-stone-300 dark:border-slate-700 pb-0.5">
                        <span>2. Chini 2kg</span>
                        <span>₹88</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3. Haldi Powder 200g</span>
                        <span>₹45</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Parchi Scanned · 3 Items Ready to Approve</span>
                  </div>
                </div>
              )}

              {activeSlide === 2 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-[#1B7A43] dark:text-emerald-400">
                      <WifiOff className="w-3.5 h-3.5" />
                      Offline-First & WhatsApp
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                      Zero Net Delay
                    </span>
                  </div>

                  <div className="bg-stone-50 dark:bg-[#0F171F] p-3 rounded-xl border border-stone-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Offline Queue Synced</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      TXN-4821
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>WhatsApp Slip Ready</span>
                    </div>
                    <span className="text-[10px] font-bold bg-[#1B7A43] text-white px-2 py-0.5 rounded-md shadow-xs">
                      1-Tap Share
                    </span>
                  </div>
                </div>
              )}

              {/* Clickable 3-Dot Indicator */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSlide === idx
                        ? 'w-6 bg-[#1B7A43] dark:bg-emerald-400'
                        : 'w-2 bg-stone-300 dark:bg-slate-700 hover:bg-stone-400 dark:hover:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Micro-Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#16202A]/80 border border-[#E2D9C8] dark:border-[#2A3644] font-medium shadow-xs">
                <Mic className="w-3.5 h-3.5 text-[#1B7A43] dark:text-emerald-400" />
                Hinglish Voice
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#16202A]/80 border border-[#E2D9C8] dark:border-[#2A3644] font-medium shadow-xs">
                <Camera className="w-3.5 h-3.5 text-[#1B7A43] dark:text-emerald-400" />
                Parchi Scan
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#16202A]/80 border border-[#E2D9C8] dark:border-[#2A3644] font-medium shadow-xs">
                <WifiOff className="w-3.5 h-3.5 text-[#1B7A43] dark:text-emerald-400" />
                Works Offline
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Polished Login / Sign Up Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white/95 dark:bg-[#151F28]/95 backdrop-blur-md border border-[#E6DFD3] dark:border-[#2A3644] rounded-3xl shadow-xl p-6 sm:p-8 animate-fade-up space-y-6">
              {/* Mobile-Only Animated Voice Ticker */}
              <div className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B7A43]/10 dark:bg-emerald-950/40 border border-[#1B7A43]/20 dark:border-emerald-800/40 text-xs text-[#1B7A43] dark:text-emerald-300 w-full justify-center">
                <div className="flex items-center gap-0.5 h-3 shrink-0">
                  <span className="w-0.5 bg-[#1B7A43] dark:bg-emerald-400 rounded-full soundwave-bar" />
                  <span className="w-0.5 bg-[#1B7A43] dark:bg-emerald-400 rounded-full soundwave-bar" />
                  <span className="w-0.5 bg-[#1B7A43] dark:bg-emerald-400 rounded-full soundwave-bar" />
                  <span className="w-0.5 bg-[#1B7A43] dark:bg-emerald-400 rounded-full soundwave-bar" />
                </div>
                <span className="font-medium truncate transition-all duration-300">
                  {mobileTickerExamples[activeSlide]}
                </span>
              </div>

              {/* Logo Header */}
              <div className="text-center space-y-2">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 dark:bg-emerald-400/20 animate-logo-ripple pointer-events-none" />
                  <div className="relative w-14 h-14 rounded-2xl bg-[#1B7A43] text-white flex items-center justify-center shadow-lg shadow-green-900/25">
                    <StoreIcon size={30} />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    KiranaScan
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Voice-First Accounting & Bahi-Khata for Kirana Merchants
                  </p>
                </div>
              </div>

              {/* 1-Tap Instant Demo Login Button (Prominent) */}
              <button
                type="button"
                onClick={() => store.loginDemoMerchant()}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#1B7A43] to-[#145E33] hover:from-[#145E33] hover:to-[#0E4424] text-white font-bold text-sm shadow-md shadow-green-900/30 active:scale-[0.98] transition-all flex items-center justify-between group subtle-shimmer cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300 shrink-0" />
                  <span>Instant Demo Login: Gupta Kirana Store</span>
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E6DFD3] dark:bg-[#2A343D]" />
                <span className="text-[11px] text-[#5A6573] dark:text-[#9CA3AF] uppercase font-semibold">ya apna khata kholein</span>
                <div className="flex-1 h-px bg-[#E6DFD3] dark:bg-[#2A343D]" />
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-[#FAF6F0] dark:bg-[#11181F] p-1 rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644]">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'login'
                      ? 'bg-white dark:bg-[#16202A] text-[#1B7A43] dark:text-emerald-400 shadow-sm'
                      : 'text-[#5A6573] dark:text-[#9CA3AF] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Dukan Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'signup'
                      ? 'bg-white dark:bg-[#16202A] text-[#1B7A43] dark:text-emerald-400 shadow-sm'
                      : 'text-[#5A6573] dark:text-[#9CA3AF] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>Nayi Dukan Jodein</span>
                </button>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              {/* ── Login Form ── */}
              {authTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#5A6573] dark:text-[#9CA3AF]">
                      10-Digit Mobile Number
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6573] dark:text-[#9CA3AF]" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={loginPhone}
                        onChange={e => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E6DFD3] dark:border-[#2A343D] bg-white dark:bg-[#11181F] text-sm text-[#1E242B] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#5A6573] dark:text-[#9CA3AF]">
                      4-Digit Security PIN
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6573] dark:text-[#9CA3AF]" />
                      <input
                        type="password"
                        maxLength={4}
                        value={loginPin}
                        onChange={e => setLoginPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E6DFD3] dark:border-[#2A343D] bg-white dark:bg-[#11181F] text-sm text-[#1E242B] dark:text-[#F3F4F6] tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-[#5A6573] dark:text-[#9CA3AF] mt-1 italic">
                      Demo Store: 9876543210 / PIN: 1234
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#1B7A43] hover:bg-[#145E33] text-white font-bold text-sm shadow transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Login to Shop
                  </button>
                </form>
              )}

              {/* ── Sign Up Form ── */}
              {authTab === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#5A6573] dark:text-[#9CA3AF]">
                      Dukan Ka Naam (Shop Name) *
                    </label>
                    <input
                      type="text"
                      value={signupShopName}
                      onChange={e => setSignupShopName(e.target.value)}
                      placeholder="e.g. Sharma Grocery Store"
                      className="w-full px-3 py-2 rounded-xl border border-[#E6DFD3] dark:border-[#2A343D] bg-white dark:bg-[#11181F] text-sm text-[#1E242B] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#5A6573] dark:text-[#9CA3AF]">
                        Dukandar Ka Naam *
                      </label>
                      <input
                        type="text"
                        value={signupOwnerName}
                        onChange={e => setSignupOwnerName(e.target.value)}
                        placeholder="e.g. Ramesh Sharma"
                        className="w-full px-3 py-2 rounded-xl border border-[#E6DFD3] dark:border-[#2A343D] bg-white dark:bg-[#11181F] text-sm text-[#1E242B] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#5A6573] dark:text-[#9CA3AF]">
                        Area / City
                      </label>
                      <input
                        type="text"
                        value={signupArea}
                        onChange={e => setSignupArea(e.target.value)}
                        placeholder="e.g. Jaipur"
                        className="w-full px-3 py-2 rounded-xl border border-[#E6DFD3] dark:border-[#2A343D] bg-white dark:bg-[#11181F] text-sm text-[#1E242B] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#5A6573] dark:text-[#9CA3AF]">
                        10-Digit Mobile *
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={signupPhone}
                        onChange={e => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9811122233"
                        className="w-full px-3 py-2 rounded-xl border border-[#E6DFD3] dark:border-[#2A343D] bg-white dark:bg-[#11181F] text-sm text-[#1E242B] dark:text-[#F3F4F6] focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#5A6573] dark:text-[#9CA3AF]">
                        4-Digit PIN *
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={signupPin}
                        onChange={e => setSignupPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="1234"
                        className="w-full px-3 py-2 rounded-xl border border-[#E6DFD3] dark:border-[#2A343D] bg-white dark:bg-[#11181F] text-sm text-[#1E242B] dark:text-[#F3F4F6] tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#5A6573] dark:text-[#9CA3AF]">
                      Opening Galla Cash ₹ (Dukan Khulte Samay Galla)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5A6573]">₹</span>
                      <input
                        type="number"
                        value={signupOpeningCash}
                        onChange={e => setSignupOpeningCash(e.target.value)}
                        placeholder="1000"
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#E6DFD3] dark:border-[#2A343D] bg-white dark:bg-[#11181F] text-sm text-[#1E242B] dark:text-[#F3F4F6] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#1B7A43] hover:bg-[#145E33] text-white font-bold text-sm shadow transition-all active:scale-[0.98] mt-2 cursor-pointer"
                  >
                    Create Shop & Start Accounting
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN APP INTERFACE (Logged in)
  // ══════════════════════════════════════════════════════════════
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return <VoiceTab store={store} isOnline={isOnline} soundboxEnabled={soundboxEnabled} lang={lang} labels={labels} isMobileFrame={isMobileFrame} />;
      case 1: return <LedgerTab store={store} isOnline={isOnline} lang={lang} labels={labels} />;
      case 2: return <DailyHisabTab store={store} lang={lang} labels={labels} />;
      case 3: return <CatalogueTab store={store} isOnline={isOnline} lang={lang} labels={labels} />;
      default: return null;
    }
  };

  const appContent = (
    <div className="flex flex-col w-full flex-1 app-min-h bg-[#FAF6F0] dark:bg-[#0B1116] text-[#1E242B] dark:text-[#F3F4F6] transition-colors relative">
      {/* ── CLEAN PROFESSIONAL MERCHANT HEADER (ADAPTIVE MOBILE + STRUCTURED FULL MODE) ── */}
      <header className="bg-[#1B7A43] text-white px-3.5 sm:px-5 py-2.5 shadow-md sticky top-0 z-30 shrink-0 transition-all">
        <div className={isMobileFrame ? 'space-y-2' : 'max-w-5xl mx-auto space-y-2.5'}>
          {/* Row 1: Shop Identity + Quick Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: Store Icon + Title + Subtitle */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <StoreIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                {editingShopName ? (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <input
                      type="text"
                      value={tempShopName}
                      onChange={e => setTempShopName(e.target.value)}
                      className="text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-white dark:bg-[#16202A] border border-green-300 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (tempShopName.trim()) store.updateShopName(tempShopName.trim());
                        setEditingShopName(false);
                      }}
                      className="p-1 bg-white text-[#1B7A43] rounded hover:bg-green-50 shadow"
                      title="Save Name"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => setEditingShopName(false)}
                      className="p-1 text-white/80 hover:text-white"
                      title="Cancel"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <h1 className="font-bold text-base truncate text-white leading-tight">
                      {currentShopName}
                    </h1>
                    <button
                      onClick={() => {
                        setTempShopName(currentShopName);
                        setEditingShopName(true);
                      }}
                      className="p-1 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors shrink-0"
                      title="Rename Shop"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
                <p className="text-xs text-emerald-100 truncate">
                  {currentMerchant?.ownerName || 'Rajesh Gupta'} · {currentMerchant?.area || 'Jaipur'}
                </p>
              </div>
            </div>

            {/* Right: Quick Controls (Full Mode consolidates status pills inline with actions) */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {!isMobileFrame && (
                <>
                  <button
                    onClick={() => setIsOnline(!isOnline)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    title="Toggle Online / Offline Mode"
                  >
                    {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-300" /> : <WifiOff className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{isOnline ? 'Online' : `Offline (${store.pendingSyncCount})`}</span>
                  </button>

                  <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/10">
                    {[
                      { key: 'hinglish', label: 'Hinglish' },
                      { key: 'hi', label: 'हिंदी' },
                      { key: 'en', label: 'Eng' },
                    ].map(l => (
                      <button
                        key={l.key}
                        onClick={() => setLang(l.key)}
                        className={`text-xs whitespace-nowrap transition-all ${lang === l.key
                          ? 'bg-white text-[#1B7A43] font-bold px-2.5 py-1 rounded-md shadow-xs'
                          : 'text-emerald-100 hover:text-white px-2 py-1'
                          }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setSoundboxEnabled(!soundboxEnabled)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    title={soundboxEnabled ? 'Soundbox Audio Feedback On' : 'Audio Muted'}
                  >
                    {soundboxEnabled ? <Volume2 className="w-3.5 h-3.5 text-yellow-300" /> : <VolumeX className="w-3.5 h-3.5 text-white/60" />}
                    <span>{soundboxEnabled ? 'Audio' : 'Mute'}</span>
                  </button>

                  <button
                    onClick={handleToggleViewMode}
                    className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    title="Auto-detected Desktop View · Click to preview 430px Mobile Frame"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Full</span>
                  </button>

                  <div className="w-px h-5 bg-white/20 mx-0.5 hidden sm:block" />
                </>
              )}

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => store.resetToDemo()}
                className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Reset Demo Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => store.logoutMerchant()}
                className="px-2.5 py-1.5 rounded-lg bg-black/25 hover:bg-black/35 text-xs font-semibold text-white flex items-center gap-1 transition-colors"
                title="Switch Shop / Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch</span>
              </button>
            </div>
          </div>

          {/* Row 2 (Mobile Frame Mode): Single-Line Control Strip */}
          {isMobileFrame && (
            <div className="flex items-center justify-between gap-1 sm:gap-1.5 mt-2 pt-2 border-t border-white/15 text-[11px] sm:text-xs">
              {/* Online/Offline Pill */}
              <button
                onClick={() => setIsOnline(!isOnline)}
                className="px-2 sm:px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white font-medium flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                title="Toggle Online / Offline Mode"
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-300" /> : <WifiOff className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isOnline ? 'Online' : `Offline (${store.pendingSyncCount})`}</span>
              </button>

              {/* Language Segmented Pill */}
              <div className="flex bg-black/20 rounded-full p-0.5 shrink-0">
                {[
                  { key: 'hinglish', label: 'Hinglish' },
                  { key: 'hi', label: 'हिंदी' },
                  { key: 'en', label: 'Eng' },
                ].map(l => (
                  <button
                    key={l.key}
                    onClick={() => setLang(l.key)}
                    className={`text-[11px] sm:text-xs whitespace-nowrap transition-all ${lang === l.key
                      ? 'bg-white text-[#1B7A43] font-bold px-2 py-0.5 rounded-full shadow-xs'
                      : 'text-emerald-100 hover:text-white px-1.5 py-0.5'
                      }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* Audio Toggle Pill */}
              <button
                onClick={() => setSoundboxEnabled(!soundboxEnabled)}
                className="px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                title={soundboxEnabled ? 'Soundbox Audio Feedback On' : 'Audio Muted'}
              >
                {soundboxEnabled ? <Volume2 className="w-3.5 h-3.5 text-yellow-300" /> : <VolumeX className="w-3.5 h-3.5 text-white/60" />}
                <span>{soundboxEnabled ? 'Audio' : 'Mute'}</span>
              </button>

              {/* View Toggle Pill */}
              <button
                onClick={handleToggleViewMode}
                className="px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                title="Switch to Full Screen Mode"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>430px</span>
              </button>
            </div>
          )}

          {/* Row 2 (Full Screen Mode): Structured 4-Column Equal-Width Navigation Bar */}
          {!isMobileFrame && (
            <nav
              aria-label="Primary Navigation"
              className="grid grid-cols-4 gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/10"
            >
              {tabLabels.map((label, i) => {
                const Icon = TAB_ICONS[i];
                const isActive = i === activeTab;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setActiveTab(i);
                      window.scrollTo(0, 0);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${isActive
                      ? 'bg-white dark:bg-[#11181F] text-[#1B7A43] dark:text-emerald-400 font-bold shadow-sm ring-1 ring-black/5 dark:ring-emerald-400/25'
                      : 'text-emerald-50/90 hover:text-white hover:bg-white/10 font-semibold'
                      }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Tab Content */}
      <main className={`flex-1 flex flex-col min-h-0 ${isMobileFrame ? 'w-full max-w-[440px] mx-auto p-2.5 sm:p-3' : 'max-w-5xl w-full mx-auto p-6 pb-12'}`}>
        {renderTabContent()}
      </main>

      {/* Bottom Navigation for Mobile View (In-flow sticky so it sits right inside visible viewport without hiding content) */}
      {isMobileFrame && (
        <nav className="sticky bottom-0 z-40 shrink-0 bg-white/95 dark:bg-[#16202A]/95 backdrop-blur-md border-t border-[#E2D9C8] dark:border-[#2A3644] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-[440px] mx-auto flex items-center justify-around">
            {tabLabels.map((label, i) => {
              const Icon = TAB_ICONS[i];
              const isActive = i === activeTab;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setActiveTab(i);
                    window.scrollTo(0, 0);
                  }}
                  className={`flex-1 flex flex-col items-center py-2 px-1 text-[11px] font-medium transition-all ${isActive
                    ? 'text-[#1B7A43] dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
                    <Icon size={20} className={isActive ? 'text-[#1B7A43] dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'} />
                  </div>
                  <span className="mt-0.5 truncate max-w-[80px]">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );

  return (
    <div className={`app-min-h bg-[#FAF6F0] dark:bg-[#0B1116] text-[#1E242B] dark:text-[#F3F4F6] transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {isMobileFrame ? (
        <div className="w-full app-min-h flex justify-center bg-[#F2EDE4] dark:bg-[#070B0E]">
          <div className="w-full max-w-[440px] app-min-h bg-[#FAF6F0] dark:bg-[#0B1116] border-x border-[#E2D9C8] dark:border-[#2A3644] shadow-2xl flex flex-col relative">
            {appContent}
          </div>
        </div>
      ) : (
        appContent
      )}
    </div>
  );
}
