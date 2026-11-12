import { BRAND_ALIASES } from '../data/seedData.js';
import { hindiToHinglish } from './devanagariTransliterator.js';

const HINDI_NUMBERS = {
  'ek': 1, 'a': 1, 'one': 1, 'do': 2, 'two': 2, 'teen': 3, 'three': 3, 'tin': 3,
  'char': 4, 'four': 4, 'chaar': 4, 'paanch': 5, 'panch': 5, 'five': 5,
  'chhe': 6, 'six': 6, 'chhah': 6, 'saat': 7, 'seven': 7, 'aath': 8, 'eight': 8,
  'nau': 9, 'nine': 9, 'das': 10, 'ten': 10, 'gyarah': 11, 'barah': 12,
  'terah': 13, 'chaudah': 14, 'pandrah': 15, 'solah': 16, 'satrah': 17, 'atharah': 18,
  'unnees': 19, 'bees': 20, 'beesh': 20, 'twenty': 20, 'pachees': 25,
  'tees': 30, 'thirty': 30, 'paintees': 35, 'chalis': 40, 'chaalis': 40, 'forty': 40,
  'pachaas': 50, 'pachas': 50, 'fifty': 50, 'saath': 60, 'sath': 60,
  'sattar': 70, 'assi': 80, 'nabbe': 90,
  'sau': 100, 'hundred': 100, 'do sau': 200, 'teen sau': 300, 'paanch sau': 500,
  'hazaar': 1000, 'hazar': 1000, 'thousand': 1000,
};

const FRACTION_WORDS = {
  'aadha': 0.5, 'adha': 0.5, 'half': 0.5,
  'paav': 0.25, 'pao': 0.25, 'pav': 0.25, 'quarter': 0.25,
  'paune': 0.75, 'sawa': 1.25, 'dedh': 1.5, 'dhai': 2.5, 'dhaai': 2.5,
};

const COMPOUND_FRACTIONS = {
  'ek paav': 0.25, 'ek pao': 0.25, 'ek pav': 0.25,
  'sadhe ek': 1.5, 'saadhe ek': 1.5,
  'sadhe do': 2.5, 'saadhe do': 2.5,
  'sadhe teen': 3.5, 'saadhe teen': 3.5,
  'sadhe char': 4.5, 'saadhe char': 4.5, 'sadhe chaar': 4.5, 'saadhe chaar': 4.5,
  'sadhe paanch': 5.5, 'saadhe paanch': 5.5, 'sadhe panch': 5.5, 'saadhe panch': 5.5,
  'sawa ek': 1.25, 'sawa do': 2.25, 'sawa teen': 3.25, 'sawa char': 4.25,
  'paune ek': 0.75, 'paune do': 1.75, 'paune teen': 2.75, 'paune char': 3.75,
  'dedh sau': 150, 'dhai sau': 250, 'dhaai sau': 250, 'sawa sau': 125, 'paune sau': 75,
};

const UNIT_ALIASES = {
  'kilo': 'kg', 'kg': 'kg', 'kgs': 'kg', 'kilogram': 'kg', 'kilograms': 'kg', 'keji': 'kg',
  'gram': 'gm', 'grams': 'gm', 'gm': 'gm', 'gms': 'gm', 'g': 'gm',
  'liter': 'L', 'liters': 'L', 'litre': 'L', 'litres': 'L', 'ltr': 'L', 'l': 'L',
  'ml': 'ml', 'mililiter': 'ml', 'milliliter': 'ml', 'millilitre': 'ml', 'mililitre': 'ml',
  'packet': 'pkt', 'packets': 'pkt', 'pkt': 'pkt', 'pkts': 'pkt', 'pack': 'pkt', 'packs': 'pkt', 'thaili': 'pkt',
  'piece': 'pc', 'pieces': 'pc', 'pc': 'pc', 'pcs': 'pc', 'nag': 'pc', 'dana': 'pc', 'dane': 'pc',
  'dozen': 'dozen', 'darjan': 'dozen',
};

const SINGLE_CHAR_UNITS = new Set(['g', 'l']);
const CURRENCY_WORDS = new Set(['₹', 'rs', 'rupaye', 'rupaya', 'rupaiye', 'rupye', 'rupees', 'rupee']);
const PRICE_MARKERS = ['wala', 'wali', 'wale', 'ka', 'ke', 'ki', 'rupaye', 'rupaya', 'rs', '₹', 'rupaiye', 'rupye', 'rupees', 'rupee'];

const UDHAAR_WORDS = ['udhaar', 'udhar', 'udhari', 'khate', 'khata', 'baaki', 'baki', 'credit'];
const CASH_WORDS = ['cash', 'nagad', 'naqad', 'nakad'];
const UPI_WORDS = ['upi', 'online', 'gpay', 'phonepe', 'paytm', 'bhim', 'google pay'];

const STRONG_WASOOLI_WORDS = ['wasooli', 'wasuli', 'vasooli', 'vasuli', 'jama', 'bharpai', 'chukaya', 'chuka'];
const STRONG_WASOOLI_PHRASES = [
  'udhaar wapas', 'udhar wapas', 'baaki wapas', 'baki wapas',
  'khata clear', 'hisab clear', 'hisab chukta', 'wapas diya', 'wapas diye', 'wapas kiya', 'wapas kiye',
];
const SOFT_WASOOLI_WORDS = ['wapas', 'payment', 'diye'];
const SOFT_WASOOLI_PHRASES = ['paise diye', 'rupaye diye', 'rupaye de diye', 'de diye'];

const SPLIT_WORDS = new Set([',', 'aur', 'and', 'or', 'plus', 'bhi', 'tatha', 'evam', 'fir', 'phir']);
const CUSTOMER_MARKERS_STRONG = new Set(['ko', 'ne', 'ji']);
const CUSTOMER_MARKERS_KNOWN = new Set(['ko', 'ne', 'ka', 'ke', 'ki', 'ji']);
const COMMON_SURNAMES = new Set(['sharma', 'kumar', 'lal', 'devi', 'gupta', 'singh', 'verma', 'yadav', 'tiwari', 'patel', 'joshi', 'mishra', 'jain', 'agarwal']);

const UNKNOWN_ITEM_STOPWORDS = new Set([
  'kal', 'aaj', 'abhi', 'subah', 'shaam', 'raat', 'bhai', 'bhaiya', 'didi', 'sir', 'madam',
  'sahab', 'sahib', 'ji', 'please', 'plz', 'mera', 'meri', 'mere', 'uska', 'unki', 'unke',
  'apna', 'apni', 'total', 'bill', 'hisab', 'dukan', 'grahak', 'customer', 'bahi', 'khata',
  'khate', 'paise', 'paisa', 'ka', 'ke', 'ki', 'ko', 'ne', 'se', 'mein', 'me', 'par', 'pe',
  'for', 'to', 'naam', 'wale', 'wali', 'wala', 'ek', 'do',
  'aur', 'and', 'or', 'plus', 'bhi', 'tatha', 'evam', 'fir', 'phir',
  'kharida', 'kharidi', 'kharide', 'liya', 'liye', 'diya', 'diye', 'di', 'de', 'dijiye', 'den',
  'le', 'lo', 'likho', 'likh', 'kar', 'karo', 'karen', 'kiya', 'kiye', 'h', 'hai', 'hain',
  'tha', 'thi', 'the',
]);

function normalizeFuzzyWord(word) {
  if (!word) return '';
  let w = String(word).toLowerCase().trim();
  if (!/^[a-z]+$/.test(w)) return w;
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) {
    w = w.slice(0, -1);
  }
  if (w.length > 3 && w.endsWith('ie')) {
    w = `${w.slice(0, -2)}i`;
  }
  w = w.replace(/(.)\1+/g, '$1');
  return w;
}

function fuzzyMatchAlias(word, alias) {
  if (!word || !alias) return false;
  const w = String(word).toLowerCase().trim();
  const a = String(alias).toLowerCase().trim();
  if (w === a) return true;
  if (!/^[a-z]{3,}$/.test(w) || !/^[a-z]{3,}$/.test(a)) return false;
  return normalizeFuzzyWord(w) === normalizeFuzzyWord(a);
}

function normalizeText(text) {
  const transliterated = hindiToHinglish(text || '');
  return transliterated
    .toLowerCase()
    .replace(/(\d)\s*\/-\s*/g, '$1 rupaye ')      // 40/- -> 40 rupaye
    .replace(/(\d),(?=\d{3}(?!\d))/g, '$1')       // remove thousands separator in 1,200
    .replace(/(\d)\.(\d)/g, '$1\uE000$2')         // protect decimals like 2.5
    .replace(/(\d)([a-z₹])/g, '$1 $2')           // 2kg -> 2 kg, 1\uE0005kg -> 1\uE0005 kg
    .replace(/([a-z₹])(\d)/g, '$1 $2')           // rs20 -> rs 20
    .replace(/₹/g, ' ₹ ')
    .replace(/\s+\/\s+/g, ' , ')
    .replace(/\s+-\s+/g, ' ')
    .replace(/[,;&+|\n।!?]+/g, ' , ')
    .replace(/[.]+/g, ' , ')                      // sentence dots -> commas while decimals are still protected
    .replace(/\uE000/g, '.')                      // restore decimals after dot splitting
    .replace(/[:'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStrictNumber(w) {
  if (!w) return null;
  if (FRACTION_WORDS[w] !== undefined) return FRACTION_WORDS[w];
  if (HINDI_NUMBERS[w] !== undefined) return HINDI_NUMBERS[w];
  if (/^\d+(\.\d+)?$/.test(w)) return parseFloat(w);
  return null;
}

function getUnit(token, prevToken) {
  if (!token) return null;
  if (SINGLE_CHAR_UNITS.has(token)) {
    const prevNum = getStrictNumber(prevToken);
    if (prevNum !== null) return UNIT_ALIASES[token];
    return null;
  }
  return UNIT_ALIASES[token] || null;
}

function wordsToNumber(words) {
  if (!words || words.length === 0) return null;
  const joined = words.join(' ');
  if (COMPOUND_FRACTIONS[joined] !== undefined) return COMPOUND_FRACTIONS[joined];
  if (HINDI_NUMBERS[joined] !== undefined) return HINDI_NUMBERS[joined];

  if (words.length === 1) {
    return getStrictNumber(words[0]);
  }
  if (words.length === 2) {
    const [a, b] = words;
    const nb = getStrictNumber(b);
    if ((a === 'sadhe' || a === 'saadhe') && nb !== null) return nb + 0.5;
    if (a === 'sawa') {
      if (b === 'sau' || b === 'hundred') return 125;
      if (nb !== null) return nb + 0.25;
    }
    if (a === 'paune') {
      if (b === 'sau' || b === 'hundred') return 75;
      if (nb !== null) return Math.max(0.25, nb - 0.25);
    }
    const na = getStrictNumber(a);
    if (na !== null) {
      if (b === 'sau' || b === 'hundred') return na * 100;
      if (b === 'hazaar' || b === 'hazar' || b === 'thousand') return na * 1000;
    }
  }
  return null;
}

function isReservedWord(word, catalogue = []) {
  if (!word || word === ',' || /^\d+(\.\d+)?$/.test(word) || word.length < 2) return true;

  const reserved = new Set([
    ...Object.keys(HINDI_NUMBERS), ...Object.keys(FRACTION_WORDS),
    ...Object.keys(UNIT_ALIASES), ...PRICE_MARKERS, ...CURRENCY_WORDS,
    ...UDHAAR_WORDS, ...CASH_WORDS, ...UPI_WORDS,
    ...STRONG_WASOOLI_WORDS, ...SOFT_WASOOLI_WORDS, ...SPLIT_WORDS,
    ...CUSTOMER_MARKERS_KNOWN, ...UNKNOWN_ITEM_STOPWORDS,
    'h', 'hai', 'the', 'tha', 'thi', 'hain', 'mein', 'me', 'se',
    'diya', 'diye', 'di', 'de', 'dijiye', 'den', 'liya', 'liye', 'le', 'lo',
    'likho', 'likh',
    'kharida', 'kharidi', 'kharide', 'kar', 'karo', 'karen', 'kiya', 'kiye',
    'google', 'pay', 'for', 'to', 'and', 'plus', 'or',
  ]);

  const itemWords = new Set();

  for (const ba of BRAND_ALIASES) {
    ba.brand.toLowerCase().split(/\s+/).forEach(w => {
      if (w) { reserved.add(w); itemWords.add(w); }
    });
    for (const al of (ba.aliases || [])) {
      al.toLowerCase().split(/\s+/).forEach(w => {
        if (w) { reserved.add(w); itemWords.add(w); }
      });
    }
  }

  for (const item of (catalogue || [])) {
    for (const al of (item.aliases || [])) {
      al.toLowerCase().split(/\s+/).forEach(w => {
        if (w) { reserved.add(w); itemWords.add(w); }
      });
    }
    (item.name || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).forEach(w => {
      if (w.length >= 2) { reserved.add(w); itemWords.add(w); }
    });
    for (const v of (item.variants || [])) {
      const b = (v.brand || v.name || v.label || '').toLowerCase().replace(/[^a-z\s]/g, ' ');
      b.split(/\s+/).forEach(w => {
        if (w.length >= 2) { reserved.add(w); itemWords.add(w); }
      });
    }
  }

  if (reserved.has(word)) return true;

  if (/^[a-z]{3,}$/.test(word)) {
    for (const iw of itemWords) {
      if (fuzzyMatchAlias(word, iw)) return true;
    }
  }

  return false;
}

function detectCustomer(tokens, customers, catalogue) {
  const matches = [];
  const allCustomers = customers || [];

  // 1. Try full name exact token sequence match
  for (const cust of allCustomers) {
    const nameParts = cust.name.toLowerCase().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) continue;
    for (let i = 0; i <= tokens.length - nameParts.length; i++) {
      let ok = true;
      for (let j = 0; j < nameParts.length; j++) {
        if (tokens[i + j] !== nameParts[j]) { ok = false; break; }
      }
      if (ok) {
        matches.push({
          ...cust,
          matchScore: 3,
          matchedName: cust.name,
          spanStart: i,
          spanEnd: i + nameParts.length - 1,
        });
        break;
      }
    }
  }
  if (matches.length === 1) {
    return { customer: matches[0], ambiguous: false, candidates: matches };
  }

  // 2. Try first name exact token match
  if (matches.length === 0) {
    for (const cust of allCustomers) {
      const firstName = cust.name.split(/\s+/)[0]?.toLowerCase() || '';
      if (firstName.length < 2) continue;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === firstName || tokens[i] === `${firstName}ji`) {
          const prevToken = tokens[i - 1] || '';
          const nextToken = tokens[i + 1] || '';
          if (
            CUSTOMER_MARKERS_KNOWN.has(nextToken) ||
            SPLIT_WORDS.has(nextToken) ||
            i === 0 ||
            i === tokens.length - 1 ||
            prevToken === 'for' ||
            prevToken === 'to'
          ) {
            matches.push({
              ...cust,
              matchScore: 2,
              matchedName: firstName,
              spanStart: i,
              spanEnd: i,
            });
            break;
          }
        }
      }
    }
  }

  if (matches.length === 1) {
    return { customer: matches[0], ambiguous: false, candidates: matches };
  }
  if (matches.length > 1) {
    const sorted = [...matches].sort((a, b) => (b.balance || 0) - (a.balance || 0));
    return { customer: sorted[0], ambiguous: true, candidates: sorted };
  }

  // 3. Detect unknown / new customer cleanly (never capture items/numbers!)
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!/^[a-z]+$/.test(t) || isReservedWord(t, catalogue)) continue;

    const next = tokens[i + 1] || '';
    const next2 = tokens[i + 2] || '';
    const isStrongMarker =
      CUSTOMER_MARKERS_STRONG.has(next) ||
      (next === 'ke' && (next2 === 'khate' || next2 === 'liye')) ||
      (next === 'ka' && next2 === 'khata') ||
      (next === 'ki' && next2 === 'udhari');

    if (isStrongMarker) {
      // Check optional prefix name (e.g. "Amit Sharma ko")
      let startIdx = i;
      let fullName = t.charAt(0).toUpperCase() + t.slice(1);
      if (i > 0 && COMMON_SURNAMES.has(t)) {
        const prevWord = tokens[i - 1];
        if (/^[a-z]+$/.test(prevWord) && !isReservedWord(prevWord, catalogue)) {
          startIdx = i - 1;
          fullName = `${prevWord.charAt(0).toUpperCase() + prevWord.slice(1)} ${fullName}`;
        }
      }
      return {
        customer: { id: null, name: fullName, isNew: true, spanStart: startIdx, spanEnd: i },
        ambiguous: false,
        candidates: [],
      };
    }
  }

  // Check "for <Name>" / "to <Name>"
  for (let i = 0; i < tokens.length - 1; i++) {
    const next = tokens[i + 1];
    if ((tokens[i] === 'for' || tokens[i] === 'to') && /^[a-z]+$/.test(next) && !isReservedWord(next, catalogue)) {
      const capitalized = next.charAt(0).toUpperCase() + next.slice(1);
      return {
        customer: { id: null, name: capitalized, isNew: true, spanStart: i + 1, spanEnd: i + 1 },
        ambiguous: false,
        candidates: [],
      };
    }
  }

  return { customer: null, ambiguous: false, candidates: [] };
}

function removeCustomerTokens(tokens, customer) {
  if (!customer || customer.spanStart === undefined) return tokens;

  const removeIndices = new Set();
  const start = customer.spanStart;
  const end = customer.spanEnd;

  for (let idx = start; idx <= end; idx++) removeIndices.add(idx);

  // Prefix 'for' / 'to'
  if (start > 0 && (tokens[start - 1] === 'for' || tokens[start - 1] === 'to')) {
    removeIndices.add(start - 1);
  }

  // Suffix markers ('ji', 'ko', 'ne', 'ke khate', 'ka khata', etc.)
  let cursor = end + 1;
  if (tokens[cursor] === 'ji') {
    removeIndices.add(cursor);
    cursor++;
  }
  if (tokens[cursor] === 'ko' || tokens[cursor] === 'ne') {
    removeIndices.add(cursor);
    cursor++;
  } else if (
    (tokens[cursor] === 'ke' && (tokens[cursor + 1] === 'khate' || tokens[cursor + 1] === 'liye')) ||
    (tokens[cursor] === 'ka' && tokens[cursor + 1] === 'khata') ||
    (tokens[cursor] === 'ki' && tokens[cursor + 1] === 'udhari')
  ) {
    removeIndices.add(cursor);
    removeIndices.add(cursor + 1);
  } else if (CUSTOMER_MARKERS_KNOWN.has(tokens[cursor])) {
    removeIndices.add(cursor);
  }

  return tokens.filter((_, idx) => !removeIndices.has(idx));
}

function hasAnyWordOrPhrase(tokens, words, phrases) {
  const tokenSet = new Set(tokens);
  for (const w of words) {
    if (tokenSet.has(w)) return true;
  }
  const joined = ` ${tokens.join(' ')} `;
  for (const p of phrases) {
    if (joined.includes(` ${p} `)) return true;
  }
  return false;
}

function detectPaymentMode(tokens, { allowWasooli = false } = {}) {
  const tokenSet = new Set(tokens);
  if (allowWasooli) {
    return { mode: 'WASOOLI', needsModeConfirmation: false };
  }
  for (const w of CASH_WORDS) {
    if (tokenSet.has(w)) return { mode: 'CASH', needsModeConfirmation: false };
  }
  for (const w of UPI_WORDS) {
    if (w.includes(' ')) {
      if (` ${tokens.join(' ')} `.includes(` ${w} `)) {
        return { mode: 'UPI', needsModeConfirmation: false };
      }
    } else if (tokenSet.has(w)) {
      return { mode: 'UPI', needsModeConfirmation: false };
    }
  }
  for (const w of UDHAAR_WORDS) {
    if (tokenSet.has(w)) return { mode: 'UDHAAR', needsModeConfirmation: false };
  }
  return { mode: 'CASH', needsModeConfirmation: true };
}

function removePaymentTokens(tokens) {
  const paymentWords = new Set([
    ...UDHAAR_WORDS, ...CASH_WORDS, ...UPI_WORDS.filter(u => !u.includes(' ')),
    ...STRONG_WASOOLI_WORDS, ...SOFT_WASOOLI_WORDS, 'clear', 'chukta', 'hisab',
    'likho', 'likh', 'diya', 'di', 'de', 'dijiye', 'den', 'liya', 'liye', 'le', 'lo',
    'kharida', 'kharidi', 'kharide', 'kar', 'karo', 'karen', 'kiya', 'kiye',
    'h', 'hai', 'hain', 'tha', 'thi', 'the', 'mein', 'me', 'se',
    'mujhe', 'please', 'plz', 'kal', 'aaj', 'abhi', 'par', 'pe',
  ]);

  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    // Handle 2-word "google pay"
    if (t === 'google' && tokens[i + 1] === 'pay') {
      i++;
      continue;
    }
    if (paymentWords.has(t)) continue;
    out.push(t);
  }
  return out;
}

function buildPhraseMatchers(catalogue) {
  const entries = [];
  const addEntry = (phrase, payload) => {
    const parts = phrase.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return;
    entries.push({ parts, charLen: phrase.length, ...payload });
  };

  // 1. Brand aliases from seedData (including common spoken/ASR spaced forms)
  for (const ba of BRAND_ALIASES) {
    const parentCat = (catalogue || []).find(c => c.id === ba.parentItem);
    if (!parentCat) continue;
    for (const al of (ba.aliases || [])) {
      addEntry(al, {
        item: parentCat,
        brandName: ba.brand,
        brandPrice: ba.price,
        isBrand: true,
      });
      if (al.toLowerCase() === 'parle-g') {
        addEntry('parle g', { item: parentCat, brandName: ba.brand, brandPrice: ba.price, isBrand: true });
        addEntry('parle ji', { item: parentCat, brandName: ba.brand, brandPrice: ba.price, isBrand: true });
      }
    }
  }

  // 2. Custom merchant variants inside catalogue items
  for (const catItem of (catalogue || [])) {
    for (const v of (catItem.variants || [])) {
      const rawBrand = (v.brand || v.name || (v.label || '').replace(/₹\s*\d+/g, '')).trim();
      const lower = rawBrand.toLowerCase();
      if (!lower || /^(standard|mini|pack|\d+.*)$/.test(lower) || lower.length < 2) continue;
      const brandLabel = rawBrand.includes(' ') ? rawBrand : `${rawBrand} ${catItem.name.split(' ')[0]}`;
      const priceVal = Number(v.price) || catItem.rate || 0;
      addEntry(lower, {
        item: catItem,
        brandName: brandLabel,
        brandPrice: priceVal,
        isBrand: true,
      });
      if (lower === 'goodday') {
        addEntry('good day', { item: catItem, brandName: brandLabel, brandPrice: priceVal, isBrand: true });
      }
      if (lower === 'parle-g') {
        addEntry('parle g', { item: catItem, brandName: brandLabel, brandPrice: priceVal, isBrand: true });
        addEntry('parle ji', { item: catItem, brandName: brandLabel, brandPrice: priceVal, isBrand: true });
      }
    }
  }

  // 3. Catalogue aliases + item names
  for (const catItem of (catalogue || [])) {
    for (const al of (catItem.aliases || [])) {
      addEntry(al, { item: catItem, isBrand: false });
    }
    // Also support clean name (without parens) and parenthetical content for user-added items
    const baseName = (catItem.name || '').replace(/\([^)]*\)/g, '').replace(/[/]/g, ' ').trim();
    if (baseName) {
      addEntry(baseName, { item: catItem, isBrand: false });
    }
    const parenMatch = (catItem.name || '').match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      const inner = parenMatch[1].trim();
      if (inner.length >= 2) {
        addEntry(inner, { item: catItem, isBrand: false });
      }
    }
  }

  // Sort: more tokens first, then brands before generic aliases, then longer string
  entries.sort((a, b) => {
    if (b.parts.length !== a.parts.length) return b.parts.length - a.parts.length;
    if (b.isBrand !== a.isBrand) return b.isBrand ? 1 : -1;
    return b.charLen - a.charLen;
  });

  return entries;
}

function isPlainTokenForFuzzy(token) {
  if (!token) return false;
  if (getStrictNumber(token) !== null) return false;
  if (UNIT_ALIASES[token]) return false;
  if (PRICE_MARKERS.includes(token) || CURRENCY_WORDS.has(token)) return false;
  if (UNKNOWN_ITEM_STOPWORDS.has(token)) return false;
  return true;
}

function findItemMatchAt(segmentTokens, i, matchers) {
  // Pass 1: Exact token sequence match
  for (const m of matchers) {
    const len = m.parts.length;
    if (i + len > segmentTokens.length) continue;
    let ok = true;
    for (let j = 0; j < len; j++) {
      if (segmentTokens[i + j] !== m.parts[j]) { ok = false; break; }
    }
    if (ok) return m;
  }

  // Pass 2: Fuzzy token match (handles plurals, double letters, -ie/-i typos like "maggie", "aatta", "biskut")
  for (const m of matchers) {
    const len = m.parts.length;
    if (i + len > segmentTokens.length) continue;
    if (len === 1 && !isPlainTokenForFuzzy(segmentTokens[i])) continue;
    let ok = true;
    for (let j = 0; j < len; j++) {
      if (!fuzzyMatchAlias(segmentTokens[i + j], m.parts[j])) { ok = false; break; }
    }
    if (ok) return m;
  }

  return null;
}

function findItemMatchesInSegment(segmentTokens, matchers) {
  const rawMatches = [];
  let i = 0;
  while (i < segmentTokens.length) {
    const found = findItemMatchAt(segmentTokens, i, matchers);
    if (found) {
      rawMatches.push({
        start: i,
        end: i + found.parts.length - 1,
        item: found.item,
        brandName: found.brandName || null,
        brandPrice: found.brandPrice ?? null,
        isBrand: found.isBrand,
      });
      i += found.parts.length;
    } else {
      i++;
    }
  }

  // Merge adjacent/connected matches pointing to the SAME catalogue item
  // (e.g. "Haldiram ki bhujia", "Sarson ka tel", "Dettol sabun", "Amul doodh")
  const merged = [];
  for (const m of rawMatches) {
    const prev = merged[merged.length - 1];
    if (prev && prev.item.id === m.item.id) {
      const between = segmentTokens.slice(prev.end + 1, m.start);
      const onlyConnectors = between.every(t => t === 'ka' || t === 'ke' || t === 'ki');
      if (onlyConnectors) {
        prev.end = m.end;
        if (m.isBrand && !prev.isBrand) {
          prev.isBrand = true;
          prev.brandName = m.brandName;
          prev.brandPrice = m.brandPrice;
        }
        continue;
      }
    }
    merged.push({ ...m });
  }

  return merged;
}

function normalizeConnectorUnits(seg) {
  const out = [];
  for (let i = 0; i < seg.length; i++) {
    const t = seg[i];
    if ((t === 'ka' || t === 'ke' || t === 'ki') && i > 0 && i + 1 < seg.length) {
      const prev = seg[i - 1];
      const next = seg[i + 1];
      const isNextExplicitUnit = Boolean(UNIT_ALIASES[next] && !SINGLE_CHAR_UNITS.has(next));
      const isPrevPriceNum =
        getStrictNumber(prev) !== null ||
        CURRENCY_WORDS.has(prev) ||
        PRICE_MARKERS.includes(prev);
      if (isNextExplicitUnit && !isPrevPriceNum) {
        continue;
      }
    }
    out.push(t);
  }
  return out;
}

function readPriceAt(arr, i) {
  const t = arr[i];
  if (!t) return null;

  if (t === '₹' || t === 'rs') {
    let priceEnd = i;
    if (i + 2 < arr.length) {
      const comp = wordsToNumber([arr[i + 1], arr[i + 2]]);
      if (comp !== null && comp > 0) priceEnd = i + 2;
    }
    if (priceEnd === i && i + 1 < arr.length) {
      const single = wordsToNumber([arr[i + 1]]);
      if (single !== null && single > 0) priceEnd = i + 1;
    }
    if (priceEnd > i) {
      let hasConnector = false;
      if (priceEnd + 1 < arr.length && PRICE_MARKERS.includes(arr[priceEnd + 1]) && !getUnit(arr[priceEnd + 1], arr[priceEnd])) {
        const m = arr[priceEnd + 1];
        hasConnector = (m === 'ka' || m === 'ke' || m === 'ki' || m === 'wala' || m === 'wali' || m === 'wale');
        priceEnd++;
      }
      return { len: priceEnd - i + 1, hasConnector, isCurrency: true };
    }
  }

  if (i + 2 < arr.length) {
    const comp = wordsToNumber([t, arr[i + 1]]);
    const afterComp = arr[i + 2];
    if (comp !== null && comp > 0 && PRICE_MARKERS.includes(afterComp) && !getUnit(afterComp, arr[i + 1])) {
      let len = 3;
      let hasConnector = (afterComp === 'ka' || afterComp === 'ke' || afterComp === 'ki' || afterComp === 'wala' || afterComp === 'wali' || afterComp === 'wale');
      if (i + 3 < arr.length && ['ka', 'ke', 'ki', 'wala', 'wali', 'wale'].includes(arr[i + 3])) {
        len = 4;
        hasConnector = true;
      }
      return { len, hasConnector, isCurrency: CURRENCY_WORDS.has(afterComp) };
    }
  }

  const num = wordsToNumber([t]);
  if (num !== null && num > 0 && i + 1 < arr.length) {
    const next = arr[i + 1];
    if (PRICE_MARKERS.includes(next) && !getUnit(next, t)) {
      let len = 2;
      let hasConnector = (next === 'ka' || next === 'ke' || next === 'ki' || next === 'wala' || next === 'wali' || next === 'wale');
      if (CURRENCY_WORDS.has(next) && i + 2 < arr.length && ['ka', 'ke', 'ki', 'wala', 'wali', 'wale'].includes(arr[i + 2])) {
        len = 3;
        hasConnector = true;
      }
      return { len, hasConnector, isCurrency: CURRENCY_WORDS.has(next) };
    }
  }

  return null;
}

function readQtyAt(arr, i) {
  if (i + 1 < arr.length) {
    const comp = wordsToNumber([arr[i], arr[i + 1]]);
    if (comp !== null && comp > 0) {
      const u = i + 2 < arr.length ? getUnit(arr[i + 2], arr[i + 1]) : null;
      return { qty: comp, unit: u, len: u ? 3 : 2 };
    }
  }
  const single = wordsToNumber([arr[i]]);
  if (single !== null && single > 0) {
    const u = i + 1 < arr.length ? getUnit(arr[i + 1], arr[i]) : null;
    return { qty: single, unit: u, len: u ? 2 : 1 };
  }
  return null;
}

function isItemNounStart(arr, i, matchers) {
  if (i >= arr.length) return { isItem: false, len: 0 };
  const m = findItemMatchAt(arr, i, matchers);
  if (m) return { isItem: true, len: m.parts.length };
  const t = arr[i];
  if (
    /^[a-z]{2,}$/.test(t) &&
    getStrictNumber(t) === null &&
    !UNIT_ALIASES[t] &&
    !PRICE_MARKERS.includes(t) &&
    !CURRENCY_WORDS.has(t) &&
    !UNKNOWN_ITEM_STOPWORDS.has(t)
  ) {
    return { isItem: true, len: 1 };
  }
  return { isItem: false, len: 0 };
}

function nextItemHasOwnModifier(arr, afterIdx, matchers) {
  let k = afterIdx;
  if (k >= arr.length) return false;
  const itemInfo = isItemNounStart(arr, k, matchers);
  if (!itemInfo.isItem) return false;
  k += itemInfo.len;
  // Allow same-item connector words like "haldiram ki bhujia" / "parle g"
  while (k < arr.length && (arr[k] === 'ka' || arr[k] === 'ke' || arr[k] === 'ki')) {
    const nextInfo = isItemNounStart(arr, k + 1, matchers);
    if (!nextInfo.isItem) break;
    k += 1 + nextInfo.len;
  }
  if (k >= arr.length) return false;
  return Boolean(readPriceAt(arr, k) || readQtyAt(arr, k));
}

function splitRunOnSegment(seg, matchers) {
  const tokens = normalizeConnectorUnits(seg);
  if (tokens.length <= 1) return [tokens];

  const startsWithItem =
    !readPriceAt(tokens, 0) &&
    !readQtyAt(tokens, 0) &&
    isItemNounStart(tokens, 0, matchers).isItem;

  const segments = [];
  let cur = [];
  let seenItem = false;
  let seenPreMod = false;
  let seenPostQty = false;
  let lastPostUnit = null;
  let seenPrice = false;

  const flush = () => {
    if (cur.length > 0) segments.push(cur);
    cur = [];
    seenItem = false;
    seenPreMod = false;
    seenPostQty = false;
    lastPostUnit = null;
    seenPrice = false;
  };

  let i = 0;
  while (i < tokens.length) {
    const price = readPriceAt(tokens, i);
    if (price) {
      const afterIdx = i + price.len;
      const introducesNextItem =
        price.hasConnector &&
        afterIdx < tokens.length &&
        !readQtyAt(tokens, afterIdx) &&
        !readPriceAt(tokens, afterIdx) &&
        isItemNounStart(tokens, afterIdx, matchers).isItem;

      if (seenItem && (seenPrice || introducesNextItem)) {
        flush();
      }
      for (let k = 0; k < price.len; k++) cur.push(tokens[i + k]);
      seenPrice = true;
      if (!seenItem) seenPreMod = true;
      i += price.len;
      continue;
    }

    const qtyObj = readQtyAt(tokens, i);
    if (qtyObj) {
      if (seenItem) {
        const isMixedPostUnit =
          !seenPreMod &&
          seenPostQty &&
          ((lastPostUnit === 'kg' && qtyObj.unit === 'gm') || (lastPostUnit === 'L' && qtyObj.unit === 'ml'));

        if (!isMixedPostUnit) {
          if (seenPreMod || seenPostQty) {
            flush();
          } else {
            const afterIdx = i + qtyObj.len;
            const keepAsPostMod =
              afterIdx >= tokens.length ||
              Boolean(readPriceAt(tokens, afterIdx) || readQtyAt(tokens, afterIdx)) ||
              (startsWithItem && nextItemHasOwnModifier(tokens, afterIdx, matchers));
            if (!keepAsPostMod) {
              flush();
            }
          }
        }
      }
      for (let k = 0; k < qtyObj.len; k++) cur.push(tokens[i + k]);
      if (seenItem) {
        seenPostQty = true;
        if (qtyObj.unit) lastPostUnit = qtyObj.unit;
      } else {
        seenPreMod = true;
      }
      i += qtyObj.len;
      continue;
    }

    const loneUnit = getUnit(tokens[i], tokens[i - 1]);
    if (loneUnit) {
      cur.push(tokens[i]);
      if (seenItem) {
        seenPostQty = true;
        lastPostUnit = loneUnit;
      } else {
        seenPreMod = true;
      }
      i++;
      continue;
    }

    const knownMatch = findItemMatchAt(tokens, i, matchers);
    if (knownMatch) {
      const mLen = knownMatch.parts.length;
      if (seenItem && (seenPostQty || seenPrice)) {
        flush();
      }
      for (let k = 0; k < mLen; k++) cur.push(tokens[i + k]);
      seenItem = true;
      i += mLen;
      continue;
    }

    const t = tokens[i];
    if (
      t === 'ka' ||
      t === 'ke' ||
      t === 'ki' ||
      UNKNOWN_ITEM_STOPWORDS.has(t) ||
      CURRENCY_WORDS.has(t) ||
      PRICE_MARKERS.includes(t)
    ) {
      cur.push(t);
      i++;
      continue;
    }

    // Potential unknown item noun (e.g. "ball", "bat", "notebook")
    if (seenItem && (seenPostQty || seenPrice)) {
      flush();
    }
    cur.push(t);
    seenItem = true;
    i++;
  }

  flush();
  return segments;
}

function hasModifier(tokens, { isTrailing = false } = {}) {
  if (!tokens || tokens.length === 0) return false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '₹' || t === 'rs') return true;
    if (getUnit(t, tokens[i - 1])) return true;
    if (t === 'do' && isTrailing && i === tokens.length - 1) continue;
    if (getStrictNumber(t) !== null) return true;
  }
  return false;
}

function extractModifiersFromSlice(arr, state, { ignoreTrailingDo = false } = {}) {
  const consumed = new Set();

  // Optional: strip trailing verb 'do' ("1 kilo chini do")
  const effectiveLen =
    ignoreTrailingDo && arr.length > 0 && arr[arr.length - 1] === 'do'
      ? arr.length - 1
      : arr.length;
  if (effectiveLen < arr.length) {
    consumed.add(arr.length - 1);
  }

  // Pass 1: Detect explicit price overrides ("₹40", "40 ka", "40 wala", "40 rupaye")
  for (let i = 0; i < effectiveLen; i++) {
    if (consumed.has(i)) continue;
    const t = arr[i];

    // Pattern A: "₹ 40" or "rs 40" or "₹ do sau"
    if (t === '₹' || t === 'rs') {
      let priceVal = null;
      let priceEnd = i;
      if (i + 2 < effectiveLen) {
        const comp = wordsToNumber([arr[i + 1], arr[i + 2]]);
        if (comp !== null && comp > 0) { priceVal = comp; priceEnd = i + 2; }
      }
      if (priceVal === null && i + 1 < effectiveLen) {
        const single = wordsToNumber([arr[i + 1]]);
        if (single !== null && single > 0) { priceVal = single; priceEnd = i + 1; }
      }
      if (priceVal !== null) {
        state.unitPrice = priceVal;
        state.isPriceOverride = true;
        consumed.add(i);
        for (let k = i + 1; k <= priceEnd; k++) consumed.add(k);
        if (priceEnd + 1 < effectiveLen && PRICE_MARKERS.includes(arr[priceEnd + 1])) {
          consumed.add(priceEnd + 1);
        }
        continue;
      }
    }

    // Pattern B: "do sau ka" / "200 rupaye"
    if (i + 2 < effectiveLen) {
      const comp = wordsToNumber([arr[i], arr[i + 1]]);
      const afterComp = arr[i + 2];
      if (comp !== null && comp > 0 && PRICE_MARKERS.includes(afterComp) && !getUnit(afterComp, arr[i + 1])) {
        state.unitPrice = comp;
        state.isPriceOverride = true;
        consumed.add(i);
        consumed.add(i + 1);
        consumed.add(i + 2);
        if (i + 3 < effectiveLen && (arr[i + 3] === 'ka' || arr[i + 3] === 'ke' || arr[i + 3] === 'ki' || arr[i + 3] === 'wala' || arr[i + 3] === 'wali' || arr[i + 3] === 'wale')) {
          consumed.add(i + 3);
        }
        i += 2;
        continue;
      }
    }

    // Pattern C: "40 ka" / "40 wala" / "40 rupaye" / "40 ₹"
    const num = wordsToNumber([t]);
    if (num !== null && num > 0 && i + 1 < effectiveLen) {
      const next = arr[i + 1];
      if (PRICE_MARKERS.includes(next) && !getUnit(next, t)) {
        state.unitPrice = num;
        state.isPriceOverride = true;
        consumed.add(i);
        consumed.add(i + 1);
        if (CURRENCY_WORDS.has(next) && i + 2 < effectiveLen && (arr[i + 2] === 'ka' || arr[i + 2] === 'ke' || arr[i + 2] === 'ki' || arr[i + 2] === 'wala' || arr[i + 2] === 'wali' || arr[i + 2] === 'wale')) {
          consumed.add(i + 2);
        }
        i++;
        continue;
      }
    }
  }

  // Pass 2: Extract quantities & units (supports compound fractions and mixed kg + gm / L + ml)
  const qtyEntries = [];
  for (let i = 0; i < effectiveLen; i++) {
    if (consumed.has(i)) continue;

    // 2-word compound number / fraction (e.g. "ek paav", "sadhe teen", "dhai sau")
    if (i + 1 < effectiveLen && !consumed.has(i + 1)) {
      const comp = wordsToNumber([arr[i], arr[i + 1]]);
      if (comp !== null && comp > 0) {
        consumed.add(i);
        consumed.add(i + 1);
        let u = null;
        if (i + 2 < effectiveLen && !consumed.has(i + 2)) {
          u = getUnit(arr[i + 2], arr[i + 1]);
          if (u) {
            consumed.add(i + 2);
            i += 2;
          } else {
            i += 1;
          }
        } else {
          i += 1;
        }
        qtyEntries.push({ qty: comp, unit: u });
        continue;
      }
    }

    const num = wordsToNumber([arr[i]]);
    if (num !== null && num > 0) {
      consumed.add(i);
      let u = null;
      if (i + 1 < effectiveLen && !consumed.has(i + 1)) {
        u = getUnit(arr[i + 1], arr[i]);
        if (u) {
          consumed.add(i + 1);
          i++;
        }
      }
      qtyEntries.push({ qty: num, unit: u });
      continue;
    }

    const loneUnit = getUnit(arr[i], arr[i - 1]);
    if (loneUnit && !state.unit) {
      state.unit = loneUnit;
      consumed.add(i);
    }
  }

  if (qtyEntries.length === 2 && qtyEntries[0].unit === 'kg' && qtyEntries[1].unit === 'gm') {
    state.qty = qtyEntries[0].qty + qtyEntries[1].qty / 1000;
    state.unit = 'kg';
  } else if (qtyEntries.length === 2 && qtyEntries[0].unit === 'L' && qtyEntries[1].unit === 'ml') {
    state.qty = qtyEntries[0].qty + qtyEntries[1].qty / 1000;
    state.unit = 'L';
  } else if (qtyEntries.length > 0 && state.qty === null) {
    state.qty = qtyEntries[0].qty;
    if (qtyEntries[0].unit) state.unit = qtyEntries[0].unit;
  }

  return consumed;
}

function buildParsedItem(match, prefixTokens, suffixTokens, { isLastSegment = false } = {}) {
  const modState = { qty: null, unit: null, unitPrice: null, isPriceOverride: false };

  const prefixConsumed = extractModifiersFromSlice(prefixTokens, modState, { ignoreTrailingDo: false });
  const suffixConsumed = extractModifiersFromSlice(suffixTokens, modState, {
    ignoreTrailingDo: isLastSegment || (modState.qty !== null || modState.isPriceOverride),
  });

  let qty = modState.qty !== null ? modState.qty : 1;
  let unit = modState.unit || match.item.unit;

  // Convert grams -> kg / ml -> L / dozen -> pc when aligned with catalogue unit
  if (unit === 'gm' && match.item.unit === 'kg') {
    qty = qty / 1000;
    unit = 'kg';
  } else if (unit === 'ml' && match.item.unit === 'L') {
    qty = qty / 1000;
    unit = 'L';
  } else if (unit === 'dozen' && match.item.unit === 'pc') {
    qty = qty * 12;
    unit = 'pc';
  }

  let unitPrice = modState.unitPrice;
  let needsPriceSelection = false;

  const defaultMultiIdx = (match.item.variants?.length || 0) >= 4 ? 2 : 0;

  if (unitPrice === null) {
    if (match.isBrand && match.brandPrice !== null) {
      unitPrice = match.brandPrice;
    } else if (match.item.isMultiBrand) {
      needsPriceSelection = true;
      unitPrice = match.item.variants?.[defaultMultiIdx]?.price ?? match.item.rate ?? 0;
    } else {
      unitPrice = match.item.rate || 0;
    }
  }

  const suggestedIdx = match.item.isMultiBrand ? defaultMultiIdx : null;

  return {
    item: {
      name: match.isBrand && match.brandName ? match.brandName : match.item.name,
      catalogueId: match.item.id,
      qty: Math.round(qty * 1000) / 1000,
      unit,
      unitPrice,
      total: Math.round(qty * unitPrice * 100) / 100,
      needsPriceSelection: needsPriceSelection && !modState.isPriceOverride,
      isMultiBrand: match.item.isMultiBrand || false,
      variants: match.item.variants || null,
      suggestedVariantIndex: suggestedIdx,
    },
    prefixConsumed,
    suffixConsumed,
  };
}

function collectResidualItems(sliceTokens, consumedSet, isLastSegment) {
  if (!sliceTokens || sliceTokens.length === 0) return [];
  const runs = [];
  let run = [];
  for (let i = 0; i < sliceTokens.length; i++) {
    if (consumedSet && consumedSet.has(i)) {
      if (run.length > 0) {
        runs.push(run);
        run = [];
      }
    } else {
      run.push(sliceTokens[i]);
    }
  }
  if (run.length > 0) runs.push(run);

  const residualItems = [];
  for (let rIdx = 0; rIdx < runs.length; rIdx++) {
    const manual = tryBuildUnknownItem(runs[rIdx], true, isLastSegment && rIdx === runs.length - 1);
    if (manual) residualItems.push(manual);
  }
  return residualItems;
}

function tryBuildUnknownItem(segmentTokens, isMultiClause, isLastSegment) {
  const modState = { qty: null, unit: null, unitPrice: null, isPriceOverride: false };
  extractModifiersFromSlice(segmentTokens, modState, { ignoreTrailingDo: isLastSegment });

  // Identify remaining non-numeric, non-unit, non-stopword noun words
  const nounWords = [];
  for (let i = 0; i < segmentTokens.length; i++) {
    const t = segmentTokens[i];
    if (t === '₹' || t === 'rs') continue;
    if (getStrictNumber(t) !== null) continue;
    if (getUnit(t, segmentTokens[i - 1])) continue;
    if (PRICE_MARKERS.includes(t) || CURRENCY_WORDS.has(t)) continue;
    if (UNKNOWN_ITEM_STOPWORDS.has(t)) continue;
    if (!/^[a-z]+$/.test(t) || t.length < 2) continue;
    nounWords.push(t);
  }

  if (nounWords.length === 0) return null;

  // Require an actual quantity, unit, price, or multi-clause list context before creating manual item
  const hasExplicitModifier = modState.qty !== null || modState.unit !== null || modState.isPriceOverride;
  if (!hasExplicitModifier && !isMultiClause) return null;

  const qty = modState.qty !== null ? modState.qty : 1;
  const rawUnit = modState.unit || 'pc';
  let unit = rawUnit;
  let finalQty = qty;
  if (rawUnit === 'gm' && qty >= 1000) {
    finalQty = qty / 1000;
    unit = 'kg';
  }

  const unitPrice = modState.unitPrice !== null ? modState.unitPrice : null;
  const total = unitPrice !== null ? Math.round(finalQty * unitPrice * 100) / 100 : 0;
  const displayName = nounWords
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    name: displayName,
    catalogueId: null,
    qty: Math.round(finalQty * 1000) / 1000,
    unit,
    unitPrice,
    total,
    needsPriceSelection: unitPrice === null || unitPrice === 0,
    isMultiBrand: false,
    variants: null,
    suggestedVariantIndex: null,
    isManual: true,
  };
}

function parseItemClauses(tokens, catalogue) {
  const matchers = buildPhraseMatchers(catalogue);

  // Split by explicit list/conjunction markers: ',', 'aur', 'and', 'or', 'plus', 'bhi', 'tatha', 'evam', 'fir', 'phir'
  const coarseSegments = [];
  let current = [];
  for (const t of tokens) {
    if (SPLIT_WORDS.has(t)) {
      if (current.length > 0) coarseSegments.push(current);
      current = [];
    } else {
      current.push(t);
    }
  }
  if (current.length > 0) coarseSegments.push(current);

  // Pre-segment run-on clauses at quantity/number boundaries & "<item> ke/ka/ki <unit>"
  const fineSegments = [];
  for (const seg of coarseSegments) {
    const subSegs = splitRunOnSegment(seg, matchers);
    for (const s of subSegs) {
      if (s.length > 0) fineSegments.push(s);
    }
  }

  const items = [];
  for (let segIdx = 0; segIdx < fineSegments.length; segIdx++) {
    const seg = fineSegments[segIdx];
    const isLastSegment = segIdx === fineSegments.length - 1;
    const matches = findItemMatchesInSegment(seg, matchers);

    if (matches.length === 0) {
      const manualItem = tryBuildUnknownItem(seg, fineSegments.length > 1, isLastSegment);
      if (manualItem) items.push(manualItem);
      continue;
    }

    if (matches.length === 1) {
      const m = matches[0];
      const prefix = seg.slice(0, m.start);
      const suffix = seg.slice(m.end + 1);
      const built = buildParsedItem(m, prefix, suffix, { isLastSegment });

      const preResiduals = collectResidualItems(prefix, built.prefixConsumed, false);
      items.push(...preResiduals);
      items.push(built.item);
      const postResiduals = collectResidualItems(suffix, built.suffixConsumed, isLastSegment);
      items.push(...postResiduals);
      continue;
    }

    // Multiple items found inside a single segment (e.g. "aata chini dal chawal", "aata chini ball")
    const gaps = [];
    gaps.push(seg.slice(0, matches[0].start));
    for (let j = 1; j < matches.length; j++) {
      gaps.push(seg.slice(matches[j - 1].end + 1, matches[j].start));
    }
    gaps.push(seg.slice(matches[matches.length - 1].end + 1));

    const firstGap = gaps[0];
    const lastGap = gaps[gaps.length - 1];
    const preHasMod = hasModifier(firstGap, { isTrailing: false });
    const postHasMod = hasModifier(lastGap, { isTrailing: isLastSegment });

    const usePostOrder = !preHasMod && postHasMod;

    for (let j = 0; j < matches.length; j++) {
      let prefix = [];
      let suffix = [];
      const isLastMatch = j === matches.length - 1;
      if (usePostOrder) {
        prefix = j === 0 ? firstGap : [];
        suffix = gaps[j + 1];
      } else {
        prefix = gaps[j];
        if (isLastMatch && postHasMod) {
          suffix = lastGap;
        }
      }

      const built = buildParsedItem(matches[j], prefix, suffix, {
        isLastSegment: isLastSegment && isLastMatch,
      });

      const preResiduals = collectResidualItems(prefix, built.prefixConsumed, false);
      items.push(...preResiduals);
      items.push(built.item);
      const postResiduals = collectResidualItems(
        suffix,
        built.suffixConsumed,
        isLastSegment && isLastMatch
      );
      items.push(...postResiduals);

      // Handle unattached trailing tokens after last known match (e.g. "aata chini ball")
      if (!usePostOrder && isLastMatch && !postHasMod && lastGap.length > 0) {
        const trailingResiduals = collectResidualItems(lastGap, null, isLastSegment);
        items.push(...trailingResiduals);
      }
    }
  }

  return items;
}

export function parseHinglishTransaction(transcript, catalogue, customers) {
  const startTime = performance.now();
  const normalized = normalizeText(transcript);
  const tokens = normalized.split(' ').filter(Boolean);

  // 1. Detect customer first (preserving exact span so customer words don't leak or wipe items)
  const customerResult = detectCustomer(tokens, customers, catalogue);
  const tokensNoCustomer = removeCustomerTokens(tokens, customerResult.customer);

  // 2. Check wasooli signals & payment mode BEFORE stripping payment words
  const tokensForMode = tokensNoCustomer.filter(t => t !== ',');
  const hasStrongWasooli = hasAnyWordOrPhrase(tokensForMode, STRONG_WASOOLI_WORDS, STRONG_WASOOLI_PHRASES);
  const hasSoftWasooli = hasAnyWordOrPhrase(tokensForMode, SOFT_WASOOLI_WORDS, SOFT_WASOOLI_PHRASES);

  // 3. Clean filler/payment words (keeping '₹', 'rs', 'rupaye', 'ka', 'wala', ',', 'aur') & parse items
  const itemTokens = removePaymentTokens(tokensNoCustomer);
  const items = parseItemClauses(itemTokens, catalogue);

  // 4. Determine WASOOLI vs SALE: only treat as WASOOLI when no sale items exist (or explicit wasooli/jama without items)
  const isWasooli = (hasStrongWasooli || hasSoftWasooli) && items.length === 0;

  let result;

  if (isWasooli) {
    let amount = 0;
    const amtTokens = tokensNoCustomer.filter(t => t !== ',');
    // Ignore trailing 'do' verb (e.g. "200 rupaye jama kar do")
    const effectiveAmtTokens = amtTokens[amtTokens.length - 1] === 'do'
      ? amtTokens.slice(0, -1)
      : amtTokens;

    for (let i = 0; i < effectiveAmtTokens.length; i++) {
      if (i + 1 < effectiveAmtTokens.length) {
        const comp = wordsToNumber([effectiveAmtTokens[i], effectiveAmtTokens[i + 1]]);
        if (comp !== null && comp > 0) {
          const next = effectiveAmtTokens[i + 2] || '';
          if (!getUnit(next, effectiveAmtTokens[i + 1])) {
            amount = comp;
            i++;
            continue;
          }
        }
      }
      const num = wordsToNumber([effectiveAmtTokens[i]]);
      if (num !== null && num > 0) {
        const next = effectiveAmtTokens[i + 1] || '';
        if (!getUnit(next, effectiveAmtTokens[i])) {
          amount = num;
        }
      }
    }

    let wasooliMode = 'CASH';
    const modeSet = new Set(tokensForMode);
    for (const w of UPI_WORDS) {
      if (w.includes(' ') ? ` ${tokensForMode.join(' ')} `.includes(` ${w} `) : modeSet.has(w)) {
        wasooliMode = 'UPI';
      }
    }
    for (const w of CASH_WORDS) {
      if (modeSet.has(w)) wasooliMode = 'CASH';
    }

    result = {
      type: 'WASOOLI',
      customer: customerResult.customer,
      customerAmbiguous: customerResult.ambiguous,
      customerCandidates: customerResult.candidates,
      isNewCustomer: customerResult.customer?.isNew || false,
      items: [],
      total: amount,
      mode: wasooliMode,
      needsModeConfirmation: false,
      transcript: transcript,
      parseTimeMs: 0,
    };
  } else {
    const paymentResult = detectPaymentMode(tokensForMode, { allowWasooli: false });
    const total = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;

    result = {
      type: 'SALE',
      customer: customerResult.customer,
      customerAmbiguous: customerResult.ambiguous,
      customerCandidates: customerResult.candidates,
      isNewCustomer: customerResult.customer?.isNew || false,
      items,
      total,
      mode: paymentResult.mode,
      needsModeConfirmation: paymentResult.needsModeConfirmation,
      transcript: transcript,
      parseTimeMs: 0,
    };
  }

  result.parseTimeMs = Math.round((performance.now() - startTime) * 10) / 10;
  return result;
}
