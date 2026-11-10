import { hindiToHinglish } from './devanagariTransliterator.js';

function convertDevanagariDigits(str) {
  return String(str || '').replace(/[०-९]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0x0966 + 0x30)
  );
}

function titleCase(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatHumanText(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (/[\u0900-\u097F]/.test(cleaned)) {
    const transliterated = hindiToHinglish(cleaned);
    return titleCase(transliterated);
  }
  return cleaned;
}

function normalizeOcrDigits(token, { allowAlphaDigits = false } = {}) {
  let raw = convertDevanagariDigits(String(token || '')).replace(/,/g, '').trim();
  if (!raw) return null;
  if (!allowAlphaDigits && !/\d/.test(raw)) return null;

  // Replace common OCR confusions inside numeric amount tokens
  const fixed = raw
    .replace(/[OoQD]/g, '0')
    .replace(/[Il|!]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/[Bb]/g, '8');

  if (!/^\d+(?:\.\d{1,2})?$/.test(fixed)) return null;
  const val = parseFloat(fixed);
  if (!Number.isFinite(val) || val < 0 || val > 500000) return null;
  return Math.round(val * 100) / 100;
}

const HEADER_LINE_RE = /^(?:sr\.?\s*no\.?|s\.?\s*no\.?|serial|name|customer|grahak|pahchan|pehchan|balance|amount|udhaar|udhar|khata|bahi\s*khata|total|kul|page|date|dinank|mobile|phone)\b/i;

const ADDRESS_KEYWORDS_RE = /(?:^|[\s.,\-/(])(?:makan|ghar|gali|street|ward|room|flat|shop|dukan|plot|house|sector|block|no\.?|h\.?\s*no\.?|मकान|गली|घर|वार्ड|कमरा|नंबर)\s*$/i;

const ASCII_AMOUNT_NOISE_RE = /\b(?:puraana|purana|baaki|baki|bakaya|baakaya|udhaar|udhar|udhari|balance|bal|dues|due|pending|amount|amt|total|rupaye|rupaya|rupees|rupee|inr|rs\.?)\b/gi;
const HINDI_AMOUNT_NOISE_RE = /(?:^|[\s\-:|])(?:बाकी|बकाया|पुराना|उधार|उधारी|कुल|रुपये|रुपया|रुपए|रु\.?)(?=$|[\s.,\-:|/])/g;

function extractPhoneAndStrip(line) {
  let phone = '';
  const cleaned = line.replace(/(?:\+?91[\s.-]?)?\b([6-9]\d{4}[\s.-]?\d{5})\b/g, (_, digits) => {
    const d = digits.replace(/\D/g, '');
    if (d.length === 10 && !phone) {
      phone = d;
      return ' ';
    }
    return digits;
  });
  return { phone, text: cleaned };
}

function cleanTextFragment(fragment, { allowTransliterate = true } = {}) {
  const stripped = convertDevanagariDigits(String(fragment || ''))
    .replace(/₹/g, ' ')
    .replace(/\/-/g, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(ASCII_AMOUNT_NOISE_RE, ' ')
    .replace(HINDI_AMOUNT_NOISE_RE, ' ')
    .replace(/^[\s\-–—|:;.,/()[\]]+|[\s\-–—|:;.,/()[\]]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) return '';
  if (allowTransliterate && /[\u0900-\u097F]/.test(stripped)) {
    return formatHumanText(stripped);
  }
  return stripped;
}

function parseNameAndPehchan(rawFragment, { rawDevanagariHint = '' } = {}) {
  let working = String(rawFragment || '').trim();
  if (!working) return { name: '', pehchan: '' };

  let pehchan = '';

  // 1. Extract parenthetical tag first: e.g. "Anita (Makan 8)" or "Raju (Nai)"
  working = working.replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const parenMatch = working.match(/\(([^)]+)\)/);
  if (parenMatch) {
    pehchan = cleanTextFragment(parenMatch[1], { allowTransliterate: false });
    working = (working.slice(0, parenMatch.index) + ' ' + working.slice(parenMatch.index + parenMatch[0].length)).trim();
  }

  // 2. Split on explicit delimiters (-, |, :, /, comma, tab, 2+ spaces)
  const parts = working
    .split(/\s*(?:\||—|–|\t|:|\s+-\s+|\/)\s*|\s{2,}/)
    .map((p) => cleanTextFragment(p, { allowTransliterate: false }))
    .filter(Boolean);

  let rawName = '';
  if (parts.length >= 2) {
    rawName = parts[0];
    const extraPehchan = parts.slice(1).join(', ');
    pehchan = pehchan ? `${extraPehchan} (${pehchan})` : extraPehchan;
  } else {
    rawName = cleanTextFragment(working, { allowTransliterate: false });
  }

  // Strip stray leading punctuation/numbers from name
  rawName = rawName.replace(/^\d+[.)\]]*\s*/, '').trim();
  if (!rawName || !/[a-zA-Z\u0905-\u0939\u0958-\u0961]/.test(rawName)) {
    return { name: '', pehchan: '' };
  }

  // Convert pure Devanagari name to TitleCase Hinglish so Voice & Search work seamlessly,
  // while preserving original Devanagari hint in pehchan if helpful
  let finalName = rawName;
  let finalPehchan = pehchan;

  if (/[\u0900-\u097F]/.test(rawName)) {
    finalName = formatHumanText(rawName);
    if (!finalPehchan && rawDevanagariHint) {
      finalPehchan = rawDevanagariHint;
    }
  } else {
    finalName = titleCase(rawName);
  }

  // Trim trailing hyphen/punctuation from pehchan
  finalPehchan = finalPehchan.replace(/^[\s\-–—,:;]+|[\s\-–—,:;]+$/g, '').trim();

  return { name: finalName, pehchan: finalPehchan };
}

/**
 * Parses raw OCR text (from Tesseract.js or any ledger text) into structured customer balance entries.
 * Handles serial numbers, dates, 10-digit mobile numbers, currency markers, address numbers,
 * Devanagari digits/names, and multi-line name + amount pairs.
 */
export function parseBahiKhataOcrText(rawText) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const entries = [];
  let pendingNameLine = null;

  for (let i = 0; i < lines.length; i++) {
    let line = convertDevanagariDigits(lines[i])
      .replace(/[•▪◦●■◆★]/g, ' ')
      .replace(/^\s*(?:sr\.?\s*)?\d{1,3}\s*[.)\]]\s+/i, '')
      .trim();

    if (!line || line.length < 2) continue;

    // Normalize common Devanagari/OCR rupee symbol variants (Tesseract hin often reads ₹ as र/रं/र₹/रू/¥)
    line = line
      .replace(/(^|[\s,;:=\-–—(])(?:रु\.?|रू\.?|¥)\s*(?=[0-9oOiIlLsS])/gi, '$1₹')
      .replace(/(^|[\s,;:=\-–—(])र[\u0900-\u0903\u093C\u094D]*₹?\.?(?=[0-9oOiIlLsS])/g, '$1₹')
      .replace(/(^|[\s,;:=\-–—(])र[\u0900-\u0903\u093C\u094D]*\.?\s+(?=\d{2,})/g, '$1₹')
      .replace(/(^|[\s,;:=-])रु\.?\s*/g, '$1₹')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove dates (e.g. 10/11/2026, 09-11-26) so dates are never mistaken for rupee balances
    line = line.replace(/\b\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (!line) continue;

    // Extract 10-digit phone numbers before scanning balance numbers
    const { phone, text: lineWithoutPhone } = extractPhoneAndStrip(line);
    let work = lineWithoutPhone.replace(/\s+/g, ' ').trim();

    // Skip pure header lines if there is no explicit amount on the line
    const hasCurrencySymbol = /(?:₹|\brs\.?|\binr\b|rupaye|\/-|\bbaaki\b|\bबाकी\b)/i.test(work);
    if (HEADER_LINE_RE.test(work) && !/\d/.test(work)) {
      pendingNameLine = null;
      continue;
    }

    let balance = null;
    let textWithoutBalance = work;

    // Strategy A: Explicit currency / baaki marker (supports OCR digit fixes like ₹34O)
    const explicitPatterns = [
      { re: /(?:₹|\brs\.?|\binr\b|\brupaye\b|\brupaya\b|\bbaaki\b|\bbaki\b|\bdue\b|\bdues\b|\bbalance\b|बाकी|बकाया)\s*[:=-]?\s*([0-9oOiIlLsS,]+(?:\.\d{1,2})?)(?:\s*(?:\/-|₹|rs\.?|rx|rz|r5|k5|दा))?/gi, allowAlpha: true },
      { re: /\b([0-9oOiIlLsS,]+(?:\.\d{1,2})?)\s*(?:\/-|₹|rs\.?|rupaye|rupees|baaki|baki|बाकी)(?=$|[\s.,;])/gi, allowAlpha: true },
      // Pure digits followed by common handwritten Rs OCR confusions (Rx, K5, R5, Rz, दा)
      { re: /\b(\d{2,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:rx|rz|r5|k5|दा)\.?(?=$|[\s.,;])/gi, allowAlpha: false },
    ];

    for (const { re, allowAlpha } of explicitPatterns) {
      let match;
      let lastValidMatch = null;
      while ((match = re.exec(work)) !== null) {
        const parsedVal = normalizeOcrDigits(match[1], { allowAlphaDigits: allowAlpha });
        if (parsedVal !== null) {
          lastValidMatch = {
            val: parsedVal,
            start: match.index,
            end: match.index + match[0].length,
          };
        }
      }
      if (lastValidMatch) {
        balance = lastValidMatch.val;
        textWithoutBalance =
          (work.slice(0, lastValidMatch.start) + ' ' + work.slice(lastValidMatch.end))
            .replace(/\s+/g, ' ')
            .trim();
        break;
      }
    }

    // Strategy B: Trailing standalone numeric token (not preceded by address words like "Makan 8")
    if (balance === null) {
      const trailingMatch = work.match(/(?:^|[\s\-–—|:;,=])([0-9oOiIlLzZsSbB,]+(?:\.\d{1,2})?)\s*$/);
      if (trailingMatch) {
        const prefixSlice = work.slice(0, trailingMatch.index);
        if (!ADDRESS_KEYWORDS_RE.test(prefixSlice)) {
          const parsedVal = normalizeOcrDigits(trailingMatch[1], { allowAlphaDigits: false });
          if (parsedVal !== null) {
            balance = parsedVal;
            textWithoutBalance = prefixSlice.trim();
          }
        }
      }
    }

    // Strategy C: Any lone numeric token after a separator if still not found
    if (balance === null && hasCurrencySymbol === false) {
      const sepMatch = work.match(/(?:\s[-–—|:=]\s*|\t)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/);
      if (sepMatch) {
        const parsedVal = normalizeOcrDigits(sepMatch[1], { allowAlphaDigits: false });
        if (parsedVal !== null) {
          balance = parsedVal;
          textWithoutBalance = work.slice(0, sepMatch.index).trim();
        }
      }
    }

    // Case 1: Line only had a balance (pair with pending name from previous line)
    const { name, pehchan } = parseNameAndPehchan(textWithoutBalance);

    if (!name && balance !== null && pendingNameLine) {
      entries.push({
        name: pendingNameLine.name,
        pehchan: pendingNameLine.pehchan,
        phone: phone || pendingNameLine.phone || '',
        balance,
      });
      pendingNameLine = null;
      continue;
    }

    // Case 2: Line had a name + no balance yet (store briefly in case next line is the balance)
    if (name && balance === null) {
      pendingNameLine = { name, pehchan, phone };
      continue;
    }

    pendingNameLine = null;

    if (!name || balance === null) continue;
    // Reject junk summary rows like "Total 1140"
    if (/^(?:total|grand total|subtotal|kul|sum|page|date|cash|upi|udhaar)$/i.test(name)) continue;

    entries.push({
      name,
      pehchan,
      phone: phone || '',
      balance,
    });
  }

  return entries;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode selected image file.'));
    img.src = src;
  });
}

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

/**
 * 1D sliding-window extremum (max or min) filter in O(n) via monotonic deque.
 * Used as separable building block for morphological closing on uneven shadows.
 */
function extremumFilter1D(arr, len, radius, isMax) {
  const out = new Float32Array(len);
  const dq = new Int32Array(len);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < len + radius; i++) {
    if (i < len) {
      while (tail > head && (isMax ? arr[dq[tail - 1]] <= arr[i] : arr[dq[tail - 1]] >= arr[i])) {
        tail--;
      }
      dq[tail++] = i;
    }
    const winStart = i - 2 * radius;
    if (head < tail && dq[head] < winStart) head++;
    const outIdx = i - radius;
    if (outIdx >= 0 && outIdx < len) {
      out[outIdx] = arr[dq[head]];
    }
  }
  return out;
}

function morph2D(src, w, h, radius, isMax) {
  const tmp = new Float32Array(w * h);
  const rowBuf = new Float32Array(w);
  for (let y = 0; y < h; y++) {
    const off = y * w;
    rowBuf.set(src.subarray(off, off + w));
    tmp.set(extremumFilter1D(rowBuf, w, radius, isMax), off);
  }
  const dst = new Float32Array(w * h);
  const colBuf = new Float32Array(h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) colBuf[y] = tmp[y * w + x];
    const colRes = extremumFilter1D(colBuf, h, radius, isMax);
    for (let y = 0; y < h; y++) dst[y * w + x] = colRes[y];
  }
  return dst;
}

/**
 * Separable 2D morphological closing (dilation followed by erosion of the same radius).
 * Erases thin dark ink strokes to estimate true local paper brightness while restoring
 * sharp shadow boundaries with zero dark boundary halos.
 */
function computeLocalPaperBackground(srcLum, w, h, radius) {
  const dilated = morph2D(srcLum, w, h, radius, true);
  return morph2D(dilated, w, h, radius, false);
}

/**
 * Resizes and preprocesses a ledger/notebook image for optimal Gemini Vision & Tesseract OCR.
 * Uses Retinex local paper estimation + reflectance bleed-through gating + blue-ink boost
 * so angled shadows & reverse-page show-through are stripped without cropping any text.
 */
export async function prepareLedgerImageForOcr(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const srcW = img.naturalWidth || img.width || 1200;
    const srcH = img.naturalHeight || img.height || 900;

    // 1. Compressed natural color JPEG for Gemini Vision & fallback OCR
    const aiScale = Math.min(1, 1600 / Math.max(srcW, srcH));
    const aiW = Math.max(1, Math.round(srcW * aiScale));
    const aiH = Math.max(1, Math.round(srcH * aiScale));
    const aiCanvas = document.createElement('canvas');
    aiCanvas.width = aiW;
    aiCanvas.height = aiH;
    aiCanvas.getContext('2d').drawImage(img, 0, 0, aiW, aiH);
    const geminiDataUrl = aiCanvas.toDataURL('image/jpeg', 0.88);
    const geminiBase64 = geminiDataUrl.split(',')[1] || '';

    // 2. OCR canvas: upscale small photos for stroke clarity, cap huge photos at 2000px
    const targetScale = srcW < 900 ? Math.min(2.2, 1400 / srcW) : Math.min(1, 2000 / Math.max(srcW, srcH));
    const ocrW = Math.max(1, Math.round(srcW * targetScale));
    const ocrH = Math.max(1, Math.round(srcH * targetScale));

    const ocrCanvas = document.createElement('canvas');
    ocrCanvas.width = ocrW;
    ocrCanvas.height = ocrH;
    const ctx = ocrCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, ocrW, ocrH);

    const imgData = ctx.getImageData(0, 0, ocrW, ocrH);
    const pixels = imgData.data;
    const totalPx = ocrW * ocrH;
    const stdLum = new Float32Array(totalPx);

    let sumLum = 0;
    for (let p = 0, idx = 0; idx < totalPx; p += 4, idx++) {
      const y = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];
      stdLum[idx] = y;
      sumLum += y;
    }

    const isDarkBackground = sumLum / Math.max(1, totalPx) < 110;
    const lum = new Float32Array(totalPx);

    for (let p = 0, idx = 0; idx < totalPx; p += 4, idx++) {
      if (isDarkBackground) {
        lum[idx] = 255 - stdLum[idx];
      } else {
        // Gently enhance blue ballpoint pen ink while preserving neutral paper luminance
        const r = pixels[p];
        const g = pixels[p + 1];
        const b = pixels[p + 2];
        lum[idx] = Math.min(stdLum[idx], 0.42 * r + 0.46 * g + 0.12 * b);
      }
    }

    // 3. Separable morphological closing background estimator (~1.1% of width radius)
    const radius = Math.max(8, Math.min(20, Math.round(ocrW * 0.011)));
    const localPaper = computeLocalPaperBackground(lum, ocrW, ocrH, radius);

    // Check coarse shadow variation (top/bottom/left/right brightness delta) for optional UI tip
    const midY = Math.floor(ocrH * 0.5);
    const leftLum = localPaper[midY * ocrW + Math.floor(ocrW * 0.15)] || 200;
    const rightLum = localPaper[midY * ocrW + Math.floor(ocrW * 0.85)] || 200;
    const topLum = localPaper[Math.floor(ocrH * 0.15) * ocrW + Math.floor(ocrW * 0.5)] || 200;
    const botLum = localPaper[Math.floor(ocrH * 0.85) * ocrW + Math.floor(ocrW * 0.5)] || 200;
    const bgMin = Math.min(leftLum, rightLum, topLum, botLum);
    const bgMax = Math.max(leftLum, rightLum, topLum, botLum);
    const hasHeavyShadow = !isDarkBackground && bgMax > 130 && bgMin / bgMax < 0.72;

    // 4. Reflectance normalization + bleed-through suppression (ratio >= 0.86 -> pure white paper)
    for (let i = 0, p = 0; i < totalPx; i++, p += 4) {
      const ratio = lum[i] / Math.max(25, localPaper[i]);
      const v = ratio >= 0.86
        ? 255
        : clampByte(((ratio - 0.42) / 0.44) * 255);
      pixels[p] = v;
      pixels[p + 1] = v;
      pixels[p + 2] = v;
      pixels[p + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    return {
      ocrCanvas,
      rawCanvas: aiCanvas,
      geminiBase64,
      geminiMimeType: 'image/jpeg',
      hasHeavyShadow,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function parseGeminiJsonEntries(responseText) {
  let stripped = String(responseText || '')
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const objStart = stripped.indexOf('{');
  const arrStart = stripped.indexOf('[');
  if (objStart > 0 || arrStart > 0) {
    const startIdx = (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) ? objStart : arrStart;
    stripped = stripped.slice(startIdx);
  }

  const parsed = JSON.parse(stripped);
  const rawList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.entries) ? parsed.entries : []);
  const rawText = typeof parsed?.rawText === 'string'
    ? parsed.rawText
    : rawList.map((r) => `${r.name}${r.pehchan ? ` - ${r.pehchan}` : ''}${r.phone ? ` (${r.phone})` : ''} - ₹${r.balance}`).join('\n');

  const entries = rawList
    .map((r) => ({
      name: formatHumanText(r?.name || ''),
      pehchan: String(r?.pehchan || '').trim(),
      phone: String(r?.phone || '').replace(/\D/g, '').slice(-10),
      balance: Math.max(0, Math.round((Number(r?.balance) || 0) * 100) / 100),
    }))
    .filter((e) => e.name);

  return { entries, rawText };
}

async function runGeminiVisionOcr(base64Data, mimeType, apiKey, onProgress) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  const prompt = [
    'You are reading an Indian Kirana shopkeeper\'s paper Bahi-Khata (credit ledger) photo.',
    'Extract EVERY customer credit/balance line visible in the image accurately.',
    'Return valid JSON ONLY matching this shape:',
    '{"rawText":"transcribed lines","entries":[{"name":"Customer Name","pehchan":"optional landmark/note","phone":"optional 10-digit number","balance":340}]}',
    'Rules:',
    '1. Transliterate Hindi/Devanagari customer names into clean English/Hinglish spelling (e.g. सुरेश -> Suresh) while preserving pehchan notes clearly.',
    '2. "balance" must be a clean number (no ₹ or Rs symbol).',
    '3. Do NOT include serial numbers, dates, headers, or page totals as balances or entries.',
    '4. If a photo has no readable ledger entries, return {"rawText":"","entries":[]}.',
  ].join('\n');

  let lastError = null;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    onProgress?.({ stage: 'gemini', progress: 35 + i * 25, status: `Reading handwriting with Gemini AI (${model})...` });
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      lastError = new Error(`Gemini API (${res.status}): ${errBody.slice(0, 140) || res.statusText}`);
      if (res.status === 404) continue;
      throw lastError;
    }

    const payload = await res.json();
    const textPart = payload?.candidates?.[0]?.content?.parts?.find((p) => typeof p.text === 'string')?.text || '';
    if (!textPart) {
      throw new Error('Gemini returned an empty response for this image.');
    }
    return parseGeminiJsonEntries(textPart);
  }
  throw lastError || new Error('Gemini Vision scan failed.');
}

async function runTesseractOnCanvas(canvas, lang, onProgress) {
  const { createWorker } = await import('tesseract.js');
  let worker = null;
  try {
    worker = await createWorker(lang, 1, {
      logger: (m) => {
        if (!m || typeof m.progress !== 'number') return;
        const pct = Math.min(98, Math.max(12, Math.round(15 + m.progress * 80)));
        const label =
          m.status === 'loading tesseract core' || m.status === 'initializing tesseract'
            ? 'Starting offline OCR engine...'
            : m.status === 'loading language traineddata'
              ? `Loading ${lang.toUpperCase()} language model (${Math.round(m.progress * 100)}%)...`
              : m.status === 'recognizing text'
                ? `Reading text from your image (${Math.round(m.progress * 100)}%)...`
                : 'Processing image...';
        onProgress?.({ stage: 'tesseract', progress: pct, status: label });
      },
    });
    // PSM 6 = assume a single uniform block of text (better for notebook pages)
    await worker.setParameters({ tessedit_pageseg_mode: '6' });
    const result = await worker.recognize(canvas);
    return (result?.data?.text || '').trim();
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}

/**
 * End-to-end real image OCR pipeline for Bahi-Khata photos uploaded from Gallery or Camera.
 * Uses Gemini Vision AI if configured, and always provides zero-key browser OCR via Tesseract.js.
 * Shadow-aware: auto-crops bright text region, runs multi-pass OCR with detailed warnings.
 */
export async function scanBahiKhataImage(
  file,
  { geminiApiKey = '', ocrLang = 'eng+hin', preferOffline = false, onProgress } = {}
) {
  if (!file) {
    throw new Error('No image selected. Please upload a photo from your gallery first.');
  }

  onProgress?.({ stage: 'prepare', progress: 8, status: 'Normalizing shadows & enhancing ink contrast...' });
  const prepared = await prepareLedgerImageForOcr(file);

  let warning = '';

  // 1. Optional Gemini Vision AI (best accuracy for messy Hindi/Hinglish handwriting + heavy shadows)
  const cleanKey = preferOffline ? '' : String(geminiApiKey || '').trim();
  if (cleanKey) {
    onProgress?.({ stage: 'gemini', progress: 20, status: 'Reading handwriting with Gemini Vision AI...' });
    try {
      const gemResult = await runGeminiVisionOcr(
        prepared.geminiBase64,
        prepared.geminiMimeType,
        cleanKey,
        onProgress
      );
      onProgress?.({ stage: 'done', progress: 100, status: 'Extraction complete!' });
      return {
        engine: 'gemini',
        rawText: gemResult.rawText,
        entries: gemResult.entries,
        warning: '',
        hasHeavyShadow: prepared.hasHeavyShadow,
      };
    } catch (err) {
      warning = `Gemini AI failed (${err.message}) — switched to built-in offline OCR.`;
    }
  }

  // 2. Zero-key built-in browser OCR via Tesseract.js (Retinex normalized canvas first)
  let rawText = '';
  let engineUsed = `tesseract-${ocrLang}`;
  try {
    rawText = await runTesseractOnCanvas(prepared.ocrCanvas, ocrLang, onProgress);
  } catch {
    if (ocrLang !== 'eng') {
      engineUsed = 'tesseract-eng';
      onProgress?.({ stage: 'tesseract', progress: 30, status: 'Switching to fast English OCR...' });
      rawText = await runTesseractOnCanvas(prepared.ocrCanvas, 'eng', onProgress);
    } else {
      throw new Error('Could not initialize OCR engine. Check internet once to cache OCR model.');
    }
  }

  let entries = parseBahiKhataOcrText(rawText);

  // Only retry rawCanvas if Retinex extracted zero entries AND almost nothing (< 10 chars)
  if (entries.length === 0 && rawText.length < 10) {
    onProgress?.({ stage: 'tesseract', progress: 88, status: 'Re-checking original image...' });
    try {
      const secondText = await runTesseractOnCanvas(
        prepared.rawCanvas,
        engineUsed === 'tesseract-eng' ? 'eng' : ocrLang,
        onProgress
      );
      const secondEntries = parseBahiKhataOcrText(secondText);
      if (secondEntries.length > entries.length || secondText.length >= 10) {
        rawText = secondText;
        entries = secondEntries;
      }
    } catch {
      /* keep first pass result */
    }
  }

  if (entries.length === 0) {
    const parts = [];
    if (warning) parts.push(warning);
    if (prepared.hasHeavyShadow) {
      parts.push('Strong camera shadow detected — offline OCR works best on evenly lit printed/block pages.');
    }
    if (!rawText) {
      parts.push('No clear text could be read from this image.');
    } else {
      parts.push('Some text was read, but no "Name - ₹Amount" lines matched. Check Raw Text below to fix typos and tap Re-parse.');
    }
    warning = parts.join(' ');
  } else if (prepared.hasHeavyShadow && !cleanKey) {
    warning = 'Uneven lighting detected — please double-check extracted spellings & amounts below before importing.';
  }

  onProgress?.({ stage: 'done', progress: 100, status: 'Scan complete!' });
  return {
    engine: engineUsed,
    rawText,
    entries,
    warning,
    hasHeavyShadow: prepared.hasHeavyShadow,
  };
}

/**
 * Generates an explicit sample notebook PNG File on an HTML5 canvas when the user taps
 * "Try Sample Notebook Photo", so even the sample runs through the real OCR pipeline.
 */
export function createSampleNotebookImageFile() {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    // Warm lined notebook paper background
    ctx.fillStyle = '#FCF7E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Red vertical notebook margin
    ctx.strokeStyle = '#E5989B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(110, 0);
    ctx.lineTo(110, canvas.height);
    ctx.stroke();

    // Horizontal ruled lines
    ctx.strokeStyle = '#BFD7EA';
    ctx.lineWidth = 2;
    for (let y = 130; y <= 580; y += 95) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#1E3A5F';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText('BAHI-KHATA SAMPLE PAGE (DEMO)', 140, 82);

    const rows = [
      '1. Suresh - Chai Wala - Rs 340',
      '2. Anita - Makan 8 - Rs 620',
      '3. Raju - Nai (9876543210) - Rs 180',
      '4. Deepak - Dairy Gali - Rs 520',
    ];
    ctx.font = 'bold 34px Arial, sans-serif';
    rows.forEach((line, idx) => {
      ctx.fillText(line, 140, 200 + idx * 95);
    });

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not generate sample notebook image.'));
        return;
      }
      resolve(new File([blob], 'sample_bahikhata_page.png', { type: 'image/png' }));
    }, 'image/png');
  });
}
