'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Brand } from './brand';
import { LANG_COOKIE, dict } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

const SECTIONS = ['work', 'capabilities', 'labs', 'studio', 'contact'] as const;

export function Header({ lang }: { lang: Lang }) {
  const d = dict[lang];
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const onHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the section currently in view on the home page.
  useEffect(() => {
    if (!onHome) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [onHome]);
  const current = onHome ? active : pathname.startsWith('/work') ? 'work' : null;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    // Close the menu if the window grows past the mobile layout.
    const mq = matchMedia('(min-width: 861px)');
    const onWide = () => mq.matches && setOpen(false);
    addEventListener('keydown', onKey);
    mq.addEventListener('change', onWide);
    return () => {
      removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onWide);
    };
  }, [open]);

  const switchLang = () => {
    const next: Lang = lang === 'en' ? 'ar' : 'en';
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  };

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <Link href="/" aria-label="Progrex home" onClick={() => setOpen(false)}>
        <Brand />
      </Link>
      <nav id="site-nav" aria-label="Main">
        {SECTIONS.map((id, i) => (
          <Link
            key={id}
            href={`/#${id}`}
            className={current === id ? 'is-active' : undefined}
            onClick={() => setOpen(false)}
          >
            <span className="nav-no">0{i + 1}</span>
            {d.nav[id]}
          </Link>
        ))}
        <Link href="/#contact" className="nav-cta btn btn-primary" onClick={() => setOpen(false)}>
          {d.start}
          <ArrowUpRight />
        </Link>
      </nav>
      <div className="header-actions">
        <button className="lang-btn" onClick={switchLang} disabled={pending} lang={lang === 'en' ? 'ar' : 'en'}>
          {d.switchLang}
        </button>
        <Link href="/#contact" className="header-cta">
          {d.start}
        </Link>
        <button
          className="menu-btn"
          aria-label={d.menu}
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
