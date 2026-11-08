// Hindi Devanagari to Natural Hinglish Transliterator & Kirana Dictionary

const HINDI_DICTIONARY = {
  // Common Kirana Customers & Names
  'रमेश': 'Ramesh',
  'सुरेश': 'Suresh',
  'सुनीता': 'Sunita',
  'मोहन': 'Mohan',
  'किरण': 'Kiran',
  'विक्रम': 'Vikram',
  'अनीता': 'Anita',
  'राजू': 'Raju',
  'शर्मा': 'Sharma',
  'कुमार': 'Kumar',
  'लाल': 'Lal',
  'देवी': 'Devi',
  'गुप्ता': 'Gupta',
  'सिंह': 'Singh',
  'वर्मा': 'Verma',
  'यादव': 'Yadav',
  'तिवारी': 'Tiwari',
  'मास्टर': 'Master',
  'चाचा': 'Chacha',
  'भैया': 'Bhaiya',
  'काका': 'Kaka',

  // Items & Products
  'आटा': 'aata',
  'आटे': 'aate',
  'गेहूं': 'gehu',
  'चीनी': 'chini',
  'चीनि': 'chini',
  'शक्कर': 'shakkar',
  'दाल': 'toor dal',
  'दाळ': 'toor dal',
  'अरहर': 'toor dal',
  'तूर': 'toor dal',
  'चावल': 'chawal',
  'बासमती': 'basmati',
  'तेल': 'tel',
  'सरसों': 'sarson',
  'रिफाइंड': 'refined oil',
  'दूध': 'doodh',
  'दुध': 'doodh',
  'अमुल': 'Amul Milk',
  'अमूल': 'Amul Milk',
  'मैगी': 'maggi',
  'मैग्गी': 'maggi',
  'नूडल्स': 'noodles',
  'ब्रेड': 'bread',
  'पाव': 'pav',
  'अंडा': 'anda',
  'अंडे': 'ande',
  'अण्ड': 'ande',
  'साबुन': 'sabun',
  'सोप': 'soap',
  'डेटॉल': 'Dettol Soap',
  'डेटोल': 'Dettol Soap',
  'लाइफबॉय': 'Lifebuoy Soap',
  'लाइफ़बॉय': 'Lifebuoy Soap',
  'बिस्कुट': 'biscuit',
  'बिस्किट': 'biscuit',
  'पारले': 'Parle-G Biscuit',
  'पारले-जी': 'Parle-G Biscuit',
  'गुडडे': 'GoodDay',
  'नमकीन': 'namkeen',
  'भुजिया': 'bhujia',
  'हल्दीराम': 'Haldiram Bhujia',
  'हल्दीराम्स': 'Haldiram Bhujia',
  'नमक': 'namak',
  'टाटा': 'Tata',
  'चाय': 'chai',
  'पत्ती': 'patti',
  'घी': 'ghee',
  'मसाला': 'masala',
  'हल्दी': 'haldi',
  'मिर्च': 'mirch',

  // Numbers in Devanagari
  'एक': '1',
  'दो': '2',
  'तीन': '3',
  'चार': '4',
  'पाँच': '5',
  'पांच': '5',
  'छह': '6',
  'छः': '6',
  'सात': '7',
  'आठ': '8',
  'नौ': '9',
  'दस': '10',
  'ग्यारह': '11',
  'बारह': '12',
  'तेरह': '13',
  'चौदह': '14',
  'पंद्रह': '15',
  'सोलह': '16',
  'सत्रह': '17',
  'अठारह': '18',
  'उन्नीस': '19',
  'बीस': '20',
  'पच्चीस': '25',
  'तीस': '30',
  'पैंतीस': '35',
  'चालीस': '40',
  'पचास': '50',
  'साठ': '60',
  'सत्तर': '70',
  'अस्सी': '80',
  'नब्बे': '90',
  'सौ': '100',
  'हजार': '1000',
  'हज़ार': '1000',

  // Fractions
  'आधा': 'aadha',
  'अधा': 'aadha',
  'पाओ': 'paav',
  'पौने': 'paune',
  'सवा': 'sawa',
  'डेढ़': 'dedh',
  'ढाई': 'dhai',
  'साढ़े': 'sadhe',

  // Units
  'किलो': 'kilo',
  'किलोग्राम': 'kg',
  'किग्रा': 'kg',
  'ग्राम': 'gram',
  'लीटर': 'liter',
  'लिटर': 'liter',
  'पैकेट': 'packet',
  'पॉकेट': 'packet',
  'नग': 'pc',
  'पीस': 'pc',
  'दाना': 'pc',

  // Grammar & Actions
  'ने': 'ne',
  'को': 'ko',
  'का': 'ka',
  'के': 'ke',
  'की': 'ki',
  'में': 'mein',
  'मे': 'mein',
  'से': 'se',
  'और': 'aur',
  'तथा': 'aur',
  'भी': 'bhi',
  'प्लस': 'plus',
  'दिया': 'diya',
  'दिए': 'diye',
  'दी': 'di',
  'दीजिये': 'dijiye',
  'दीजिए': 'dijiye',
  'लिया': 'liya',
  'लिए': 'liye',
  'खरीदा': 'kharida',
  'खरीदी': 'kharidi',
  'खरीदे': 'kharide',
  'उधार': 'udhaar',
  'उधारी': 'udhaar',
  'बाकी': 'baaki',
  'बकाया': 'baaki',
  'खाते': 'khate',
  'खाता': 'khata',
  'खातेदार': 'khatedar',
  'लिखो': 'likho',
  'लिख': 'likh',
  'डालो': 'likho',
  'चढ़ाओ': 'likho',
  'जमा': 'jama',
  'किए': 'kiye',
  'किया': 'kiya',
  'वसूली': 'wasooli',
  'नकद': 'cash',
  'कैश': 'cash',
  'नगद': 'cash',
  'यूपीआई': 'UPI',
  'ऑनलाइन': 'online',
  'पेटीएम': 'Paytm',
  'गूगलपे': 'GPay',
  'फोनपे': 'PhonePe',
  'रुपये': 'rupaye',
  'रुपया': 'rupaye',
  'रुपए': 'rupaye',
  'रु': '₹',
  'वाला': 'wala',
  'वाली': 'wali',
  'वाले': 'wale',
  'जी': 'ji',
  'है': 'hai',
  'हैं': 'hai',
  'था': 'tha',
  'थी': 'thi',
};

// Convert Devanagari digits to standard digits (०-९ -> 0-9)
function convertDevanagariDigits(str) {
  return str.replace(/[०-९]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0966 + 0x30));
}

// Fallback phonetic character map for words not in the dictionary
const VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
};

const MATRAS = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
  'ं': 'n', 'ँ': 'n', 'ः': 'h',
};

const CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f',
};

function transliterateDevanagariWord(word) {
  // Check dictionary first (exact match)
  const cleanWord = word.replace(/[।.,!?]/g, '').trim();
  if (HINDI_DICTIONARY[cleanWord]) {
    return HINDI_DICTIONARY[cleanWord];
  }

  // Phonetic transliteration
  let result = '';
  const len = word.length;
  for (let i = 0; i < len; i++) {
    const char = word[i];

    if (CONSONANTS[char]) {
      const nextChar = word[i + 1];
      if (nextChar === '्') {
        // Halant - consonant without implicit 'a'
        result += CONSONANTS[char];
        i++; // skip halant
      } else if (MATRAS[nextChar]) {
        // Consonant followed by vowel matra
        result += CONSONANTS[char] + MATRAS[nextChar];
        i++; // skip matra
      } else if (i === len - 1) {
        // Word ending consonant typically has no inherent 'a' in modern Hindi
        result += CONSONANTS[char];
      } else {
        // Internal consonant with inherent 'a'
        result += CONSONANTS[char] + 'a';
      }
    } else if (VOWELS[char]) {
      result += VOWELS[char];
    } else if (MATRAS[char]) {
      result += MATRAS[char];
    } else {
      result += char;
    }
  }

  return result || word;
}

/**
 * Transliterates Hindi/Devanagari text to natural Hinglish
 * E.g. "रमेश ने ₹20 का आटा खरीदा।" -> "Ramesh ne ₹20 ka aata kharida"
 */
export function hindiToHinglish(text) {
  if (!text) return '';
  // Check if text has any Devanagari characters (U+0900 to U+097F)
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (!hasDevanagari) return text;

  // First convert Devanagari digits to 0-9
  let normalized = convertDevanagariDigits(text);

  // Normalize punctuation spacing
  normalized = normalized
    .replace(/₹/g, ' ₹ ')
    .replace(/।/g, ' ')
    .replace(/[,\.:!?]/g, ' $& ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into tokens
  const tokens = normalized.split(' ');
  const transliteratedTokens = tokens.map((token) => {
    if (!token) return '';
    // If token is punctuation or pure number, keep as is
    if (/^[\d.,!?₹]+$/.test(token)) return token;

    // Check dictionary
    if (HINDI_DICTIONARY[token]) {
      return HINDI_DICTIONARY[token];
    }

    // Check lowercase/clean
    const clean = token.replace(/[.,!?₹]/g, '');
    if (HINDI_DICTIONARY[clean]) {
      return token.replace(clean, HINDI_DICTIONARY[clean]);
    }

    // Transliterate phonetically if has Devanagari
    if (/[\u0900-\u097F]/.test(token)) {
      return transliterateDevanagariWord(token);
    }

    return token;
  });

  return transliteratedTokens.join(' ').replace(/\s+/g, ' ').trim();
}
