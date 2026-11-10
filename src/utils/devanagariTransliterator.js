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
  'गेंहू': 'gehu',
  'चीनी': 'chini',
  'चीनि': 'chini',
  'शक्कर': 'shakkar',
  'दाल': 'dal',
  'दाळ': 'dal',
  'अरहर': 'arhar',
  'तूर': 'toor',
  'चावल': 'chawal',
  'बासमती': 'basmati',
  'तेल': 'tel',
  'सरसों': 'sarson',
  'रिफाइंड': 'refined oil',
  'दूध': 'doodh',
  'दुध': 'doodh',
  'अमुल': 'Amul',
  'अमूल': 'Amul',
  'मैगी': 'maggi',
  'मैग्गी': 'maggi',
  'नूडल्स': 'noodles',
  'ब्रेड': 'bread',
  'डबलरोटी': 'bread',
  'अंडा': 'anda',
  'अंडे': 'ande',
  'अण्डे': 'ande',
  'अण्डा': 'anda',
  'साबुन': 'sabun',
  'सोप': 'soap',
  'डेटॉल': 'Dettol',
  'डेटोल': 'Dettol',
  'लाइफबॉय': 'Lifebuoy',
  'लाइफ़बॉय': 'Lifebuoy',
  'बिस्कुट': 'biscuit',
  'बिस्किट': 'biscuit',
  'पारले': 'Parle',
  'पारले-जी': 'Parle-G',
  'गुडडे': 'GoodDay',
  'नमकीन': 'namkeen',
  'भुजिया': 'bhujia',
  'हल्दीराम': 'Haldiram',
  'हल्दीराम्स': 'Haldiram',
  'नमक': 'namak',
  'टाटा': 'Tata',
  'चाय': 'chai',
  'पत्ती': 'patti',
  'घी': 'ghee',
  'मसाला': 'masala',
  'हल्दी': 'haldi',
  'मिर्च': 'mirch',
  'मिर्ची': 'mirch',
  'धनिया': 'dhaniya',
  'जीरा': 'jeera',
  'प्याज': 'pyaaz',
  'आलू': 'aloo',
  'टमाटर': 'tamatar',
  'मटर': 'matar',
  'लहसुन': 'lehsun',
  'अदरक': 'adrak',
  'दही': 'dahi',
  'पनीर': 'paneer',
  'मक्खन': 'butter',
  'गुड़': 'gud',
  'मूंग': 'moong',
  'चना': 'chana',
  'उड़द': 'urad',
  'मसूर': 'masoor',
  'सोया': 'soya',
  'बेसन': 'besan',
  'मैदा': 'maida',
  'सूजी': 'suji',
  'पोहा': 'poha',
  'कॉफी': 'coffee',
  'पापड़': 'papad',
  'अचार': 'achar',

  // Numbers in Devanagari ('दो' stays 'do' so both "do kilo" = 2kg and "aata de do" = give work cleanly)
  'एक': '1',
  'दो': 'do',
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
  'पाव': 'paav',
  'पाओ': 'paav',
  'पौने': 'paune',
  'पौना': 'paune',
  'सवा': 'sawa',
  'डेढ़': 'dedh',
  'ढाई': 'dhai',
  'साढ़े': 'sadhe',

  // Units
  'किलो': 'kilo',
  'किलोग्राम': 'kg',
  'किग्रा': 'kg',
  'केजी': 'kg',
  'ग्राम': 'gram',
  'मिलीलीटर': 'ml',
  'एमएल': 'ml',
  'लीटर': 'liter',
  'लिटर': 'liter',
  'पैकेट': 'packet',
  'पॉकेट': 'packet',
  'थैली': 'packet',
  'नग': 'pc',
  'पीस': 'pc',
  'दाना': 'pc',
  'दर्जन': 'dozen',

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
  'एवं': 'aur',
  'भी': 'bhi',
  'प्लस': 'plus',
  'दे': 'de',
  'दें': 'de',
  'कर': 'kar',
  'करो': 'karo',
  'करें': 'karen',
  'ले': 'le',
  'लो': 'lo',
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
  'लिखिए': 'likho',
  'लिखें': 'likho',
  'डालो': 'likho',
  'चढ़ाओ': 'likho',
  'जोड़ो': 'likho',
  'जोड़ें': 'likho',
  'जमा': 'jama',
  'किए': 'kiye',
  'किया': 'kiya',
  'वसूली': 'wasooli',
  'वापस': 'wapas',
  'नकद': 'cash',
  'कैश': 'cash',
  'नगद': 'cash',
  'यूपीआई': 'UPI',
  'ऑनलाइन': 'online',
  'पेटीएम': 'Paytm',
  'गूगलपे': 'GPay',
  'गूगल': 'Google',
  'पे': 'Pay',
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
  'मुझे': 'mujhe',
  'कल': 'kal',
  'आज': 'aaj',
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

  // 1. Convert Devanagari digits to 0-9
  let normalized = convertDevanagariDigits(text);

  // 2. Replace standalone "रु." / "रु" currency prefix cleanly before dot/comma splitting
  normalized = normalized.replace(/(^|[\s,;])रु\.?(?=\s|\d|$)/g, '$1 ₹ ');

  // 3. Remove thousands commas inside numbers (e.g. "1,200" -> "1200")
  normalized = normalized.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');

  // 4. Protect decimal dots inside numbers (e.g. "2.5" -> "2\uE0005")
  normalized = normalized.replace(/(\d)\.(\d)/g, '$1\uE000$2');

  // 5. Separate digits attached to Devanagari or Latin units/currency (e.g. "2किलो" -> "2 किलो", "₹20" -> "₹ 20")
  normalized = normalized
    .replace(/(\d)([\u0900-\u097Fa-zA-Z₹])/g, '$1 $2')
    .replace(/([\u0900-\u097Fa-zA-Z₹])(\d)/g, '$1 $2');

  // 6. Normalize punctuation spacing while preserving list commas
  normalized = normalized
    .replace(/₹/g, ' ₹ ')
    .replace(/[।|;]+/g, ' , ')
    .replace(/,/g, ' , ')
    .replace(/[.!?]+/g, ' , ')
    .replace(/[:'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 7. Split into tokens and transliterate
  const tokens = normalized.split(' ');
  const transliteratedTokens = tokens.map((token) => {
    if (!token) return '';
    // Keep commas, currency symbol, punctuation, or pure numbers (including protected decimals)
    if (token === ',' || /^[\d\uE000.,!?₹]+$/.test(token)) return token;

    // Check dictionary (exact match, preserves hyphenated words like "पारले-जी")
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

  return transliteratedTokens
    .join(' ')
    .replace(/\uE000/g, '.')
    .replace(/₹\s+(\d)/g, '₹$1')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(?:,\s*){2,}/g, ', ')
    .replace(/^,\s*|\s*,\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
