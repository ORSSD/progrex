import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { bindings } from './db';

const COOKIE = 'progrex_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // one week

const enc = new TextEncoder();

function secret() {
  const b = bindings();
  return b.SESSION_SECRET || b.ADMIN_PASSWORD || '';
}

export const adminConfigured = () => Boolean(bindings().ADMIN_PASSWORD);

async function sign(payload: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Constant-time string comparison. */
function same(a: string, b: string) {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function checkPassword(input: string) {
  const expected = bindings().ADMIN_PASSWORD;
  if (!expected) return false;
  return same(input, expected);
}

export async function startSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `admin.${exp}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${await sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const i = raw.lastIndexOf('.');
  const payload = raw.slice(0, i);
  const sig = raw.slice(i + 1);
  const exp = Number(payload.split('.')[1]);
  if (!exp || exp < Date.now() / 1000) return false;
  return same(sig, await sign(payload));
}

/** Use at the top of every admin page and admin server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}
