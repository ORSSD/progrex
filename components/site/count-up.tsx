'use client';

import { useEffect, useRef } from 'react';

/** Renders the final number on the server, then counts up to it once it scrolls into view. */
export function CountUp({ value, pad = 2 }: { value: number; pad?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fmt = (n: number) => String(n).padStart(pad, '0');
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);
        el.textContent = fmt(Math.round(value * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, pad]);
  return <span ref={ref}>{String(value).padStart(pad, '0')}</span>;
}
