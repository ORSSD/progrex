import { env } from 'cloudflare:workers';

/**
 * The admin's public address comes from the ADMIN_PATH environment variable
 * (e.g. "studio-x7k2"), so it never appears in the repo or in browser code.
 * Internally the pages live under /admin, which proxy.ts blocks from outside.
 * Returns null when ADMIN_PATH is unset or invalid — the admin is then unreachable.
 */
export function adminBase(): string | null {
  const raw = (env as unknown as { ADMIN_PATH?: string }).ADMIN_PATH ?? '';
  const slug = raw.trim().replace(/^\/+|\/+$/g, '');
  return /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(slug) ? slug : null;
}

/** Public URL for an admin page, e.g. adminHref('/messages'). */
export function adminHref(sub = '') {
  return `/${adminBase() ?? 'admin'}${sub}`;
}
