import { useState, useEffect, useLayoutEffect } from 'react';
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
  Sun, Moon, Edit2, Check, X, LogOut, ArrowRight, User, Phone, Lock, MapPin, Wallet, Sparkles, AlertCircle
} from 'lucide-react';
import './index.css';

const TAB_ICONS = [Mic, BookOpen, BarChart3, StoreIcon];

export default function App() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [soundboxEnabled, setSoundboxEnabled] = useState(true);
  const [lang, setLang] = useState('hinglish');
  const [isMobileFrame, setIsMobileFrame] = useState(true);

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
      <div className={`app-min-h flex flex-col justify-center items-center p-4 bg-[#FAF6F0] dark:bg-[#0B1116] text-[#1E242B] dark:text-[#F3F4F6] transition-colors ${isDarkMode ? 'dark' : ''}`}>
        {/* Top Floating Controls */}
        <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] text-[#5A6573] dark:text-[#9CA3AF] hover:text-[#1B7A43] shadow-sm transition-all"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-[#16202A] rounded-3xl border border-[#E2D9C8] dark:border-[#2A3644] shadow-xl p-6 sm:p-8 space-y-6">
          {/* Logo & Branding */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1B7A43] text-white flex items-center justify-center shadow-lg shadow-green-900/20">
              <StoreIcon size={34} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#1E242B] dark:text-[#F3F4F6]">
                KiranaScan
              </h1>
              <p className="text-xs text-[#5A6573] dark:text-[#9CA3AF] mt-0.5">
                Voice-First Accounting & Bahi-Khata for Kirana Merchants
              </p>
            </div>
          </div>

          {/* 1-Tap Instant Demo Login Button (Prominent) */}
          <button
            type="button"
            onClick={() => store.loginDemoMerchant()}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#1B7A43] to-[#145E33] hover:from-[#145E33] hover:to-[#0E4424] text-white font-bold text-sm shadow-md shadow-green-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles size={18} className="text-yellow-300 animate-pulse" />
            <span>🚀 Instant Demo Login: Gupta Kirana Store</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E6DFD3] dark:bg-[#2A343D]" />
            <span className="text-[11px] text-[#5A6573] dark:text-[#9CA3AF] uppercase font-semibold">ya apna khata kholein</span>
            <div className="flex-1 h-px bg-[#E6DFD3] dark:bg-[#2A343D]" />
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-[#FAF6F0] dark:bg-[#11181F] p-1 rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644]">
            <button
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${authTab === 'login'
                ? 'bg-white dark:bg-[#16202A] text-[#1B7A43] dark:text-green-400 shadow-sm'
                : 'text-[#5A6573] dark:text-[#9CA3AF] hover:text-[#1E242B]'
                }`}
            >
              🔑 Dukan Login
            </button>
            <button
              onClick={() => { setAuthTab('signup'); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${authTab === 'signup'
                ? 'bg-white dark:bg-[#16202A] text-[#1B7A43] dark:text-green-400 shadow-sm'
                : 'text-[#5A6573] dark:text-[#9CA3AF] hover:text-[#1E242B]'
                }`}
            >
              ✨ Nayi Dukan Jodein (Sign Up)
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
                className="w-full py-2.5 rounded-xl bg-[#1B7A43] hover:bg-[#145E33] text-white font-bold text-sm shadow transition-all active:scale-[0.98]"
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
                className="w-full py-2.5 rounded-xl bg-[#1B7A43] hover:bg-[#145E33] text-white font-bold text-sm shadow transition-all active:scale-[0.98] mt-2"
              >
                Create Shop & Start Accounting
              </button>
            </form>
          )}
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
      {/* ── 2-ROW CLEAN PROFESSIONAL MERCHANT HEADER ── */}
      <header className="bg-[#1B7A43] text-white px-3.5 py-2.5 shadow-md sticky top-0 z-30 shrink-0 transition-all">
        <div className={isMobileFrame ? 'space-y-2' : 'max-w-5xl mx-auto space-y-2.5'}>
          {/* Row 1: Shop Identity + Quick Icon Actions */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Store Icon + Title + Subtitle */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
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

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
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

          {/* Row 2: Single-Line Control Strip */}
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
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              className="px-2 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
              title="Toggle Phone Frame vs Full Screen"
            >
              {isMobileFrame ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              <span>{isMobileFrame ? '430px' : 'Full'}</span>
            </button>
          </div>

          {/* Desktop Navigation Tabs for Full Screen Mode */}
          {!isMobileFrame && (
            <nav className="flex items-center gap-1.5 bg-black/15 p-1 rounded-xl mt-2">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                      ? 'bg-white dark:bg-[#16202A] text-[#1B7A43] dark:text-emerald-400 shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
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
