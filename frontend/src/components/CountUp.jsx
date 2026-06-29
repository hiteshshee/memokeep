import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

// Animates a number from 0 up to `value` on mount. `format` turns the running
// number into the display string (e.g. currency or a rounded integer).
export default function CountUp({ value = 0, format = (v) => Math.round(v).toLocaleString('en-IN'), duration = 1.1 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, duration]);

  return <>{format(display)}</>;
}
