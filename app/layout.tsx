import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { Reveal } from '@/components/site/reveal';
import { getLang } from '@/lib/lang';
import './globals.css';

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });
const arabic = IBM_Plex_Sans_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600'],
});

const description =
  'We build what does not come with a template. Intelligent, secure digital products engineered around complex problems.';

export const metadata: Metadata = {
  title: { default: 'Progrex — Technology Studio', template: '%s — Progrex' },
  description,
  openGraph: { title: 'Progrex — Technology Studio', description, type: 'website', siteName: 'Progrex' },
  twitter: { card: 'summary_large_image', title: 'Progrex — Technology Studio', description },
};

export const viewport: Viewport = { themeColor: '#18252b' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <body className={`${sans.variable} ${mono.variable} ${arabic.variable}`}>
        {children}
        <Reveal />
      </body>
    </html>
  );
}
