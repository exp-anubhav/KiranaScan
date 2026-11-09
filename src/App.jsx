import { useState, useEffect } from 'react';
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
      <div className={`min-h-screen flex flex-col justify-center items-center p-4 bg-[#FAF6F0] dark:bg-[#0F1419] text-[#1E242B] dark:text-[#F3F4F6] transition-colors ${isDarkMode ? 'dark' : ''}`}>
        {/* Top Floating Controls */}
        <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-white dark:bg-[#182026] border border-[#E6DFD3] dark:border-[#2A343D] text-[#5A6573] dark:text-[#9CA3AF] hover:text-[#1B7A43] shadow-sm transition-all"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-[#182026] rounded-3xl border border-[#E6DFD3] dark:border-[#2A343D] shadow-xl p-6 sm:p-8 space-y-6">
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
          <div className="flex bg-[#FAF6F0] dark:bg-[#0F1419] p-1 rounded-2xl border border-[#E6DFD3] dark:border-[#2A343D]">
            <button
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                authTab === 'login'
                  ? 'bg-white dark:bg-[#182026] text-[#1B7A43] dark:text-green-400 shadow-sm'
                  : 'text-[#5A6573] dark:text-[#9CA3AF] hover:text-[#1E242B]'
              }`}
            >
              🔑 Dukan Login
            </button>
            <button
              onClick={() => { setAuthTab('signup'); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                authTab === 'signup'
                  ? 'bg-white dark:bg-[#182026] text-[#1B7A43] dark:text-green-400 shadow-sm'
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
      case 0: return <VoiceTab store={store} isOnline={isOnline} soundboxEnabled={soundboxEnabled} lang={lang} labels={labels} />;
      case 1: return <LedgerTab store={store} isOnline={isOnline} lang={lang} labels={labels} />;
      case 2: return <DailyHisabTab store={store} lang={lang} labels={labels} />;
      case 3: return <CatalogueTab store={store} isOnline={isOnline} lang={lang} labels={labels} />;
      default: return null;
    }
  };

  const appContent = (
    <div className={`flex flex-col w-full bg-[#FAF6F0] dark:bg-[#0F1419] text-[#1E242B] dark:text-[#F3F4F6] transition-colors ${isMobileFrame ? 'h-full' : 'min-h-screen'}`}>
      {/* ── 2-ROW CLEAN PROFESSIONAL MERCHANT HEADER ── */}
      <header className={`bg-[#1B7A43] dark:bg-[#145E33] text-white shadow-md z-30 transition-all ${isMobileFrame ? 'px-4 py-3 pt-9' : 'px-6 py-4'}`}>
        <div className={isMobileFrame ? 'space-y-2.5' : 'max-w-5xl mx-auto space-y-3'}>
          {/* Row 1: Store Icon + currentMerchant.shopName + Owner/Area subtitle + Switch Shop / Logout + Reset Data */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-xs">
                <StoreIcon size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                {editingShopName ? (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <input
                      type="text"
                      value={tempShopName}
                      onChange={e => setTempShopName(e.target.value)}
                      className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white px-2 py-1 rounded-md bg-white dark:bg-[#182026] border border-green-300 focus:outline-none"
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
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingShopName(false)}
                      className="p-1 text-white/80 hover:text-white"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <h1 className="text-sm sm:text-base md:text-lg font-black leading-tight tracking-tight truncate max-w-[230px] sm:max-w-xs md:max-w-md">
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
                <p className="text-[11px] text-green-100/80 truncate">
                  👤 {currentMerchant.ownerName} · 📍 {currentMerchant.area}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => store.resetToDemo()}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="Restore Default Sample Data"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={() => store.logoutMerchant()}
                className="px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="Switch Shop / Logout"
              >
                <LogOut size={12} />
                <span>Switch Shop</span>
              </button>
            </div>
          </div>

          {/* Row 2: Compact Control Pills (Network, Language, Soundbox, Theme, Frame) */}
          <div className="flex items-center justify-between flex-wrap gap-1.5 pt-1 border-t border-white/15 text-[11px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Network Toggle Pill */}
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`px-2.5 py-1 rounded-full font-semibold transition-all flex items-center gap-1 ${
                  isOnline
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-amber-400 text-amber-950 font-bold'
                }`}
                title="Toggle Online / Offline Mode"
              >
                {isOnline ? <Wifi size={11} className="text-green-300" /> : <WifiOff size={11} />}
                <span>{isOnline ? '🟢 Online' : `🟠 Offline (${store.pendingSyncCount})`}</span>
              </button>

              {/* Language Switcher Pill */}
              <div className="flex bg-black/20 rounded-full p-0.5">
                {[
                  { key: 'hinglish', label: 'Hinglish' },
                  { key: 'hi', label: 'हिंदी' },
                  { key: 'en', label: 'Eng' },
                ].map(l => (
                  <button
                    key={l.key}
                    onClick={() => setLang(l.key)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                      lang === l.key
                        ? 'bg-white text-[#1B7A43] shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* Soundbox TTS Pill */}
              <button
                onClick={() => setSoundboxEnabled(!soundboxEnabled)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  soundboxEnabled ? 'bg-white/20 text-white' : 'bg-black/20 text-white/60'
                }`}
                title={soundboxEnabled ? 'Soundbox Audio Feedback On' : 'Audio Muted'}
              >
                {soundboxEnabled ? <Volume2 size={12} className="text-yellow-300" /> : <VolumeX size={12} />}
                <span>{soundboxEnabled ? 'Audio On' : 'Mute'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Theme Toggle Pill */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {isDarkMode ? <Sun size={12} className="text-yellow-300" /> : <Moon size={12} />}
              </button>

              {/* Desktop Frame Switcher Pill */}
              <button
                onClick={() => setIsMobileFrame(!isMobileFrame)}
                className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium transition-colors flex items-center gap-1"
                title="Toggle Phone Frame vs Full Screen"
              >
                {isMobileFrame ? <Smartphone size={12} /> : <Monitor size={12} />}
                <span>{isMobileFrame ? '430px' : 'Full'}</span>
              </button>
            </div>
          </div>

          {/* Desktop Navigation Tabs for Full Screen Mode */}
          {!isMobileFrame && (
            <nav className="flex items-center gap-1.5 bg-black/15 p-1 rounded-xl pt-1">
              {tabLabels.map((label, i) => {
                const Icon = TAB_ICONS[i];
                const isActive = i === activeTab;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white dark:bg-[#182026] text-[#1B7A43] dark:text-green-400 shadow-md'
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
      <main className={`flex-1 overflow-y-auto ${isMobileFrame ? 'pb-20 p-3' : 'max-w-5xl w-full mx-auto p-6 pb-12'}`}>
        {renderTabContent()}
      </main>

      {/* Bottom Navigation for Mobile Frame only */}
      {isMobileFrame && (
        <nav className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#182026] border-t border-[#E6DFD3] dark:border-[#2A343D] flex z-40 transition-colors shadow-lg">
          {tabLabels.map((label, i) => {
            const Icon = TAB_ICONS[i];
            const isActive = i === activeTab;
            return (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`flex-1 flex flex-col items-center py-2.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-[#1B7A43] dark:text-green-400 border-t-2 border-[#1B7A43] dark:border-green-400 font-bold'
                    : 'text-[#5A6573] dark:text-[#9CA3AF]'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#1B7A43] dark:text-green-400' : 'text-[#5A6573] dark:text-[#9CA3AF]'} />
                <span className="mt-0.5 truncate max-w-[80px]">{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#F0ECE6] dark:bg-[#0F1419] text-[#1E242B] dark:text-[#F3F4F6] transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {isMobileFrame ? (
        <div className="flex justify-center items-center py-4 px-2 min-h-screen">
          <div className="phone-frame bg-[#FAF6F0] dark:bg-[#0F1419] flex flex-col shadow-2xl">
            {appContent}
          </div>
        </div>
      ) : (
        appContent
      )}
    </div>
  );
}
