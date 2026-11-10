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

    // Normalize common Devanagari/OCR rupee symbol variants (Tesseract hin often reads ₹ as र/रू/¥)
    line = line
      .replace(/(^|[\s,;:=\-–—(])(?:रु\.?|रू\.?|¥)\s*(?=[0-9oOiIlLsS])/gi, '$1₹')
      .replace(/(^|[\s,;:=\-–—(])र\.?(?=[0-9oOiIlLsS])/g, '$1₹')
      .replace(/(^|[\s,;:=\-–—(])र\.?\s+(?=\d{2,})/g, '$1₹')
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
      /(?:₹|\brs\.?|\binr\b|\brupaye\b|\brupaya\b|\bbaaki\b|\bbaki\b|\bdue\b|\bdues\b|\bbalance\b|बाकी|बकाया)\s*[:=-]?\s*([0-9oOiIlLsS,]+(?:\.\d{1,2})?)(?:\s*\/-)?/gi,
      /\b([0-9oOiIlLsS,]+(?:\.\d{1,2})?)\s*(?:\/-|₹|rs\.?|rupaye|rupees|baaki|baki|बाकी)(?=$|[\s.,;])/gi,
    ];

    for (const pattern of explicitPatterns) {
      let match;
      let lastValidMatch = null;
      while ((match = pattern.exec(work)) !== null) {
        const parsedVal = normalizeOcrDigits(match[1], { allowAlphaDigits: true });
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
 * Scans the image row-by-row and returns the fraction [0,1] at which
 * a persistent dark shadow begins (meanLum of a row drops below threshold).
 * Returns 1.0 if no significant shadow is found.
 */
function detectShadowStartFraction(lum, w, h, threshold = 145) {
  // Sample every 4th row for speed
  const CONSEC_ROWS_NEEDED = Math.max(2, Math.round(h * 0.03)); // 3% of height
  let darkCount = 0;
  for (let row = 0; row < h; row += 4) {
    let rowSum = 0;
    const rowOff = row * w;
    for (let col = Math.round(w * 0.1); col < Math.round(w * 0.9); col++) {
      rowSum += lum[rowOff + col];
    }
    const usedCols = Math.round(w * 0.8);
    const rowMean = rowSum / Math.max(1, usedCols);
    if (rowMean < threshold) {
      darkCount++;
      if (darkCount >= CONSEC_ROWS_NEEDED) {
        return Math.max(0.05, (row - CONSEC_ROWS_NEEDED * 4) / h);
      }
    } else {
      darkCount = 0;
    }
  }
  return 1.0;
}

/**
 * Scans the image column-by-column and returns the fraction [0,1] at which
 * a persistent dark shadow begins from the left or right side.
 * Returns { leftFrac: 0, rightFrac: 1 } if no significant column shadow is found.
 */
function detectColumnShadow(lum, w, h, threshold = 145) {
  const CONSEC_COLS = Math.max(2, Math.round(w * 0.03));
  let leftFrac = 0;
  let darkCount = 0;
  // Scan from left → right
  for (let col = 0; col < w; col++) {
    let colSum = 0;
    for (let row = Math.round(h * 0.1); row < Math.round(h * 0.9); row += 4) {
      colSum += lum[row * w + col];
    }
    const usedRows = Math.round(h * 0.8 / 4);
    const colMean = colSum / Math.max(1, usedRows);
    if (colMean < threshold) {
      darkCount++;
      if (darkCount >= CONSEC_COLS) {
        leftFrac = Math.max(0, (col - CONSEC_COLS) / w);
        break;
      }
    } else {
      darkCount = 0;
    }
  }

  let rightFrac = 1.0;
  darkCount = 0;
  // Scan from right → left
  for (let col = w - 1; col >= 0; col--) {
    let colSum = 0;
    for (let row = Math.round(h * 0.1); row < Math.round(h * 0.9); row += 4) {
      colSum += lum[row * w + col];
    }
    const usedRows = Math.round(h * 0.8 / 4);
    const colMean = colSum / Math.max(1, usedRows);
    if (colMean < threshold) {
      darkCount++;
      if (darkCount >= CONSEC_COLS) {
        rightFrac = Math.min(1, (col + CONSEC_COLS) / w);
        break;
      }
    } else {
      darkCount = 0;
    }
  }

  return { leftFrac, rightFrac };
}

/**
 * Resizes and preprocesses a ledger/notebook image for optimal Gemini Vision & Tesseract OCR.
 * Key upgrades:
 *  - Detects large camera-shadow zones (row & column) and crops to the bright text region only
 *  - Applies aggressive local illumination normalization on the cropped region
 *  - Returns the shadow crop metrics so the UI can warn the user if heavy crop was applied
 */
export async function prepareLedgerImageForOcr(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const srcW = img.naturalWidth || img.width || 1200;
    const srcH = img.naturalHeight || img.height || 900;

    // 1. Compressed natural color JPEG for Gemini Vision & fast preview (full image, no crop)
    const aiScale = Math.min(1, 1600 / Math.max(srcW, srcH));
    const aiW = Math.max(1, Math.round(srcW * aiScale));
    const aiH = Math.max(1, Math.round(srcH * aiScale));
    const aiCanvas = document.createElement('canvas');
    aiCanvas.width = aiW;
    aiCanvas.height = aiH;
    aiCanvas.getContext('2d').drawImage(img, 0, 0, aiW, aiH);
    const geminiDataUrl = aiCanvas.toDataURL('image/jpeg', 0.88);
    const geminiBase64 = geminiDataUrl.split(',')[1] || '';

    // 2. Build an intermediate full-size canvas to compute luminance for shadow detection
    const detScale = Math.min(1, 1200 / Math.max(srcW, srcH));
    const detW = Math.max(1, Math.round(srcW * detScale));
    const detH = Math.max(1, Math.round(srcH * detScale));
    const detCanvas = document.createElement('canvas');
    detCanvas.width = detW;
    detCanvas.height = detH;
    const detCtx = detCanvas.getContext('2d', { willReadFrequently: true });
    detCtx.drawImage(img, 0, 0, detW, detH);
    const detData = detCtx.getImageData(0, 0, detW, detH).data;
    const detLum = new Float32Array(detW * detH);
    for (let p = 0, i = 0; i < detW * detH; p += 4, i++) {
      detLum[i] = 0.299 * detData[p] + 0.587 * detData[p + 1] + 0.114 * detData[p + 2];
    }

    // 3. Detect shadow boundaries
    const meanLumFull = detLum.reduce((s, v) => s + v, 0) / detLum.length;
    const isDarkBg = meanLumFull < 110;
    if (isDarkBg) {
      for (let i = 0; i < detLum.length; i++) detLum[i] = 255 - detLum[i];
    }
    // Shadow threshold: regions whose mean is 60% below global median are considered shadow
    const shadowThreshold = Math.min(170, Math.max(100, meanLumFull * 0.75));
    const rowShadowFrac = detectShadowStartFraction(detLum, detW, detH, shadowThreshold);
    const { leftFrac, rightFrac } = detectColumnShadow(detLum, detW, detH, shadowThreshold);

    // 4. Determine crop rectangle in source image coordinates
    // Only apply crop if shadow is significant (shadow covers >15% of image)
    const hasRowShadow = rowShadowFrac < 0.85;
    const hasColShadowRight = rightFrac < 0.85;
    const hasColShadowLeft = leftFrac > 0.15;
    const cropY1 = hasRowShadow ? Math.min(rowShadowFrac, 0.95) : 1.0;
    const cropX0 = hasColShadowLeft ? leftFrac : 0;
    const cropX1 = hasColShadowRight ? rightFrac : 1.0;
    const cropApplied = hasRowShadow || hasColShadowRight || hasColShadowLeft;
    // Ensure we keep at least 20% of the image
    const usableFrac = (cropX1 - cropX0) * cropY1;
    const finalCropY1 = usableFrac < 0.2 ? 1.0 : cropY1;
    const finalCropX0 = usableFrac < 0.2 ? 0 : cropX0;
    const finalCropX1 = usableFrac < 0.2 ? 1.0 : cropX1;

    // 5. OCR canvas: render only the bright (non-shadow) region
    const srcCropX = Math.round(srcW * finalCropX0);
    const srcCropY = 0;
    const srcCropW = Math.max(1, Math.round(srcW * (finalCropX1 - finalCropX0)));
    const srcCropH = Math.max(1, Math.round(srcH * finalCropY1));

    const targetScale = srcCropW < 800 ? Math.min(2.5, 1400 / srcCropW) : Math.min(1.5, 2000 / Math.max(srcCropW, srcCropH));
    const ocrW = Math.max(1, Math.round(srcCropW * targetScale));
    const ocrH = Math.max(1, Math.round(srcCropH * targetScale));

    const ocrCanvas = document.createElement('canvas');
    ocrCanvas.width = ocrW;
    ocrCanvas.height = ocrH;
    const ctx = ocrCanvas.getContext('2d', { willReadFrequently: true });
    // Draw the bright crop region scaled up
    ctx.drawImage(img, srcCropX, srcCropY, srcCropW, srcCropH, 0, 0, ocrW, ocrH);

    const imgData = ctx.getImageData(0, 0, ocrW, ocrH);
    const pixels = imgData.data;
    const totalPx = ocrW * ocrH;
    const lum = new Float32Array(totalPx);

    let sumLum = 0;
    for (let p = 0, idx = 0; idx < totalPx; p += 4, idx++) {
      const y = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];
      lum[idx] = y;
      sumLum += y;
    }

    const isDarkBackground = sumLum / Math.max(1, totalPx) < 110;
    if (isDarkBackground) {
      for (let i = 0; i < totalPx; i++) lum[i] = 255 - lum[i];
    }

    // 6. Finer illumination grid on cropped region (32×32 for better local contrast)
    const gridCols = 32;
    const gridRows = 32;
    const cellW = Math.max(1, Math.ceil(ocrW / gridCols));
    const cellH = Math.max(1, Math.ceil(ocrH / gridRows));
    const bgGrid = new Float32Array(gridCols * gridRows);

    for (let gy = 0; gy < gridRows; gy++) {
      const y0 = gy * cellH;
      const y1 = Math.min(ocrH, y0 + cellH);
      for (let gx = 0; gx < gridCols; gx++) {
        const x0 = gx * cellW;
        const x1 = Math.min(ocrW, x0 + cellW);
        let maxBright = 100;
        const vals = [];
        for (let y = y0; y < y1; y += 2) {
          const rowOff = y * ocrW;
          for (let x = x0; x < x1; x += 2) {
            const v = lum[rowOff + x];
            vals.push(v);
            if (v > maxBright) maxBright = v;
          }
        }
        // Use 90th-percentile brightness as local paper estimate (more robust than max)
        vals.sort((a, b) => a - b);
        const p90 = vals[Math.floor(vals.length * 0.9)] ?? maxBright;
        bgGrid[gy * gridCols + gx] = Math.max(80, p90 * 0.9 + maxBright * 0.1);
      }
    }

    // 7. Apply illumination-normalized contrast stretch
    for (let y = 0; y < ocrH; y++) {
      const gyF = Math.min(gridRows - 1.001, (y / ocrH) * gridRows);
      const gy0 = Math.floor(gyF);
      const gy1 = Math.min(gridRows - 1, gy0 + 1);
      const ty = gyF - gy0;
      const rowOff = y * ocrW;

      for (let x = 0; x < ocrW; x++) {
        const gxF = Math.min(gridCols - 1.001, (x / ocrW) * gridCols);
        const gx0 = Math.floor(gxF);
        const gx1 = Math.min(gridCols - 1, gx0 + 1);
        const tx = gxF - gx0;

        const b00 = bgGrid[gy0 * gridCols + gx0];
        const b10 = bgGrid[gy0 * gridCols + gx1];
        const b01 = bgGrid[gy1 * gridCols + gx0];
        const b11 = bgGrid[gy1 * gridCols + gx1];
        const localPaper =
          (b00 * (1 - tx) + b10 * tx) * (1 - ty) +
          (b01 * (1 - tx) + b11 * tx) * ty;

        const norm = (lum[rowOff + x] / Math.max(1, localPaper)) * 255;
        // Aggressive paper whitening + ink darkening
        const contrasted = norm >= 210 ? 255 : norm < 30 ? 0 : clampByte((norm - 40) * 1.6);
        const p = (rowOff + x) * 4;
        pixels[p] = contrasted;
        pixels[p + 1] = contrasted;
        pixels[p + 2] = contrasted;
        pixels[p + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    return {
      ocrCanvas,
      rawCanvas: aiCanvas,
      geminiBase64,
      geminiMimeType: 'image/jpeg',
      shadowCrop: cropApplied && usableFrac >= 0.2
        ? { rowShadowFrac, leftFrac: finalCropX0, rightFrac: finalCropX1 }
        : null,
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
export async function scanBahiKhataImage(file, { geminiApiKey = '', ocrLang = 'eng+hin', onProgress } = {}) {
  if (!file) {
    throw new Error('No image selected. Please upload a photo from your gallery first.');
  }

  onProgress?.({ stage: 'prepare', progress: 8, status: 'Detecting shadow zones & enhancing text clarity...' });
  const prepared = await prepareLedgerImageForOcr(file);

  let warning = '';
  if (prepared.shadowCrop) {
    const coverPct = Math.round((1 - (prepared.shadowCrop.rightFrac - prepared.shadowCrop.leftFrac) * prepared.shadowCrop.rowShadowFrac) * 100);
    warning = `Shadow detected — auto-cropped to the bright text region (~${coverPct}% of image was dark). For best results, retake the photo in even lighting with shadow removed.`;
  }

  // 1. Optional Gemini Vision AI (best accuracy for messy Hindi/Hinglish handwriting + shadows)
  const cleanKey = String(geminiApiKey || '').trim();
  if (cleanKey) {
    onProgress?.({ stage: 'gemini', progress: 20, status: 'Sending to Gemini Vision AI (handles shadows & cursive)...' });
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
        warning,
      };
    } catch (err) {
      warning = warning
        ? `${warning} | Gemini: ${err.message}`
        : `Gemini AI failed (${err.message}) — using built-in OCR (may struggle with heavy shadows/cursive).`;
    }
  }

  // 2. Zero-key built-in browser OCR via Tesseract.js
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

  // If shadow-cropped version got few entries, retry on the original natural canvas as well
  if (entries.length === 0 || rawText.length < 15) {
    onProgress?.({ stage: 'tesseract', progress: 86, status: 'Re-scanning original image for more text...' });
    try {
      const secondText = await runTesseractOnCanvas(
        prepared.rawCanvas,
        engineUsed === 'tesseract-eng' ? 'eng' : ocrLang,
        onProgress
      );
      const secondEntries = parseBahiKhataOcrText(secondText);
      if (secondEntries.length > entries.length || secondText.length > rawText.length) {
        rawText = secondText;
        entries = secondEntries;
      }
    } catch {
      /* keep first pass result */
    }
  }

  // Add a Gemini upsell warning when Tesseract produced little/no output
  const tesseractFailed = entries.length === 0;
  if (tesseractFailed) {
    warning = [
      warning,
      'Built-in OCR could not read this handwriting clearly.',
      'Tips: 📸 Retake in bright even light (no shadows), hold phone steady.',
      'Or add a free Gemini API key (+ AI Handwriting Boost button) — Gemini Vision handles shadows & cursive handwriting much better.',
    ].filter(Boolean).join(' ');
  }

  onProgress?.({ stage: 'done', progress: 100, status: tesseractFailed ? 'Scan complete — see tips below' : 'Scan complete!' });
  return {
    engine: engineUsed,
    rawText,
    entries,
    warning,
    shadowDetected: Boolean(prepared.shadowCrop),
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
