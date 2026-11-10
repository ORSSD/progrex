'use client';

import { useEffect, useRef } from 'react';

/**
 * A paragraph whose words light up one after another as it scrolls through the viewport.
 * Without JavaScript (or with reduced motion) every word is simply fully visible.
 */
export function ScrollWords({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const start = innerHeight * 0.85;
      const end = innerHeight * 0.35;
      const p = (start - r.top) / (r.height + start - end);
      el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const words = text.split(/\s+/);
  return (
    <p ref={ref} className={`scroll-words ${className}`} style={{ '--n': words.length } as React.CSSProperties}>
      {words.map((w, i) => (
        <span key={i} style={{ '--i': i } as React.CSSProperties}>
          {w}{' '}
        </span>
      ))}
    </p>
  );
}
