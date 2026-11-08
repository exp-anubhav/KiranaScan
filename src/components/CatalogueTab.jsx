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
      <section className="bg-white dark:bg-[#1E252D] rounded-xl border p-4 shadow-sm" style={{ borderColor: COLORS.cardBorder }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Tag size={18} style={{ color: COLORS.green }} />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              🏪 Dukan Profile & Shop Name (दुकान का नाम)
            </h2>
          </div>
          {shopNameSaved && (
            <span className="text-xs text-green-700 dark:text-green-400 font-semibold flex items-center gap-1">
              <Check size={14} /> Saved!
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
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
            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-[#151B22] text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
          />
          <button
            onClick={() => {
              if (shopNameInput.trim()) {
                store.updateShopName(shopNameInput.trim());
                setShopNameSaved(true);
                setTimeout(() => setShopNameSaved(false), 2500);
              }
            }}
            className="px-4 py-2 bg-[#1B7A43] hover:bg-[#145E33] text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <Save size={14} /> Save Name
          </button>
        </div>
      </section>

      {/* ===== SECTION 1: SHOP CATALOGUE MANAGER ===== */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package size={20} style={{ color: COLORS.green }} />
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>
            {lang === 'hi' ? 'दुकान कैटलॉग' : 'Dukan Catalogue'}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: COLORS.greenLight, color: COLORS.green }}>
            {filtered.length} items
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.secondary }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'hi' ? 'Item khojein...' : 'Search items by name or alias...'}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.cardBorder, color: COLORS.text }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} style={{ color: COLORS.secondary }} />
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
                className="rounded-lg border bg-white"
                style={{ borderColor: COLORS.cardBorder }}
              >
                {/* Item Header */}
                <button
                  onClick={() => handleExpand(item)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isExpanded
                        ? <ChevronDown size={14} style={{ color: COLORS.secondary }} />
                        : <ChevronRight size={14} style={{ color: COLORS.secondary }} />}
                      <span className="font-semibold text-sm" style={{ color: COLORS.text }}>{item.name}</span>
                      {item.isMultiBrand && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: COLORS.amberBg, color: COLORS.amberText }}>
                          Multi-Brand
                        </span>
                      )}
                    </div>
                    {item.aliases?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 ml-5">
                        {item.aliases.map((alias, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {alias}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm font-bold" style={{ color: COLORS.green }}>₹{item.rate}/{item.unit}</div>
                  </div>
                </button>

                {/* Expanded Edit Form */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t pt-3 space-y-3" style={{ borderColor: COLORS.cardBorder }}>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] font-medium" style={{ color: COLORS.secondary }}>Base Rate (₹ / {item.unit})</label>
                        <input
                          type="number"
                          value={editRate}
                          onChange={e => setEditRate(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1"
                          style={{ borderColor: COLORS.cardBorder }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] font-medium" style={{ color: COLORS.secondary }}>Aliases (comma-separated)</label>
                        <input
                          type="text"
                          value={editAliases}
                          onChange={e => setEditAliases(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1"
                          style={{ borderColor: COLORS.cardBorder }}
                          placeholder="e.g. aata, gehun"
                        />
                      </div>
                    </div>

                    {/* Multi-brand / Variant Manager */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <Tag size={13} className="text-amber-600" />
                          Brands & Variant Rates (ब्रांड और कीमतें)
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditIsMultiBrand(!editIsMultiBrand)}
                          className="text-[11px] text-green-700 font-medium hover:underline"
                        >
                          {editIsMultiBrand || editVariants.length > 0 ? '✓ Multi-Brand Enabled' : '+ Enable Multi-Brand'}
                        </button>
                      </div>

                      {/* Existing Variants list */}
                      {editVariants.length > 0 ? (
                        <div className="space-y-1.5 mb-2.5">
                          {editVariants.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                              <div className="flex-1">
                                <span className="text-[10px] text-gray-400 block">Brand Name</span>
                                <input
                                  type="text"
                                  value={v.brand}
                                  onChange={e => handleUpdateVariantBrand(i, e.target.value)}
                                  className="w-full text-xs px-2 py-1 bg-white border border-gray-200 rounded focus:outline-none"
                                  placeholder="Brand name"
                                />
                              </div>
                              <div className="w-24">
                                <span className="text-[10px] text-gray-400 block">Rate (₹)</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    value={v.price}
                                    onChange={e => handleUpdateVariantPrice(i, e.target.value)}
                                    className="w-full text-xs px-2 py-1 bg-white border border-gray-200 rounded font-semibold text-green-700 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(i)}
                                className="text-red-500 hover:text-red-700 p-1.5 mt-3 rounded hover:bg-red-50 transition-colors"
                                title="Remove Brand"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic mb-2">No separate brands. Fixed rate: ₹{editRate}/{item.unit}</p>
                      )}

                      {/* Add new brand inline */}
                      <div className="flex items-center gap-2 bg-green-50/60 p-2 rounded-md border border-green-200">
                        <input
                          type="text"
                          value={newBrandName}
                          onChange={e => setNewBrandName(e.target.value)}
                          placeholder="Brand Name (e.g. Lifebuoy, Tata)"
                          className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded focus:outline-none"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-xs text-gray-500">₹</span>
                          <input
                            type="number"
                            value={newBrandPrice}
                            onChange={e => setNewBrandPrice(e.target.value)}
                            placeholder="Price"
                            className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddBrandToExisting}
                          disabled={!newBrandName.trim()}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#1B7A43] text-white rounded hover:bg-[#145E33] shrink-0 disabled:opacity-40"
                        >
                          + Add Brand
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-white text-xs font-bold transition-colors"
                        style={{ background: COLORS.green }}
                      >
                        <Save size={14} /> Save Changes
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.name}" from catalogue?`)) {
                            store.deleteCatalogueItem(item.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2.5 py-1 rounded hover:bg-red-50 transition-colors"
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
            <p className="text-sm text-center py-4" style={{ color: COLORS.secondary }}>
              {searchQuery ? 'No items match your search.' : 'No catalogue items yet.'}
            </p>
          )}
        </div>

        {/* Add New Item */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed text-sm font-medium transition-colors hover:bg-green-50"
            style={{ borderColor: COLORS.green, color: COLORS.green }}
          >
            <Plus size={16} /> {lang === 'hi' ? 'नया आइटम जोड़ें' : '+ Add New Item'}
          </button>
        ) : (
          <div className="mt-3 rounded-xl border-2 p-4 bg-white space-y-3 shadow-sm" style={{ borderColor: COLORS.green }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: COLORS.text }}>
                <Package size={16} className="text-[#1B7A43]" /> New Item (नया सामान)
              </h3>
              <button onClick={() => setShowAddForm(false)}>
                <X size={16} style={{ color: COLORS.secondary }} />
              </button>
            </div>
            <input
              type="text"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Item name (e.g. Toor Dal, Namkeen)"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
              style={{ borderColor: COLORS.cardBorder }}
            />
            <input
              type="text"
              value={newItem.aliases}
              onChange={e => setNewItem({ ...newItem, aliases: e.target.value })}
              placeholder="Spoken Aliases (e.g. arhar, toor, dal)"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
              style={{ borderColor: COLORS.cardBorder }}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-medium" style={{ color: COLORS.secondary }}>Unit (मात्रा प्रकार)</label>
                <select
                  value={newItem.unit}
                  onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-2.5 py-2 text-sm border rounded-lg focus:outline-none bg-white"
                  style={{ borderColor: COLORS.cardBorder }}
                >
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-medium" style={{ color: COLORS.secondary }}>Base Rate (₹)</label>
                <input
                  type="number"
                  value={newItem.rate}
                  onChange={e => setNewItem({ ...newItem, rate: e.target.value })}
                  placeholder="0"
                  className="w-full px-2.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                  style={{ borderColor: COLORS.cardBorder }}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-2 rounded-lg bg-gray-50 border border-gray-200" style={{ color: COLORS.text }}>
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
              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <Tag size={12} /> Add Brands & Rates (ब्रांड और भाव)
                  </span>
                  <span className="text-[10px] text-gray-500">e.g. Tata, Local, 10 Mini</span>
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
                      className="flex-1 px-2.5 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-600"
                    />
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-xs text-gray-500">₹</span>
                      <input
                        type="number"
                        value={v.price}
                        onChange={e => {
                          const arr = [...newItemVariants];
                          arr[i].price = e.target.value;
                          setNewItemVariants(arr);
                        }}
                        placeholder="Rate"
                        className="w-full px-2 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-600"
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
                  className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 pt-1"
                >
                  <Plus size={13} /> + Add Another Brand (नया ब्रांड जोड़ें)
                </button>
              </div>
            )}

            <button
              onClick={handleAddItem}
              disabled={!newItem.name.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-sm font-bold disabled:opacity-40 shadow-sm transition-all"
              style={{ background: COLORS.green }}
            >
              <Save size={16} /> Save Item to Catalogue
            </button>
          </div>
        )}
      </section>

      {/* ===== SECTION 2: SYNC QUEUE INSPECTOR ===== */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw size={18} style={{ color: COLORS.amber }} />
          <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>
            🔄 Duplicate-Safe Offline Sync Queue
          </h2>
        </div>
        <p className="text-xs mb-3" style={{ color: COLORS.secondary }}>
          Each transaction gets a unique <span className="font-mono font-semibold">TXN_UUID</span> + <span className="font-mono font-semibold">Idempotency Key</span> for duplicate-safe sync.
        </p>

        {/* Architecture Flow Diagram */}
        <div className="rounded-lg border p-3 mb-3 overflow-x-auto" style={{ borderColor: COLORS.cardBorder, background: '#FAFAF8' }}>
          <div className="flex items-center gap-0 text-[11px] font-medium min-w-[520px]" style={{ color: COLORS.text }}>
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
                  <span className="text-base mx-0.5" style={{ color: COLORS.green }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sync Queue Table */}
        {syncQueue.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: COLORS.cardBorder }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#F7F5F0' }}>
                  <th className="text-left px-2 py-2 font-semibold" style={{ color: COLORS.secondary }}>TXN_UUID</th>
                  <th className="text-left px-2 py-2 font-semibold" style={{ color: COLORS.secondary }}>Idempotency Key</th>
                  <th className="text-left px-2 py-2 font-semibold" style={{ color: COLORS.secondary }}>Timestamp</th>
                  <th className="text-left px-2 py-2 font-semibold" style={{ color: COLORS.secondary }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {syncQueue.map((entry, i) => (
                  <tr key={entry.txnId || i} className="border-t" style={{ borderColor: COLORS.cardBorder }}>
                    <td className="px-2 py-1.5 font-mono text-[11px]" style={{ color: COLORS.text }}>
                      {entry.txnId || '—'}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px]" style={{ color: COLORS.secondary }}>
                      {entry.idempotencyKey
                        ? entry.idempotencyKey.length > 12
                          ? entry.idempotencyKey.slice(0, 12) + '…'
                          : entry.idempotencyKey
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5" style={{ color: COLORS.secondary }}>
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5">
                      {entry.status === 'SYNCED' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: COLORS.greenLight, color: COLORS.green }}>
                          <Check size={10} /> SYNCED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: COLORS.amberBg, color: COLORS.amberText }}>
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
          <div className="text-center py-4 text-sm rounded-lg border" style={{ borderColor: COLORS.cardBorder, color: COLORS.secondary }}>
            <Database size={20} className="mx-auto mb-1 opacity-40" />
            Sync queue is empty.
          </div>
        )}

        {/* Manual Sync Button */}
        {queuedCount > 0 && isOnline && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: COLORS.amber }}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing
              ? 'Syncing...'
              : `🔄 Trigger Manual Batch Sync (${queuedCount} queued)`}
          </button>
        )}
      </section>

      {/* ===== SECTION 3: GEMINI AI KEY ===== */}
      <section>
        <div className="rounded-lg border p-4 bg-white" style={{ borderColor: COLORS.cardBorder }}>
          <h2 className="text-base font-bold mb-1" style={{ color: COLORS.text }}>
            🤖 Optional Gemini AI Enhancement
          </h2>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: COLORS.secondary }}>
            The built-in <strong>Position-Independent Hinglish NLP Engine</strong> works 100% offline with zero API keys.
            Optionally add a Gemini API key for LLM-powered parsing fallback.
          </p>

          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Key size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: COLORS.secondary }} />
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => { setGeminiKey(e.target.value); setGeminiSaved(false); }}
                placeholder="Gemini API Key"
                className="w-full pl-8 pr-16 py-2 text-sm border rounded-md focus:outline-none focus:ring-1"
                style={{ borderColor: COLORS.cardBorder }}
              />
              <button
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium px-1.5 py-0.5 rounded"
                style={{ color: COLORS.secondary, background: '#F3F0EB' }}
              >
                {showGeminiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <button
              onClick={handleSaveGeminiKey}
              className="px-3 py-2 rounded-md text-white text-sm font-medium shrink-0"
              style={{ background: COLORS.green }}
            >
              <Save size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs" style={{ color: geminiSaved && geminiKey ? COLORS.green : COLORS.secondary }}>
            {geminiSaved && geminiKey ? (
              <>
                <Check size={14} /> Connected ✅
              </>
            ) : (
              <>
                <Globe size={14} /> Not configured (optional)
              </>
            )}
          </div>

          <p className="text-[10px] mt-2 italic" style={{ color: COLORS.secondary }}>
            Roadmap: Gemini 1.5 Flash for complex multi-item disambiguation
          </p>
        </div>
      </section>

      {/* ===== SECTION 4: DATA PRIVACY & PORTABILITY ===== */}
      <section>
        <div className="rounded-lg border p-4 bg-white" style={{ borderColor: COLORS.cardBorder }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} style={{ color: COLORS.green }} />
            <h2 className="text-base font-bold" style={{ color: COLORS.text }}>
              🛡️ Data Privacy & Portability
            </h2>
          </div>

          <div className="grid gap-2">
            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors hover:bg-green-50"
              style={{ borderColor: COLORS.cardBorder, color: COLORS.text }}
            >
              <Download size={16} style={{ color: COLORS.green }} />
              <span>📥 Export Full Shop Ledger (JSON)</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors hover:bg-green-50"
              style={{ borderColor: COLORS.cardBorder, color: COLORS.text }}
            >
              <Download size={16} style={{ color: COLORS.green }} />
              <span>📥 Export as CSV</span>
            </button>

            {/* Reset Demo */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors hover:bg-amber-50"
              style={{ borderColor: COLORS.amberBg, color: COLORS.amberText }}
            >
              <RefreshCw size={16} style={{ color: COLORS.amber }} />
              <span>🔄 Reset Demo to Initial Slide 1 State</span>
            </button>

            {/* Delete All */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors hover:bg-red-50"
              style={{ borderColor: '#FECACA', color: COLORS.danger }}
            >
              <Trash2 size={16} style={{ color: COLORS.danger }} />
              <span>🗑️ Delete All Shop Data</span>
            </button>
          </div>

          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: COLORS.secondary }}>
            🔒 All data stored locally on your device. Zero data sent to any server without your explicit consent.
          </p>
        </div>
      </section>

      {/* ===== RESET CONFIRMATION MODAL ===== */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl" style={{ borderColor: COLORS.cardBorder }}>
            <h3 className="text-base font-bold mb-2" style={{ color: COLORS.text }}>Reset to Demo State?</h3>
            <p className="text-sm mb-4" style={{ color: COLORS.secondary }}>
              This will reset all data to the initial demo state. Your current data will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{ borderColor: COLORS.cardBorder, color: COLORS.secondary }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ background: COLORS.amber }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl border-2" style={{ borderColor: COLORS.danger }}>
            <div className="flex items-center gap-2 mb-2">
              <Trash2 size={20} style={{ color: COLORS.danger }} />
              <h3 className="text-base font-bold" style={{ color: COLORS.danger }}>Delete All Data?</h3>
            </div>
            <p className="text-sm mb-3" style={{ color: COLORS.secondary }}>
              This will <strong>permanently delete</strong> all your shop data including customers, transactions, and catalogue.
              This action cannot be undone.
            </p>
            <p className="text-xs font-medium mb-2" style={{ color: COLORS.text }}>
              Type <span className="font-mono font-bold" style={{ color: COLORS.danger }}>DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-sm font-mono border-2 rounded-md mb-3 focus:outline-none"
              style={{
                borderColor: deleteText === 'DELETE' ? COLORS.danger : COLORS.cardBorder,
                color: COLORS.danger,
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                className="px-4 py-2 rounded-lg border text-sm font-medium"
                style={{ borderColor: COLORS.cardBorder, color: COLORS.secondary }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteText !== 'DELETE'}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-30"
                style={{ background: COLORS.danger }}
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
