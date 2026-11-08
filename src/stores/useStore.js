import { useState, useCallback, useEffect, useRef } from 'react';
import { SEED_CUSTOMERS, SEED_CATALOGUE, SEED_DAILY_HISAB } from '../data/seedData.js';

const STORAGE_KEY = 'kiranascan_state';

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

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.customers && parsed.customers.length > 0) {
        return {
          ...parsed,
          shopName: parsed.shopName || 'Gupta Kirana & General Store'
        };
      }
    }
  } catch (e) { /* ignore */ }
  return buildSeedState();
}

function buildSeedState() {
  return {
    shopName: 'Gupta Kirana & General Store',
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

export function useStore() {
  const [state, setState] = useState(getInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const resetToDemo = useCallback(() => {
    const seed = buildSeedState();
    setState(seed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  }, []);

  const deleteAllData = useCallback(() => {
    const empty = {
      customers: [],
      catalogue: SEED_CATALOGUE.map(c => ({ ...c })),
      dailyHisab: { cashSales: 0, upiSales: 0, creditIssued: 0, collectionsReceived: 0, baseMarketCredit: 0, openingGalla: 0 },
      syncQueue: [],
      sessionStats: { totalParsed: 0, firstTryAccurate: 0, totalEntryTimeMs: 0, draftsEdited: 0, sessionCash: 0, sessionUpi: 0, sessionCredit: 0, sessionWasooli: 0 },
      gallaActual: null,
    };
    setState(empty);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  }, []);

  const updateShopName = useCallback((newName) => {
    setState(prev => ({ ...prev, shopName: newName.trim() || 'Gupta Kirana & General Store' }));
  }, []);

  const addCustomer = useCallback((customer) => {
    setState(prev => {
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

  const confirmTransaction = useCallback((parsed, isOnline) => {
    const txnId = generateTxnId();
    const idempotencyKey = generateUUID();
    const timestamp = new Date().toISOString();

    setState(prev => {
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
        items: parsed.items.map(it => ({ name: it.name, qty: it.qty, unit: it.unit, price: it.unitPrice, total: it.total })),
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

  const undoLastTransaction = useCallback(() => {
    setState(prev => {
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

  const recordWasooli = useCallback((custId, amount, mode, isOnline) => {
    const txnId = generateTxnId();
    const timestamp = new Date().toISOString();

    setState(prev => {
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

  const syncOfflineQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      syncQueue: prev.syncQueue.map(q => ({ ...q, syncStatus: 'SYNCED', synced: true })),
      customers: prev.customers.map(c => ({
        ...c,
        history: c.history.map(h => ({ ...h, synced: true }))
      }))
    }));
  }, []);

  const updateCatalogueItem = useCallback((itemId, updates) => {
    setState(prev => ({
      ...prev,
      catalogue: prev.catalogue.map(c => c.id === itemId ? { ...c, ...updates } : c)
    }));
  }, []);

  const addCatalogueItem = useCallback((item) => {
    setState(prev => ({
      ...prev,
      catalogue: [...prev.catalogue, { id: 'item_' + Date.now(), ...item }]
    }));
  }, []);

  const deleteCatalogueItem = useCallback((itemId) => {
    setState(prev => ({
      ...prev,
      catalogue: prev.catalogue.filter(c => c.id !== itemId)
    }));
  }, []);

  const setGallaActual = useCallback((amount) => {
    setState(prev => ({ ...prev, gallaActual: amount }));
  }, []);

  const updateSessionStats = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      sessionStats: { ...prev.sessionStats, ...updates }
    }));
  }, []);

  const importOCRCustomers = useCallback((ocrCustomers) => {
    setState(prev => {
      const newCustomers = ocrCustomers.map(oc => ({
        id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: oc.name,
        pehchan: oc.pehchan || '',
        phone: oc.phone || '',
        balance: oc.balance || 0,
        history: []
      }));
      return { ...prev, customers: [...prev.customers, ...newCustomers] };
    });
  }, []);

  // Computed values
  const totalCustomerBalance = state.customers.reduce((s, c) => s + c.balance, 0);
  const totalOutstandingCredit = state.dailyHisab.baseMarketCredit + totalCustomerBalance;
  const pendingSyncCount = state.syncQueue.filter(q => q.syncStatus === 'QUEUED_OFFLINE').length;

  const expectedGalla = state.dailyHisab.openingGalla + state.dailyHisab.cashSales +
    state.syncQueue.filter(q => q.type === 'WASOOLI' && q.mode === 'CASH').reduce((s, q) => s + q.total, 0);

  const avgEntrySpeed = state.sessionStats.totalParsed > 0
    ? (state.sessionStats.totalEntryTimeMs / state.sessionStats.totalParsed / 1000).toFixed(1)
    : '0.0';

  const parserAccuracy = state.sessionStats.totalParsed > 0
    ? Math.round((state.sessionStats.firstTryAccurate / state.sessionStats.totalParsed) * 100)
    : 100;

  const editPercentage = state.sessionStats.totalParsed > 0
    ? Math.round((state.sessionStats.draftsEdited / state.sessionStats.totalParsed) * 100)
    : 0;

  // Transactions recorded today with customer information
  const todayTransactions = state.syncQueue.map(q => {
    const cust = state.customers.find(c => c.history.some(h => h.id === q.id));
    return {
      ...q,
      customerName: cust?.name || 'Walk-in',
      customerPehchan: cust?.pehchan || '',
      customerPhone: cust?.phone || '',
      currentBalance: cust?.balance ?? 0
    };
  }).reverse();

  return {
    ...state,
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

