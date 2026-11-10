import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';
import { ScrollProgress } from '@/components/site/scroll-progress';
import { getLang } from '@/lib/lang';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <Header lang={lang} />
      <main id="main">{children}</main>
      <Footer lang={lang} />
    </>
  );
}
