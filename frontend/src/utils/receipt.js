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
// Pull money-like amounts from a line, ignoring obvious non-prices.
function amountsIn(line) {
  const out = [];
  const re = /(?:₹|rs\.?|inr|\$)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
  let m;
  while ((m = re.exec(line))) {
    const raw = m[1];
    const digits = raw.replace(/[,.]/g, '');
    // Skip long digit runs without separators (phone / GST / invoice numbers).
    if (digits.length >= 7 && !raw.includes('.') && !raw.includes(',')) continue;
    const n = parseFloat(raw.replace(/,/g, ''));
    if (!Number.isNaN(n) && n >= 1 && n <= 1_000_000) out.push(n);
  }
  return out;
}

const SKIP_LINE = /gst|tin|vat|hsn|phone|\bph\b|tel|mobile|invoice\s*no|bill\s*no|order\s*no|receipt\s*no/i;

export function parsePrice(linesArr) {
  let best = null; // { score, value }
  for (const line of linesArr) {
    if (SKIP_LINE.test(line)) continue;
    const low = line.toLowerCase();
    let score = 0;
    if (/grand\s*total|amount\s*payable|net\s*(payable|amount)/.test(low)) score = 4;
    else if (/\btotal\b/.test(low) && !/sub\s*total/.test(low)) score = 3;
    else if (/amount|paid|\bmrp\b|price/.test(low)) score = 2;
    else if (/sub\s*total/.test(low)) score = 1;

    const amts = amountsIn(line);
    if (!amts.length) continue;
    const value = Math.max(...amts);
    if (!best || score > best.score || (score === best.score && value > best.value)) {
      best = { score, value };
    }
  }
  return best ? Math.round(best.value) : '';
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
