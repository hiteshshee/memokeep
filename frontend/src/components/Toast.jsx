import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

// Tiny global toast: call toast('Saved') anywhere; <Toaster/> (mounted once in
// App) renders + auto-dismisses them with a spring animation.
let listeners = [];
let counter = 0;

export function toast(message, type = 'success') {
  const t = { id: ++counter, message, type };
  listeners.forEach((fn) => fn(t));
}

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TONES = {
  success: 'border-emerald-200 text-emerald-600',
  error: 'border-red-200 text-red-500',
  info: 'border-gold-200 text-gold-600',
};

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const add = (t) => {
      setToasts((cur) => [...cur, t]);
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 3200);
    };
    listeners.push(add);
    return () => {
      listeners = listeners.filter((fn) => fn !== add);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{ background: 'var(--surface-solid)' }}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-[0_12px_34px_-12px_rgba(20,30,80,0.35)] backdrop-blur ${TONES[t.type] || TONES.info}`}
            >
              <Icon size={18} />
              <span className="font-medium text-ink-800">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
