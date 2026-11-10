'use client';

import { useEffect } from 'react';

/**
 * Fades in every `[data-reveal]` element as it scrolls into view, and tracks the pointer over `[data-cursor]`.
 * Watches the DOM so content added later (navigation, language switch) is picked up too.
 */
export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('js');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.shown = '';
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    const scan = () =>
      document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-shown])').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    // Let `[data-cursor]` elements know where the pointer is, so a label can follow it.
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-cursor]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('pointermove', onMove);
    };
  }, []);
  return null;
}
