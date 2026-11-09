import { useState } from 'react';
import {
  Search, Plus, Edit3, Save, Trash2, Package, RefreshCw, Shield,
  Download, Database, Key, Globe, X, Check, ChevronDown, ChevronRight,
  ArrowUpDown, Wifi, WifiOff, Tag
} from 'lucide-react';

const COLORS = {
  green: '#1B7A43',
  greenLight: '#E8F5EE',
  amber: '#E68A00',
  amberBg: '#FFF4E0',
  amberText: '#B36B00',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  cardBorder: '#E6DFD3',
  text: '#1E242B',
  secondary: '#5A6573',
};

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

  // Gemini key state
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('kiranascan_gemini_key') || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiSaved, setGeminiSaved] = useState(() => !!localStorage.getItem('kiranascan_gemini_key'));

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
    <div className="space-y-6 pb-8">
      {/* ===== SECTION 0: SHOP NAME / DUKAN PROFILE ===== */}
      <section className="bg-white dark:bg-[#16202A] rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-[#1B7A43] dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Dukan Profile & Shop Name (दुकान का नाम)
            </h2>
          </div>
          {shopNameSaved && (
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Check size={14} /> Saved!
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
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
            className="flex-1 px-3 py-2 text-sm border rounded-xl bg-white dark:bg-[#11181F] text-slate-900 dark:text-white border-[#E2D9C8] dark:border-[#2A3644] focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
          />
          <button
            onClick={() => {
              if (shopNameInput.trim()) {
                store.updateShopName(shopNameInput.trim());
                setShopNameSaved(true);
                setTimeout(() => setShopNameSaved(false), 2500);
              }
            }}
            className="px-4 py-2 bg-[#1B7A43] hover:bg-[#145E33] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <Save size={14} /> Save Name
          </button>
        </div>
      </section>

      {/* ===== SECTION 1: SHOP CATALOGUE MANAGER ===== */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package size={20} className="text-[#1B7A43] dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {lang === 'hi' ? 'दुकान कैटलॉग' : 'Dukan Catalogue'}
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            {filtered.length} items
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'hi' ? 'Item khojein...' : 'Search items by name or alias...'}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Catalogue List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filtered.map(item => {
            const isExpanded = expandedItemId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A] overflow-hidden shadow-sm"
              >
                {/* Item Header */}
                <button
                  onClick={() => handleExpand(item)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50/60 dark:hover:bg-[#1E293B]/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isExpanded
                        ? <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
                        : <ChevronRight size={14} className="text-slate-500 dark:text-slate-400" />}
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{item.name}</span>
                      {item.isMultiBrand && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          Multi-Brand
                        </span>
                      )}
                    </div>
                    {item.aliases?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 ml-5">
                        {item.aliases.map((alias, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300">
                            {alias}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{item.rate}/{item.unit}</div>
                  </div>
                </button>

                {/* Expanded Edit Form */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-[#E2D9C8] dark:border-[#2A3644] pt-3 space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Base Rate (₹ / {item.unit})</label>
                        <input
                          type="number"
                          value={editRate}
                          onChange={e => setEditRate(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-[#E2D9C8] dark:border-[#2A3644] rounded-lg bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Aliases (comma-separated)</label>
                        <input
                          type="text"
                          value={editAliases}
                          onChange={e => setEditAliases(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-[#E2D9C8] dark:border-[#2A3644] rounded-lg bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                          placeholder="e.g. aata, gehun"
                        />
                      </div>
                    </div>

                    {/* Multi-brand / Variant Manager */}
                    <div className="pt-2 border-t border-slate-100 dark:border-[#2A3644]">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <Tag size={13} className="text-amber-600" />
                          Brands & Variant Rates (ब्रांड और कीमतें)
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditIsMultiBrand(!editIsMultiBrand)}
                          className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                        >
                          {editIsMultiBrand || editVariants.length > 0 ? '✓ Multi-Brand Enabled' : '+ Enable Multi-Brand'}
                        </button>
                      </div>

                      {/* Existing Variants list */}
                      {editVariants.length > 0 ? (
                        <div className="space-y-1.5 mb-2.5">
                          {editVariants.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-[#11181F] p-2 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644]">
                              <div className="flex-1">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Brand Name</span>
                                <input
                                  type="text"
                                  value={v.brand}
                                  onChange={e => handleUpdateVariantBrand(i, e.target.value)}
                                  className="w-full text-xs px-2 py-1 bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] text-slate-900 dark:text-white rounded focus:outline-none"
                                  placeholder="Brand name"
                                />
                              </div>
                              <div className="w-24">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Rate (₹)</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-500">₹</span>
                                  <input
                                    type="number"
                                    value={v.price}
                                    onChange={e => handleUpdateVariantPrice(i, e.target.value)}
                                    className="w-full text-xs px-2 py-1 bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] rounded font-semibold text-emerald-700 dark:text-emerald-400 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(i)}
                                className="text-red-500 hover:text-red-700 p-1.5 mt-3 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="Remove Brand"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">No separate brands. Fixed rate: ₹{editRate}/{item.unit}</p>
                      )}

                      {/* Add new brand inline */}
                      <div className="flex items-center gap-2 bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                        <input
                          type="text"
                          value={newBrandName}
                          onChange={e => setNewBrandName(e.target.value)}
                          placeholder="Brand Name (e.g. Lifebuoy, Tata)"
                          className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] text-slate-900 dark:text-white rounded-md focus:outline-none"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-xs text-slate-500">₹</span>
                          <input
                            type="number"
                            value={newBrandPrice}
                            onChange={e => setNewBrandPrice(e.target.value)}
                            placeholder="Price"
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] text-slate-900 dark:text-white rounded-md focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddBrandToExisting}
                          disabled={!newBrandName.trim()}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#1B7A43] text-white rounded-md hover:bg-[#145E33] shrink-0 disabled:opacity-40"
                        >
                          + Add Brand
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#2A3644]">
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-colors bg-[#1B7A43] hover:bg-[#145E33]"
                      >
                        <Save size={14} /> Save Changes
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.name}" from catalogue?`)) {
                            store.deleteCatalogueItem(item.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 px-2.5 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
            <p className="text-sm text-center py-4 text-slate-500 dark:text-slate-400">
              {searchQuery ? 'No items match your search.' : 'No catalogue items yet.'}
            </p>
          )}
        </div>

        {/* Add New Item */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-[#1B7A43] text-[#1B7A43] dark:text-emerald-400 text-sm font-semibold transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <Plus size={16} /> {lang === 'hi' ? 'नया आइटम जोड़ें' : 'Add New Item'}
          </button>
        ) : (
          <div className="mt-3 rounded-2xl border-2 border-[#1B7A43] p-4 bg-white dark:bg-[#16202A] space-y-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Package size={16} className="text-[#1B7A43] dark:text-emerald-400" /> New Item (नया सामान)
              </h3>
              <button onClick={() => setShowAddForm(false)}>
                <X size={16} className="text-slate-500 hover:text-slate-700" />
              </button>
            </div>
            <input
              type="text"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Item name (e.g. Toor Dal, Namkeen)"
              className="w-full px-3 py-2 text-sm border border-[#E2D9C8] dark:border-[#2A3644] rounded-xl bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
            />
            <input
              type="text"
              value={newItem.aliases}
              onChange={e => setNewItem({ ...newItem, aliases: e.target.value })}
              placeholder="Spoken Aliases (e.g. arhar, toor, dal)"
              className="w-full px-3 py-2 text-sm border border-[#E2D9C8] dark:border-[#2A3644] rounded-xl bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Unit (मात्रा प्रकार)</label>
                <select
                  value={newItem.unit}
                  onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-2.5 py-2 text-sm border border-[#E2D9C8] dark:border-[#2A3644] rounded-xl bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none"
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Base Rate (₹)</label>
                <input
                  type="number"
                  value={newItem.rate}
                  onChange={e => setNewItem({ ...newItem, rate: e.target.value })}
                  placeholder="0"
                  className="w-full px-2.5 py-2 text-sm border border-[#E2D9C8] dark:border-[#2A3644] rounded-xl bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-2.5 rounded-xl bg-slate-50 dark:bg-[#11181F] border border-[#E2D9C8] dark:border-[#2A3644] text-slate-900 dark:text-white">
              <input
                type="checkbox"
                checked={newItem.isMultiBrand}
                onChange={e => setNewItem({ ...newItem, isMultiBrand: e.target.checked })}
                className="accent-green-700 w-4 h-4 rounded"
              />
              Multi-Brand Item (कई अलग-अलग ब्रांड उपलब्ध हैं)
            </label>

            {/* Merchant-friendly Brand Manager for New Item */}
            {newItem.isMultiBrand && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                    <Tag size={12} /> Add Brands & Rates (ब्रांड और भाव)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">e.g. Tata, Local, 10 Mini</span>
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
                      placeholder={`Brand ${i + 1} (e.g. Tata, GoodDay)`}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-[#E2D9C8] dark:border-[#2A3644] rounded-lg bg-white dark:bg-[#16202A] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                    />
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-xs text-slate-500">₹</span>
                      <input
                        type="number"
                        value={v.price}
                        onChange={e => {
                          const arr = [...newItemVariants];
                          arr[i].price = e.target.value;
                          setNewItemVariants(arr);
                        }}
                        placeholder="Rate"
                        className="w-full px-2 py-1.5 text-xs border border-[#E2D9C8] dark:border-[#2A3644] rounded-lg bg-white dark:bg-[#16202A] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                      />
                    </div>
                    {newItemVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewItemVariants(newItemVariants.filter((_, idx) => idx !== i))}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setNewItemVariants([...newItemVariants, { brand: '', price: '' }])}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1"
                >
                  <Plus size={13} /> + Add Another Brand (नया ब्रांड जोड़ें)
                </button>
              </div>
            )}

            <button
              onClick={handleAddItem}
              disabled={!newItem.name.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-bold bg-[#1B7A43] hover:bg-[#145E33] disabled:opacity-40 shadow-sm transition-all"
            >
              <Save size={16} /> Save Item to Catalogue
            </button>
          </div>
        )}
      </section>

      {/* ===== SECTION 2: SYNC QUEUE INSPECTOR ===== */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw size={18} className="text-[#E68A00] dark:text-amber-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Duplicate-Safe Offline Sync Queue
          </h2>
        </div>
        <p className="text-xs mb-3 text-slate-600 dark:text-slate-400">
          Each transaction gets a unique <span className="font-mono font-semibold">TXN_UUID</span> + <span className="font-mono font-semibold">Idempotency Key</span> for duplicate-safe sync.
        </p>

        {/* Architecture Flow Diagram */}
        <div className="rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] p-3 mb-3 overflow-x-auto bg-[#F9F7F4] dark:bg-[#11181F]">
          <div className="flex items-center gap-0 text-[11px] font-medium min-w-[520px] text-slate-800 dark:text-slate-200">
            {[
              { label: 'Voice Input', icon: '🎤' },
              { label: 'Parser', icon: '⚙️' },
              { label: 'Draft', icon: '📝' },
              { label: 'Confirm', icon: '✅' },
              { label: 'IndexedDB', icon: '💾' },
              { label: 'Sync Queue', icon: '📤' },
              { label: 'Server', icon: '☁️' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center px-1.5">
                  <span className="text-base">{step.icon}</span>
                  <span className="whitespace-nowrap mt-0.5">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-base mx-0.5 text-[#1B7A43] dark:text-emerald-400">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sync Queue Table */}
        {syncQueue.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F7F5F0] dark:bg-[#1E293B] border-b border-[#E2D9C8] dark:border-[#2A3644]">
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300">TXN_UUID</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300">Idempotency Key</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300">Timestamp</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {syncQueue.map((entry, i) => (
                  <tr key={entry.txnId || i} className="border-t border-[#E2D9C8] dark:border-[#2A3644]">
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-900 dark:text-white font-semibold">
                      {entry.txnId || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {entry.idempotencyKey
                        ? entry.idempotencyKey.length > 12
                          ? entry.idempotencyKey.slice(0, 12) + '…'
                          : entry.idempotencyKey
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {entry.status === 'SYNCED' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          <Check size={10} /> SYNCED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
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
          <div className="text-center py-4 text-sm rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#16202A] text-slate-500 dark:text-slate-400">
            <Database size={20} className="mx-auto mb-1 opacity-40" />
            Sync queue is empty.
          </div>
        )}

        {/* Manual Sync Button */}
        {queuedCount > 0 && isOnline && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60 bg-[#E68A00] hover:bg-[#B36B00] shadow-sm"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing
              ? 'Syncing...'
              : `Trigger Manual Batch Sync (${queuedCount} queued)`}
          </button>
        )}
      </section>

      {/* ===== SECTION 3: GEMINI AI KEY ===== */}
      <section>
        <div className="rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] p-4 bg-white dark:bg-[#16202A] shadow-sm">
          <h2 className="text-base font-bold mb-1 text-slate-900 dark:text-white">
            Optional Gemini AI Enhancement
          </h2>
          <p className="text-xs mb-3 leading-relaxed text-slate-600 dark:text-slate-400">
            The built-in <strong>Position-Independent Hinglish NLP Engine</strong> works 100% offline with zero API keys.
            Optionally add a Gemini API key for LLM-powered parsing fallback.
          </p>

          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Key size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => { setGeminiKey(e.target.value); setGeminiSaved(false); }}
                placeholder="Gemini API Key"
                className="w-full pl-8 pr-16 py-2 text-sm border border-[#E2D9C8] dark:border-[#2A3644] rounded-xl bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
              />
              <button
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#1E293B]"
              >
                {showGeminiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              onClick={handleSaveGeminiKey}
              className="px-3.5 py-2 rounded-xl text-white text-sm font-medium shrink-0 bg-[#1B7A43] hover:bg-[#145E33] shadow-sm"
            >
              <Save size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            {geminiSaved && geminiKey ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check size={14} /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Globe size={14} /> Not configured (optional)
              </span>
            )}
          </div>

          <p className="text-[10px] mt-2 italic text-slate-500 dark:text-slate-400">
            Roadmap: Gemini 1.5 Flash for complex multi-item disambiguation
          </p>
        </div>
      </section>

      {/* ===== SECTION 4: DATA PRIVACY & PORTABILITY ===== */}
      <section>
        <div className="rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] p-4 bg-white dark:bg-[#16202A] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-[#1B7A43] dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Data Privacy & Portability
            </h2>
          </div>

          <div className="grid gap-2">
            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] text-sm font-medium text-left transition-colors bg-white dark:bg-[#11181F] text-slate-900 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Download size={16} className="text-[#1B7A43] dark:text-emerald-400" />
              <span>Export Full Shop Ledger (JSON)</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] text-sm font-medium text-left transition-colors bg-white dark:bg-[#11181F] text-slate-900 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Download size={16} className="text-[#1B7A43] dark:text-emerald-400" />
              <span>Export as CSV</span>
            </button>

            {/* Reset Demo */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 text-sm font-medium text-left transition-colors bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
            >
              <RefreshCw size={16} className="text-[#E68A00] dark:text-amber-400" />
              <span>Restore Default Sample Data</span>
            </button>

            {/* Delete All */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 text-sm font-medium text-left transition-colors bg-red-50/60 dark:bg-red-950/30 text-red-600 dark:text-red-300 hover:bg-red-100"
            >
              <Trash2 size={16} className="text-red-600 dark:text-red-400" />
              <span>Delete All Shop Data</span>
            </button>
          </div>

          <p className="text-[10px] mt-3 leading-relaxed text-slate-500 dark:text-slate-400">
            All data stored locally on your device. Zero data sent to any server without your explicit consent.
          </p>
        </div>
      </section>

      {/* ===== RESET CONFIRMATION MODAL ===== */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
          <div className="bg-white dark:bg-[#16202A] rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">Restore Default Sample Data?</h3>
            <p className="text-sm mb-4 text-slate-600 dark:text-slate-400">
              This will restore default sample customers, catalogue items, and hisab entries. Your current data will be reset.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-[#E68A00] hover:bg-[#B36B00] shadow-sm"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
          <div className="bg-white dark:bg-[#16202A] rounded-2xl border-2 border-red-500 p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 size={20} className="text-red-600" />
              <h3 className="text-base font-bold text-red-600">Delete All Data?</h3>
            </div>
            <p className="text-sm mb-3 text-slate-600 dark:text-slate-400">
              This will <strong>permanently delete</strong> all your shop data including customers, transactions, and catalogue.
              This action cannot be undone.
            </p>
            <p className="text-xs font-medium mb-2 text-slate-900 dark:text-white">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-sm font-mono border-2 border-red-300 rounded-xl mb-3 focus:outline-none bg-white dark:bg-[#11181F] text-red-600 font-bold"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                className="px-4 py-2 rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteText !== 'DELETE'}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-30 shadow-sm"
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
