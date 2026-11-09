# 🏪 KiranaScan — Voice & Camera POS for Bharat Retailers

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.3-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-1B7A43.svg)](https://web.dev/progressive-web-apps/)

> **"Speak it. Confirm it. Trust it."**  
> *Move from handwritten paper credit to verified digital bahi-khata, one confirmed transaction at a time.*

---

## 📖 Overview

**KiranaScan** is an offline-first, voice-powered point-of-sale (POS) and ledger Progressive Web Application (PWA) designed specifically for neighbourhood Indian kirana stores, general merchants, and small retail businesses.

Millions of local shopkeepers across India run credit (*udhaar*) using physical paper notebooks (*bahi-khata*). Paper registers lead to lost credits, arithmetic disputes, and hours spent calculating balances late at night. Traditional POS apps fail because typing item names and prices on a smartphone keyboard while attending to customers on a crowded shop counter is too slow.

KiranaScan solves this with a **voice-first interface**, a **built-in Position-Independent Hinglish NLP Parser**, **camera notebook scanning**, and **audio soundbox verification**.

---

## 🛡️ The Golden Trust Rule

> **Never write directly to the financial ledger from voice alone.**  
> Voice input creates a structured, editable **Approval Draft**. Ambiguous names, multi-brand prices, or unknown items trigger clear clarification prompts. Data commits to the permanent ledger **only after the shopkeeper reviews and taps "Confirm"**.

---

## ⚡ Key Features

### 1. 🎙️ Voice Counter & Hinglish NLP Engine
- **Natural Spoken Input:** Understands natural mixed Hindi-English sentences in any word order (e.g., *"Ramesh ko do kilo aata aur ek soap udhaar mein diya"* or *"40 ka sabun h, Ramesh ne kharida"*).
- **Desi Fractions & Units:** Native parsing for traditional Indian quantity terms like *paav* (0.25 kg), *aadha* (0.5), *paun* (0.75), *sawa* (1.25), and *dhai* (2.5 kg/L).
- **Multi-Brand Disambiguation:** Automatically detects items with brand variations (e.g., *Soap: Lifebuoy ₹36, Dettol ₹45, Standard ₹40*) and prompts for one-tap price selection.
- **Duplicate Name Resolution:** Instantly flags common names (e.g., *Ramesh Kumar* vs *Ramesh Sharma*) and provides clear pehchan/landmark tags for selection.

### 2. 🔊 Voice Soundbox Audio Feedback
- Replicates hardware payment soundboxes using the browser's native `SpeechSynthesis` (`hi-IN`).
- Automatically announces transaction confirmations in spoken Hindi:
  - **Udhaar:** *"Ramesh ji ke khate mein ₹130 udhaar darj hue. Kul baaki ₹550."*
  - **Cash:** *"Ramesh ji ne ₹130 cash diye."*
  - **UPI:** *"Ramesh ji ne ₹130 UPI se diye."*
  - **Wasooli:** *"Ramesh ji ne ₹200 jama kiye. Ab baaki bache ₹350."*

### 3. 📒 Bahi-Khata Ledger & Immutable Audit Trail
- **Customer Directory:** Complete customer profiles with phone numbers, landmark/pehchan tags, current credit balances, and chronological transaction histories.
- **One-Tap Wasooli (Repayment):** Quick collection logging via Cash or UPI with instant balance recalculation.
- **WhatsApp Slips & Reminders:** Generate formatted WhatsApp receipts and balance reminders with 3 customizable tones: *Polite (Vinamra)*, *Standard (Hisab Slip)*, and *Month-End Urgent*.
- **Camera Notebook Scanner (OCR Import):** Digitize existing paper bahi-khata pages with structured pre-import validation.

### 4. 📊 Aaj Ka Hisab & Night-Time Galla Check
- **Real-Time Turnover Dashboard:** Live tracking of Cash Sales, UPI Sales, Credit Issued (Udhaar), Collections Received (Wasooli), and Total Outstanding Credit.
- **Night-Time Cash Drawer Reconciliation:** Automatically computes `Expected Physical Cash = Opening Galla + Cash Sales + Cash Wasooli`, and flags loose expense shortages or unrecorded cash discrepancies.
- **Customer Flow Breakdown:** View today's customer visits side-by-side with overall turnover mathematics.

### 5. 🏪 Multi-Merchant Isolation & Catalogue Management
- **Per-Store Data Isolation:** Multi-shop login allows running separate data stores on a single device without data bleed.
- **Dukan Catalogue:** Add, edit, and organize catalogue items, base rates, spoken aliases, and multi-brand variant prices.
- **Offline Sync Inspector:** Idempotent, duplicate-safe sync queue with unique `TXN_UUID` and client-side idempotency keys.
- **Full Data Ownership:** 100% client-side persistence with one-click full shop backup exports in JSON and CSV formats.

---

## 🎨 Visual Identity & Theming

KiranaScan features a purpose-built design system crafted for high readability in harsh retail lighting:
- **Warm Paper Cream Light Mode (`#FAF6F0`):** Inspired by traditional physical ledger paper to reduce eye strain.
- **Merchant OLED Dark Mode (`#0B1116` / `#16202A`):** Pure high-contrast dark surfaces designed for nighttime accounting and battery conservation.
- **Primary Trust Green (`#1B7A43`):** High-visibility action cues for confirmation and primary actions.
- **Udhaar Amber (`#E68A00`):** Instant visual identification for outstanding credit and risk indicators.
- **Payment Badges:** Dedicated color coding for Cash (Emerald), UPI (Indigo), Udhaar (Amber), and Wasooli (Teal).

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React 19 + Vite 8 | Ultra-fast reactive UI and lightweight bundle footprint |
| **Styling** | Tailwind CSS v4 | Class-based dark/light theme switching with CSS variables |
| **Icons** | Lucide React | Clean, scalable interface icons |
| **Local Storage** | IndexedDB (`idb`) + LocalStorage | Offline-first persistence with zero cloud lock-in |
| **Speech Input** | Web Speech API (`webkitSpeechRecognition`) | Real-time bilingual Hindi & English voice recognition |
| **Audio Feedback**| SpeechSynthesis API (`hi-IN`) | Integrated voice soundbox confirmation audio |
| **NLP Engine** | Custom Regex & Token Parser (`hinglishParser.js`) | Position-independent Hinglish parsing (offline, zero API costs) |
| **AI Fallback** | Optional Google Gemini Flash API | Optional LLM enhancement for complex multi-item sentences |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/exp-anubhav/KiranaScan.git
cd KiranaScan
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Run Parser Test Suite
```bash
npm test
```
Executes the built-in position-independent Hinglish test scenarios:
- Multi-item credit bills
- Inverted/reversed sentence orders
- Desi fractional quantities and liquid measurements
- Multi-brand variant matching
- New customer onboarding drafts
- Wasooli repayments

### 5. Build for Production
```bash
npm run build
```

---

## 📂 Repository File Structure

```
KiranaScan/
├── index.html                   # Entry HTML with PWA meta & font definitions
├── package.json                 # Project configuration and script commands
├── vite.config.js               # Vite bundler and Tailwind CSS plugin setup
├── public/
│   ├── favicon.svg              # Application icon
│   └── manifest.json            # PWA manifest configuration
├── src/
│   ├── main.jsx                 # React root DOM initialization
│   ├── App.jsx                  # Main application container, auth & navigation
│   ├── App.css                  # Frame layout overrides
│   ├── index.css                # Global theme variables & responsive styles
│   ├── components/
│   │   ├── VoiceTab.jsx         # Tab 1: Voice counter & approval card
│   │   ├── LedgerTab.jsx        # Tab 2: Customer bahi-khata & OCR modal
│   │   ├── DailyHisabTab.jsx    # Tab 3: Sales summary & Galla check
│   │   └── CatalogueTab.jsx     # Tab 4: Catalogue rates & sync queue
│   ├── stores/
│   │   └── useStore.js          # Persistent local state & multi-shop manager
│   ├── utils/
│   │   ├── hinglishParser.js    # Position-independent Hinglish NLP parser
│   │   └── devanagariTransliterator.js # Hindi Devanagari to Hinglish transliterator
│   └── data/
│       └── seedData.js          # Default catalogue, customers, and translations
└── test-parser.mjs              # Standalone Node.js parser verification suite
```

---

## 🔒 Privacy & Offline Guarantee

KiranaScan runs entirely in your browser using local storage and IndexedDB. 
- **Zero Required Cloud Dependencies:** All speech recognition and parsing happen on the client.
- **Offline By Default:** Works without internet access. When reconnected, changes queue safely and idempotently.
- **Export Anytime:** Merchant data is always accessible and exportable as standard CSV or JSON files.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
