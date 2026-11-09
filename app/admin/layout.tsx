import type { Metadata } from 'next';
import Link from 'next/link';
import { Brand } from '@/components/site/brand';
import { isAdmin } from '@/lib/auth';
import { unreadCount } from '@/lib/db';
import { logout } from './actions';
import './admin.css';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  const unread = authed ? await unreadCount() : 0;
  return (
    <div className="admin" dir="ltr" lang="en">
      {authed && (
        <header className="admin-bar">
          <Link href="/admin" className="admin-brand">
            <Brand small />
            <span>Studio admin</span>
          </Link>
          <nav>
            <Link href="/admin">Projects</Link>
            <Link href="/admin/messages">
              Inbox {unread > 0 && <b className="badge">{unread}</b>}
            </Link>
            <Link href="/" target="_blank">
              View site ↗
            </Link>
            <form action={logout}>
              <button type="submit">Sign out</button>
            </form>
          </nav>
        </header>
      )}
      <div className="admin-main">{children}</div>
    </div>
  );
}
