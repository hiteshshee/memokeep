import { useRef } from 'react';

// Gently pulls its child toward the cursor on hover — a subtle "magnetic" feel.
export default function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate(0, 0)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`inline-block transition-transform duration-300 ease-out ${className}`}
      style={{ willChange: 'transform' }}
    >
      {children}
    </div>
  );
}
