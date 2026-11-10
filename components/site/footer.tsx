import Link from 'next/link';
import { Brand } from './brand';
import { dict } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

export function Footer({ lang }: { lang: Lang }) {
  const d = dict[lang];
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Brand />
        <nav aria-label="Footer">
          <Link href="/work">{d.allWork}</Link>
          <Link href="/#capabilities">{d.nav.capabilities}</Link>
          <Link href="/#labs">{d.nav.labs}</Link>
          <Link href="/#contact">{d.nav.contact}</Link>
          <a href="mailto:hello@progrex.team">hello@progrex.team</a>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>{d.footer}</span>
        <span>
          © {new Date().getFullYear()} Progrex — {d.rights}
        </span>
      </div>
    </footer>
  );
}
