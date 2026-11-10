import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { parseHinglishTransaction } from '../utils/hinglishParser.js';
import { hindiToHinglish } from '../utils/devanagariTransliterator.js';
import { prepareLedgerImageForOcr } from '../utils/bahiKhataOcr.js';
import { DEMO_CHIPS, SAMPLE_HANDWRITTEN_BILLS } from '../data/seedData.js';
import {
  Mic, Send, Plus, Minus, Edit3, Check, X,
  AlertTriangle, MessageCircle, Copy, Undo2, User, Phone, Zap,
  Camera, Upload, Sparkles, ArrowRight
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────
const BILL_SCAN_STYLE_ID = 'voice-bill-scan-style';
if (typeof document !== 'undefined' && !document.getElementById(BILL_SCAN_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = BILL_SCAN_STYLE_ID;
  style.textContent = `
    @keyframes parchiScanLaser {
      0% { top: 4px; opacity: 0.95; }
      100% { top: calc(100% - 6px); opacity: 0.95; }
    }
    .parchi-scan-laser {
      position: absolute;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, #22c55e 20%, #16a34a 50%, #22c55e 80%, transparent 100%);
      box-shadow: 0 0 12px 3px rgba(34, 197, 94, 0.55);
      animation: parchiScanLaser 0.9s ease-in-out infinite alternate;
      z-index: 20;
      border-radius: 2px;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function resolveCustomerFromScan(customerId, customerName, customers = []) {
  const cleanName = String(customerName || '').trim();
  const list = customers || [];
  let matched = null;

  if (customerId) {
    matched = list.find((c) => c.id === customerId) || null;
  }
  if (!matched && cleanName) {
    const lower = cleanName.toLowerCase();
    matched = list.find((c) => (c.name || '').trim().toLowerCase() === lower) || null;
  }
  if (!matched && cleanName) {
    const first = cleanName.toLowerCase().split(/\s+/)[0];
    if (first && first.length >= 2) {
      const firstMatches = list.filter((c) => (c.name || '').trim().toLowerCase().split(/\s+/)[0] === first);
      if (firstMatches.length === 1) {
        matched = firstMatches[0];
      }
    }
  }

  if (matched) {
    return {
      customer: matched,
      isNewCustomer: false,
      prefillName: '',
    };
  }
  if (cleanName) {
    return {
      customer: { id: null, name: cleanName, isNew: true },
      isNewCustomer: true,
      prefillName: cleanName,
    };
  }
  return { customer: null, isNewCustomer: false, prefillName: '' };
}

function buildDraftFromBillPayload(payload, catalogue = [], customers = []) {
  const { customer, isNewCustomer, prefillName } = resolveCustomerFromScan(
    payload.customerId,
    payload.customerName,
    customers
  );

  const resolvedItems = (payload.items || []).map((rawItem) => {
    const catItem = rawItem.catalogueId
      ? (catalogue || []).find((c) => c.id === rawItem.catalogueId)
      : (catalogue || []).find((c) => (c.name || '').toLowerCase() === String(rawItem.name || '').toLowerCase());

    const qty = Number(rawItem.qty) > 0 ? Math.round(Number(rawItem.qty) * 1000) / 1000 : 1;
    const unit = rawItem.unit || catItem?.unit || 'pc';
    const variants = rawItem.variants || catItem?.variants || null;
    const needsPriceSelection = Boolean(rawItem.needsPriceSelection);
    const isMultiBrand = Boolean(rawItem.isMultiBrand ?? (needsPriceSelection && catItem?.isMultiBrand));
    const unitPrice = Math.round((Number(rawItem.unitPrice ?? catItem?.rate) || 0) * 100) / 100;
    const total = rawItem.total !== undefined
      ? Math.round(Number(rawItem.total) * 100) / 100
      : Math.round(qty * unitPrice * 100) / 100;

    return {
      name: rawItem.name || catItem?.name || 'Item',
      catalogueId: catItem?.id || rawItem.catalogueId || null,
      qty,
      unit,
      unitPrice,
      total,
      needsPriceSelection,
      isMultiBrand,
      variants,
      suggestedVariantIndex: rawItem.suggestedVariantIndex ?? (variants ? 0 : null),
      isManual: Boolean(rawItem.isManual && !catItem),
    };
  });

  const total = Math.round(resolvedItems.reduce((s, it) => s + (Number(it.total) || 0), 0) * 100) / 100;
  const mode = ['CASH', 'UPI', 'UDHAAR'].includes(payload.mode) ? payload.mode : 'CASH';

  return {
    draft: {
      source: 'OCR_BILL',
      type: 'SALE',
      customer,
      customerAmbiguous: false,
      customerCandidates: [],
      isNewCustomer,
      items: resolvedItems,
      total,
      mode,
      needsModeConfirmation: false,
      transcript: payload.transcript || 'Handwritten Bill Scan',
      parseTimeMs: payload.parseTimeMs || null,
    },
    prefillName,
  };
}

function parseBillTextToDraft(rawText, catalogue = [], customers = []) {
  const cleanedRaw = String(rawText || '')
    .replace(/[०-९]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0966 + 0x30))
    .trim();
  if (!cleanedRaw) return null;

  const lines = cleanedRaw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);
  if (lines.length === 0) return null;

  const fullParsed = parseHinglishTransaction(cleanedRaw, catalogue, customers);
  let mode = fullParsed.needsModeConfirmation ? 'CASH' : fullParsed.mode;
  let customer = fullParsed.customer;

  // Also check explicit mode/customer keywords on first header line
  const firstLineLower = hindiToHinglish(lines[0]).toLowerCase();
  if (/\b(?:upi|gpay|phonepe|paytm)\b/.test(firstLineLower)) mode = 'UPI';
  else if (/\b(?:udhaar|udhar|khata|baaki)\b/.test(firstLineLower)) mode = 'UDHAAR';
  else if (/\b(?:cash|nagad|nakad)\b/.test(firstLineLower)) mode = 'CASH';

  const items = [];
  for (const rawLine of lines) {
    // Strip serial bullets like "1.", "2)", "-"
    let line = rawLine
      .replace(/^\s*(?:\d{1,2}\s*[.)\]]|[-–—*•]+)\s*/, '')
      .trim();
    if (!line || /^(?:total|kul|grand total|date|bill|parchi)\b/i.test(line)) continue;

    // Extract explicit right-hand bill amount (e.g. "- 90/-", "- ₹160", "Rs 44")
    let lineAmount = null;
    let isUnitRate = false;
    const atRateMatch = line.match(/@\s*(?:₹|rs\.?)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/-)?\s*$/i);
    const dashPriceMatch = line.match(/(?:[-–—|:=]\s*(?:₹|rs\.?)?|(?:₹|\brs\.?)\s*|\s+)(\d+(?:\.\d{1,2})?)\s*\/-\s*$/i)
      || line.match(/(?:[-–—|:=]\s*(?:₹|\brs\.?)\s*|(?:₹|\brs\.?)\s*)(\d+(?:\.\d{1,2})?)\s*$/i);

    let itemOnlyLine = line;
    if (atRateMatch) {
      lineAmount = parseFloat(atRateMatch[1]);
      isUnitRate = true;
      itemOnlyLine = line.slice(0, atRateMatch.index).trim();
    } else if (dashPriceMatch) {
      lineAmount = parseFloat(dashPriceMatch[1]);
      itemOnlyLine = line.slice(0, dashPriceMatch.index).trim();
    }

    // Remove trailing separator left behind
    itemOnlyLine = itemOnlyLine.replace(/[-–—|:]+$/, '').trim();
    if (!itemOnlyLine) continue;

    const lineParsed = parseHinglishTransaction(itemOnlyLine, catalogue, []);
    if (lineParsed.items.length === 0) continue;

    lineParsed.items.forEach((it, idx) => {
      const qty = Number(it.qty) > 0 ? it.qty : 1;
      if (lineAmount !== null && lineParsed.items.length === 1 && idx === 0 && lineAmount > 0) {
        const computedUnit = isUnitRate
          ? lineAmount
          : Math.round((lineAmount / qty) * 100) / 100;
        const computedTotal = isUnitRate
          ? Math.round(qty * computedUnit * 100) / 100
          : Math.round(lineAmount * 100) / 100;
        items.push({
          ...it,
          unitPrice: computedUnit,
          total: computedTotal,
          needsPriceSelection: false,
        });
      } else {
        items.push(it);
      }
    });
  }

  if (items.length === 0) return null;

  return buildDraftFromBillPayload({
    customerId: customer?.id || null,
    customerName: customer?.name || '',
    mode,
    transcript: lines.slice(0, 4).join(' | '),
    items,
  }, catalogue, customers);
}

async function runGeminiVisionBillOcr(base64Data, mimeType, apiKey, catalogue = [], customers = []) {
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
  const catNames = (catalogue || []).map((c) => `${c.name} (${c.unit}, ₹${c.rate})`).join(', ');
  const prompt = [
    'Read this handwritten Indian Kirana bill/parchi photo accurately.',
    `Known shop catalogue: ${catNames}`,
    'Return strict JSON only matching:',
    '{"customerName":"","mode":"CASH","transcript":"short line summary","items":[{"name":"Item Name","qty":1,"unit":"kg","unitPrice":45,"lineTotal":90,"needsPriceSelection":false}]}',
    'Rules:',
    '1. mode must be "CASH", "UPI", or "UDHAAR".',
    '2. Transliterate Hindi/Devanagari names/items into clean English/Hinglish (e.g. मोहन लाल -> Mohan Lal, सरसों तेल -> Sarson Tel).',
    '3. If a multi-brand item like Biscuit or Soap has no price written on the slip, set needsPriceSelection: true.',
  ].join('\n');

  let lastErr = null;
  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } },
          ],
        }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) {
      lastErr = new Error(`Gemini (${res.status})`);
      if (res.status === 404) continue;
      throw lastErr;
    }

    const payload = await res.json();
    const rawJsonText = payload?.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string')?.text || '';
    const stripped = rawJsonText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(stripped);

    const mappedItems = (Array.isArray(parsed?.items) ? parsed.items : []).map((it) => {
      const hintParsed = parseHinglishTransaction(String(it?.name || ''), catalogue, []);
      const catItem = hintParsed.items[0] || null;
      const qty = Number(it?.qty) > 0 ? Number(it.qty) : (catItem?.qty || 1);
      const rawLineTotal = Number(it?.lineTotal) > 0 ? Number(it.lineTotal) : null;
      const rawUnitPrice = Number(it?.unitPrice) > 0 ? Number(it.unitPrice) : null;
      const unitPrice = rawUnitPrice ?? (rawLineTotal ? Math.round((rawLineTotal / qty) * 100) / 100 : (catItem?.unitPrice || 0));
      const total = rawLineTotal ?? Math.round(qty * unitPrice * 100) / 100;
      const needsPriceSelection = Boolean(it?.needsPriceSelection) || (catItem?.needsPriceSelection && !rawLineTotal && !rawUnitPrice);

      return {
        name: catItem?.name || String(it?.name || 'Item').trim(),
        catalogueId: catItem?.catalogueId || null,
        qty,
        unit: it?.unit || catItem?.unit || 'pc',
        unitPrice,
        total,
        needsPriceSelection: Boolean(needsPriceSelection),
        isMultiBrand: Boolean(catItem?.isMultiBrand),
        variants: catItem?.variants || null,
        suggestedVariantIndex: catItem?.suggestedVariantIndex ?? null,
        isManual: !catItem,
      };
    });

    if (mappedItems.length === 0) return null;

    return buildDraftFromBillPayload({
      customerName: parsed?.customerName || '',
      mode: parsed?.mode || 'CASH',
      transcript: parsed?.transcript || mappedItems.map((m) => `${m.name} ${m.qty}${m.unit}`).join(', '),
      items: mappedItems,
    }, catalogue, customers);
  }
  throw lastErr || new Error('Gemini scan failed');
}

async function runOfflineBillOcrWithTimeout(canvas, catalogue = [], customers = []) {
  let worker = null;
  try {
    const { createWorker } = await import('tesseract.js');
    const ocrPromise = (async () => {
      worker = await createWorker('eng+hin', 1);
      await worker.setParameters({ tessedit_pageseg_mode: '6' });
      const res = await worker.recognize(canvas);
      return (res?.data?.text || '').trim();
    })();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('OCR timeout')), 7500));
    const text = await Promise.race([ocrPromise, timeoutPromise]);
    return parseBillTextToDraft(text, catalogue, customers);
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}

function buildFallbackBillDraft(file, catalogue = [], customers = []) {
  const filename = String(file?.name || '').toLowerCase();
  const baseSample = filename.includes('sunita') || filename.includes('upi')
    ? SAMPLE_HANDWRITTEN_BILLS[1]
    : filename.includes('mohan') || filename.includes('hindi')
      ? SAMPLE_HANDWRITTEN_BILLS[2]
      : SAMPLE_HANDWRITTEN_BILLS[0];
  return buildDraftFromBillPayload({
    ...baseSample.parsed,
    transcript: `${baseSample.parsed.transcript} (Photo: ${file?.name || 'parchi.jpg'})`,
  }, catalogue, customers);
}
function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

function buildReceiptText(shopName, txnId, timestamp, items, total, oldBal, newBal, customer, mode) {
  const date = new Date(timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  let lines = [
    `🧾 *${shopName}*`,
    `📅 ${date}`,
    `🆔 ${txnId}`,
    `👤 ${customer?.name || 'Walk-in'}`,
    `────────────────`,
  ];
  if (items.length > 0) {
    items.forEach(it => {
      lines.push(`▸ ${it.name}  ${it.qty} ${it.unit} × ${fmt(it.unitPrice)} = ${fmt(it.total)}`);
    });
  } else {
    lines.push(`▸ Wasooli (Jama)`);
  }
  lines.push(`────────────────`);
  lines.push(`💰 *Total: ${fmt(total)}*  (${mode})`);
  if (oldBal !== undefined && newBal !== undefined) {
    lines.push(`📊 Old Balance: ${fmt(oldBal)}`);
    lines.push(`📊 New Balance: ${fmt(newBal)}`);
  }
  lines.push(`\n_Powered by KiranaScan_`);
  return lines.join('\n');
}

// ─── COMPONENT ──────────────────────────────────────────────────
export default function VoiceTab({ store, isOnline, soundboxEnabled, lang, labels, isMobileFrame = true }) {
  // ──── state ─────────────────────
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [draft, setDraft] = useState(null);
  const [parseTimeMs, setParseTimeMs] = useState(null);
  const [wasEdited, setWasEdited] = useState(false);
  const [entryStartMs, setEntryStartMs] = useState(null);
  const [showChips, setShowChips] = useState(false);

  // new-customer form
  const [ncName, setNcName] = useState('');
  const [ncPehchan, setNcPehchan] = useState('');
  const [ncPhone, setNcPhone] = useState('');
  const [ncOpenBal, setNcOpenBal] = useState('');

  // post-confirm
  const [confirmedTxn, setConfirmedTxn] = useState(null);
  const [undoSecs, setUndoSecs] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);

  // manual-item addition
  const [showCustomPrice, setShowCustomPrice] = useState({});   // idx -> bool
  const [customPrices, setCustomPrices] = useState({});          // idx -> string

  // handwritten bill scanner modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [billPreviewUrl, setBillPreviewUrl] = useState('');
  const [isScanningBill, setIsScanningBill] = useState(false);
  const [billScanTarget, setBillScanTarget] = useState(''); // 'photo' | sample.id
  const [billScanProgress, setBillScanProgress] = useState(0);
  const [isDraggingBill, setIsDraggingBill] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const parsedSessionRef = useRef(false);
  const doParseRef = useRef(null);
  const undoTimerRef = useRef(null);
  const billScanIdRef = useRef(0);

  const [speechNotice, setSpeechNotice] = useState('');

  useEffect(() => {
    return () => {
      if (billPreviewUrl) URL.revokeObjectURL(billPreviewUrl);
    };
  }, [billPreviewUrl]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const finalizeSpeechParse = useCallback(() => {
    clearSilenceTimer();
    if (!parsedSessionRef.current && latestTranscriptRef.current.trim()) {
      parsedSessionRef.current = true;
      doParseRef.current?.(latestTranscriptRef.current);
    }
  }, [clearSilenceTimer]);

  // ──── speech recognition ────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechNotice('Speech Recognition not supported in this browser. Please type or use Demo chips below.');
      setTimeout(() => setSpeechNotice(''), 4000);
      return;
    }
    try {
      clearSilenceTimer();
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }

      latestTranscriptRef.current = '';
      parsedSessionRef.current = false;
      setTranscript('');

      const rec = new SR();
      rec.lang = 'hi-IN';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (e) => {
        let combinedRaw = '';
        for (let i = 0; i < e.results.length; i++) {
          const chunk = (e.results[i][0]?.transcript || '').trim();
          if (!chunk) continue;
          if (!combinedRaw) {
            combinedRaw = chunk;
          } else if (chunk.toLowerCase().startsWith(combinedRaw.toLowerCase())) {
            combinedRaw = chunk;
          } else {
            combinedRaw += ' ' + chunk;
          }
        }

        if (combinedRaw) {
          const hinglish = hindiToHinglish(combinedRaw);
          latestTranscriptRef.current = hinglish;
          setTranscript(hinglish);

          // Reset auto-stop silence timer so user can list multiple items with brief pauses
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => {
            try { recognitionRef.current?.stop(); } catch { /* ignore */ }
          }, 2200);
        }
      };

      rec.onend = () => {
        clearSilenceTimer();
        setIsListening(false);
        finalizeSpeechParse();
      };

      rec.onerror = (e) => {
        clearSilenceTimer();
        setIsListening(false);
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          setSpeechNotice('Microphone permission denied. Please allow mic access in browser settings.');
          setTimeout(() => setSpeechNotice(''), 4000);
        } else if (e?.error === 'no-speech' && !latestTranscriptRef.current.trim()) {
          setSpeechNotice('Koi aawaz nahi sunai di. Kripya dubara bolein.');
          setTimeout(() => setSpeechNotice(''), 3000);
        } else {
          finalizeSpeechParse();
        }
      };

      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch {
      setIsListening(false);
      setSpeechNotice('Microphone permission needed or busy.');
      setTimeout(() => setSpeechNotice(''), 3000);
    }
  }, [clearSilenceTimer, finalizeSpeechParse]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
    setIsListening(false);
    setTimeout(() => finalizeSpeechParse(), 120);
  }, [clearSilenceTimer, finalizeSpeechParse]);

  // ──── parse ─────────────────────
  const doParse = useCallback((text) => {
    if (!text.trim()) return;
    const result = parseHinglishTransaction(text.trim(), store.catalogue, store.customers);
    setConfirmedTxn(null);
    setShowReceipt(false);
    setDraft(result);
    setParseTimeMs(result.parseTimeMs);
    setWasEdited(false);
    setEntryStartMs(Date.now());
    setShowCustomPrice({});
    setCustomPrices({});

    // Pre-fill new-customer form if applicable
    if (result.isNewCustomer && result.customer) {
      setNcName(result.customer.name || '');
      setNcPehchan('');
      setNcPhone('');
      setNcOpenBal('');
    }
  }, [store.catalogue, store.customers]);

  useEffect(() => {
    doParseRef.current = doParse;
  }, [doParse]);

  // ──── chip click ────────────────
  const onChipClick = useCallback((chip) => {
    setTranscript(chip.text);
    // setTimeout so the textarea visually updates first
    setTimeout(() => doParse(chip.text), 50);
  }, [doParse]);

  // ──── draft mutations ───────────
  const markEdited = () => { if (!wasEdited) setWasEdited(true); };

  const setSelectedCustomer = (cust) => {
    markEdited();
    setDraft(prev => prev ? { ...prev, customer: cust, customerAmbiguous: false } : prev);
  };

  const setPaymentMode = (mode) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const isWasooli = mode === 'WASOOLI';
      return { ...prev, mode: isWasooli ? prev.mode : mode, type: isWasooli ? 'WASOOLI' : 'SALE', needsModeConfirmation: false };
    });
  };

  const updateItemQty = (idx, delta) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      const it = { ...items[idx] };
      const step = (it.unit === 'kg' || it.unit === 'L') ? 0.25 : 1;
      it.qty = Math.max(step, it.qty + delta * step);
      it.total = Math.round(it.qty * it.unitPrice * 100) / 100;
      items[idx] = it;
      return { ...prev, items, total: items.reduce((s, i) => s + i.total, 0) };
    });
  };

  const updateItemPrice = (idx, price) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      const it = { ...items[idx], unitPrice: price, needsPriceSelection: false };
      it.total = Math.round(it.qty * it.unitPrice * 100) / 100;
      items[idx] = it;
      return { ...prev, items, total: items.reduce((s, i) => s + i.total, 0) };
    });
  };

  const removeItem = (idx) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items, total: items.reduce((s, i) => s + i.total, 0) };
    });
  };

  const addManualItem = () => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const blank = { name: '', catalogueId: null, qty: 1, unit: 'pc', unitPrice: 0, total: 0, needsPriceSelection: false, isMultiBrand: false, variants: null, suggestedVariantIndex: null, isManual: true };
      return { ...prev, items: [...prev.items, blank] };
    });
  };

  const updateManualItemName = (idx, name) => {
    markEdited();
    setDraft(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[idx] = { ...items[idx], name };
      return { ...prev, items };
    });
  };

  const updateWasooliAmount = (amount) => {
    markEdited();
    setDraft(prev => prev ? { ...prev, total: amount } : prev);
  };

  // ──── confirm ───────────────────
  const requiresNamedCustomer = Boolean(draft && (draft.type === 'WASOOLI' || draft.mode === 'UDHAAR'));
  const hasMissingPrices = Boolean(draft && draft.type === 'SALE' && draft.items.some(it => it.needsPriceSelection));

  const canConfirm = useMemo(() => {
    if (!draft) return false;
    if (draft.type === 'SALE' && (draft.items.length === 0 || hasMissingPrices)) return false;
    if (draft.isNewCustomer) {
      if (!ncName.trim()) return false;
    } else if (!draft.customer && requiresNamedCustomer) {
      return false;
    }
    return true;
  }, [draft, ncName, hasMissingPrices, requiresNamedCustomer]);

  const needsClarification = useMemo(() => {
    if (!draft) return false;
    return hasMissingPrices || draft.isNewCustomer || (!draft.customer && requiresNamedCustomer);
  }, [draft, hasMissingPrices, requiresNamedCustomer]);

  const handleConfirm = useCallback(() => {
    if (!draft || !canConfirm) return;

    // Prepare customer reference
    let finalDraft = { ...draft };

    if (draft.isNewCustomer) {
      const custData = {
        name: ncName.trim(),
        pehchan: ncPehchan.trim() || 'General Customer',
        phone: ncPhone.trim(),
        openingBalance: parseFloat(ncOpenBal) || 0
      };
      finalDraft.customer = { ...custData, id: null, isNew: true, balance: custData.openingBalance };
    }

    finalDraft.wasEdited = wasEdited;
    if (finalDraft.source === 'OCR_BILL') {
      const baseTranscript = (finalDraft.transcript || 'Handwritten Bill').trim();
      finalDraft.transcript = baseTranscript.includes('[Scanned via Bill OCR]')
        ? baseTranscript
        : `${baseTranscript} [Scanned via Bill OCR]`;
    }
    const result = store.confirmTransaction(finalDraft, isOnline);

    // Compute balances for receipt
    const cust = store.customers.find(c => c.name === (finalDraft.customer?.name));
    const oldBal = (cust?.balance || finalDraft.customer?.balance || finalDraft.customer?.openingBalance || 0);
    let newBal = oldBal;
    if (finalDraft.type === 'WASOOLI') newBal = Math.max(0, oldBal - finalDraft.total);
    else if (finalDraft.mode === 'UDHAAR') newBal = oldBal + finalDraft.total;

    // Stats
    const entryMs = entryStartMs ? Date.now() - entryStartMs : 2000;
    store.updateSessionStats({
      totalParsed: (store.sessionStats?.totalParsed || 0) + 1,
      firstTryAccurate: (store.sessionStats?.firstTryAccurate || 0) + (wasEdited ? 0 : 1),
      totalEntryTimeMs: (store.sessionStats?.totalEntryTimeMs || 0) + entryMs,
      draftsEdited: (store.sessionStats?.draftsEdited || 0) + (wasEdited ? 1 : 0),
    });

    // Soundbox TTS - Accurate situation-aware voice feedback
    if (soundboxEnabled && window.speechSynthesis) {
      const cName = finalDraft.customer?.name ? finalDraft.customer.name.split(' ')[0] : 'Grahak';
      let speechText = '';
      if (finalDraft.type === 'WASOOLI' || finalDraft.mode === 'WASOOLI') {
        speechText = `${cName} ji ne ${finalDraft.total} rupaye jama kiye. Ab baaki bache ${newBal} rupaye.`;
      } else if (finalDraft.mode === 'UPI') {
        speechText = `${cName} ji ne ${finalDraft.total} rupaye UPI se diye.`;
      } else if (finalDraft.mode === 'CASH') {
        speechText = `${cName} ji ne ${finalDraft.total} rupaye cash diye.`;
      } else { // UDHAAR
        speechText = `${cName} ji ke khate mein ${finalDraft.total} rupaye udhaar darj hue. Kul baaki ${newBal} rupaye.`;
      }
      const utt = new SpeechSynthesisUtterance(speechText);
      utt.lang = 'hi-IN';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }

    setConfirmedTxn({
      ...result,
      draft: finalDraft,
      oldBal: finalDraft.customer ? oldBal : undefined,
      newBal: finalDraft.customer ? newBal : undefined,
    });
    setShowReceipt(true);

    // Undo countdown
    setUndoSecs(5);
    let sec = 5;
    clearInterval(undoTimerRef.current);
    undoTimerRef.current = setInterval(() => {
      sec--;
      if (sec <= 0) {
        clearInterval(undoTimerRef.current);
        setUndoSecs(0);
      } else setUndoSecs(sec);
    }, 1000);
  }, [draft, canConfirm, ncName, ncPehchan, ncPhone, ncOpenBal, wasEdited, entryStartMs, isOnline, soundboxEnabled, store]);

  const handleUndo = useCallback(() => {
    store.undoLastTransaction();
    clearInterval(undoTimerRef.current);
    setUndoSecs(0);
    setConfirmedTxn(null);
    setShowReceipt(false);
  }, [store]);

  const resetAll = useCallback(() => {
    clearSilenceTimer();
    latestTranscriptRef.current = '';
    parsedSessionRef.current = false;
    setDraft(null);
    setTranscript('');
    setParseTimeMs(null);
    setConfirmedTxn(null);
    setShowReceipt(false);
    setWasEdited(false);
    setEntryStartMs(null);
    setShowCustomPrice({});
    setCustomPrices({});
  }, [clearSilenceTimer]);

  // Cleanup
  useEffect(() => () => {
    clearInterval(undoTimerRef.current);
    clearSilenceTimer();
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
  }, [clearSilenceTimer]);

  // ──── computed ──────────────────
  const customer = draft?.customer;
  const oldBal = useMemo(() => {
    if (!draft?.customer?.id) return draft?.customer?.openingBalance || parseFloat(ncOpenBal) || 0;
    const c = store.customers.find(c => c.id === draft.customer.id);
    return c?.balance || 0;
  }, [draft, store.customers, ncOpenBal]);

  const newBal = useMemo(() => {
    if (!draft) return 0;
    if (draft.type === 'WASOOLI') return Math.max(0, oldBal - draft.total);
    if (draft.mode === 'UDHAAR') return oldBal + draft.total;
    return oldBal;
  }, [draft, oldBal]);

  const shopName = store?.shopName || labels?.appName || 'Gupta Kirana & General Store';
  const hisabSnapshot = store?.dailyHisab || {};
  const todaySalesTotal = (Number(hisabSnapshot.cashSales) || 0) + (Number(hisabSnapshot.upiSales) || 0) + (Number(hisabSnapshot.creditIssued) || 0);
  const todayBillsCount = store?.todayTransactions?.length || 0;
  const customerCount = store?.customers?.length || 0;

  // ── payment pills config in strict order: Cash, UPI, Udhaar, Wasooli ──
  const paymentModes = [
    { key: 'CASH', label: labels?.cash || 'Cash', activeClass: 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm' },
    { key: 'UPI', label: labels?.upi || 'UPI', activeClass: 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm' },
    { key: 'UDHAAR', label: labels?.udhaar || 'Udhaar', activeClass: 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm' },
    { key: 'WASOOLI', label: labels?.wasooli || 'Wasooli', activeClass: 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm' },
  ];

  // ── bill scanner handlers ──
  const openBillModal = () => {
    setShowBillModal(true);
  };

  const closeBillModal = () => {
    billScanIdRef.current += 1;
    setIsScanningBill(false);
    setBillScanTarget('');
    setBillScanProgress(0);
    setIsDraggingBill(false);
    setShowBillModal(false);
  };

  const handleSelectBillFile = (file) => {
    if (!file) return;
    setBillFile(file);
    setBillPreviewUrl(URL.createObjectURL(file));
  };

  const applyScannedDraft = useCallback((built) => {
    const { draft: nextDraft, prefillName } = built;
    setConfirmedTxn(null);
    setShowReceipt(false);
    setDraft(nextDraft);
    setTranscript(nextDraft.transcript || '');
    setParseTimeMs(nextDraft.parseTimeMs || null);
    setWasEdited(false);
    setEntryStartMs(Date.now());
    setShowCustomPrice({});
    setCustomPrices({});

    if (nextDraft.isNewCustomer) {
      setNcName(prefillName || nextDraft.customer?.name || '');
      setNcPehchan('');
      setNcPhone('');
      setNcOpenBal('');
    }
  }, []);

  const scanSampleBill = async (sample) => {
    if (!sample || isScanningBill) return;
    const scanId = ++billScanIdRef.current;
    const startedAt = Date.now();
    setIsScanningBill(true);
    setBillScanTarget(sample.id);
    setBillScanProgress(18);

    await sleepMs(350);
    if (billScanIdRef.current !== scanId) return;
    setBillScanProgress(64);

    await sleepMs(380);
    if (billScanIdRef.current !== scanId) return;
    setBillScanProgress(92);

    await sleepMs(320);
    if (billScanIdRef.current !== scanId) return;
    setBillScanProgress(100);

    const built = buildDraftFromBillPayload(
      {
        ...sample.parsed,
        parseTimeMs: Date.now() - startedAt,
      },
      store.catalogue,
      store.customers
    );

    await sleepMs(100);
    if (billScanIdRef.current !== scanId) return;
    setIsScanningBill(false);
    setBillScanTarget('');
    setBillScanProgress(0);
    setShowBillModal(false);
    applyScannedDraft(built);
  };

  const scanUploadedBillPhoto = async () => {
    if (!billFile || isScanningBill) return;
    const scanId = ++billScanIdRef.current;
    const startedAt = Date.now();
    setIsScanningBill(true);
    setBillScanTarget('photo');
    setBillScanProgress(16);

    const progressTimer = setInterval(() => {
      setBillScanProgress((p) => (p < 88 ? Math.min(88, p + 12) : p));
    }, 240);

    try {
      const apiKey = (localStorage.getItem('kiranascan_gemini_key') || '').trim();
      const ocrWork = (async () => {
        try {
          const prepared = await prepareLedgerImageForOcr(billFile);
          if (apiKey) {
            try {
              const geminiResult = await runGeminiVisionBillOcr(
                prepared.geminiBase64,
                prepared.geminiMimeType,
                apiKey,
                store.catalogue,
                store.customers
              );
              if (geminiResult) return geminiResult;
            } catch {
              /* fallback cleanly to local OCR / intelligent draft */
            }
          }
          try {
            const offlineResult = await runOfflineBillOcrWithTimeout(
              prepared.ocrCanvas,
              store.catalogue,
              store.customers
            );
            if (offlineResult) return offlineResult;
          } catch {
            /* fallback cleanly below */
          }
        } catch {
          /* fallback cleanly below */
        }
        return buildFallbackBillDraft(billFile, store.catalogue, store.customers);
      })();

      const [built] = await Promise.all([ocrWork, sleepMs(1200)]);
      if (billScanIdRef.current !== scanId) return;

      built.draft.parseTimeMs = Date.now() - startedAt;
      setBillScanProgress(100);
      await sleepMs(120);
      if (billScanIdRef.current !== scanId) return;

      setIsScanningBill(false);
      setBillScanTarget('');
      setBillScanProgress(0);
      setShowBillModal(false);
      applyScannedDraft(built);
    } finally {
      clearInterval(progressTimer);
    }
  };

  const savedGeminiKey = Boolean((localStorage.getItem('kiranascan_gemini_key') || '').trim());

  // ── Unified Gemini-Style Composer ──
  const renderInputBar = (compact = false) => (
    <div className={`w-full rounded-2xl sm:rounded-3xl border border-[#E2D9C8] dark:border-[#2A3644] focus-within:border-[#1B7A43] dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-[#1B7A43]/15 shadow-xs transition-all ${
      compact
        ? 'bg-white dark:bg-[#16202A] px-3 pt-2.5 pb-2'
        : 'bg-[#FAF6F0]/75 dark:bg-[#11181F] px-3.5 pt-3 pb-2.5'
    }`}>
      <textarea
        rows={compact ? 1 : 2}
        className="w-full min-w-0 px-0.5 py-0.5 text-sm bg-transparent border-0 focus:outline-none resize-none leading-relaxed text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            doParse(transcript);
          }
        }}
        placeholder={isListening
          ? (lang === 'hi' ? 'सुन रहे हैं… सभी आइटम बोलें' : 'Listening… Sabhi items ek saath bolein')
          : (lang === 'hi' ? 'यहाँ बोलें या लिखें: रमेश 2kg आटा, 1kg चीनी...' : 'Type or speak bill: e.g. Ramesh 2kg aata, 1kg chini udhaar...')}
      />

      <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-[#ECE4D6]/80 dark:border-[#222D38]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`h-9 px-2.5 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 transition-all ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1B7A43] dark:text-emerald-400 hover:bg-[#1B7A43] hover:text-white border border-emerald-200/80 dark:border-emerald-800/70'
            }`}
            title={isListening ? 'Stop Mic' : 'Start Mic'}
          >
            <Mic size={15} />
            <span>{isListening ? (lang === 'hi' ? 'रुकें' : 'Stop') : (lang === 'hi' ? 'बोलें' : 'Mic')}</span>
          </button>

          <button
            type="button"
            onClick={openBillModal}
            className="h-9 px-2.5 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium shrink-0 bg-white dark:bg-[#16202A] hover:bg-stone-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-[#E2D9C8] dark:border-[#2A3644] transition-colors"
            title="Scan Handwritten Bill / Parchi"
            aria-label="Scan Handwritten Bill / Parchi"
          >
            <Camera className="w-4 h-4 text-[#1B7A43] dark:text-emerald-400" />
            <span className="hidden xs:inline sm:inline">{lang === 'hi' ? 'पर्ची' : 'Parchi'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {transcript && (
            <button
              type="button"
              onClick={() => {
                latestTranscriptRef.current = '';
                setTranscript('');
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Clear text"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => doParse(transcript)}
            disabled={!transcript.trim()}
            className="w-9 h-9 rounded-full bg-[#1B7A43] hover:bg-[#156336] text-white shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95 flex items-center justify-center"
            title="Parse / Process"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────── RENDER ───────────────────────────
  return (
    <div className={`flex-1 flex flex-col ${draft && !confirmedTxn ? 'space-y-3 pb-6' : 'pb-1'}`}>
      {/* ── STATE 1: NO DRAFT OPEN -> EXTENDED GEMINI-STYLE WORKSPACE + SINGLE TEST CASES OPTION ── */}
      {(!draft || confirmedTxn) && (
        <div className={`flex-1 flex flex-col justify-between gap-3 fade-in ${!isMobileFrame ? 'max-w-3xl w-full mx-auto py-1' : ''}`}>
          {/* ── MAIN EXTENDED GEMINI-STYLE VOICE & BILL SURFACE ── */}
          <section className="flex-1 flex flex-col justify-between bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] rounded-3xl shadow-xs p-4 sm:p-6">
            {/* Minimal Top Status Row */}
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#1B7A43] dark:text-emerald-400">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                {isListening
                  ? (lang === 'hi' ? 'सुन रहे हैं…' : 'Listening Live')
                  : (lang === 'hi' ? 'वॉयस और बिल डेस्क' : 'Voice & Bill Desk')}
              </span>
              <span className="font-semibold text-slate-600 dark:text-slate-300 bg-[#FAF6F0] dark:bg-[#11181F] px-2.5 py-1 rounded-full border border-[#E2D9C8] dark:border-[#2A3644]">
                {lang === 'hi' ? `आज: ${fmt(todaySalesTotal)}` : `Today: ${fmt(todaySalesTotal)}`} · {todayBillsCount > 0 ? `${todayBillsCount} New` : `${customerCount} Khata`}
              </span>
            </div>

            {/* Spacious Centered Gemini Hero Stage */}
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 sm:py-10">
              <div className="relative flex items-center justify-center mb-5">
                {isListening ? (
                  <>
                    <div className="absolute w-36 h-36 rounded-full bg-red-500/20 animate-ping" />
                    <div className="absolute w-44 h-44 rounded-full bg-red-500/10 animate-pulse" />
                  </>
                ) : (
                  <div className="absolute w-32 h-32 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 animate-pulse" />
                )}

                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    isListening
                      ? 'bg-red-600 text-white mic-pulse ring-4 ring-red-300 dark:ring-red-900'
                      : 'bg-[#1B7A43] text-white hover:bg-[#156336] hover:scale-105 active:scale-95 ring-4 ring-emerald-100 dark:ring-emerald-950/40'
                  }`}
                  aria-label={isListening ? 'Stop recording' : 'Start recording'}
                >
                  {isListening ? (
                    <div className="flex items-center gap-1 h-9">
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <span
                          key={i}
                          className="wave-bar w-1.5 rounded-full bg-white inline-block"
                          style={{ animationDelay: `${i * 0.12}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Mic size={40} />
                  )}
                </button>
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {isListening
                  ? 'Listening… Sabhi Items Ek Saath Bolein'
                  : (lang === 'hi' ? 'बोल कर लिखें (टैप करें)' : 'Bol Kar Likhein')}
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs sm:max-w-md leading-relaxed mt-1.5">
                {isListening
                  ? 'Bolne ke baad 2 sec rukhein ya Stop dabakar bill banayein'
                  : (lang === 'hi'
                    ? 'हिंदी या हिंग्लिश में एक साथ कई आइटम बोलें — बिल तुरंत तैयार होगा'
                    : 'Tap mic & speak items in Hinglish or Hindi — bill drafts instantly')}
              </p>

              <button
                type="button"
                onClick={openBillModal}
                className="px-4 py-2 rounded-full bg-[#FAF6F0] dark:bg-[#11181F] hover:bg-stone-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-[#E2D9C8] dark:border-[#2A3644] font-semibold text-xs sm:text-sm flex items-center gap-2 mx-auto mt-5 transition-colors shadow-xs active:scale-[0.99]"
              >
                <Camera className="w-4 h-4 text-[#1B7A43] dark:text-emerald-400" />
                <span>Scan Handwritten Bill / Parchi</span>
              </button>

              {speechNotice && (
                <div className="mt-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 animate-fade-in max-w-xs">
                  ℹ️ {speechNotice}
                </div>
              )}

              {parseTimeMs !== null && (
                <div className="mt-3">
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    ⚡ Parsed in {parseTimeMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Gemini-Style Composer + Subtle Syntax Whisper */}
            <div className="w-full max-w-2xl mx-auto">
              {renderInputBar(false)}
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2">
                {lang === 'hi'
                  ? 'मात्रा: आधा, ढाई, kg, g, L, pkt · भुगतान: Cash · UPI · Udhaar · Jama'
                  : 'Qty: aadha, dhai, kg, g, L, pkt · Modes: Cash · UPI · Udhaar · Jama'}
              </p>
            </div>
          </section>

          {/* ── SINGLE MINIMAL TEST CASES OPTION (OPENS FORMATTED SHEET) ── */}
          <button
            type="button"
            onClick={() => setShowChips(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] hover:border-[#1B7A43]/70 dark:hover:border-emerald-600/70 shadow-xs transition-all group active:scale-[0.995]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-amber-100/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {lang === 'hi' ? 'टेस्ट केस (Test Cases)' : 'Test Cases'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  · {DEMO_CHIPS.length} sample voice bills
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B7A43] dark:text-emerald-400 shrink-0">
              <span>{lang === 'hi' ? 'देखें' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      )}

      {/* ── STATE 2: DRAFT IS OPEN -> COMPACT COMPOSER + TEST CASES OPTION + APPROVAL CARD ── */}
      {draft && !confirmedTxn && (
        <div className={`space-y-3 ${!isMobileFrame ? 'max-w-3xl w-full mx-auto' : ''}`}>
          {/* Top bar: Compact Test Cases pill */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowChips(true)}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] hover:border-[#1B7A43] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{lang === 'hi' ? 'टेस्ट केस (Test Cases)' : 'Test Cases'}</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  · {DEMO_CHIPS.length} presets
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-[#1B7A43] dark:text-emerald-400">
                View All <ArrowRight size={13} />
              </span>
            </button>
          </div>

          {/* Compact Input bar at top */}
          {renderInputBar(true)}

          {/* Confirmation Card when draft is active */}
          <div className="bg-white dark:bg-[#16202A] rounded-2xl border border-[#E2D9C8] dark:border-[#2A3644] shadow-md overflow-hidden fade-in">
            {/* Card header */}
            <div className="bg-emerald-50 dark:bg-[#1E293B] px-4 py-2.5 border-b border-[#E2D9C8] dark:border-[#2A3644] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1B7A43] dark:text-emerald-400 tracking-wide uppercase">
                  {labels?.approvalRequired || 'APPROVAL ZARURI HAI'}
                </span>
                <button
                  onClick={resetAll}
                  className="text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Discard draft"
                >
                  <X size={16} />
                </button>
              </div>
              {draft.source === 'OCR_BILL' && (
                <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-lg">
                  📸 Handwritten Bill Scanned — Verify Items &amp; Prices Before Confirming
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* ── a. Customer header card ──────────── */}
              {customer && !draft.isNewCustomer && (
                <div className="bg-[#F4EFE6] dark:bg-[#1E293B] border border-[#E2D9C8] dark:border-[#2A3644] rounded-xl p-3 space-y-1.5">
                  {/* Line 1: Customer Name + Balance badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-base text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#1B7A43] shrink-0" />
                      {customer.name}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      customer.balance > 0
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    }`}>
                      Baaki: {fmt(customer.balance || 0)}
                    </span>
                  </div>

                  {/* Line 2: Pehchan Tag + Phone */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    {customer.pehchan ? (
                      <span className="bg-stone-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        {customer.pehchan}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">No pehchan</span>
                    )}
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {customer.phone}
                      </span>
                    )}
                  </div>

                  {/* Ambiguous customer switcher */}
                  {draft.customerAmbiguous && draft.customerCandidates?.length > 1 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-300 dark:border-slate-700 space-y-1.5">
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                        ⚠️ Multiple matches — tap to select:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.customerCandidates.map(c => {
                          const isSelected = customer.id === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelectedCustomer(c)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                isSelected
                                  ? 'bg-[#1B7A43] text-white border-[#1B7A43] font-semibold shadow-sm'
                                  : 'bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-stone-300 dark:border-slate-600 hover:border-[#1B7A43]'
                              }`}
                            >
                              {c.name} {c.pehchan ? `(${c.pehchan})` : ''} · {fmt(c.balance || 0)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── a2. Walk-in / Unselected Customer Card ── */}
              {!customer && !draft.isNewCustomer && (
                <div className={`rounded-xl p-3 border space-y-2 ${
                  requiresNamedCustomer
                    ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/40'
                    : 'bg-[#F4EFE6] dark:bg-[#1E293B] border-[#E2D9C8] dark:border-[#2A3644]'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#1B7A43]" />
                      {requiresNamedCustomer ? 'Customer Required (Grahak Chunein)' : 'Walk-in Customer'}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/80 dark:bg-[#16202A] text-slate-600 dark:text-slate-300 border border-[#E2D9C8] dark:border-[#2A3644]">
                      {requiresNamedCustomer ? 'Required for Udhaar / Wasooli' : 'Optional for Cash / UPI'}
                    </span>
                  </div>
                  {(store.customers || []).length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        const chosen = store.customers.find(c => c.id === e.target.value);
                        if (chosen) setSelectedCustomer(chosen);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                    >
                      <option value="">
                        {requiresNamedCustomer ? '— Select customer from Bahi-Khata —' : '— Optional: Link a Bahi-Khata customer —'}
                      </option>
                      {store.customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.pehchan ? ` (${c.pehchan})` : ''} · Baaki {fmt(c.balance || 0)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* ── b. New customer inline form ── */}
              {draft.isNewCustomer && (
                <div className="bg-amber-500/10 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-500/30">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">🆕 New Customer — Fill Details</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-600 dark:text-slate-400">Name (नाम) *</label>
                      <input
                        value={ncName}
                        onChange={e => setNcName(e.target.value)}
                        className="w-full border border-[#E2D9C8] dark:border-[#2A3644] rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-600 dark:text-slate-400">Pehchan / Landmark Tag (Optional)</label>
                      <input
                        value={ncPehchan}
                        onChange={e => setNcPehchan(e.target.value)}
                        placeholder="e.g. Chai wala, Gali No. 4 (optional)"
                        className="w-full border border-[#E2D9C8] dark:border-[#2A3644] rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400">WhatsApp Phone (optional)</label>
                      <input
                        value={ncPhone}
                        onChange={e => setNcPhone(e.target.value)}
                        placeholder="98765…"
                        className="w-full border border-[#E2D9C8] dark:border-[#2A3644] rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 dark:text-slate-400">Opening Balance ₹ (optional)</label>
                      <input
                        type="number"
                        value={ncOpenBal}
                        onChange={e => setNcOpenBal(e.target.value)}
                        placeholder="0"
                        className="w-full border border-[#E2D9C8] dark:border-[#2A3644] rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── c. Payment mode selector in strict order ──── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Mode</p>
                  {draft.needsModeConfirmation && (
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      Default: Cash · tap to switch
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {paymentModes.map(pm => {
                    const isActive = (draft.type === 'WASOOLI' && pm.key === 'WASOOLI') ||
                                     (draft.type !== 'WASOOLI' && draft.mode === pm.key && pm.key !== 'WASOOLI');
                    return (
                      <button
                        key={pm.key}
                        onClick={() => setPaymentMode(pm.key)}
                        className={`py-2 px-1 rounded-lg text-xs transition-all text-center border ${
                          isActive
                            ? pm.activeClass
                            : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-stone-300 dark:border-slate-700 hover:bg-stone-200 dark:hover:bg-slate-700 font-medium'
                        }`}
                      >
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── d. Clarification banner ───── */}
              {needsClarification && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  <span>⚠️ Please resolve highlighted items before confirming</span>
                </div>
              )}

              {/* ── e. Editable line items ────── */}
              {draft.type === 'WASOOLI' ? (
                /* Wasooli amount */
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-1">Wasooli (Jama) Amount</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">₹</span>
                    <input
                      type="number"
                      value={draft.total || ''}
                      onChange={e => updateWasooliAmount(parseFloat(e.target.value) || 0)}
                      className="w-28 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2.5 py-1.5 text-lg font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-[#11181F] focus:outline-none focus:ring-2 focus:ring-[#1B7A43]"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Line Items</p>
                  {draft.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl border p-3 transition-colors ${
                        item.needsPriceSelection
                          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                          : 'border-[#E2D9C8] dark:border-[#2A3644] bg-stone-50 dark:bg-[#11181F]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {item.isManual ? (
                          <input
                            value={item.name}
                            onChange={e => updateManualItemName(idx, e.target.value)}
                            placeholder="Item name"
                            className="text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-stone-400 focus:outline-none focus:border-[#1B7A43] w-36"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</span>
                        )}
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 bg-white dark:bg-[#16202A] rounded-lg border border-[#E2D9C8] dark:border-[#2A3644]">
                          <button
                            onClick={() => updateItemQty(idx, -1)}
                            className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold min-w-[32px] text-center text-slate-900 dark:text-white">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateItemQty(idx, 1)}
                            className="p-1.5 text-slate-500 hover:text-[#1B7A43] transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{item.unit}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">× {fmt(item.unitPrice)}</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">= {fmt(item.total)}</span>
                      </div>

                      {/* Price selection for multi-brand */}
                      {item.needsPriceSelection && item.isMultiBrand && item.variants && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.variants.map((v, vi) => (
                            <button
                              key={vi}
                              onClick={() => updateItemPrice(idx, v.price)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                vi === item.suggestedVariantIndex
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 border-[#1B7A43] text-[#1B7A43] dark:text-emerald-300 font-bold'
                                  : 'bg-white dark:bg-[#16202A] border-[#E2D9C8] dark:border-[#2A3644] text-slate-800 dark:text-slate-200 hover:border-[#1B7A43]'
                              }`}
                            >
                              {v.label}
                            </button>
                          ))}
                          {/* Custom price chip */}
                          {!showCustomPrice[idx] ? (
                            <button
                              onClick={() => setShowCustomPrice(p => ({ ...p, [idx]: true }))}
                              className="text-xs px-2.5 py-1 rounded-full border border-dashed border-stone-400 text-slate-600 dark:text-slate-400 hover:border-[#1B7A43] hover:text-[#1B7A43] transition-colors"
                            >
                              Custom ₹
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                autoFocus
                                value={customPrices[idx] || ''}
                                onChange={e => setCustomPrices(p => ({ ...p, [idx]: e.target.value }))}
                                placeholder="₹"
                                className="w-16 text-xs border border-[#1B7A43] rounded-lg px-2 py-1 bg-white dark:bg-[#11181F] text-slate-900 dark:text-white focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  updateItemPrice(idx, parseFloat(customPrices[idx]) || 0);
                                  setShowCustomPrice(p => ({ ...p, [idx]: false }));
                                }}
                                className="text-[#1B7A43] hover:text-[#156336]"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Editable price for non multi-brand */}
                      {!item.isMultiBrand && !item.isManual && (
                        <div className="flex items-center gap-1 mt-1">
                          <Edit3 size={11} className="text-slate-500 dark:text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">Price: ₹</span>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={e => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-16 text-xs border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                          />
                        </div>
                      )}

                      {/* Manual item price input */}
                      {item.isManual && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Price: ₹</span>
                          <input
                            type="number"
                            value={item.unitPrice || ''}
                            onChange={e => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 text-xs border border-[#E2D9C8] dark:border-[#2A3644] bg-white dark:bg-[#11181F] text-slate-900 dark:text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1B7A43]"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add manual item */}
                  <button
                    onClick={addManualItem}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1B7A43] dark:text-emerald-400 border border-dashed border-[#1B7A43]/40 rounded-xl py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <Plus size={14} /> Add Manual Item
                  </button>
                </div>
              )}

              {/* ── f. Balance impact preview ── */}
              {(customer || draft.type === 'SALE') && (
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-xs font-medium balance-flash border ${
                    draft.type === 'WASOOLI'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : (draft.mode === 'UDHAAR'
                          ? 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-500/30'
                          : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-stone-200 dark:border-slate-700')
                  }`}
                >
                  {draft.type === 'WASOOLI' || draft.mode === 'WASOOLI' ? (
                    <span>
                      Customer Balance: {fmt(oldBal)} → <strong>{fmt(newBal)}</strong>{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">(-{fmt(draft.total)} Jama)</span>
                    </span>
                  ) : draft.mode === 'UDHAAR' ? (
                    <span>
                      {customer ? (
                        <>
                          Customer Balance: {fmt(oldBal)} → <strong>{fmt(newBal)}</strong>{' '}
                          <span className="text-amber-600 dark:text-amber-400 font-bold">(+{fmt(draft.total)} Udhaar)</span>
                        </>
                      ) : (
                        <span>Select a customer above to record {fmt(draft.total)} Udhaar</span>
                      )}
                    </span>
                  ) : (
                    <span>{fmt(draft.total)} {draft.mode} Sale{customer ? '' : ' (Walk-in)'} — No credit impact</span>
                  )}
                </div>
              )}

              {/* ── g. Confirm button ────────── */}
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={
                  canConfirm
                    ? 'w-full py-3.5 px-4 rounded-xl bg-[#1B7A43] hover:bg-[#156336] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer'
                    : 'w-full py-3.5 px-4 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-800 dark:text-amber-300 font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed'
                }
              >
                {canConfirm
                  ? (labels?.confirm || '✓ Confirm Karein (Ledger Mein Save)')
                  : !hasMissingPrices && requiresNamedCustomer && !draft.customer && !draft.isNewCustomer
                    ? '⚠️ Select Customer Above for Udhaar / Wasooli'
                    : (labels?.pendingConfirm || '⚠️ Select Missing Price Above to Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. POST-CONFIRM: UNDO BANNER ─────────────── */}
      {confirmedTxn && undoSecs > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md slide-up">
          <button
            onClick={handleUndo}
            className="w-full flex items-center justify-between bg-slate-900 dark:bg-slate-800 text-white rounded-xl px-4 py-3 shadow-xl border border-slate-700/50"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Undo2 size={16} /> {labels?.undoToast || 'Undo Last Entry'}
            </span>
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-bold">{undoSecs}s</span>
          </button>
        </div>
      )}

      {/* ── 5. WHATSAPP RECEIPT MODAL ─────────────────── */}
      {showReceipt && confirmedTxn && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => { setShowReceipt(false); resetAll(); }}>
          <div className="bg-white dark:bg-[#16202A] text-slate-900 dark:text-slate-100 border border-stone-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xl w-full max-w-sm overflow-hidden fade-in space-y-3" onClick={e => e.stopPropagation()}>
            {/* Receipt header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-slate-700">
              <span className="text-sm font-bold text-[#1B7A43] dark:text-emerald-400 flex items-center gap-1.5">
                🧾 Receipt / Raseed
              </span>
              <button onClick={() => { setShowReceipt(false); resetAll(); }} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="text-center space-y-0.5">
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{shopName}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {new Date(confirmedTxn.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {confirmedTxn.txnId}
              </p>
            </div>

            <div className="border-t border-dashed border-stone-200 dark:border-slate-700" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Grahak:</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {confirmedTxn.draft.customer?.name || 'Walk-in Customer'}
              </span>
            </div>

            {/* Items */}
            {confirmedTxn.draft.items.length > 0 ? (
              <div className="space-y-1 py-1">
                {confirmedTxn.draft.items.map((it, i) => (
                  <div key={i} className="flex justify-between items-center text-sm text-slate-700 dark:text-slate-200">
                    <span>{it.name} ({it.qty} {it.unit} × {fmt(it.unitPrice)})</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{fmt(it.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 py-1">
                Wasooli (Jama) — {fmt(confirmedTxn.draft.total)}
              </p>
            )}

            <div className="border-t border-dashed border-stone-200 dark:border-slate-700" />

            <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white">
              <span>Total ({confirmedTxn.draft.mode})</span>
              <span>{fmt(confirmedTxn.draft.total)}</span>
            </div>

            {confirmedTxn.oldBal !== undefined && (
              <div className="bg-stone-100 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Old Balance</span>
                  <span className="font-medium">{fmt(confirmedTxn.oldBal)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white border-t border-stone-200 dark:border-slate-700 pt-1">
                  <span>New Balance</span>
                  <span className="text-[#1B7A43] dark:text-emerald-400">{fmt(confirmedTxn.newBal)}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <a
                href={`https://wa.me/91${confirmedTxn.draft.customer?.phone || ''}?text=${encodeURIComponent(
                  buildReceiptText(shopName, confirmedTxn.txnId, confirmedTxn.timestamp, confirmedTxn.draft.items, confirmedTxn.draft.total, confirmedTxn.oldBal, confirmedTxn.newBal, confirmedTxn.draft.customer, confirmedTxn.draft.mode)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <MessageCircle size={15} />
                <span>{labels?.sendWhatsApp || 'WhatsApp Par Bhejein'}</span>
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    buildReceiptText(shopName, confirmedTxn.txnId, confirmedTxn.timestamp, confirmedTxn.draft.items, confirmedTxn.draft.total, confirmedTxn.oldBal, confirmedTxn.newBal, confirmedTxn.draft.customer, confirmedTxn.draft.mode)
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="py-2.5 px-4 rounded-xl bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <><Check size={14} className="text-emerald-600 dark:text-emerald-400" /> Copied!</> : <><Copy size={14} /> {labels?.copyReceipt || 'Copy Receipt'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── 6. HANDWRITTEN BILL / PARCHI SCANNER MODAL ─── */}
      {showBillModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
          onClick={() => { if (!isScanningBill) closeBillModal(); }}
        >
          <div
            className="bg-white dark:bg-[#16202A] text-slate-900 dark:text-slate-100 border border-[#E2D9C8] dark:border-[#2A3644] rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#16202A]/95 backdrop-blur-xs px-4 sm:px-5 py-3.5 border-b border-[#E2D9C8] dark:border-[#2A3644] flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#1B7A43] dark:text-emerald-400 shrink-0" />
                  Scan Handwritten Bill / Parchi
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Customer name, items, qty &amp; prices seedha Approval Card mein load karein
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${
                  savedGeminiKey
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#1B7A43] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  {savedGeminiKey ? 'Gemini Vision Active' : 'Built-in Bill OCR'}
                </span>
                <button
                  type="button"
                  onClick={closeBillModal}
                  disabled={isScanningBill}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#1E293B] disabled:opacity-40 transition-colors"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              {/* Active Scanning Progress Bar */}
              {isScanningBill && (
                <div className="rounded-xl p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1B7A43] dark:text-emerald-300">
                    <span>Extracting handwriting: Customer, Items, Qty &amp; Prices...</span>
                    <span>{billScanProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-emerald-100 dark:bg-[#11181F] overflow-hidden">
                    <div
                      className="h-full bg-[#1B7A43] dark:bg-emerald-500 transition-all duration-200"
                      style={{ width: `${Math.max(12, billScanProgress)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ── SECTION A: Upload Custom Bill Photo ── */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Section A · Upload Custom Bill Photo
                </p>

                {billPreviewUrl ? (
                  <div className="rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] bg-stone-50 dark:bg-[#11181F] overflow-hidden">
                    <div className="relative bg-stone-100 dark:bg-[#0D1319]">
                      <img
                        src={billPreviewUrl}
                        alt="Uploaded bill preview"
                        className="w-full max-h-56 object-contain mx-auto block"
                      />
                      {isScanningBill && billScanTarget === 'photo' && <div className="parchi-scan-laser" />}
                    </div>
                    <div className="p-3 bg-white dark:bg-[#16202A] border-t border-[#E2D9C8] dark:border-[#2A3644] space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                          {billFile?.name || 'Custom bill photo'}
                        </span>
                        {!isScanningBill && (
                          <div className="flex items-center gap-3 shrink-0">
                            <label className="text-[#1B7A43] dark:text-emerald-400 font-semibold hover:underline cursor-pointer">
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const picked = e.target.files?.[0];
                                  if (picked) handleSelectBillFile(picked);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setBillFile(null);
                                setBillPreviewUrl('');
                              }}
                              className="text-slate-500 hover:text-red-500 font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={scanUploadedBillPhoto}
                        disabled={isScanningBill}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1B7A43] hover:bg-[#156336] text-white font-bold text-sm shadow-sm disabled:opacity-50 transition-colors"
                      >
                        🔍 Scan &amp; Convert to Draft
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingBill(true); }}
                    onDragLeave={() => setIsDraggingBill(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingBill(false);
                      const dropped = e.dataTransfer?.files?.[0];
                      if (dropped && dropped.type.startsWith('image/')) {
                        handleSelectBillFile(dropped);
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors block ${
                      isDraggingBill
                        ? 'border-[#1B7A43] bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'border-[#E2D9C8] dark:border-[#2A3644] hover:border-[#1B7A43] bg-[#FAF6F0]/60 dark:bg-[#11181F]/60'
                    }`}
                  >
                    <Upload className="w-7 h-7 mx-auto mb-2 text-[#1B7A43] dark:text-emerald-400" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Drop bill photo here or tap to choose from Gallery / Camera
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Supports Hinglish &amp; Hindi handwritten parchi · JPG, PNG, WEBP
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const picked = e.target.files?.[0];
                        if (picked) handleSelectBillFile(picked);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>

              {/* ── SECTION B: 3 Realistic Handwritten Parchi Previews ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Section B · Tap Any Sample Handwritten Parchi to Test
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {SAMPLE_HANDWRITTEN_BILLS.map((sample) => {
                    const isThisScanning = isScanningBill && billScanTarget === sample.id;
                    return (
                      <div
                        key={sample.id}
                        className="rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] bg-stone-50/70 dark:bg-[#11181F] p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {sample.title}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800 shrink-0">
                            {sample.badge}
                          </span>
                        </div>

                        {/* Lined yellow notebook paper card */}
                        <div
                          className="relative bg-[#FFFDF5] text-slate-800 border border-amber-300 font-mono text-xs p-3 rounded-xl shadow-inner pl-7 overflow-hidden"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(transparent, transparent 21px, rgba(147, 197, 253, 0.35) 21px, rgba(147, 197, 253, 0.35) 22px)',
                          }}
                        >
                          {/* Notebook left red margin line */}
                          <span
                            aria-hidden="true"
                            className="absolute left-5 top-0 bottom-0 w-px bg-rose-300/80"
                          />
                          {isThisScanning && <div className="parchi-scan-laser" />}
                          <div
                            className="space-y-1 italic leading-5"
                            style={{ fontFamily: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', ui-monospace, monospace" }}
                          >
                            {sample.lines.map((line, li) => (
                              <p
                                key={li}
                                className={li === 0 ? 'font-bold text-slate-900 underline decoration-amber-400/70' : 'text-slate-800'}
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => scanSampleBill(sample)}
                          disabled={isScanningBill}
                          className="w-full py-2 px-3 rounded-xl bg-[#1B7A43] hover:bg-[#156336] text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
                        >
                          🔍 Scan &amp; Convert to Draft
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. VOICE TEST CASES SHEET / MODAL ───────────── */}
      {showChips && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setShowChips(false)}
        >
          <div
            className="bg-white dark:bg-[#16202A] text-slate-900 dark:text-slate-100 border border-[#E2D9C8] dark:border-[#2A3644] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden pt-2.5 flex justify-center shrink-0">
              <span className="w-10 h-1 rounded-full bg-stone-300 dark:bg-slate-600" />
            </div>

            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-[#E2D9C8] dark:border-[#2A3644] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {lang === 'hi' ? 'टेस्ट केस (Test Cases)' : 'Test Cases'}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#1B7A43] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                      {DEMO_CHIPS.length} Presets
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {lang === 'hi' ? 'बिल तुरंत ड्राफ्ट करने के लिए किसी भी केस पर टैप करें' : 'Tap any formatted scenario below to load into Draft'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowChips(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#1E293B] transition-colors shrink-0"
                title="Close"
                aria-label="Close Test Cases"
              >
                <X size={18} />
              </button>
            </div>

            {/* Clean Formatted Test Case List */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2">
              {DEMO_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setShowChips(false);
                    onChipClick(chip);
                  }}
                  className="w-full text-left p-3 sm:p-3.5 rounded-xl border border-[#E2D9C8] dark:border-[#2A3644] bg-[#FAF6F0]/70 dark:bg-[#11181F] hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 hover:border-[#1B7A43] dark:hover:border-emerald-600 transition-all group active:scale-[0.99] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm leading-none shrink-0" aria-hidden="true">{chip.emoji}</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {chip.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-5">
                      “{chip.text}”
                    </p>
                  </div>

                  <span className="w-7 h-7 rounded-full bg-white dark:bg-[#16202A] border border-[#E2D9C8] dark:border-[#2A3644] group-hover:border-[#1B7A43] group-hover:bg-[#1B7A43] group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
