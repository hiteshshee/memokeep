import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light' : 'Switch to dark'}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-line text-ink-500 transition hover:border-gold-300 hover:text-ink-900"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'sun' : 'moon'}
          initial={{ y: 14, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          {dark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
