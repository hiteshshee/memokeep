// Best-effort receipt parser. OCR text is noisy, so everything here is a
// heuristic "best guess" the user reviews before saving — never authoritative.

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// A small roster of common brands. Detection just helps pre-fill the Brand
// field; an un-listed brand simply leaves it blank for the user.
const BRANDS = [
  'Samsung', 'LG', 'Sony', 'Apple', 'iPhone', 'iPad', 'MacBook', 'Dell', 'HP',
  'Lenovo', 'Asus', 'Acer', 'Bosch', 'Whirlpool', 'Philips', 'Panasonic',
  'Xiaomi', 'Redmi', 'OnePlus', 'Realme', 'Oppo', 'Vivo', 'Nokia', 'Canon',
  'Nikon', 'Godrej', 'Haier', 'Voltas', 'Daikin', 'Hitachi', 'Prestige',
  'Bajaj', 'Havells', 'Boat', 'JBL', 'Toshiba', 'Microsoft', 'Motorola',
  'Honor', 'Nothing', 'Crompton', 'Usha', 'Kent', 'Symphony',
];

const lines = (text) =>
  text.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);

const pad = (n) => String(n).padStart(2, '0');

function toISO(y, mIdx, d) {
  if (y < 100) y += 2000;
  if (mIdx < 0 || mIdx > 11 || d < 1 || d > 31 || y < 2000 || y > 2100) return '';
  return `${y}-${pad(mIdx + 1)}-${pad(d)}`;
}

// --- Date ---------------------------------------------------------------
// Defaults to day-first (Indian/most-of-world) ordering when ambiguous.
export function parseDate(text) {
  let m = text.match(/\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/); // yyyy-mm-dd
  if (m) return toISO(+m[1], +m[2] - 1, +m[3]);

  m = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/); // dd/mm/yyyy
  if (m) {
    let day = +m[1];
    let mon = +m[2];
    if (day <= 12 && mon > 12) [day, mon] = [mon, day]; // looks US-style → swap
    return toISO(+m[3], mon - 1, day);
  }

  m = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/); // 12 Jan 2024
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()] !== undefined) {
    return toISO(+m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);
  }

  m = text.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/); // Jan 12, 2024
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()] !== undefined) {
    return toISO(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]);
  }
  return '';
}

// --- Price --------------------------------------------------------------
// Lines that never hold a product price (tax IDs, contact info, doc numbers).
const SKIP_LINE =
  /gst|gstin|tin|vat|hsn|sac|\bpan\b|phone|\bph\b|tel|mobile|contact|invoice\s*no|bill\s*no|order\s*(no|id)|receipt\s*no|reg\.?\s*no|\bcin\b|fssai|pin\s*code|account|ifsc|\bupi\b|card\s*no/i;

// Lines that talk about counts, not money.
const QTY_LINE = /\b(qty|quantity|items?|pcs|nos|units?)\b/i;

// How strongly a line's wording suggests it holds the final amount.
function labelScore(low) {
  if (/grand\s*total|amount\s*(payable|due)|total\s*payable|net\s*(payable|amount|total)|balance\s*due/.test(low)) return 5;
  if (/\btotal\b/.test(low) && !/sub\s*-?\s*total/.test(low)) return 4;
  if (/sub\s*-?\s*total/.test(low)) return 2;
  if (/\bamount\b|\bpaid\b|\bmrp\b|\bprice\b|\bcost\b|\bnet\b/.test(low)) return 2;
  return 0;
}

// Pull amounts from one line, flagging whether a currency symbol preceded each
// number (a strong signal it's really money, not an ID/quantity/year).
function amountsIn(line) {
  const out = [];
  const re = /(₹|rs\.?|inr|\$)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
  let m;
  while ((m = re.exec(line))) {
    const sym = m[1];
    const raw = m[2];
    const grouped = raw.includes('.') || raw.includes(',');
    const digits = raw.replace(/[,.]/g, '');
    // Skip long digit runs without separators (phone / GST / doc numbers).
    if (digits.length >= 7 && !grouped) continue;
    const n = parseFloat(raw.replace(/,/g, ''));
    if (Number.isNaN(n) || n < 1 || n > 5_000_000) continue;
    const hasCurrency = Boolean(sym);
    const looksLikeYear = !hasCurrency && !grouped && n >= 1990 && n <= 2099;
    out.push({ value: n, hasCurrency, looksLikeYear });
  }
  return out;
}

export function parsePrice(linesArr) {
  // Per-line info, so an amount can inherit a label from the line above it
  // (column layouts often OCR "TOTAL" and its value as two separate lines).
  const meta = linesArr.map((line) => {
    const skip = SKIP_LINE.test(line) || QTY_LINE.test(line);
    const score = labelScore(line.toLowerCase());
    const amounts = skip ? [] : amountsIn(line);
    return { score, amounts, isPureLabel: score > 0 && amounts.length === 0 };
  });

  const candidates = [];
  meta.forEach((mm, i) => {
    for (const a of mm.amounts) {
      let score = mm.score;
      if (score === 0 && i > 0 && meta[i - 1].isPureLabel) score = meta[i - 1].score;
      if (a.looksLikeYear && score === 0) continue; // drop stray years
      candidates.push({ value: a.value, hasCurrency: a.hasCurrency, score });
    }
  });

  if (!candidates.length) return '';

  // Labelled "total" lines win; then amounts with a ₹/Rs/$ symbol; then the
  // largest value (the grand total is the biggest of the total-ish numbers).
  candidates.sort((a, b) =>
    b.score - a.score || b.hasCurrency - a.hasCurrency || b.value - a.value,
  );

  return Math.round(candidates[0].value);
}

// --- Warranty (returns months) -----------------------------------------
export function parseWarranty(text) {
  const low = text.toLowerCase();
  let m =
    low.match(/(?:warranty|guarantee)[^0-9]{0,20}(\d{1,2})\s*(years?|yrs?|months?|mo)\b/) ||
    low.match(/(\d{1,2})\s*(years?|yrs?|months?|mo)\b[^a-z0-9]{0,12}(?:warranty|guarantee)/);
  if (!m) return '';
  const n = +m[1];
  return m[2].startsWith('y') ? n * 12 : n;
}

// --- Brand / name / merchant -------------------------------------------
export function parseBrand(text) {
  for (const b of BRANDS) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(text)) return b;
  }
  return '';
}

function parseMerchant(linesArr) {
  // The store name is usually one of the first prominent text lines.
  for (const line of linesArr.slice(0, 5)) {
    const letters = line.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 4 && !/total|invoice|receipt|gst|tax|bill|date/i.test(line)) {
      return line.replace(/\s{2,}/g, ' ').slice(0, 60);
    }
  }
  return '';
}

// --- Entry point --------------------------------------------------------
export function parseReceipt(rawText) {
  const linesArr = lines(rawText);
  const text = linesArr.join('\n');
  const brand = parseBrand(text);

  const fields = {
    purchasePrice: parsePrice(linesArr),
    purchaseDate: parseDate(text),
    warrantyMonths: parseWarranty(text),
    brand,
    purchasedFrom: parseMerchant(linesArr),
  };

  // Best-effort product name: the line mentioning the detected brand.
  if (brand) {
    const nameLine = linesArr.find(
      (l) => new RegExp(brand, 'i').test(l) && l.length <= 70,
    );
    if (nameLine) fields.name = nameLine.replace(/\s{2,}/g, ' ').trim();
  }
  return fields;
}
