import { useState, useCallback, useEffect, useRef } from 'react';
import { SEED_CUSTOMERS, SEED_CATALOGUE, SEED_DAILY_HISAB } from '../data/seedData.js';

const MERCHANTS_STORAGE_KEY = 'kiranascan_merchants_v1';
const ACTIVE_MERCHANT_KEY = 'kiranascan_active_merchant_id';

export const DEFAULT_GUPTA_MERCHANT = {
  shopId: 'shop_gupta',
  shopName: 'Gupta Kirana & General Store',
  ownerName: 'Rajesh Gupta',
  phone: '9876543210',
  pin: '1234',
  area: 'Jaipur'
};

function generateTxnId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${n}`;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getShopStorageKey(shopId) {
  return `kiranascan_shop_${shopId}`;
}

function getRegisteredMerchants() {
  try {
    const raw = localStorage.getItem(MERCHANTS_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch (e) { /* ignore */ }
  const defaults = [DEFAULT_GUPTA_MERCHANT];
  localStorage.setItem(MERCHANTS_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveRegisteredMerchants(list) {
  localStorage.setItem(MERCHANTS_STORAGE_KEY, JSON.stringify(list));
}

function buildGuptaSeedState() {
  return {
    shopName: DEFAULT_GUPTA_MERCHANT.shopName,
    customers: SEED_CUSTOMERS.map(c => ({ ...c, history: [...c.history] })),
    catalogue: SEED_CATALOGUE.map(c => ({ ...c })),
    dailyHisab: { ...SEED_DAILY_HISAB },
    syncQueue: [],
    sessionStats: {
      totalParsed: 0,
      firstTryAccurate: 0,
      totalEntryTimeMs: 0,
      draftsEdited: 0,
      sessionCash: 0,
      sessionUpi: 0,
      sessionCredit: 0,
      sessionWasooli: 0,
    },
    gallaActual: null,
  };
}

function buildNewMerchantSeedState(merchant) {
  const openingCash = Number(merchant?.openingCash) || 0;
  return {
    shopName: merchant?.shopName || 'My Kirana Store',
    customers: [],
    catalogue: SEED_CATALOGUE.map(c => ({ ...c })),
    dailyHisab: {
      cashSales: 0,
      upiSales: 0,
      creditIssued: 0,
      collectionsReceived: 0,
      baseMarketCredit: 0,
      openingGalla: openingCash,
    },
    syncQueue: [],
    sessionStats: {
      totalParsed: 0,
      firstTryAccurate: 0,
      totalEntryTimeMs: 0,
      draftsEdited: 0,
      sessionCash: 0,
      sessionUpi: 0,
      sessionCredit: 0,
      sessionWasooli: 0,
    },
    gallaActual: null,
  };
}

function loadShopState(shopId, merchants) {
  const merchant = merchants.find(m => m.shopId === shopId);
  const fallback = shopId === 'shop_gupta' ? buildGuptaSeedState() : buildNewMerchantSeedState(merchant);
  try {
    const raw = localStorage.getItem(getShopStorageKey(shopId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...fallback,
          ...parsed,
          customers: Array.isArray(parsed.customers) ? parsed.customers : fallback.customers,
          catalogue: Array.isArray(parsed.catalogue) && parsed.catalogue.length > 0 ? parsed.catalogue : fallback.catalogue,
          dailyHisab: { ...fallback.dailyHisab, ...(parsed.dailyHisab || {}) },
          syncQueue: Array.isArray(parsed.syncQueue) ? parsed.syncQueue : [],
          sessionStats: { ...fallback.sessionStats, ...(parsed.sessionStats || {}) },
        };
      }
    }
  } catch (e) { /* ignore */ }

  localStorage.setItem(getShopStorageKey(shopId), JSON.stringify(fallback));
  return fallback;
}

export function useStore() {
  const [merchants, setMerchants] = useState(getRegisteredMerchants);

  // Active merchant state (Always starts at Login page for new visits/sessions)
  const [currentMerchant, setCurrentMerchant] = useState(() => {
    const activeId = sessionStorage.getItem(ACTIVE_MERCHANT_KEY);
    if (!activeId || activeId === '__LOGGED_OUT__') return null;
    const list = getRegisteredMerchants();
    const found = list.find(m => m.shopId === activeId);
    return found || null;
  });

  // Shop state for active merchant
  const [shopState, setShopState] = useState(() => {
    const activeId = currentMerchant?.shopId || DEFAULT_GUPTA_MERCHANT.shopId;
    return loadShopState(activeId, getRegisteredMerchants());
  });

  const currentMerchantRef = useRef(currentMerchant);
  currentMerchantRef.current = currentMerchant;

  // Persist current shop state whenever it changes
  useEffect(() => {
    if (currentMerchant?.shopId) {
      localStorage.setItem(getShopStorageKey(currentMerchant.shopId), JSON.stringify(shopState));
    }
  }, [shopState, currentMerchant]);

  // Auth: Login
  const loginMerchant = useCallback((phone, pin) => {
    const cleanPhone = String(phone || '').trim().replace(/\D/g, '');
    const cleanPin = String(pin || '').trim();
    const list = getRegisteredMerchants();
    const found = list.find(m => String(m.phone).replace(/\D/g, '') === cleanPhone && String(m.pin).trim() === cleanPin);

    if (!found) {
      return { success: false, error: 'Galat Mobile Number ya PIN! Kripya dobara jaanchein.' };
    }

    sessionStorage.setItem(ACTIVE_MERCHANT_KEY, found.shopId);
    localStorage.setItem(ACTIVE_MERCHANT_KEY, found.shopId);
    setCurrentMerchant(found);
    const loaded = loadShopState(found.shopId, list);
    setShopState(loaded);
    return { success: true, merchant: found };
  }, []);

  // Auth: Instant Demo Login
  const loginDemoMerchant = useCallback(() => {
    const list = getRegisteredMerchants();
    let gupta = list.find(m => m.shopId === DEFAULT_GUPTA_MERCHANT.shopId);
    if (!gupta) {
      gupta = DEFAULT_GUPTA_MERCHANT;
      const updated = [DEFAULT_GUPTA_MERCHANT, ...list];
      saveRegisteredMerchants(updated);
      setMerchants(updated);
    }
    sessionStorage.setItem(ACTIVE_MERCHANT_KEY, gupta.shopId);
    localStorage.setItem(ACTIVE_MERCHANT_KEY, gupta.shopId);
    setCurrentMerchant(gupta);
    const loaded = loadShopState(gupta.shopId, list);
    setShopState(loaded);
    return { success: true, merchant: gupta };
  }, []);

  // Auth: Register New Merchant
  const registerMerchant = useCallback(({ shopName, ownerName, phone, pin, area, openingCash }) => {
    const cleanPhone = String(phone || '').trim().replace(/\D/g, '');
    const cleanPin = String(pin || '').trim();
    const cleanShopName = String(shopName || '').trim();
    const cleanOwnerName = String(ownerName || '').trim();
    const cleanArea = String(area || '').trim() || 'Local Market';
    const cleanOpeningCash = Number(openingCash) || 0;

    if (!cleanShopName) return { success: false, error: 'Dukan ka naam likhna zaroori hai!' };
    if (!cleanOwnerName) return { success: false, error: 'Dukandar ka naam likhna zaroori hai!' };
    if (cleanPhone.length !== 10) return { success: false, error: 'Kripya 10-digit mobile number dalein!' };
    if (cleanPin.length !== 4) return { success: false, error: 'Kripya 4-digit security PIN banayein!' };

    const list = getRegisteredMerchants();
    const exists = list.find(m => String(m.phone).replace(/\D/g, '') === cleanPhone);
    if (exists) {
      return { success: false, error: 'Yeh mobile number pehle se registered hai! Kripya Login karein.' };
    }

    const shopId = `shop_${Date.now()}`;
    const newMerchant = {
      shopId,
      shopName: cleanShopName,
      ownerName: cleanOwnerName,
      phone: cleanPhone,
      pin: cleanPin,
      area: cleanArea,
      openingCash: cleanOpeningCash,
      registeredAt: new Date().toISOString()
    };

    const updatedList = [...list, newMerchant];
    saveRegisteredMerchants(updatedList);
    setMerchants(updatedList);

    // Initialize isolated shop state
    const newShopState = buildNewMerchantSeedState(newMerchant);
    localStorage.setItem(getShopStorageKey(shopId), JSON.stringify(newShopState));

    // Activate merchant
    sessionStorage.setItem(ACTIVE_MERCHANT_KEY, shopId);
    localStorage.setItem(ACTIVE_MERCHANT_KEY, shopId);
    setCurrentMerchant(newMerchant);
    setShopState(newShopState);

    return { success: true, merchant: newMerchant };
  }, []);

  // Auth: Logout
  const logoutMerchant = useCallback(() => {
    sessionStorage.removeItem(ACTIVE_MERCHANT_KEY);
    localStorage.setItem(ACTIVE_MERCHANT_KEY, '__LOGGED_OUT__');
    setCurrentMerchant(null);
  }, []);

  // Auth: Switch Merchant
  const switchMerchant = useCallback((shopId) => {
    const list = getRegisteredMerchants();
    const found = list.find(m => m.shopId === shopId);
    if (found) {
      sessionStorage.setItem(ACTIVE_MERCHANT_KEY, found.shopId);
      localStorage.setItem(ACTIVE_MERCHANT_KEY, found.shopId);
      setCurrentMerchant(found);
      const loaded = loadShopState(found.shopId, list);
      setShopState(loaded);
    }
  }, []);

  // Reset current shop to demo
  const resetToDemo = useCallback(() => {
    if (!currentMerchant?.shopId) return;
    const isGupta = currentMerchant.shopId === DEFAULT_GUPTA_MERCHANT.shopId;
    const fresh = isGupta ? buildGuptaSeedState() : buildNewMerchantSeedState(currentMerchant);
    setShopState(fresh);
    localStorage.setItem(getShopStorageKey(currentMerchant.shopId), JSON.stringify(fresh));
  }, [currentMerchant]);

  // Delete all data for current shop
  const deleteAllData = useCallback(() => {
    if (!currentMerchant?.shopId) return;
    const empty = {
      shopName: currentMerchant.shopName,
      customers: [],
      catalogue: SEED_CATALOGUE.map(c => ({ ...c })),
      dailyHisab: { cashSales: 0, upiSales: 0, creditIssued: 0, collectionsReceived: 0, baseMarketCredit: 0, openingGalla: 0 },
      syncQueue: [],
      sessionStats: { totalParsed: 0, firstTryAccurate: 0, totalEntryTimeMs: 0, draftsEdited: 0, sessionCash: 0, sessionUpi: 0, sessionCredit: 0, sessionWasooli: 0 },
      gallaActual: null,
    };
    setShopState(empty);
    localStorage.setItem(getShopStorageKey(currentMerchant.shopId), JSON.stringify(empty));
  }, [currentMerchant]);

  // Update shop name
  const updateShopName = useCallback((newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed || !currentMerchant?.shopId) return;

    setShopState(prev => ({ ...prev, shopName: trimmed }));

    // Also update in registeredMerchants
    setMerchants(prev => {
      const updated = prev.map(m => m.shopId === currentMerchant.shopId ? { ...m, shopName: trimmed } : m);
      saveRegisteredMerchants(updated);
      return updated;
    });

    setCurrentMerchant(prev => prev ? { ...prev, shopName: trimmed } : prev);
  }, [currentMerchant]);

  // Add Customer
  const addCustomer = useCallback((customer) => {
    setShopState(prev => {
      const trimmedName = (customer.name || '').trim();
      if (!trimmedName) return prev;
      const existing = prev.customers.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
      if (existing) {
        return {
          ...prev,
          customers: prev.customers.map(c => c.id === existing.id ? {
            ...c,
            pehchan: customer.pehchan || c.pehchan,
            phone: customer.phone || c.phone,
          } : c)
        };
      }
      const newCust = {
        id: 'cust_' + Date.now(),
        name: trimmedName,
        pehchan: customer.pehchan || '',
        phone: customer.phone || '',
        balance: Number(customer.openingBalance) || 0,
        history: []
      };
      return { ...prev, customers: [...prev.customers, newCust] };
    });
  }, []);

  // Confirm Transaction
  const confirmTransaction = useCallback((parsed, isOnline) => {
    const txnId = generateTxnId();
    const idempotencyKey = generateUUID();
    const timestamp = new Date().toISOString();

    setShopState(prev => {
      const newState = { ...prev };
      const customers = [...prev.customers];

      // Find existing customer by ID or exact name match
      let custIndex = customers.findIndex(c =>
        (parsed.customer?.id && c.id === parsed.customer.id) ||
        (parsed.customer?.name && c.name.toLowerCase() === parsed.customer.name.trim().toLowerCase())
      );

      // Create new customer only if not found
      if (custIndex === -1 && (parsed.isNewCustomer || parsed.customer?.name)) {
        const newCust = {
          id: 'cust_' + Date.now(),
          name: (parsed.customer.name || 'New Customer').trim(),
          pehchan: parsed.customer.pehchan || '',
          phone: parsed.customer.phone || '',
          balance: Number(parsed.customer.openingBalance) || 0,
          history: []
        };
        customers.push(newCust);
        custIndex = customers.length - 1;
      }

      const txnRecord = {
        id: txnId,
        idempotencyKey,
        date: timestamp,
        type: parsed.type === 'WASOOLI' ? 'WASOOLI' : 'UDHAAR',
        items: (parsed.items || []).map(it => ({ name: it.name, qty: it.qty, unit: it.unit, price: it.unitPrice, total: it.total })),
        total: parsed.total,
        mode: parsed.mode,
        transcript: parsed.transcript,
        synced: isOnline,
        editedBeforeConfirm: parsed.wasEdited || false,
      };

      if (custIndex >= 0) {
        const cust = { ...customers[custIndex] };
        cust.history = [...cust.history, txnRecord];

        if (parsed.type === 'WASOOLI') {
          cust.balance = Math.max(0, cust.balance - parsed.total);
        } else if (parsed.mode === 'UDHAAR') {
          cust.balance = cust.balance + parsed.total;
        }
        customers[custIndex] = cust;
      }

      newState.customers = customers;

      // Update daily hisab
      const hisab = { ...prev.dailyHisab };
      const stats = { ...prev.sessionStats };

      if (parsed.type === 'WASOOLI') {
        hisab.collectionsReceived += parsed.total;
        stats.sessionWasooli += parsed.total;
      } else {
        switch (parsed.mode) {
          case 'CASH':
            hisab.cashSales += parsed.total;
            stats.sessionCash += parsed.total;
            break;
          case 'UPI':
            hisab.upiSales += parsed.total;
            stats.sessionUpi += parsed.total;
            break;
          case 'UDHAAR':
            hisab.creditIssued += parsed.total;
            stats.sessionCredit += parsed.total;
            break;
        }
      }

      newState.dailyHisab = hisab;
      newState.sessionStats = stats;

      // Add to sync queue
      const queueEntry = { ...txnRecord, syncStatus: isOnline ? 'SYNCED' : 'QUEUED_OFFLINE', localTimestamp: timestamp };
      newState.syncQueue = [...prev.syncQueue, queueEntry];

      return newState;
    });

    return { txnId, timestamp };
  }, []);

  // Undo Last Transaction
  const undoLastTransaction = useCallback(() => {
    setShopState(prev => {
      if (prev.syncQueue.length === 0) return prev;
      const lastTxn = prev.syncQueue[prev.syncQueue.length - 1];
      const newState = { ...prev };

      // Remove from sync queue
      newState.syncQueue = prev.syncQueue.slice(0, -1);

      // Find customer and reverse
      const customers = [...prev.customers];
      const custIndex = customers.findIndex(c =>
        c.history.some(h => h.id === lastTxn.id)
      );

      if (custIndex >= 0) {
        const cust = { ...customers[custIndex] };
        cust.history = cust.history.filter(h => h.id !== lastTxn.id);

        if (lastTxn.type === 'WASOOLI') {
          cust.balance += lastTxn.total;
        } else if (lastTxn.mode === 'UDHAAR') {
          cust.balance -= lastTxn.total;
        }
        customers[custIndex] = cust;
      }

      newState.customers = customers;

      // Reverse hisab
      const hisab = { ...prev.dailyHisab };
      const stats = { ...prev.sessionStats };
      if (lastTxn.type === 'WASOOLI') {
        hisab.collectionsReceived -= lastTxn.total;
        stats.sessionWasooli -= lastTxn.total;
      } else {
        switch (lastTxn.mode) {
          case 'CASH': hisab.cashSales -= lastTxn.total; stats.sessionCash -= lastTxn.total; break;
          case 'UPI': hisab.upiSales -= lastTxn.total; stats.sessionUpi -= lastTxn.total; break;
          case 'UDHAAR': hisab.creditIssued -= lastTxn.total; stats.sessionCredit -= lastTxn.total; break;
        }
      }
      newState.dailyHisab = hisab;
      newState.sessionStats = stats;

      return newState;
    });
  }, []);

  // Record Wasooli (Repayment)
  const recordWasooli = useCallback((custId, amount, mode, isOnline) => {
    const txnId = generateTxnId();
    const timestamp = new Date().toISOString();

    setShopState(prev => {
      const customers = [...prev.customers];
      const idx = customers.findIndex(c => c.id === custId);
      if (idx < 0) return prev;

      const cust = { ...customers[idx] };
      const txn = {
        id: txnId, idempotencyKey: generateUUID(), date: timestamp,
        type: 'WASOOLI', items: [], total: amount, mode,
        transcript: `Wasooli ₹${amount} via ${mode}`, synced: isOnline
      };
      cust.history = [...cust.history, txn];
      cust.balance = Math.max(0, cust.balance - amount);
      customers[idx] = cust;

      const hisab = { ...prev.dailyHisab };
      hisab.collectionsReceived += amount;
      const stats = { ...prev.sessionStats };
      stats.sessionWasooli += amount;

      const queueEntry = { ...txn, syncStatus: isOnline ? 'SYNCED' : 'QUEUED_OFFLINE', localTimestamp: timestamp };

      return { ...prev, customers, dailyHisab: hisab, sessionStats: stats, syncQueue: [...prev.syncQueue, queueEntry] };
    });

    return txnId;
  }, []);

  // Sync Offline Queue
  const syncOfflineQueue = useCallback(() => {
    setShopState(prev => ({
      ...prev,
      syncQueue: prev.syncQueue.map(q => ({ ...q, syncStatus: 'SYNCED', synced: true })),
      customers: prev.customers.map(c => ({
        ...c,
        history: c.history.map(h => ({ ...h, synced: true }))
      }))
    }));
  }, []);

  // Catalogue Item Update
  const updateCatalogueItem = useCallback((itemId, updates) => {
    setShopState(prev => ({
      ...prev,
      catalogue: prev.catalogue.map(c => c.id === itemId ? { ...c, ...updates } : c)
    }));
  }, []);

  const addCatalogueItem = useCallback((item) => {
    setShopState(prev => ({
      ...prev,
      catalogue: [...prev.catalogue, { id: 'item_' + Date.now(), ...item }]
    }));
  }, []);

  const deleteCatalogueItem = useCallback((itemId) => {
    setShopState(prev => ({
      ...prev,
      catalogue: prev.catalogue.filter(c => c.id !== itemId)
    }));
  }, []);

  const setGallaActual = useCallback((amount) => {
    setShopState(prev => ({ ...prev, gallaActual: amount }));
  }, []);

  const updateSessionStats = useCallback((updates) => {
    setShopState(prev => ({
      ...prev,
      sessionStats: { ...prev.sessionStats, ...updates }
    }));
  }, []);

  const importOCRCustomers = useCallback((ocrCustomers) => {
    setShopState(prev => {
      const updated = [...prev.customers];
      ocrCustomers.forEach(oc => {
        const trimmed = (oc.name || '').trim();
        if (!trimmed) return;
        const idx = updated.findIndex(c => c.name.toLowerCase() === trimmed.toLowerCase());
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            pehchan: oc.pehchan || updated[idx].pehchan,
            balance: (Number(oc.balance) || 0) + (updated[idx].balance || 0),
          };
        } else {
          updated.push({
            id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: trimmed,
            pehchan: oc.pehchan || '',
            phone: oc.phone || '',
            balance: Number(oc.balance) || 0,
            history: []
          });
        }
      });
      return { ...prev, customers: updated };
    });
  }, []);

  // Computed values
  const totalCustomerBalance = (shopState.customers || []).reduce((s, c) => s + (c.balance || 0), 0);
  const totalOutstandingCredit = (shopState.dailyHisab?.baseMarketCredit || 0) + totalCustomerBalance;
  const pendingSyncCount = (shopState.syncQueue || []).filter(q => q.syncStatus === 'QUEUED_OFFLINE').length;

  const expectedGalla = (shopState.dailyHisab?.openingGalla || 0) + (shopState.dailyHisab?.cashSales || 0) +
    (shopState.syncQueue || []).filter(q => q.type === 'WASOOLI' && q.mode === 'CASH').reduce((s, q) => s + q.total, 0);

  const avgEntrySpeed = shopState.sessionStats?.totalParsed > 0
    ? (shopState.sessionStats.totalEntryTimeMs / shopState.sessionStats.totalParsed / 1000).toFixed(1)
    : '0.0';

  const parserAccuracy = shopState.sessionStats?.totalParsed > 0
    ? Math.round((shopState.sessionStats.firstTryAccurate / shopState.sessionStats.totalParsed) * 100)
    : 100;

  const editPercentage = shopState.sessionStats?.totalParsed > 0
    ? Math.round((shopState.sessionStats.draftsEdited / shopState.sessionStats.totalParsed) * 100)
    : 0;

  // Transactions recorded today with customer information
  const todayTransactions = (shopState.syncQueue || []).map(q => {
    const cust = (shopState.customers || []).find(c => (c.history || []).some(h => h.id === q.id));
    return {
      ...q,
      customerName: cust?.name || 'Walk-in',
      customerPehchan: cust?.pehchan || '',
      customerPhone: cust?.phone || '',
      currentBalance: cust?.balance ?? 0
    };
  }).reverse();

  return {
    ...shopState,
    currentMerchant,
    registeredMerchants: merchants,
    loginMerchant,
    loginDemoMerchant,
    registerMerchant,
    logoutMerchant,
    switchMerchant,
    totalOutstandingCredit,
    pendingSyncCount,
    expectedGalla,
    avgEntrySpeed,
    parserAccuracy,
    editPercentage,
    todayTransactions,
    updateShopName,
    resetToDemo,
    deleteAllData,
    addCustomer,
    confirmTransaction,
    undoLastTransaction,
    recordWasooli,
    syncOfflineQueue,
    updateCatalogueItem,
    addCatalogueItem,
    deleteCatalogueItem,
    setGallaActual,
    updateSessionStats,
    importOCRCustomers,
  };
}
