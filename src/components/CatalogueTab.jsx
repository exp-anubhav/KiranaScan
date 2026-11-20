import { useState } from 'react';
import {
  Search, Plus, Edit3, Save, Trash2, Package, RefreshCw, Shield,
  Download, Database, Key, Globe, X, Check, ChevronDown, ChevronRight,
  ArrowUpDown, Wifi, WifiOff, Tag, Store, Sparkles
} from 'lucide-react';
import { getActiveGeminiKey, hasBuiltInGeminiKey } from '../utils/bahiKhataOcr.js';

const UNIT_OPTIONS = ['kg', 'L', 'pkt', 'pc'];

export default function CatalogueTab({ store, isOnline, lang, labels }) {
  // Catalogue state
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [editRate, setEditRate] = useState('');
  const [editAliases, setEditAliases] = useState('');
  const [editIsMultiBrand, setEditIsMultiBrand] = useState(false);
  const [editVariants, setEditVariants] = useState([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandPrice, setNewBrandPrice] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', aliases: '', unit: 'kg', rate: '', isMultiBrand: false
  });
  const [newItemVariants, setNewItemVariants] = useState([
    { brand: '', price: '' }
  ]);

  // Shop Name state
  const [shopNameInput, setShopNameInput] = useState(() => store.shopName || 'Gupta Kirana & General Store');
  const [shopNameSaved, setShopNameSaved] = useState(false);

  // Gemini key state (uses built-in VITE_GEMINI_API_KEY by default; custom override optional)
  const builtInGeminiActive = hasBuiltInGeminiKey();
  const [geminiKey, setGeminiKey] = useState(() => {
    const active = getActiveGeminiKey();
    const envKey = import.meta.env?.VITE_GEMINI_API_KEY?.trim() || '';
    return active && active !== envKey ? active : '';
  });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiSaved, setGeminiSaved] = useState(() => {
    const active = getActiveGeminiKey();
    const envKey = import.meta.env?.VITE_GEMINI_API_KEY?.trim() || '';
    return Boolean(active && active !== envKey);
  });

  // Sync animation
  const [syncing, setSyncing] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const catalogue = store.catalogue || [];
  const syncQueue = store.syncQueue || [];

  // Filter catalogue
  const filtered = catalogue.filter(item => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (item.name?.toLowerCase().includes(q)) return true;
    if (item.aliases?.some(a => a.toLowerCase().includes(q))) return true;
    return false;
  });

  // Expand/collapse item for editing
  const handleExpand = (item) => {
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
      return;
    }
    setExpandedItemId(item.id);
    setEditRate(item.rate?.toString() || '');
    setEditAliases(item.aliases?.join(', ') || '');
    setEditIsMultiBrand(!!item.isMultiBrand);
    const variants = (item.variants || []).map(v => {
      if (typeof v === 'object') {
        const brand = v.brand || v.name || v.label?.replace(/ ₹\d+/, '') || 'Brand';
        const price = v.price ?? v.rate ?? 0;
        return { brand, price, label: v.label || `${brand} ₹${price}` };
      }
      return { brand: String(v), price: 0, label: String(v) };
    });
    setEditVariants(variants);
    setNewBrandName('');
    setNewBrandPrice('');
  };

  const handleUpdateVariantPrice = (idx, newPrice) => {
    setEditVariants(prev => {
      const updated = [...prev];
      const p = parseFloat(newPrice) || 0;
      updated[idx] = {
        ...updated[idx],
        price: p,
        label: `${updated[idx].brand} ₹${p}`
      };
      return updated;
    });
  };

  const handleUpdateVariantBrand = (idx, newBrand) => {
    setEditVariants(prev => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        brand: newBrand,
        label: `${newBrand} ₹${updated[idx].price || 0}`
      };
      return updated;
    });
  };

  const handleRemoveVariant = (idx) => {
    setEditVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddBrandToExisting = () => {
    if (!newBrandName.trim()) return;
    const price = parseFloat(newBrandPrice) || 0;
    const brand = newBrandName.trim();
    setEditVariants(prev => [
      ...prev,
      { brand, price, label: `${brand} ₹${price}` }
    ]);
    setNewBrandName('');
    setNewBrandPrice('');
  };

  // Save edited item
  const handleSaveEdit = (itemId) => {
    const aliasArr = editAliases
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
    store.updateCatalogueItem(itemId, {
      rate: parseFloat(editRate) || 0,
      aliases: aliasArr,
      isMultiBrand: editIsMultiBrand || editVariants.length > 0,
      variants: editVariants.map(v => ({
        label: `${v.brand} ₹${v.price}`,
        price: Number(v.price) || 0,
        brand: v.brand
      }))
    });
    setExpandedItemId(null);
  };

  // Add new item
  const handleAddItem = () => {
    const aliasArr = newItem.aliases
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
    const validVariants = newItem.isMultiBrand
      ? newItemVariants
          .filter(v => v.brand.trim())
          .map(v => ({
            label: `${v.brand.trim()} ₹${parseFloat(v.price) || 0}`,
            price: parseFloat(v.price) || 0,
            brand: v.brand.trim()
          }))
      : [];
    store.addCatalogueItem({
      name: newItem.name.trim(),
      aliases: aliasArr,
      unit: newItem.unit,
      rate: parseFloat(newItem.rate) || (validVariants[0]?.price || 0),
      isMultiBrand: newItem.isMultiBrand && validVariants.length > 0,
      variants: validVariants,
    });
    setNewItem({ name: '', aliases: '', unit: 'kg', rate: '', isMultiBrand: false });
    setNewItemVariants([{ brand: '', price: '' }]);
    setShowAddForm(false);
  };

  // Sync queue
  const handleSync = async () => {
    setSyncing(true);
    await store.syncOfflineQueue();
    setTimeout(() => setSyncing(false), 1200);
  };

  // Gemini key save
  const handleSaveGeminiKey = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('kiranascan_gemini_key', geminiKey.trim());
      setGeminiSaved(true);
    } else {
      localStorage.removeItem('kiranascan_gemini_key');
      setGeminiSaved(false);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      catalogue: store.catalogue,
      syncQueue: store.syncQueue,
      customers: store.customers || [],
      transactions: store.transactions || [],
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `kiranascan_backup_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const customers = store.customers || [];
    const headers = ['Name', 'Phone', 'Balance', 'Last Transaction'];
    const rows = customers.map(c => [
      c.name || '',
      c.phone || '',
      c.balance ?? 0,
      c.lastTransaction || '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `kiranascan_balances_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset demo
  const handleReset = () => {
    store.resetToDemo();
    setShowResetConfirm(false);
  };

  // Delete all
  const handleDeleteAll = () => {
    if (deleteText === 'DELETE') {
      store.deleteAllData();
      setShowDeleteConfirm(false);
      setDeleteText('');
    }
  };

  const queuedCount = syncQueue.filter(e => e.status === 'QUEUED_OFFLINE').length;

  return (
    <div className="space-y-4">

      {/* ===== SECTION 0: SHOP NAME / DUKAN PROFILE ===== */}
      <section className="bg-white dark:bg-[#12151C] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#111315] dark:bg-[#C8F53B]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Dukan Profile & Shop Name (दुकान का नाम)
            </h2>
          </div>
          {shopNameSaved && (
            <span className="text-xs text-emerald-600 dark:text-[#C8F53B] font-bold flex items-center gap-1">
              <Check size={14} /> Saved!
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
          This name appears on customer WhatsApp slips, voice soundbox, and header.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={shopNameInput}
            onChange={e => {
              setShopNameInput(e.target.value);
              setShopNameSaved(false);
            }}
            placeholder="e.g. Gupta Kirana & General Store"
            className="flex-1 px-3.5 py-2.5 text-sm border rounded-2xl bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#C8F53B]"
          />
          <button
            onClick={() => {
              if (shopNameInput.trim()) {
                store.updateShopName(shopNameInput.trim());
                setShopNameSaved(true);
                setTimeout(() => setShopNameSaved(false), 2500);
              }
            }}
            className="px-4 py-2.5 bg-[#111315] dark:bg-[#C8F53B] text-[#C8F53B] dark:text-[#111315] rounded-full text-xs font-extrabold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Save size={14} /> Save Name
          </button>
        </div>
      </section>

      {/* ===== SECTION 1: SHOP CATALOGUE MANAGER ===== */}
      <section className="bg-white dark:bg-[#12151C] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#111315] dark:bg-[#C8F53B]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'hi' ? 'दुकान कैटलॉग व भाव' : 'Shop Catalogue & Rates'}
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 tabular-nums">
              {filtered.length} items
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#111315] dark:bg-[#C8F53B] text-[#C8F53B] dark:text-[#111315] rounded-full font-bold px-3.5 py-1.5 text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus size={14} /> {lang === 'hi' ? 'नया सामान' : 'Add Item'}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'hi' ? 'सामान या उपनाम खोजें...' : 'Search items by name or alias...'}
            className="w-full pl-9 pr-8 py-2.5 text-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C8F53B]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Add New Item Inline Form */}
        {showAddForm && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/15 p-4 bg-slate-50 dark:bg-[#181C25] space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Package size={14} className="text-[#111315] dark:text-[#C8F53B]" /> Naya Item (Add Item)
              </h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Item name (e.g. Toor Dal, Namkeen)"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12151C] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
            />
            <input
              type="text"
              value={newItem.aliases}
              onChange={e => setNewItem({ ...newItem, aliases: e.target.value })}
              placeholder="Spoken Aliases (e.g. arhar, toor, dal)"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12151C] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Unit</label>
                <select
                  value={newItem.unit}
                  onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12151C] text-slate-900 dark:text-white focus:outline-none"
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Base Rate (₹)</label>
                <input
                  type="number"
                  value={newItem.rate}
                  onChange={e => setNewItem({ ...newItem, rate: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#12151C] text-slate-900 dark:text-white font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-2 rounded-xl bg-white dark:bg-[#12151C] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
              <input
                type="checkbox"
                checked={newItem.isMultiBrand}
                onChange={e => setNewItem({ ...newItem, isMultiBrand: e.target.checked })}
                className="accent-black dark:accent-[#C8F53B] w-4 h-4 rounded"
              />
              Multi-Brand Item (अलग-अलग ब्रांड व कीमतें हैं)
            </label>

            {/* Brand Manager for New Item */}
            {newItem.isMultiBrand && (
              <div className="bg-white dark:bg-[#12151C] p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Tag size={12} className="text-[#111315] dark:text-[#C8F53B]" /> Add Brands &amp; Rates
                  </span>
                  <span className="text-[10px] text-slate-400">e.g. Tata, GoodDay</span>
                </div>
                {newItemVariants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.brand}
                      onChange={e => {
                        const arr = [...newItemVariants];
                        arr[i].brand = e.target.value;
                        setNewItemVariants(arr);
                      }}
                      placeholder={`Brand ${i + 1} (e.g. Tata, Local)`}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white focus:outline-none"
                    />
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        value={v.price}
                        onChange={e => {
                          const arr = [...newItemVariants];
                          arr[i].price = e.target.value;
                          setNewItemVariants(arr);
                        }}
                        placeholder="Rate"
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white font-bold tabular-nums focus:outline-none"
                      />
                    </div>
                    {newItemVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewItemVariants(newItemVariants.filter((_, idx) => idx !== i))}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setNewItemVariants([...newItemVariants, { brand: '', price: '' }])}
                  className="text-xs font-semibold text-slate-800 dark:text-[#C8F53B] hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                >
                  <Plus size={13} /> + Add Another Brand
                </button>
              </div>
            )}

            <button
              onClick={handleAddItem}
              disabled={!newItem.name.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-extrabold text-[#111315] bg-[#C8F53B] hover:bg-[#b8e62b] disabled:opacity-40 shadow-sm transition-all cursor-pointer"
            >
              <Save size={15} /> Save Item to Catalogue
            </button>
          </div>
        )}

        {/* Catalogue List */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-0.5">
          {filtered.map(item => {
            const isExpanded = expandedItemId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#181C25]/50 overflow-hidden shadow-xs transition-all"
              >
                {/* Item Row Header */}
                <button
                  onClick={() => handleExpand(item)}
                  className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-100/60 dark:hover:bg-[#181C25] transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isExpanded
                        ? <ChevronDown size={14} className="text-slate-400" />
                        : <ChevronRight size={14} className="text-slate-400" />}
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</span>
                      {item.isMultiBrand && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          Multi-Brand
                        </span>
                      )}
                    </div>
                    {item.aliases?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
                        {item.aliases.map((alias, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium">
                            {alias}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-sm font-extrabold text-[#111315] dark:text-[#C8F53B] tabular-nums">
                      ₹{item.rate}<span className="text-xs font-normal text-slate-400">/{item.unit}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded Edit Form */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-200/80 dark:border-white/10 pt-3.5 space-y-3 bg-white dark:bg-[#12151C]">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                          Base Rate (₹ / {item.unit})
                        </label>
                        <input
                          type="number"
                          value={editRate}
                          onChange={e => setEditRate(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-bold tabular-nums border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                          Aliases (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={editAliases}
                          onChange={e => setEditAliases(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
                          placeholder="e.g. aata, gehun"
                        />
                      </div>
                    </div>

                    {/* Multi-brand / Variant Manager */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Tag size={13} className="text-[#111315] dark:text-[#C8F53B]" />
                          Brands &amp; Variant Rates
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditIsMultiBrand(!editIsMultiBrand)}
                          className="text-[11px] text-slate-800 dark:text-[#C8F53B] font-bold hover:underline cursor-pointer"
                        >
                          {editIsMultiBrand || editVariants.length > 0 ? '✓ Multi-Brand Enabled' : '+ Enable Multi-Brand'}
                        </button>
                      </div>

                      {/* Existing Variants list */}
                      {editVariants.length > 0 ? (
                        <div className="space-y-1.5 mb-2.5">
                          {editVariants.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-[#181C25] p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
                              <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Brand</span>
                                <input
                                  type="text"
                                  value={v.brand}
                                  onChange={e => handleUpdateVariantBrand(i, e.target.value)}
                                  className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-[#12151C] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                                  placeholder="Brand name"
                                />
                              </div>
                              <div className="w-24">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Rate (₹)</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    value={v.price}
                                    onChange={e => handleUpdateVariantPrice(i, e.target.value)}
                                    className="w-full text-xs px-2 py-1.5 bg-white dark:bg-[#12151C] border border-slate-200 dark:border-white/10 rounded-lg font-bold tabular-nums text-[#111315] dark:text-[#C8F53B] focus:outline-none"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(i)}
                                className="text-slate-400 hover:text-rose-500 p-1.5 mt-3.5 rounded-lg transition-colors cursor-pointer"
                                title="Remove Brand"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic mb-2">No separate brands. Fixed rate: ₹{editRate}/{item.unit}</p>
                      )}

                      {/* Add new brand inline */}
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#181C25] p-2 rounded-xl border border-slate-200 dark:border-white/10">
                        <input
                          type="text"
                          value={newBrandName}
                          onChange={e => setNewBrandName(e.target.value)}
                          placeholder="Brand Name (e.g. Lifebuoy, Tata)"
                          className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-[#12151C] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-xs text-slate-400">₹</span>
                          <input
                            type="number"
                            value={newBrandPrice}
                            onChange={e => setNewBrandPrice(e.target.value)}
                            placeholder="Price"
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-[#12151C] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg font-bold tabular-nums focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddBrandToExisting}
                          disabled={!newBrandName.trim()}
                          className="px-3 py-1.5 text-xs font-bold bg-[#111315] dark:bg-[#C8F53B] text-[#C8F53B] dark:text-[#111315] rounded-lg shrink-0 disabled:opacity-40 cursor-pointer"
                        >
                          + Add Brand
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[#111315] bg-[#C8F53B] hover:bg-[#b8e62b] text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                      >
                        <Save size={14} /> Save Changes
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.name}" from catalogue?`)) {
                            store.deleteCatalogueItem(item.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 px-3 py-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} /> Delete Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-center py-6 text-slate-400">
              {searchQuery ? 'No items match your search.' : 'No catalogue items yet.'}
            </p>
          )}
        </div>
      </section>

      {/* ===== SECTION 2: SYNC QUEUE INSPECTOR ===== */}
      <section className="bg-white dark:bg-[#12151C] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#111315] dark:bg-[#C8F53B]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Duplicate-Safe Offline Sync Queue
            </h2>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            queuedCount === 0
              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
          }`}>
            {queuedCount === 0 ? 'All Synced ✓' : `${queuedCount} Queued Offline`}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Each transaction gets a unique <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">TXN_UUID</span> + <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">Idempotency Key</span> for duplicate-safe sync.
        </p>

        {/* Sync Queue Table */}
        {syncQueue.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#12151C] border-b border-slate-200 dark:border-white/10 text-[10px] uppercase font-bold text-slate-400">
                  <th className="text-left px-3.5 py-2.5">TXN_UUID</th>
                  <th className="text-left px-3.5 py-2.5">Idempotency Key</th>
                  <th className="text-left px-3.5 py-2.5">Timestamp</th>
                  <th className="text-left px-3.5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {syncQueue.map((entry, i) => (
                  <tr key={entry.txnId || i}>
                    <td className="px-3.5 py-2 font-mono text-[11px] text-slate-900 dark:text-white font-semibold">
                      {entry.txnId || '—'}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.idempotencyKey
                        ? entry.idempotencyKey.length > 12
                          ? entry.idempotencyKey.slice(0, 12) + '…'
                          : entry.idempotencyKey
                        : '—'}
                    </td>
                    <td className="px-3.5 py-2 text-slate-500 dark:text-slate-400">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td className="px-3.5 py-2">
                      {entry.status === 'SYNCED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                          <Check size={10} /> SYNCED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                          <WifiOff size={10} /> QUEUED_OFFLINE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5 text-xs rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181C25] text-slate-400">
            <Database size={18} className="mx-auto mb-1 opacity-40" />
            Sync queue is empty.
          </div>
        )}

        {/* Manual Sync Button */}
        {queuedCount > 0 && isOnline && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[#111315] text-xs font-extrabold transition-all disabled:opacity-60 bg-[#C8F53B] hover:bg-[#b8e62b] shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing
              ? 'Syncing...'
              : `Trigger Manual Batch Sync (${queuedCount} queued)`}
          </button>
        )}
      </section>

      {/* ===== SECTION 3: GEMINI AI KEY ===== */}
      <section className="bg-white dark:bg-[#12151C] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#111315] dark:bg-[#C8F53B]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Gemini Vision AI Settings
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" /> Cloud Key Active
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Offline Hinglish voice billing runs locally. Gemini Vision powers handwritten bill &amp; ledger scanning.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showGeminiKey ? 'text' : 'password'}
              value={geminiKey}
              onChange={e => { setGeminiKey(e.target.value); setGeminiSaved(false); }}
              placeholder="Custom Gemini API key (optional)"
              className="w-full pl-8 pr-16 py-2.5 text-xs border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#C8F53B]"
            />
            <button
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-white/10 cursor-pointer"
            >
              {showGeminiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            onClick={handleSaveGeminiKey}
            className="px-4 py-2.5 rounded-2xl bg-[#111315] dark:bg-[#C8F53B] text-[#C8F53B] dark:text-[#111315] text-xs font-extrabold shrink-0 shadow-sm cursor-pointer"
          >
            <Save size={14} />
          </button>
        </div>

        {geminiSaved && geminiKey.trim() && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
            <Check size={14} /> Custom Gemini Key Connected
          </div>
        )}
      </section>

      {/* ===== SECTION 4: DATA PRIVACY & PORTABILITY ===== */}
      <section className="bg-white dark:bg-[#12151C] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#111315] dark:bg-[#C8F53B]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Data Privacy &amp; Portability
          </h2>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-center transition-colors bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white hover:border-slate-300 cursor-pointer"
            >
              <Download size={14} className="text-[#111315] dark:text-[#C8F53B] shrink-0" />
              <span className="truncate">Export JSON</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-center transition-colors bg-slate-50 dark:bg-[#181C25] text-slate-900 dark:text-white hover:border-slate-300 cursor-pointer"
            >
              <Download size={14} className="text-[#111315] dark:text-[#C8F53B] shrink-0" />
              <span className="truncate">Export CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Reset Demo */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border border-amber-500/20 text-xs font-semibold text-center transition-colors bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/15 cursor-pointer"
            >
              <RefreshCw size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">Restore Sample Data</span>
            </button>

            {/* Delete All */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border border-rose-500/20 text-xs font-semibold text-center transition-colors bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15 cursor-pointer"
            >
              <Trash2 size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="truncate">Delete All Shop Data</span>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
          All data stored locally on your device. Zero data sent to any server without your explicit consent.
        </p>
      </section>

      {/* ===== RESET CONFIRMATION MODAL ===== */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
          <div className="bg-white dark:bg-[#12151C] rounded-3xl border border-slate-200 dark:border-white/10 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Restore Default Sample Data?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This will restore default sample customers, catalogue items, and hisab entries. Your current data will be reset.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-full text-[#111315] text-xs font-extrabold bg-[#C8F53B] hover:bg-[#b8e62b] shadow-sm cursor-pointer"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
          <div className="bg-white dark:bg-[#12151C] rounded-3xl border border-rose-500/50 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 size={20} />
              <h3 className="text-base font-bold">Delete All Data?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This will <strong>permanently delete</strong> all your shop data including customers, transactions, and catalogue.
              This action cannot be undone.
            </p>
            <div>
              <p className="text-xs font-medium mb-1.5 text-slate-900 dark:text-white">
                Type <span className="font-mono font-bold text-rose-600">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={e => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-sm font-mono border-2 border-rose-300 dark:border-rose-900/60 rounded-xl focus:outline-none bg-slate-50 dark:bg-[#181C25] text-rose-600 font-bold"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteText !== 'DELETE'}
                className="px-4 py-2 rounded-full text-white text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-30 shadow-sm cursor-pointer"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
