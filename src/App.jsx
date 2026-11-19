import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useStore } from './stores/useStore.js';
import { LABELS } from './data/seedData.js';
import VoiceTab from './components/VoiceTab.jsx';
import LedgerTab from './components/LedgerTab.jsx';
import DailyHisabTab from './components/DailyHisabTab.jsx';
import CatalogueTab from './components/CatalogueTab.jsx';
import OnboardingAuth from './components/OnboardingAuth.jsx';
import {
  Mic, BookOpen, BarChart3, Store as StoreIcon,
  Wifi, WifiOff, Volume2, VolumeX, RotateCcw,
  Smartphone, Monitor, Globe, ChevronUp, ChevronDown, Zap,
  Sun, Moon, Edit2, Check, X, LogOut
} from 'lucide-react';
import './index.css';

const TAB_ICONS = [Mic, BookOpen, BarChart3, StoreIcon];
const TAB_SHORT_LABELS = ['Bol Kar', 'Khata', 'Hisab', 'Bhaav'];

function getShopMonogram(name) {
  if (!name) return 'KS';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return 'KS';
}

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
  const [authError, setAuthError] = useState({ field: '', message: '' });

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
    setAuthError({ field: '', message: '' });

    const cleanPhone = String(loginPhone || '').trim().replace(/\D/g, '');
    const cleanPin = String(loginPin || '').trim();

    if (cleanPhone.length !== 10) {
      setAuthError({ field: 'phone', message: 'Enter a valid 10-digit mobile number' });
      return;
    }

    if (cleanPin.length !== 4) {
      setAuthError({ field: 'pin', message: 'Enter all 4 digits of your PIN' });
      return;
    }

    const merchants = store.registeredMerchants || [];
    const phoneExists = merchants.some(m => String(m.phone).replace(/\D/g, '') === cleanPhone);

    if (!phoneExists) {
      setAuthError({ field: 'phone', message: 'No shop registered on this number. Tap New Shop to create one.' });
      return;
    }

    const res = store.loginMerchant(cleanPhone, cleanPin);
    if (!res.success) {
      setAuthError({ field: 'pin', message: 'Incorrect PIN. Check your digits or try Instant Demo.' });
    } else {
      setLoginPhone('');
      setLoginPin('');
      setAuthError({ field: '', message: '' });
    }
  };

  const handleSignup = (e) => {
    e?.preventDefault();
    setAuthError({ field: '', message: '' });

    const cleanShop = String(signupShopName || '').trim();
    const cleanOwner = String(signupOwnerName || '').trim();
    const cleanPhone = String(signupPhone || '').trim().replace(/\D/g, '');
    const cleanPin = String(signupPin || '').trim();

    if (!cleanShop) {
      setAuthError({ field: 'shopName', message: 'Enter your shop name' });
      return;
    }
    if (!cleanOwner) {
      setAuthError({ field: 'ownerName', message: 'Enter the owner name' });
      return;
    }
    if (cleanPhone.length !== 10) {
      setAuthError({ field: 'phone', message: 'Enter a valid 10-digit mobile number' });
      return;
    }
    const merchants = store.registeredMerchants || [];
    const phoneExists = merchants.some(m => String(m.phone).replace(/\D/g, '') === cleanPhone);
    if (phoneExists) {
      setAuthError({ field: 'phone', message: 'A shop is already registered with this number. Please log in.' });
      return;
    }
    if (cleanPin.length !== 4) {
      setAuthError({ field: 'pin', message: 'Create a 4-digit security PIN' });
      return;
    }

    const res = store.registerMerchant({
      shopName: cleanShop,
      ownerName: cleanOwner,
      phone: cleanPhone,
      pin: cleanPin,
      area: signupArea,
      openingCash: signupOpeningCash
    });
    if (!res.success) {
      setAuthError({ field: 'form', message: res.error?.replace(/!/g, '') || 'Unable to register shop. Please try again.' });
    } else {
      setSignupShopName('');
      setSignupOwnerName('');
      setSignupPhone('');
      setSignupPin('');
      setSignupArea('');
      setSignupOpeningCash('1000');
      setAuthError({ field: '', message: '' });
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
      <OnboardingAuth
        store={store}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        authTab={authTab}
        setAuthTab={setAuthTab}
        loginPhone={loginPhone}
        setLoginPhone={setLoginPhone}
        loginPin={loginPin}
        setLoginPin={setLoginPin}
        signupShopName={signupShopName}
        setSignupShopName={setSignupShopName}
        signupOwnerName={signupOwnerName}
        setSignupOwnerName={setSignupOwnerName}
        signupPhone={signupPhone}
        setSignupPhone={setSignupPhone}
        signupPin={signupPin}
        setSignupPin={setSignupPin}
        signupArea={signupArea}
        setSignupArea={setSignupArea}
        signupOpeningCash={signupOpeningCash}
        setSignupOpeningCash={setSignupOpeningCash}
        authError={authError}
        setAuthError={setAuthError}
        handleLogin={handleLogin}
        handleSignup={handleSignup}
      />
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
    <div className="flex flex-col w-full flex-1 app-min-h bg-[#F4F6F8] dark:bg-[#090B0F] text-slate-900 dark:text-slate-100 transition-colors relative">
      {/* ── REFINED FROSTED GLASS HEADER (OBSIDIAN + VOLT LIME) ── */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#090B0F]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] transition-all">
        <div className={isMobileFrame ? 'w-full' : 'max-w-5xl mx-auto'}>
          {/* Row 1: Shop Identity + Quick Controls */}
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            {/* Left: Shop Monogram + Name + inline Edit + City/Owner subtitle */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-[#111315] dark:bg-[#C8F53B] text-[#C8F53B] dark:text-[#111315] font-extrabold text-xs flex items-center justify-center shrink-0 tracking-wider shadow-sm">
                {getShopMonogram(currentShopName)}
              </div>
              <div className="min-w-0 flex-1">
                {editingShopName ? (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <input
                      type="text"
                      value={tempShopName}
                      onChange={e => setTempShopName(e.target.value)}
                      className="text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-white dark:bg-[#181C25] border border-slate-300 dark:border-white/20 focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (tempShopName.trim()) store.updateShopName(tempShopName.trim());
                        setEditingShopName(false);
                      }}
                      className="p-1 bg-[#111315] text-[#C8F53B] dark:bg-[#C8F53B] dark:text-[#111315] rounded hover:opacity-90 shadow-sm cursor-pointer"
                      title="Save Name"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => setEditingShopName(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      title="Cancel"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group">
                    <h1 className="font-bold text-sm tracking-tight text-[#111315] dark:text-white truncate leading-tight">
                      {currentShopName}
                    </h1>
                    <button
                      onClick={() => {
                        setTempShopName(currentShopName);
                        setEditingShopName(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                      title="Rename Shop"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {currentMerchant?.ownerName || 'Rajesh Gupta'} · {currentMerchant?.area || 'Jaipur'}
                </p>
              </div>
            </div>

            {/* Right: Minimal circular icon buttons for Theme, Reset Demo, and compact Switch pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => store.resetToDemo()}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Reset Demo Data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => store.logoutMerchant()}
                className="px-2.5 h-8 rounded-full border border-slate-200 dark:border-white/12 bg-white/60 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Switch Shop / Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch</span>
              </button>
            </div>
          </div>

          {/* Row 2: Sleek Utility Strip */}
          <div className="px-4 pb-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {/* Online / Offline Pill */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}
              title="Toggle Online / Offline Mode"
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline ({store.pendingSyncCount})</span>
                </>
              )}
            </button>

            {/* Language Segmented Control */}
            <div className="flex bg-slate-100 dark:bg-white/[0.06] p-0.5 rounded-full border border-slate-200/70 dark:border-white/[0.08] shrink-0">
              {[
                { key: 'hinglish', label: 'Hinglish' },
                { key: 'hi', label: 'हिंदी' },
                { key: 'en', label: 'Eng' },
              ].map(l => (
                <button
                  key={l.key}
                  onClick={() => setLang(l.key)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                    lang === l.key
                      ? 'bg-[#111315] text-[#C8F53B] dark:bg-[#C8F53B] dark:text-[#111315] font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Audio Pill */}
              <button
                onClick={() => setSoundboxEnabled(!soundboxEnabled)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  soundboxEnabled
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-transparent'
                }`}
                title={soundboxEnabled ? 'Soundbox Audio Feedback On' : 'Audio Muted'}
              >
                {soundboxEnabled ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <Volume2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Audio</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3 text-slate-400" />
                    <span>Mute</span>
                  </>
                )}
              </button>

              {/* View-Mode Pill */}
              <button
                onClick={handleToggleViewMode}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                title={isMobileFrame ? 'Switch to Full Screen Desktop Mode' : 'Preview 430px Mobile Frame'}
              >
                {isMobileFrame ? (
                  <>
                    <Smartphone className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    <span>430px</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    <span>Full</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <main className={`flex-1 flex flex-col min-h-0 pb-28 ${isMobileFrame ? 'w-full max-w-[440px] mx-auto p-2.5 sm:p-3' : 'max-w-5xl w-full mx-auto p-6 pb-28'}`}>
        {renderTabContent()}
      </main>

      {/* Floating Glassmorphic Pill Bottom Dock */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-[404px] rounded-full bg-[#111315]/95 dark:bg-[#161A22]/95 backdrop-blur-2xl border border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.28)] p-1.5 flex items-center justify-between gap-1"
      >
        {TAB_ICONS.map((Icon, i) => {
          const isActive = i === activeTab;
          return isActive ? (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveTab(i);
                window.scrollTo(0, 0);
              }}
              aria-current="page"
              className="bg-[#C8F53B] text-[#111315] font-bold rounded-full px-3.5 py-2.5 flex items-center gap-1.5 shadow-sm transition-all text-xs shrink-0 cursor-pointer"
            >
              <Icon size={16} strokeWidth={2.4} className="shrink-0" />
              <span className="whitespace-nowrap">{TAB_SHORT_LABELS[i]}</span>
            </button>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveTab(i);
                window.scrollTo(0, 0);
              }}
              className="text-slate-400 hover:text-white px-2.5 py-2 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer flex-1"
            >
              <Icon size={16} strokeWidth={2} />
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">{TAB_SHORT_LABELS[i]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className={`app-min-h bg-[#F4F6F8] dark:bg-[#090B0F] text-slate-900 dark:text-slate-100 transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {isMobileFrame ? (
        <div className="w-full app-min-h flex justify-center bg-[#E5E9EE] dark:bg-[#05070A]">
          <div className="w-full max-w-[440px] app-min-h bg-[#F4F6F8] dark:bg-[#090B0F] border-x border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col relative">
            {appContent}
          </div>
        </div>
      ) : (
        appContent
      )}
    </div>
  );
}
