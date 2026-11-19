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
