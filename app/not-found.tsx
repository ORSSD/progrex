import Link from 'next/link';
import { Brand } from '@/components/site/brand';
import { getDict } from '@/lib/lang';

export default async function NotFound() {
  const { d } = await getDict();
  return (
    <main className="not-found">
      <Brand />
      <span className="kicker">404</span>
      <h1>{d.notFound}</h1>
      <Link href="/" className="btn btn-primary">
        {d.returnHome}
      </Link>
    </main>
  );
}
