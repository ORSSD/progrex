'use client';

import { useEffect } from 'react';

/**
 * Fades in every `[data-reveal]` element as it scrolls into view.
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
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
