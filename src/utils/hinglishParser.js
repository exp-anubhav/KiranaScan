import { BRAND_ALIASES } from '../data/seedData.js';
import { hindiToHinglish } from './devanagariTransliterator.js';

const HINDI_NUMBERS = {
  'ek': 1, 'a': 1, 'one': 1, 'do': 2, 'two': 2, 'teen': 3, 'three': 3, 'tin': 3,
  'char': 4, 'four': 4, 'chaar': 4, 'paanch': 5, 'panch': 5, 'five': 5,
  'chhe': 6, 'six': 6, 'chhah': 6, 'saat': 7, 'seven': 7, 'aath': 8, 'eight': 8,
  'nau': 9, 'nine': 9, 'das': 10, 'ten': 10, 'gyarah': 11, 'barah': 12,
  'terah': 13, 'chaudah': 14, 'pandrah': 15, 'bees': 20, 'twenty': 20,
  'pachees': 25, 'tees': 30, 'thirty': 30, 'paintees': 35, 'chalis': 40, 'forty': 40,
  'pachaas': 50, 'fifty': 50, 'saath': 60, 'sattar': 70, 'assi': 80, 'nabbe': 90,
  'sau': 100, 'hundred': 100, 'do sau': 200, 'teen sau': 300, 'paanch sau': 500, 'hazaar': 1000
};

const FRACTION_WORDS = {
  'aadha': 0.5, 'adha': 0.5, 'half': 0.5,
  'paav': 0.25, 'pao': 0.25, 'pav': 0.25, 'quarter': 0.25,
  'paune': 0.75, 'sawa': 1.25, 'dedh': 1.5, 'dhai': 2.5, 'dhaai': 2.5,
};

const COMPOUND_FRACTIONS = {
  'ek paav': 0.25, 'ek pao': 0.25, 'ek pav': 0.25,
  'sadhe teen': 3.5, 'saadhe teen': 3.5, 'sadhe char': 4.5, 'sadhe paanch': 5.5,
};

const UNIT_ALIASES = {
  'kilo': 'kg', 'kg': 'kg', 'kilogram': 'kg',
  'gram': 'gm', 'gm': 'gm', 'g': 'gm',
  'liter': 'L', 'litre': 'L', 'ltr': 'L', 'l': 'L',
  'packet': 'pkt', 'pkt': 'pkt', 'pack': 'pkt',
  'piece': 'pc', 'pc': 'pc', 'nag': 'pc', 'dana': 'pc'
};

const PRICE_MARKERS = ['wala', 'wali', 'wale', 'ka', 'ke', 'ki', 'rupaye', 'rupaya', 'rs', '₹', 'rupaiye', 'rupye'];
const UDHAAR_WORDS = ['udhaar', 'udhar', 'khate', 'khata', 'baaki', 'baki', 'credit', 'likho', 'likh'];
const CASH_WORDS = ['cash', 'nagad', 'naqad', 'nakad'];
const UPI_WORDS = ['upi', 'online', 'gpay', 'phonepe', 'paytm', 'google pay'];
const WASOOLI_WORDS = ['jama', 'wasooli', 'wasuli', 'wapas', 'payment', 'chuka', 'bharpai', 'de diye', 'diye'];
const SPLIT_WORDS = ['aur', 'and', 'plus', 'bhi'];
const CUSTOMER_MARKERS_AFTER = ['ko', 'ne', 'ka', 'ke', 'ki', 'ji'];
const CUSTOMER_MARKERS_PHRASES = ['ke khate', 'ka khata', 'ke liye', 'for', 'to'];

function normalizeText(text) {
  const transliterated = hindiToHinglish(text || '');
  return transliterated
    .toLowerCase()
    .replace(/₹/g, ' ₹ ')
    .replace(/[,।!?.;:'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordsToNumber(words) {
  const joined = words.join(' ');
  for (const [phrase, val] of Object.entries(COMPOUND_FRACTIONS)) {
    if (joined.includes(phrase)) return val;
  }
  if (words.length === 1) {
    const w = words[0];
    if (FRACTION_WORDS[w] !== undefined) return FRACTION_WORDS[w];
    if (HINDI_NUMBERS[w] !== undefined) return HINDI_NUMBERS[w];
    const n = parseFloat(w);
    if (!isNaN(n)) return n;
  }
  if (words.length === 2) {
    const [a, b] = words;
    const na = HINDI_NUMBERS[a] !== undefined ? HINDI_NUMBERS[a] : parseFloat(a);
    const nb = HINDI_NUMBERS[b] !== undefined ? HINDI_NUMBERS[b] : parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) {
      if (nb === 100) return na * 100;
      if (nb === 1000) return na * 1000;
    }
    const compKey = `${a} ${b}`;
    if (HINDI_NUMBERS[compKey] !== undefined) return HINDI_NUMBERS[compKey];
  }
  return null;
}

function detectCustomer(tokens, customers) {
  const text = tokens.join(' ');
  let matches = [];

  // Try full name match first
  for (const cust of customers) {
    const nameLower = cust.name.toLowerCase();
    if (text.includes(nameLower)) {
      matches.push({ ...cust, matchScore: 3, matchedName: cust.name });
    }
  }
  if (matches.length === 1) return { customer: matches[0], ambiguous: false, candidates: matches };

  // Try first name match
  if (matches.length === 0) {
    for (const cust of customers) {
      const firstName = cust.name.split(' ')[0].toLowerCase();
      if (firstName.length < 2) continue;
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === firstName || tokens[i] === firstName + 'ji' || tokens[i] === firstName) {
          // check if next token is a customer marker
          const nextToken = tokens[i + 1] || '';
          if (CUSTOMER_MARKERS_AFTER.includes(nextToken) || i === tokens.length - 1 || SPLIT_WORDS.includes(nextToken)) {
            matches.push({ ...cust, matchScore: 2, matchedName: firstName });
          }
        }
      }
      // Also check for "ji" suffix like "sunita ji"
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i] === firstName && tokens[i + 1] === 'ji') {
          if (!matches.find(m => m.id === cust.id)) {
            matches.push({ ...cust, matchScore: 2, matchedName: firstName });
          }
        }
      }
    }
  }

  // Check for unknown customer name patterns: "<Name> ko", "<Name> ne", "for <Name>"
  if (matches.length === 0) {
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const next = tokens[i + 1] || '';
      if (CUSTOMER_MARKERS_AFTER.includes(next) && !isReservedWord(t)) {
        const capitalized = t.charAt(0).toUpperCase() + t.slice(1);
        return {
          customer: { id: null, name: capitalized, isNew: true },
          ambiguous: false,
          candidates: []
        };
      }
    }
    // Check "for <Name>" pattern
    for (let i = 0; i < tokens.length - 1; i++) {
      if ((tokens[i] === 'for' || tokens[i] === 'to') && !isReservedWord(tokens[i + 1])) {
        const capitalized = tokens[i + 1].charAt(0).toUpperCase() + tokens[i + 1].slice(1);
        return {
          customer: { id: null, name: capitalized, isNew: true },
          ambiguous: false,
          candidates: []
        };
      }
    }
  }

  if (matches.length === 0) return { customer: null, ambiguous: false, candidates: [] };
  if (matches.length === 1) return { customer: matches[0], ambiguous: false, candidates: matches };

  // Multiple matches - ambiguity (e.g., two Ramesh's)
  // Default to the one with higher balance
  const sorted = [...matches].sort((a, b) => b.balance - a.balance);
  return { customer: sorted[0], ambiguous: true, candidates: sorted };
}

function isReservedWord(word) {
  const reserved = new Set([
    ...Object.keys(HINDI_NUMBERS), ...Object.keys(FRACTION_WORDS),
    ...Object.keys(UNIT_ALIASES), ...PRICE_MARKERS, ...UDHAAR_WORDS,
    ...CASH_WORDS, ...UPI_WORDS, ...WASOOLI_WORDS, ...SPLIT_WORDS,
    ...CUSTOMER_MARKERS_AFTER, 'h', 'hai', 'the', 'tha', 'mein', 'me', 'se', 'diya', 'diye',
    'liya', 'liye', 'kharida', 'kharidi', 'rupaye', 'rupaya', 'aur', 'packet', 'kilo', 'liter',
    'litre', 'wala', 'wali', 'wale', 'ka', 'ke', 'ki', 'ko', 'ne', 'ji', 'sir', 'bhai',
    'madam', 'didi', 'bhaiya', 'sahab', 'sahib', 'mein', 'mai', 'hain',
  ]);
  return reserved.has(word);
}

function detectPaymentMode(tokens) {
  const text = tokens.join(' ');
  for (const w of WASOOLI_WORDS) {
    if (text.includes(w)) return { mode: 'WASOOLI', needsModeConfirmation: false };
  }
  for (const w of UDHAAR_WORDS) {
    if (tokens.includes(w)) return { mode: 'UDHAAR', needsModeConfirmation: false };
  }
  for (const w of CASH_WORDS) {
    if (tokens.includes(w)) return { mode: 'CASH', needsModeConfirmation: false };
  }
  for (const w of UPI_WORDS) {
    if (text.includes(w)) return { mode: 'UPI', needsModeConfirmation: false };
  }
  return { mode: 'UDHAAR', needsModeConfirmation: true };
}

function detectWasooli(tokens) {
  const text = tokens.join(' ');
  for (const w of WASOOLI_WORDS) {
    if (text.includes(w)) return true;
  }
  return false;
}

function parseItemClauses(tokens, catalogue) {
  // Remove customer-related tokens and payment mode tokens
  const cleanTokens = [...tokens];
  const text = cleanTokens.join(' ');

  // Split by "aur", "and", "plus"
  const clauses = [];
  let current = [];
  for (const t of cleanTokens) {
    if (SPLIT_WORDS.includes(t)) {
      if (current.length > 0) clauses.push(current);
      current = [];
    } else {
      current.push(t);
    }
  }
  if (current.length > 0) clauses.push(current);

  const items = [];
  for (const clause of clauses) {
    const item = parseItemClause(clause, catalogue);
    if (item) items.push(item);
  }

  // If no items found from clauses, try the whole thing as one clause
  if (items.length === 0) {
    const item = parseItemClause(cleanTokens, catalogue);
    if (item) items.push(item);
  }

  return items;
}

function parseItemClause(clauseTokens, catalogue) {
  let qty = null;
  let unitPrice = null;
  let unit = null;
  let matchedItem = null;
  let brandMatch = null;
  let needsPriceSelection = false;
  let isPriceOverride = false;

  // First check brand aliases
  const clauseText = clauseTokens.join(' ');
  for (const ba of BRAND_ALIASES) {
    for (const alias of ba.aliases) {
      if (clauseText.includes(alias)) {
        brandMatch = ba;
        matchedItem = catalogue.find(c => c.id === ba.parentItem);
        unitPrice = ba.price;
        break;
      }
    }
    if (brandMatch) break;
  }

  // Detect price override pattern: "40 ka sabun", "40 wala", "₹40"
  for (let i = 0; i < clauseTokens.length; i++) {
    const num = wordsToNumber([clauseTokens[i]]);
    if (num !== null && num > 0) {
      const next = clauseTokens[i + 1] || '';
      if (PRICE_MARKERS.includes(next)) {
        unitPrice = num;
        isPriceOverride = true;
        if (qty === null) qty = 1;
      }
    }
    if (clauseTokens[i] === '₹') {
      const next = clauseTokens[i + 1] || '';
      const n = parseFloat(next);
      if (!isNaN(n)) {
        unitPrice = n;
        isPriceOverride = true;
        if (qty === null) qty = 1;
      }
    }
  }

  // Find matching catalogue item
  if (!matchedItem) {
    for (const catItem of (catalogue || [])) {
      for (const alias of (catItem.aliases || [])) {
        if (clauseText.includes(alias)) {
          if (!matchedItem || alias.length > (matchedItem._matchLen || 0)) {
            matchedItem = { ...catItem, _matchLen: alias.length };
          }
        }
      }
    }
  }

  if (!matchedItem) return null;

  // Detect quantity
  for (let i = 0; i < clauseTokens.length; i++) {
    // Check for compound fractions first
    if (i < clauseTokens.length - 1) {
      const compound = wordsToNumber([clauseTokens[i], clauseTokens[i + 1]]);
      if (compound !== null) {
        const afterCompound = clauseTokens[i + 2] || '';
        if (UNIT_ALIASES[afterCompound] || (matchedItem.aliases || []).includes(afterCompound) || !PRICE_MARKERS.includes(clauseTokens[i + 2] || '')) {
          if (!isPriceOverride || UNIT_ALIASES[afterCompound]) {
            qty = compound;
            if (UNIT_ALIASES[afterCompound]) unit = UNIT_ALIASES[afterCompound];
            i++;
            continue;
          }
        }
      }
    }

    const num = wordsToNumber([clauseTokens[i]]);
    if (num !== null && num > 0) {
      const next = clauseTokens[i + 1] || '';
      const prev = clauseTokens[i - 1] || '';

      // Skip if this was already captured as a price
      if (PRICE_MARKERS.includes(next) && !UNIT_ALIASES[next]) continue;

      if (UNIT_ALIASES[next]) {
        qty = num;
        unit = UNIT_ALIASES[next];
      } else if (!isPriceOverride || unitPrice !== num) {
        // This number is quantity if not a price
        if (qty === null) qty = num;
      }
    }
    if (UNIT_ALIASES[clauseTokens[i]] && !unit) {
      unit = UNIT_ALIASES[clauseTokens[i]];
    }
  }

  if (qty === null) qty = 1;
  if (!unit) unit = matchedItem.unit;

  // Convert grams to kg
  if (unit === 'gm' && matchedItem.unit === 'kg') {
    qty = qty / 1000;
    unit = 'kg';
  }

  // Determine price
  if (!unitPrice && !brandMatch) {
    if (matchedItem.isMultiBrand) {
      needsPriceSelection = true;
      unitPrice = matchedItem.variants?.[2]?.price || matchedItem.rate || 0;
    } else {
      unitPrice = matchedItem.rate;
    }
  }

  return {
    name: brandMatch ? brandMatch.brand : matchedItem.name,
    catalogueId: matchedItem.id,
    qty,
    unit,
    unitPrice,
    total: Math.round(qty * unitPrice * 100) / 100,
    needsPriceSelection: needsPriceSelection && !isPriceOverride,
    isMultiBrand: matchedItem.isMultiBrand || false,
    variants: matchedItem.variants || null,
    suggestedVariantIndex: matchedItem.isMultiBrand ? 2 : null, // Standard ₹40 for soap
  };
}

function removeCustomerTokens(tokens, customerName) {
  if (!customerName) return tokens;
  const nameParts = customerName.toLowerCase().split(' ');
  const cleaned = [];
  let skipNext = false;
  for (let i = 0; i < tokens.length; i++) {
    if (skipNext) { skipNext = false; continue; }
    if (nameParts.includes(tokens[i])) continue;
    if (tokens[i] === 'ji' && i > 0 && nameParts.includes(tokens[i - 1])) continue;
    if (CUSTOMER_MARKERS_AFTER.includes(tokens[i]) && i > 0 && nameParts.includes(tokens[i - 1])) continue;
    if (CUSTOMER_MARKERS_PHRASES.some(p => tokens.slice(i, i + p.split(' ').length).join(' ') === p)) continue;
    cleaned.push(tokens[i]);
  }
  return cleaned;
}

function removePaymentTokens(tokens) {
  const paymentWords = new Set([...UDHAAR_WORDS, ...CASH_WORDS, ...UPI_WORDS, ...WASOOLI_WORDS,
    'diya', 'diye', 'liya', 'liye', 'kharida', 'kharidi', 'h', 'hai', 'mein', 'me', 'se',
    'rupaye', 'rupaya', 'rupaiye', 'rupye', 'rs', '₹']);
  return tokens.filter(t => !paymentWords.has(t));
}

export function parseHinglishTransaction(transcript, catalogue, customers) {
  const startTime = performance.now();
  const normalized = normalizeText(transcript);
  const tokens = normalized.split(' ').filter(Boolean);

  // Detect if this is a wasooli/collection
  const isWasooli = detectWasooli(tokens);

  // Detect customer
  const customerResult = detectCustomer(tokens, customers);

  // Detect payment mode
  const paymentResult = detectPaymentMode(tokens);

  let result;

  if (isWasooli) {
    // Extract amount for wasooli
    let amount = 0;
    const cleaned = removeCustomerTokens(tokens, customerResult.customer?.name);
    for (let i = 0; i < cleaned.length; i++) {
      const num = wordsToNumber([cleaned[i]]);
      if (num !== null && num > 0) {
        // Check if next word is a unit (then it's not the wasooli amount)
        const next = cleaned[i + 1] || '';
        if (!UNIT_ALIASES[next]) {
          amount = num;
        }
      }
      // Check compound: "do sau" = 200
      if (i < cleaned.length - 1) {
        const compound = wordsToNumber([cleaned[i], cleaned[i + 1]]);
        if (compound !== null && compound > amount) {
          amount = compound;
        }
      }
    }

    // Determine wasooli payment mode (cash/upi)
    let wasooliMode = 'CASH';
    for (const w of UPI_WORDS) { if (normalized.includes(w)) wasooliMode = 'UPI'; }
    for (const w of CASH_WORDS) { if (tokens.includes(w)) wasooliMode = 'CASH'; }

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
      parseTimeMs: 0
    };
  } else {
    // Remove customer and payment tokens before parsing items
    let itemTokens = removeCustomerTokens(tokens, customerResult.customer?.name);
    itemTokens = removePaymentTokens(itemTokens);

    // Parse item clauses
    const items = parseItemClauses(itemTokens, catalogue);
    const total = items.reduce((sum, item) => sum + item.total, 0);

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
      parseTimeMs: 0
    };
  }

  result.parseTimeMs = Math.round((performance.now() - startTime) * 10) / 10;
  return result;
}

