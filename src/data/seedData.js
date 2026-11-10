export const SEED_CUSTOMERS = [
  {
    id: 'cust_1', name: 'Ramesh Kumar',
    pehchan: 'Makan No. 12 (Regular)', phone: '9876543210',
    balance: 420,
    history: [
      { id: 'TXN-0001', date: '2026-11-06T10:30:00', type: 'UDHAAR', items: [{ name: 'Chawal (Rice)', qty: 5, unit: 'kg', price: 60, total: 300 }], total: 300, mode: 'UDHAAR', transcript: 'Ramesh ko 5 kilo chawal udhaar', synced: true },
      { id: 'TXN-0002', date: '2026-11-07T14:15:00', type: 'UDHAAR', items: [{ name: 'Amul Milk', qty: 2, unit: 'pkt', price: 33, total: 66 }, { name: 'Bread', qty: 1, unit: 'pkt', price: 40, total: 40 }, { name: 'Eggs (Ande)', qty: 2, unit: 'pc', price: 7, total: 14 }], total: 120, mode: 'UDHAAR', transcript: 'Ramesh ko 2 doodh 1 bread 2 ande udhaar', synced: true }
    ]
  },
  {
    id: 'cust_2', name: 'Ramesh Sharma',
    pehchan: 'School Master, Gali No. 4', phone: '9811122233',
    balance: 150,
    history: [
      { id: 'TXN-0003', date: '2026-11-07T09:00:00', type: 'UDHAAR', items: [{ name: 'Toor Dal', qty: 1, unit: 'kg', price: 140, total: 140 }, { name: 'Maggi Noodles', qty: 1, unit: 'pkt', price: 14, total: 14 }], total: 154, mode: 'UDHAAR', transcript: 'Ramesh Sharma ko 1 kilo dal aur maggi udhaar', synced: true },
      { id: 'TXN-0004', date: '2026-11-07T18:00:00', type: 'WASOOLI', items: [], total: 4, mode: 'CASH', transcript: 'Ramesh Sharma ne 4 rupaye jama kiye', synced: true }
    ]
  },
  {
    id: 'cust_3', name: 'Sunita Devi',
    pehchan: 'Dairy Wali Gali', phone: '9822233344',
    balance: 1240,
    history: [
      { id: 'TXN-0005', date: '2026-11-06T16:00:00', type: 'UDHAAR', items: [{ name: 'Sarson Tel (Mustard Oil)', qty: 2, unit: 'L', price: 160, total: 320 }], total: 320, mode: 'UDHAAR', transcript: 'Sunita ko 2 liter sarson tel udhaar', synced: true }
    ]
  },
  {
    id: 'cust_4', name: 'Mohan Lal',
    pehchan: 'rickshaw driver', phone: '9833344455',
    balance: 890,
    history: [
      { id: 'TXN-0006', date: '2026-11-05T11:00:00', type: 'UDHAAR', items: [{ name: 'Aata (Wheat Flour)', qty: 10, unit: 'kg', price: 45, total: 450 }], total: 450, mode: 'UDHAAR', transcript: 'Mohan ko 10 kilo aata udhaar', synced: true }
    ]
  },
  {
    id: 'cust_5', name: 'Kiran Tailor',
    pehchan: 'Main Market', phone: '9844455566',
    balance: 650,
    history: [
      { id: 'TXN-0007', date: '2026-11-07T08:30:00', type: 'UDHAAR', items: [{ name: 'Chini (Sugar)', qty: 5, unit: 'kg', price: 44, total: 220 }], total: 220, mode: 'UDHAAR', transcript: 'Kiran ko 5 kilo chini udhaar', synced: true }
    ]
  }
];

export const SEED_CATALOGUE = [
  { id: 'item_1', name: 'Aata (Wheat Flour)', aliases: ['aata', 'atta', 'gehu', 'flour', 'gehun'], unit: 'kg', rate: 45, isMultiBrand: false },
  { id: 'item_2', name: 'Chini (Sugar)', aliases: ['chini', 'cheeni', 'shakkar', 'sugar'], unit: 'kg', rate: 44, isMultiBrand: false },
  { id: 'item_3', name: 'Toor Dal', aliases: ['dal', 'daal', 'toor', 'arhar'], unit: 'kg', rate: 140, isMultiBrand: false },
  { id: 'item_4', name: 'Chawal (Rice)', aliases: ['chawal', 'rice', 'basmati'], unit: 'kg', rate: 60, isMultiBrand: false },
  { id: 'item_5', name: 'Sarson Tel (Mustard Oil)', aliases: ['tel', 'oil', 'sarson', 'mustard'], unit: 'L', rate: 160, isMultiBrand: false },
  { id: 'item_6', name: 'Amul Milk', aliases: ['doodh', 'milk', 'amul'], unit: 'pkt', rate: 33, isMultiBrand: false },
  { id: 'item_7', name: 'Maggi Noodles', aliases: ['maggi', 'noodles'], unit: 'pkt', rate: 14, isMultiBrand: false },
  { id: 'item_8', name: 'Bread', aliases: ['bread', 'bred'], unit: 'pkt', rate: 40, isMultiBrand: false },
  { id: 'item_9', name: 'Eggs (Ande)', aliases: ['anda', 'ande', 'egg', 'eggs', 'anda'], unit: 'pc', rate: 7, isMultiBrand: false },
  {
    id: 'item_10', name: 'Soap (Sabun)', aliases: ['soap', 'sabun'], unit: 'pc', isMultiBrand: true, rate: 40,
    variants: [
      { label: '₹10 Mini', price: 10 },
      { label: 'Lifebuoy ₹36', price: 36 },
      { label: 'Standard ₹40', price: 40 },
      { label: 'Dettol ₹45', price: 45 }
    ]
  },
  {
    id: 'item_11', name: 'Biscuit', aliases: ['biscuit', 'biskut'], unit: 'pkt', isMultiBrand: true, rate: 10,
    variants: [
      { label: 'Parle-G ₹10', price: 10 },
      { label: 'GoodDay ₹20', price: 20 },
      { label: 'Marie ₹35', price: 35 }
    ]
  },
  {
    id: 'item_12', name: 'Namkeen / Bhujia', aliases: ['namkeen', 'bhujia', 'chips'], unit: 'pkt', isMultiBrand: true, rate: 20,
    variants: [
      { label: '₹10 Pack', price: 10 },
      { label: '₹20 Pack', price: 20 },
      { label: 'Haldiram ₹55', price: 55 }
    ]
  }
];

export const BRAND_ALIASES = [
  { brand: 'Dettol Soap', aliases: ['dettol'], price: 45, unit: 'pc', parentItem: 'item_10' },
  { brand: 'Lifebuoy Soap', aliases: ['lifebuoy'], price: 36, unit: 'pc', parentItem: 'item_10' },
  { brand: 'Parle-G Biscuit', aliases: ['parle', 'parle-g', 'parleg'], price: 10, unit: 'pkt', parentItem: 'item_11' },
  { brand: 'Haldiram Bhujia', aliases: ['haldiram', 'haldirams'], price: 55, unit: 'pkt', parentItem: 'item_12' }
];

export const SEED_DAILY_HISAB = {
  cashSales: 4200,
  upiSales: 2850,
  creditIssued: 1900,
  collectionsReceived: 1350,
  baseMarketCredit: 15250,
  openingGalla: 1000
};

export const DEMO_CHIPS = [
  { label: 'Udhaar Bill (Multi-Item)', text: 'Ramesh ko do kilo aata aur ek soap udhaar mein diya', emoji: '🎯' },
  { label: 'Reversed Order', text: '40 ka sabun h, Ramesh ne kharida', emoji: '🔄' },
  { label: 'Desi Fractions + UPI', text: 'Sunita ji ko dhai kilo chini aur aadha liter sarson tel UPI se diya', emoji: '📐' },
  { label: 'Unknown Item', text: 'Mohan ko ek packet Haldiram bhujia aur 1 bread udhaar likho', emoji: '❓' },
  { label: 'New Customer', text: 'Vikram ko 1 kilo toor dal aur 2 Maggi udhaar mein diya', emoji: '🆕' },
  { label: 'Wasooli / Settlement', text: 'Ramesh ne 200 rupaye cash jama kiye', emoji: '💰' }
];

export const LABELS = {
  en: {
    appName: 'Gupta Kirana & General Store',
    tab1: 'Speak',
    tab2: 'Ledger',
    tab3: 'Daily Hisab',
    tab4: 'Catalogue',
    speak: 'Speak (Bol Kar)',
    ledger: 'Bahi-Khata',
    daily: 'Aaj Ka Hisab',
    catalogue: 'Dukan Bhaav & Sync',
    confirm: '✓ Confirm Transaction (Save to Ledger)',
    pendingConfirm: '⚠️ Select Missing Price Above to Confirm',
    udhaar: 'Udhaar',
    cash: 'Cash',
    upi: 'UPI',
    wasooli: 'Wasooli (Jama)',
    searchPlaceholder: 'Search by name, phone, pehchan...',
    newCustomer: 'Naya Grahak',
    cashSales: 'Cash Sales Today',
    upiSales: 'UPI Sales Today',
    creditIssued: 'Credit Issued Today (Udhaar)',
    collections: 'Collections Received (Wasooli)',
    totalCredit: 'Total Outstanding Credit',
    voiceHint: 'Tap mic or type Hinglish sentence...',
    demoChips: 'Sample Voice Commands (Tap to Test)',
    approvalRequired: 'APPROVAL REQUIRED',
    balancePreview: 'Balance Impact Preview',
    undoToast: 'Undo Last Entry',
    sendWhatsApp: 'WhatsApp Par Bhejein',
    copyReceipt: 'Copy Receipt',
    online: '🟢 Online (Server Synced)',
    offline: '🟠 Offline Mode (Local IndexedDB Queue)',
    soundboxOn: '🔊 Bolkar Sunayein (On)',
    soundboxOff: '🔇 Bolkar Sunayein (Off)',
    resetDemo: 'Restore Default Sample Data',
    mobileView: '📱 Mobile Frame',
    fullView: '🖥️ Full Screen',
    gallaCheck: 'Night-Time Galla (Cash Drawer) Check',
    exportLedger: 'Export Full Shop Ledger',
    deleteAll: 'Delete All Shop Data',
    scanOCR: 'Scan Bahi-Khata'
  },
  hi: {
    appName: 'गुप्ता किराना एंड जनरल स्टोर',
    tab1: 'बोलें',
    tab2: 'बही-खाता',
    tab3: 'आज का हिसाब',
    tab4: 'दुकान भाव',
    speak: 'बोल कर लिखें',
    ledger: 'बही-खाता',
    daily: 'आज का हिसाब',
    catalogue: 'दुकान भाव और सिंक',
    confirm: '✓ लेनदेन पक्का करें (खाते में दर्ज करें)',
    pendingConfirm: '⚠️ पहले ऊपर कीमत चुनें',
    udhaar: 'उधार',
    cash: 'नकद',
    upi: 'UPI',
    wasooli: 'वसूली (जमा)',
    searchPlaceholder: 'नाम, फोन, या पहचान से खोजें...',
    newCustomer: 'नया ग्राहक',
    cashSales: 'आज की नकद बिक्री',
    upiSales: 'आज की UPI बिक्री',
    creditIssued: 'आज का उधार',
    collections: 'आज की वसूली',
    totalCredit: 'कुल बाकी उधार',
    voiceHint: 'माइक दबाएं या हिंग्लिश में लिखें...',
    demoChips: 'नमूना वॉयस कमांड (परीक्षण करें)',
    approvalRequired: 'मंजूरी आवश्यक',
    balancePreview: 'बैलेंस पूर्वावलोकन',
    undoToast: 'पिछली एंट्री वापस करें',
    sendWhatsApp: 'व्हाट्सएप पर भेजें',
    copyReceipt: 'रसीद कॉपी करें',
    online: '🟢 ऑनलाइन (सर्वर सिंक)',
    offline: '🟠 ऑफलाइन मोड',
    soundboxOn: '🔊 बोलकर सुनाएं (चालू)',
    soundboxOff: '🔇 बोलकर सुनाएं (बंद)',
    resetDemo: 'डिफ़ॉल्ट डेटा पुनर्स्थापित करें',
    mobileView: '📱 मोबाइल व्यू',
    fullView: '🖥️ पूर्ण स्क्रीन',
    gallaCheck: 'रात का गल्ला (कैश ड्रॉअर) चेक',
    exportLedger: 'पूरा खाता निर्यात करें',
    deleteAll: 'सारा डेटा मिटाएं',
    scanOCR: 'बही-खाता स्कैन करें'
  },
  hinglish: {
    appName: 'Gupta Kirana & General Store',
    tab1: 'Bol Kar',
    tab2: 'Bahi-Khata',
    tab3: 'Aaj Ka Hisab',
    tab4: 'Dukan Bhaav',
    speak: 'Bol Kar Likhein',
    ledger: 'Bahi-Khata',
    daily: 'Aaj Ka Hisab',
    catalogue: 'Dukan Bhaav & Sync',
    confirm: '✓ Confirm Karein (Ledger Mein Save)',
    pendingConfirm: '⚠️ Pehle Upar Price Chunein',
    udhaar: 'Udhaar',
    cash: 'Cash',
    upi: 'UPI',
    wasooli: 'Wasooli (Jama)',
    searchPlaceholder: 'Naam, phone, ya pehchan se khojein...',
    newCustomer: 'Naya Grahak',
    cashSales: 'Aaj Ki Cash Sale',
    upiSales: 'Aaj Ki UPI Sale',
    creditIssued: 'Aaj Ka Udhaar Diya',
    collections: 'Aaj Ki Wasooli',
    totalCredit: 'Total Baaki Udhaar',
    voiceHint: 'Mic dabayein ya Hinglish mein likhein...',
    demoChips: 'Sample Voice Commands (Tap to Test)',
    approvalRequired: 'APPROVAL ZARURI HAI',
    balancePreview: 'Balance Impact Preview',
    undoToast: 'Pichhli Entry Wapas',
    sendWhatsApp: 'WhatsApp Par Bhejein',
    copyReceipt: 'Receipt Copy Karein',
    online: '🟢 Online (Server Synced)',
    offline: '🟠 Offline Mode (Local Queue)',
    soundboxOn: '🔊 Bolkar Sunayein (On)',
    soundboxOff: '🔇 Bolkar Sunayein (Off)',
    resetDemo: 'Restore Default Sample Data',
    mobileView: '📱 Mobile Frame',
    fullView: '🖥️ Full Screen',
    gallaCheck: 'Raat Ka Galla Check',
    exportLedger: 'Poora Khata Export',
    deleteAll: 'Saara Data Mitayein',
    scanOCR: 'Scan Bahi-Khata'
  }
};

export const SAMPLE_HANDWRITTEN_BILLS = [
  {
    id: 'bill_1',
    title: 'Hinglish Udhaar Parchi (With Prices)',
    badge: 'Udhaar · Priced',
    lines: [
      'Ramesh Kumar - Udhaar',
      '1. Aata - 2 kg - 90/-',
      '2. Chini - 1 kg - 44/-',
      '3. Soap - 1 pc - 40/-',
    ],
    parsed: {
      customerId: 'cust_1',
      customerName: 'Ramesh Kumar',
      mode: 'UDHAAR',
      type: 'SALE',
      transcript: 'Ramesh Kumar - Udhaar | 1. Aata 2 kg ₹90, 2. Chini 1 kg ₹44, 3. Soap 1 pc ₹40',
      items: [
        {
          name: 'Aata (Wheat Flour)',
          catalogueId: 'item_1',
          qty: 2,
          unit: 'kg',
          unitPrice: 45,
          total: 90,
          needsPriceSelection: false,
          isMultiBrand: false,
          variants: null,
          suggestedVariantIndex: null,
        },
        {
          name: 'Chini (Sugar)',
          catalogueId: 'item_2',
          qty: 1,
          unit: 'kg',
          unitPrice: 44,
          total: 44,
          needsPriceSelection: false,
          isMultiBrand: false,
          variants: null,
          suggestedVariantIndex: null,
        },
        {
          name: 'Soap (Sabun)',
          catalogueId: 'item_10',
          qty: 1,
          unit: 'pc',
          unitPrice: 40,
          total: 40,
          needsPriceSelection: false,
          isMultiBrand: false,
          variants: null,
          suggestedVariantIndex: null,
        },
      ],
    },
  },
  {
    id: 'bill_2',
    title: 'Customer Home Slip (Missing Multi-Brand Price)',
    badge: 'UPI · Pick Brand Price',
    lines: [
      'Sunita Devi (UPI)',
      '- Chawal 2 kilo',
      '- Maggi 2 packet',
      '- Biscuit 1 pkt',
    ],
    parsed: {
      customerId: 'cust_3',
      customerName: 'Sunita Devi',
      mode: 'UPI',
      type: 'SALE',
      transcript: 'Sunita Devi (UPI) | Chawal 2 kg, Maggi 2 pkt, Biscuit 1 pkt',
      items: [
        {
          name: 'Chawal (Rice)',
          catalogueId: 'item_4',
          qty: 2,
          unit: 'kg',
          unitPrice: 60,
          total: 120,
          needsPriceSelection: false,
          isMultiBrand: false,
          variants: null,
          suggestedVariantIndex: null,
        },
        {
          name: 'Maggi Noodles',
          catalogueId: 'item_7',
          qty: 2,
          unit: 'pkt',
          unitPrice: 14,
          total: 28,
          needsPriceSelection: false,
          isMultiBrand: false,
          variants: null,
          suggestedVariantIndex: null,
        },
        {
          name: 'Biscuit',
          catalogueId: 'item_11',
          qty: 1,
          unit: 'pkt',
          unitPrice: 10,
          total: 10,
          needsPriceSelection: true,
          isMultiBrand: true,
          variants: [
            { label: 'Parle-G ₹10', price: 10 },
            { label: 'GoodDay ₹20', price: 20 },
            { label: 'Marie ₹35', price: 35 },
          ],
          suggestedVariantIndex: 0,
        },
      ],
    },
  },
  {
    id: 'bill_3',
    title: 'Hindi Devanagari Cash Slip',
    badge: 'Cash · हिंदी',
    lines: [
      'मोहन लाल (Cash / नगद)',
      'सरसों तेल - 1 L - ₹160',
      'तूर दाल - 0.5 kg - ₹70',
    ],
    parsed: {
      customerId: 'cust_4',
      customerName: 'Mohan Lal',
      mode: 'CASH',
      type: 'SALE',
      transcript: 'Mohan Lal (Cash) | Sarson Tel 1 L ₹160, Toor Dal 0.5 kg ₹70',
      items: [
        {
          name: 'Sarson Tel (Mustard Oil)',
          catalogueId: 'item_5',
          qty: 1,
          unit: 'L',
          unitPrice: 160,
          total: 160,
          needsPriceSelection: false,
          isMultiBrand: false,
          variants: null,
          suggestedVariantIndex: null,
        },
        {
          name: 'Toor Dal',
          catalogueId: 'item_3',
          qty: 0.5,
          unit: 'kg',
          unitPrice: 140,
          total: 70,
          needsPriceSelection: false,
          isMultiBrand: false,
          variants: null,
          suggestedVariantIndex: null,
        },
      ],
    },
  },
];


