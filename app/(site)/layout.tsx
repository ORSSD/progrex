import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';
import { getLang } from '@/lib/lang';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header lang={lang} />
      <main id="main">{children}</main>
      <Footer lang={lang} />
    </>
  );
}
