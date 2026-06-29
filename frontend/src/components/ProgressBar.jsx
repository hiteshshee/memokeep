import { motion } from 'framer-motion';

// A slim bar that fills from 0 to `value`% on mount. Colour shifts with urgency.
export default function ProgressBar({ value = 0, tone = 'blue' }) {
  const pct = Math.max(0, Math.min(100, value));
  const colors = {
    blue: 'linear-gradient(90deg,#2f6bff,#7c3aed)',
    amber: 'linear-gradient(90deg,#f59e0b,#f97316)',
    red: 'linear-gradient(90deg,#fb7185,#e11d48)',
    green: 'linear-gradient(90deg,#34d399,#10b981)',
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ivory-100">
      <motion.div
        className="h-full rounded-full"
        style={{ background: colors[tone] || colors.blue }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 }}
      />
    </div>
  );
}
