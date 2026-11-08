import { useState, useEffect } from 'react'
import { useStore } from './stores/useStore.js'
import { LABELS } from './data/seedData.js'
import VoiceTab from './components/VoiceTab.jsx'
import LedgerTab from './components/LedgerTab.jsx'
import DailyHisabTab from './components/DailyHisabTab.jsx'
import CatalogueTab from './components/CatalogueTab.jsx'
import {
  Mic, BookOpen, BarChart3, Store as StoreIcon,
  Wifi, WifiOff, Volume2, VolumeX, RotateCcw,
  Smartphone, Monitor, Globe, ChevronUp, ChevronDown, Zap,
  Sun, Moon, Edit2, Check, X
} from 'lucide-react'
import './index.css'

const TAB_ICONS = [Mic, BookOpen, BarChart3, StoreIcon];
const TAB_KEYS = ['speak', 'ledger', 'daily', 'catalogue'];

export default function App() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [soundboxEnabled, setSoundboxEnabled] = useState(true);
  const [lang, setLang] = useState('hinglish');
  const [isMobileFrame, setIsMobileFrame] = useState(true);
  const [topBarCollapsed, setTopBarCollapsed] = useState(false);

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
  const [tempShopName, setTempShopName] = useState(store.shopName || 'Gupta Kirana & General Store');

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
  }, [isOnline]);

  const tabLabels = [labels.tab1, labels.tab2, labels.tab3, labels.tab4];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return <VoiceTab store={store} isOnline={isOnline} soundboxEnabled={soundboxEnabled} lang={lang} labels={labels} />;
      case 1: return <LedgerTab store={store} isOnline={isOnline} lang={lang} labels={labels} />;
      case 2: return <DailyHisabTab store={store} lang={lang} labels={labels} />;
      case 3: return <CatalogueTab store={store} isOnline={isOnline} lang={lang} labels={labels} />;
      default: return null;
    }
  };

  const currentShopName = store.shopName || labels.appName;

  const appContent = (
    <div className={`flex flex-col h-full bg-[#FAF6F0] dark:bg-[#12161A] text-[#1E242B] dark:text-[#F1F5F9] transition-colors ${isMobileFrame ? '' : 'min-h-[calc(100vh-60px)]'}`}>
      {/* Shop Header */}
      <header className={`bg-[#1B7A43] dark:bg-[#145E33] text-white shadow-md z-30 transition-all ${isMobileFrame ? 'px-4 py-3 pt-9' : 'px-6 py-4'}`}>
        <div className={isMobileFrame ? '' : 'max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3'}>
          <div className="flex items-center justify-between flex-1 min-w-[280px]">
            <div>
              {editingShopName ? (
                <div className="flex items-center gap-1.5 py-1">
                  <input
                    type="text"
                    value={tempShopName}
                    onChange={e => setTempShopName(e.target.value)}
                    className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white px-2 py-1 rounded-md bg-white dark:bg-[#1E252D] border border-green-300 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (tempShopName.trim()) store.updateShopName(tempShopName.trim());
                      setEditingShopName(false);
                    }}
                    className="p-1 bg-white dark:bg-[#1E252D] text-[#1B7A43] dark:text-green-400 rounded hover:bg-green-50 shadow"
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
                <div className="flex items-center gap-2 group">
                  <StoreIcon size={22} className="text-green-200" />
                  <h1 className="text-base md:text-xl font-bold leading-tight tracking-tight">
                    {currentShopName}
                  </h1>
                  <button
                    onClick={() => {
                      setTempShopName(currentShopName);
                      setEditingShopName(true);
                    }}
                    className="p-1 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
                    title="Click to rename shop"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 mt-1.5 text-xs opacity-90 flex-wrap">
                {store.pendingSyncCount > 0 && (
                  <span className={`bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold ${syncing ? 'animate-pulse' : ''}`}>
                    {syncing ? '⏳ Syncing...' : `Pending Sync (${store.pendingSyncCount})`}
                  </span>
                )}
                <span className="flex items-center gap-1 text-green-100">
                  <Zap size={11} className="text-yellow-300" />
                  Avg Entry: {store.avgEntrySpeed}s
                </span>
                <span className="flex items-center gap-1.5 text-green-100">
                  <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-300' : 'bg-amber-400'}`} />
                  {isOnline ? '🟢 Online (Server Synced)' : '🟠 Offline Mode'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs for Full Screen Mode */}
          {!isMobileFrame && (
            <nav className="flex items-center gap-1.5 bg-black/15 p-1 rounded-xl">
              {tabLabels.map((label, i) => {
                const Icon = TAB_ICONS[i];
                const isActive = i === activeTab;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white dark:bg-[#1E252D] text-[#1B7A43] dark:text-green-400 shadow-md'
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
      <main className={`flex-1 overflow-y-auto ${isMobileFrame ? 'pb-6 p-3' : 'max-w-5xl w-full mx-auto p-6 pb-12'}`}>
        {renderTabContent()}
      </main>

      {/* Bottom Navigation for Mobile Frame only */}
      {isMobileFrame && (
        <nav className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1E252D] border-t border-[#E6DFD3] dark:border-[#2F3844] flex z-40 transition-colors">
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
                    : 'text-[#5A6573] dark:text-gray-400'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#1B7A43] dark:text-green-400' : 'text-[#5A6573] dark:text-gray-400'} />
                <span className="mt-0.5 truncate max-w-[80px]">{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0ECE6] dark:bg-[#0B0F13] text-[#1E242B] dark:text-[#F1F5F9] transition-colors">
      {/* Top Utility Bar */}
      <div className="bg-white dark:bg-[#1E252D] border-b border-[#E6DFD3] dark:border-[#2F3844] shadow-sm transition-colors">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setTopBarCollapsed(!topBarCollapsed)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-[#1E242B] dark:text-white hover:bg-gray-50 dark:hover:bg-[#252E38]"
          >
            <span className="flex items-center gap-1.5">
              <span>🏪</span>
              <span>KiranaScan — Quick Controls & Simulator</span>
            </span>
            {topBarCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {!topBarCollapsed && (
            <div className="px-4 pb-3 flex flex-wrap items-center gap-2 text-xs">
              {/* View Switcher */}
              <div className="flex bg-gray-100 dark:bg-[#151B22] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsMobileFrame(true)}
                  className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${isMobileFrame ? 'bg-[#1B7A43] text-white font-semibold' : 'text-[#5A6573] dark:text-gray-400'}`}
                >
                  <Smartphone size={12} /> Mobile Frame
                </button>
                <button
                  onClick={() => setIsMobileFrame(false)}
                  className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${!isMobileFrame ? 'bg-[#1B7A43] text-white font-semibold' : 'text-[#5A6573] dark:text-gray-400'}`}
                >
                  <Monitor size={12} /> Full Screen
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium border transition-colors ${
                  isDarkMode
                    ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/20'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
                title="Toggle Dark / Light Mode"
              >
                {isDarkMode ? <><Sun size={12} /> ☀️ Light Mode</> : <><Moon size={12} /> 🌙 Dark Mode</>}
              </button>

              {/* Network Toggle */}
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 font-medium border transition-colors ${
                  isOnline
                    ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                {isOnline ? <><Wifi size={12} /> Online</> : <><WifiOff size={12} /> Offline Queue</>}
                {store.pendingSyncCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-[9px] px-1.5 rounded-full">{store.pendingSyncCount}</span>
                )}
              </button>

              {/* Language Switcher */}
              <div className="flex bg-gray-100 dark:bg-[#151B22] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {[['hinglish', 'Hinglish'], ['hi', 'हिंदी'], ['en', 'English']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setLang(key)}
                    className={`px-2.5 py-1.5 transition-colors ${lang === key ? 'bg-[#1B7A43] text-white font-semibold' : 'text-[#5A6573] dark:text-gray-400'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Soundbox Toggle */}
              <button
                onClick={() => setSoundboxEnabled(!soundboxEnabled)}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 border transition-colors ${
                  soundboxEnabled
                    ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 font-medium'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
              >
                {soundboxEnabled ? <><Volume2 size={12} /> 🔊 Soundbox Active</> : <><VolumeX size={12} /> Soundbox Off</>}
              </button>

              {/* Reset Button */}
              <button
                onClick={() => { store.resetToDemo(); setActiveTab(0); }}
                className="px-3 py-1.5 rounded-full flex items-center gap-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-100 transition-colors"
              >
                <RotateCcw size={12} /> Reset Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* App Content Container */}
      {isMobileFrame ? (
        <div className="flex justify-center py-6">
          <div className="phone-frame bg-[#FAF6F0] dark:bg-[#12161A] relative overflow-hidden transition-colors">
            <div className="h-full overflow-hidden flex flex-col">
              {appContent}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full min-h-[calc(100vh-50px)]">
          {appContent}
        </div>
      )}
    </div>
  );
}
