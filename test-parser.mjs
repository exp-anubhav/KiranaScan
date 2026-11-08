import { parseHinglishTransaction } from './src/utils/hinglishParser.js';
import { SEED_CATALOGUE, SEED_CUSTOMERS, DEMO_CHIPS } from './src/data/seedData.js';

console.log('--- Testing 6 Demo Chips ---');
DEMO_CHIPS.forEach((chip, i) => {
  const res = parseHinglishTransaction(chip.text, SEED_CATALOGUE, SEED_CUSTOMERS);
  console.log(`\n=== Chip ${i+1}: ${chip.label} ===`);
  console.log(`Text: "${chip.text}"`);
  console.log(`Customer: ${res.customer?.name} (New: ${res.isNewCustomer}, Ambiguous: ${res.customerAmbiguous})`);
  console.log(`Type: ${res.type}, Mode: ${res.mode}, NeedsModeConfirm: ${res.needsModeConfirmation}`);
  console.log(`Items:`, res.items.map(it => `${it.name} x ${it.qty} ${it.unit} @ ₹${it.unitPrice} = ₹${it.total}`));
  console.log(`Total: ₹${res.total}`);
});

