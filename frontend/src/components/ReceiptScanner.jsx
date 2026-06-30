import { useRef, useState } from 'react';
import { ScanLine, Camera } from 'lucide-react';
import { parseReceipt } from '../utils/receipt.js';
import { toast } from './Toast.jsx';

// Reads a receipt/bill image entirely on-device (Tesseract.js OCR via
// WebAssembly) and hands the best-effort fields back to the parent form.
// Nothing is uploaded — no API key, no server, no cost.
export default function ReceiptScanner({ onParsed }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again later
    if (!file) return;

    setBusy(true);
    setProgress(0);
    try {
      // Tesseract.js is ~2 MB of WASM — load it only when actually scanning.
      const { default: Tesseract } = await import('tesseract.js');
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const fields = parseReceipt(data.text || '');
      const found = Object.values(fields).filter((v) => v !== '' && v != null).length;
      if (found === 0) {
        toast('Couldn’t read much from that image — try a clearer, flatter photo', 'info');
      } else {
        toast(`Scanned — filled ${found} field${found > 1 ? 's' : ''}. Please review.`);
      }
      onParsed(fields);
    } catch {
      toast('Scan failed. Please fill the form manually.', 'error');
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-gold-300 bg-gold-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-display text-sm font-semibold text-ink-900">
            <ScanLine size={16} className="text-gold-600" /> Scan a receipt
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            Snap or upload a bill — we read it right on your device and auto-fill what we can.
            Nothing leaves your browser.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="btn-ghost shrink-0"
        >
          <Camera size={16} />
          {busy ? `Reading… ${progress}%` : 'Choose image'}
        </button>
      </div>

      {busy && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gold-100">
          <div
            className="h-full rounded-full bg-gold-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
