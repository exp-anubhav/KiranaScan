# 🏪 KiranaScan (Team Knockout — CodeQuest 2026)
### *Voice-first, offline-first accounting & bahi-khata for neighbourhood Indian kirana shopkeepers*

> **Mantra:** *"Speak it. Confirm it. Trust it. Move from handwritten credit records to verified digital hisab, one confirmed transaction at a time."*  
> **Golden Trust Rule:** NEVER write anything directly to the ledger from voice alone. Voice creates a structured draft; human confirms before writing.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev

# 3. Test the built-in Hinglish NLP Parser against all 6 Judge Demo Scenarios
npm test

# 4. Build for production
npm run build
```

---

## 🎨 Visual Palette & Identity (Matches Pitch Deck)
- **App Background:** Warm Paper Cream (`#FAF6F0`)
- **Card Surface:** Crisp White (`#FFFFFF`) with border (`#E6DFD3`)
- **Primary Trust Green:** `#1B7A43` (Hover: `#145E33`)
- **Udhaar / Credit Amber Badge:** `#E68A00` (Background `#FFF4E0`, Text `#B36B00`)
- **Clarification / Warning Banner:** `#FEF3C7` with `#D97706` border
- **Danger Red:** `#DC2626`
- **UPI Purple:** `#5B21B6` (Background `#EDE9FE`)
- **Text:** Deep Charcoal (`#1E242B`)

---

## 📱 Feature Overview & Tab Architecture

### 🏆 Top Judge & Demo Utility Bar
- **View Switcher:** Toggle between `📱 Mobile Frame View` (430px smartphone frame for hackathon judging) and `🖥️ Full Screen View`.
- **Network Simulation Toggle:** Clickable pill toggling `🟢 Online (Server Synced)` and `🟠 Offline Mode (Local Queue)`. When Offline, transactions save locally with UUID (`TXN-xxxx`) and increment `Pending Sync Queue (N)`. Switching back to Online auto-syncs queued items.
- **Language Switcher:** `Hinglish` | `हिंदी` | `English` (live updates UI labels).
- **Soundbox TTS Toggle:** `🔊 Bolkar Sunayein` (`hi-IN`) announces confirmed bills aloud like a payment soundbox.
- **1-Click "Reset Demo State":** Instantly restores initial seed data.

---

### Tab 1: 🎙️ Speak (Bol Kar) — Voice Counter & Draft Approval
1. **Web Speech API & Text Input:**
   - Large pulsing Forest Green mic button with 5-bar animated waveform.
   - Textarea to speak live or type Hinglish sentences.
2. **6 One-Tap Judge Test Chips:**
   - `🎯 Slide 1 Hero Case`: *"Ramesh ko do kilo aata aur ek soap udhaar mein diya"* → Aata 2kg ₹90 + Soap 1pc ₹40 = ₹130 total. Ramesh balance ₹420 → ₹550.
   - `🔄 Natural Reversed Order`: *"40 ka sabun h, Ramesh ne kharida"* → Unit price ₹40 override.
   - `📐 Desi Fractions + UPI`: *"Sunita ji ko dhai kilo chini aur aadha liter sarson tel UPI se diya"* → Dhai (2.5kg) & Aadha (0.5L) parsed accurately.
   - `❓ Unknown Item Clarification`: *"Mohan ko ek packet Haldiram bhujia aur 1 bread udhaar likho"* → Brand alias recognition.
   - `🆕 New Customer Onboarding`: *"Vikram ko 1 kilo toor dal aur 2 Maggi udhaar mein diya"* → Inline customer creation with Pehchan tag.
   - `💰 Udhaar Wasooli / Settlement`: *"Ramesh ne 200 rupaye cash jama kiye"* → Wasooli reduction from udhaar balance.
3. **Human-in-the-Loop Confirmation Card:**
   - Duplicate name disambiguation (Ramesh Kumar ₹420 vs Ramesh Sharma ₹150).
   - Multi-brand price selection chips (`[₹10 Mini] [Lifebuoy ₹36] [Standard ₹40] [Dettol ₹45] [Custom ₹]`).
   - Live Balance Impact Preview (`Ramesh Balance: ₹420 → ₹550 (+₹130 Udhaar)`).
   - 5-second **Undo Toast** banner.
   - One-Tap **WhatsApp Receipt Modal** with `wa.me` link and copy button.

---

### Tab 2: 📒 Ledger (Bahi-Khata) — Customers & Paper OCR
1. **Customer Search & Filters:** Filter by Name, Phone, or Pehchan tag.
2. **Bahi-Khata Photo OCR Modal (Slide 7 & 8):**
   - Realistic ruled notebook mockup with Hindi handwriting.
   - 1.2s scanning animation line (`scan-line`).
   - Review & Edit table with pre-extracted entries (*Suresh, Anita, Raju*) before importing.
3. **Immutable Audit Trail:**
   - TXN-UUID, timestamp, synced status, original voice transcript, and "Edited before confirm" tag.
4. **Quick Wasooli & WhatsApp Reminder:**
   - 3 Tone options: *Polite (Vinamra)*, *Standard (Hisab Slip)*, *Month-End Urgent*.

---

### Tab 3: 📊 Daily Hisab — Slide 9 Summary & Night-Time Galla Check
1. **5 Live Metric Cards:**
   - Cash Sales Today (`₹4,200` baseline + session delta)
   - UPI Sales Today (`₹2,850` baseline + session delta)
   - Credit Issued Today (`₹1,900` baseline + session delta)
   - Collections Received (`₹1,350` baseline + session delta)
   - Total Outstanding Credit (`₹18,600` baseline + live net change)
2. **Night-Time Galla Reconciliation Tool:**
   - Calculates `Expected Physical Cash = Opening Galla (₹1,000) + Cash Sales + Cash Wasooli`.
   - Test presets: `Match Exact` vs `Simulate ₹250 Shortage`.
   - Flags cash drawer discrepancies with alerts.
3. **Slide 9 Target Metrics Validation Panel:**
   - Voice Parser Accuracy (>85% Target)
   - Avg Time to Log Transaction (<5s Target)
   - Drafts Needing Manual Edit (<15% Target)

---

### Tab 4: 🏪 Catalogue & Sync — Rates, Sync Queue & Privacy
1. **Shop Catalogue Manager:** Manage loose rates, multi-brand items, and aliases.
2. **Duplicate-Safe Sync Queue Inspector:** Visual flow diagram and sync state table (`SYNCED` vs `QUEUED_OFFLINE`).
3. **Optional Gemini AI Key:** Secure input for `gemini-1.5-flash` fallback while highlighting 100% offline local parser.
4. **Data Privacy & Portability:** Export full shop ledger as JSON or CSV, Reset to Demo state, or Wipe Data.

---

## 🧠 Position-Independent Hinglish NLP Engine
The engine in `src/utils/hinglishParser.js` deterministically handles:
- **Hindi Numbers & Desi Fractions:** *ek, do, teen...*, *paav (0.25)*, *aadha (0.5)*, *paune (0.75)*, *sawa (1.25)*, *dedh (1.5)*, *dhai (2.5)*, *sadhe teen (3.5)*.
- **Relational Markers:** `<Name> ko`, `<Name> ne`, `<Name> ke khate`, `<Name> ka`, `for <Name>`.
- **Price vs Quantity Disambiguation:** Differentiates `"40 ka sabun"` (unit price ₹40, qty 1) from `"do kilo aata"` (qty 2, auto-priced at ₹45/kg).
- **Proximity Brand Linking:** Automatically links `"Dettol"` or `"Lifebuoy"` to parent soap items.
