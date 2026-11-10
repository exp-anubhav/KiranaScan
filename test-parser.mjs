import assert from 'node:assert/strict';
import { parseHinglishTransaction } from './src/utils/hinglishParser.js';
import { hindiToHinglish } from './src/utils/devanagariTransliterator.js';
import { parseBahiKhataOcrText } from './src/utils/bahiKhataOcr.js';
import { SEED_CATALOGUE, SEED_CUSTOMERS, DEMO_CHIPS } from './src/data/seedData.js';

console.log('--- Testing Hinglish NLP Parser Core Scenarios ---');
DEMO_CHIPS.forEach((chip, i) => {
  const res = parseHinglishTransaction(chip.text, SEED_CATALOGUE, SEED_CUSTOMERS);
  console.log(`\n=== Scenario ${i + 1}: ${chip.label} ===`);
  console.log(`Text: "${chip.text}"`);
  console.log(`Customer: ${res.customer?.name} (New: ${res.isNewCustomer}, Ambiguous: ${res.customerAmbiguous})`);
  console.log(`Type: ${res.type}, Mode: ${res.mode}, NeedsModeConfirm: ${res.needsModeConfirmation}`);
  console.log(`Items:`, res.items.map(it => `${it.name} x ${it.qty} ${it.unit} @ ₹${it.unitPrice} = ₹${it.total}`));
  console.log(`Total: ₹${res.total}`);
});

console.log('\n--- Running Automated Assertions (Core + Multi-Item Edge Cases) ---');

const checks = [
  {
    name: 'Core 1: Udhaar multi-item',
    input: DEMO_CHIPS[0].text,
    verify: (r) => {
      assert.equal(r.type, 'SALE');
      assert.equal(r.mode, 'UDHAAR');
      assert.equal(r.items.length, 2);
      assert.equal(r.total, 130);
    },
  },
  {
    name: 'Core 2: Reversed order defaults to CASH',
    input: DEMO_CHIPS[1].text,
    verify: (r) => {
      assert.equal(r.type, 'SALE');
      assert.equal(r.mode, 'CASH');
      assert.equal(r.needsModeConfirmation, true);
      assert.equal(r.items.length, 1);
      assert.equal(r.items[0].unitPrice, 40);
      assert.equal(r.total, 40);
    },
  },
  {
    name: 'Core 3: Desi fractions + UPI',
    input: DEMO_CHIPS[2].text,
    verify: (r) => {
      assert.equal(r.mode, 'UPI');
      assert.equal(r.customer?.name, 'Sunita Devi');
      assert.equal(r.items.length, 2);
      assert.equal(r.items[0].qty, 2.5);
      assert.equal(r.items[1].qty, 0.5);
      assert.equal(r.total, 190);
    },
  },
  {
    name: 'Multi-item 1: 4 comma + aur separated items',
    input: 'Ramesh ko 2 kilo aata, 1 kilo chini, 1 soap aur 2 maggi udhaar mein diya',
    verify: (r) => {
      assert.equal(r.items.length, 4);
      assert.equal(r.total, 202);
    },
  },
  {
    name: 'Multi-item 2: Space-separated without commas or aur',
    input: 'Ramesh ko 2 doodh 1 bread 2 ande udhaar',
    verify: (r) => {
      assert.equal(r.type, 'SALE');
      assert.equal(r.items.length, 3);
      assert.deepEqual(r.items.map(i => [i.name, i.qty]), [
        ['Amul Milk', 2],
        ['Bread', 1],
        ['Eggs (Ande)', 2],
      ]);
      assert.equal(r.total, 120);
    },
  },
  {
    name: 'Multi-item 3: Pure item names without quantities',
    input: 'Ramesh ko aata chini chawal aur dal udhaar likho',
    verify: (r) => {
      assert.equal(r.items.length, 4);
      assert.equal(r.total, 289);
    },
  },
  {
    name: 'Multi-item 4: 5 items in Devanagari Hindi (Google ASR)',
    input: 'रमेश को 2 किलो आटा 1 किलो चीनी 1 साबुन 2 मैगी और 1 ब्रेड उधार दिया',
    verify: (r) => {
      assert.equal(r.items.length, 5);
      assert.equal(r.total, 242);
    },
  },
  {
    name: 'Multi-item 5: Fractions + grams + price override + cash',
    input: 'Sunita ko do kilo aata, aadha liter tel, 250 gram dal aur 40 ka sabun cash diya',
    verify: (r) => {
      assert.equal(r.mode, 'CASH');
      assert.equal(r.items.length, 4);
      assert.equal(r.items[0].qty, 2);
      assert.equal(r.items[1].qty, 0.5);
      assert.equal(r.items[2].qty, 0.25);
      assert.equal(r.items[3].unitPrice, 40);
      assert.equal(r.total, 245);
    },
  },
  {
    name: 'Multi-item 6: Post-modifier item order',
    input: 'Ramesh ko aata 2 kilo chini 1 kilo tel 500 ml UPI se diya',
    verify: (r) => {
      assert.equal(r.mode, 'UPI');
      assert.equal(r.items.length, 3);
      assert.deepEqual(r.items.map(i => [i.qty, i.unit]), [
        [2, 'kg'],
        [1, 'kg'],
        [0.5, 'L'],
      ]);
      assert.equal(r.total, 214);
    },
  },
  {
    name: 'Multi-item 7: Decimal quantities + attached units + false wasooli guard (diye)',
    input: 'Mohan ko 2.5 kilo aata 1.5kg chini 500gm chawal 500ml tel cash diye',
    verify: (r) => {
      assert.equal(r.type, 'SALE');
      assert.equal(r.mode, 'CASH');
      assert.equal(r.items.length, 4);
      assert.deepEqual(r.items.map(i => [i.qty, i.unit]), [
        [2.5, 'kg'],
        [1.5, 'kg'],
        [0.5, 'kg'],
        [0.5, 'L'],
      ]);
      assert.equal(r.total, 288.5);
    },
  },
  {
    name: 'Multi-item 8: Mixed brands including Parle G biscuit',
    input: 'Ramesh ko 2 dettol 1 lifebuoy aur 2 parle g biscuit udhaar diya',
    verify: (r) => {
      assert.equal(r.items.length, 3);
      assert.deepEqual(r.items.map(i => [i.name, i.qty, i.total]), [
        ['Dettol Soap', 2, 90],
        ['Lifebuoy Soap', 1, 36],
        ['Parle-G Biscuit', 2, 20],
      ]);
      assert.equal(r.total, 146);
    },
  },
  {
    name: 'Multi-item 9: Devanagari decimal + attached units + रु. + currency override',
    input: 'रमेश को 2.5 किलो आटा, 500ग्राम चीनी, रु. 40 का साबुन, 500ml तेल और 2 ब्रेड उधार दिया।',
    verify: (r) => {
      const h = hindiToHinglish('रमेश को 2.5 किलो आटा, 500ग्राम चीनी, रु. 40 का साबुन, 500ml तेल और 2 ब्रेड उधार दिया।');
      assert.ok(h.includes('2.5 kilo aata'));
      assert.equal(r.items.length, 5);
      assert.equal(r.items[0].qty, 2.5);
      assert.equal(r.items[1].qty, 0.5);
      assert.equal(r.items[2].unitPrice, 40);
      assert.equal(r.items[3].qty, 0.5);
      assert.equal(r.items[4].qty, 2);
      assert.equal(r.total, 334.5);
    },
  },
  {
    name: 'Multi-item 10: Dozen + mixed kg-gram + trailing verb "do"',
    input: 'रमेश को 1 दर्जन अंडे और 2 किलो 500 ग्राम चावल दे दो',
    verify: (r) => {
      assert.equal(r.items.length, 2);
      assert.equal(r.items[0].qty, 12);
      assert.equal(r.items[1].qty, 2.5);
      assert.equal(r.total, 234);
    },
  },
  {
    name: 'Wasooli with trailing verb "kar do" does not overwrite amount',
    input: 'Ramesh ke 500 rupaye jama kar do',
    verify: (r) => {
      assert.equal(r.type, 'WASOOLI');
      assert.equal(r.total, 500);
    },
  },
  {
    name: '10 items in a single breath without commas or aur',
    input: 'Sunita ko aata chini dal chawal tel doodh maggi bread ande soap udhaar',
    verify: (r) => {
      assert.equal(r.customer?.name, 'Sunita Devi');
      assert.equal(r.items.length, 10);
      assert.equal(r.mode, 'UDHAAR');
    },
  },
  {
    name: '6 items with customer at the very end',
    input: '2 kilo aata 1 kilo chini 1 kilo dal 1 liter tel 1 bread 6 ande cash diya Ramesh ko',
    verify: (r) => {
      assert.equal(r.customer?.name, 'Ramesh Kumar');
      assert.equal(r.mode, 'CASH');
      assert.equal(r.items.length, 6);
      assert.deepEqual(r.items.map(i => i.qty), [2, 1, 1, 1, 1, 6]);
    },
  },
  {
    name: 'Default payment mode is CASH when listing items without mode word or customer',
    input: '2 kilo aata, 1 kilo chini aur 2 maggi',
    verify: (r) => {
      assert.equal(r.type, 'SALE');
      assert.equal(r.mode, 'CASH');
      assert.equal(r.needsModeConfirmation, true);
      assert.equal(r.items.length, 3);
      assert.equal(r.total, 162);
    },
  },
  {
    name: 'Bare "likho" without udhaar/khata stays default CASH',
    input: 'Ramesh ko 2 kilo aata aur 1 bread likho',
    verify: (r) => {
      assert.equal(r.type, 'SALE');
      assert.equal(r.mode, 'CASH');
      assert.equal(r.items.length, 2);
      assert.equal(r.total, 130);
    },
  },
];

for (const tc of checks) {
  const res = parseHinglishTransaction(tc.input, SEED_CATALOGUE, SEED_CUSTOMERS);
  tc.verify(res);
  console.log(`PASS: ${tc.name}`);
}

console.log('\n--- Running Bahi-Khata OCR Text Parser Assertions ---');
const ocrRawSample = [
  'Name   Pehchan   Balance',
  '1. Ramesh Kumar - Gali 4 (10/11/2026) - Rs. 1,420/-',
  '2) Sunita Devi | Dairy Wali Gali | 9822233344 | ₹34O',
  '3. सुरेश - चाय वाला - पुराना बाकी ₹340',
  'Mohan Lal',
  '₹890',
  '4. Anita (Makan No. 8) Rs I50',
  '5. Deepa Joshi (9876543210) - र310',
  '6. Vinod - घर 8 - ¥215',
  '7. सुरेश वर्मा - चाय दुकान - र₹420',
  '8. Ramesh - baaki 2000 Rx',
  'Total 3140',
].join('\n');

const ocrParsed = parseBahiKhataOcrText(ocrRawSample);
assert.equal(ocrParsed.length, 9);
assert.deepEqual(ocrParsed[0], { name: 'Ramesh Kumar', pehchan: 'Gali 4', phone: '', balance: 1420 });
assert.deepEqual(ocrParsed[1], { name: 'Sunita Devi', pehchan: 'Dairy Wali Gali', phone: '9822233344', balance: 340 });
assert.deepEqual(ocrParsed[2], { name: 'Suresh', pehchan: 'चाय वाला', phone: '', balance: 340 });
assert.deepEqual(ocrParsed[3], { name: 'Mohan Lal', pehchan: '', phone: '', balance: 890 });
assert.deepEqual(ocrParsed[4], { name: 'Anita', pehchan: 'Makan No. 8', phone: '', balance: 150 });
assert.deepEqual(ocrParsed[5], { name: 'Deepa Joshi', pehchan: '', phone: '9876543210', balance: 310 });
assert.deepEqual(ocrParsed[6], { name: 'Vinod', pehchan: 'घर 8', phone: '', balance: 215 });
assert.deepEqual(ocrParsed[7], { name: 'Suresh Verma', pehchan: 'चाय दुकान', phone: '', balance: 420 });
assert.deepEqual(ocrParsed[8], { name: 'Ramesh', pehchan: '', phone: '', balance: 2000 });
console.log('PASS: Bahi-Khata OCR multi-format parsing (phones, dates, address numbers, OCR digit typos, Devanagari, headers)');

console.log(`\nAll ${checks.length} voice parser + OCR parser assertions passed!`);
