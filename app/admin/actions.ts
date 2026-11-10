'use server';

import { adminHref } from '@/lib/admin-path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clientIp, securityLog } from '@/lib/request';
import { checkPassword, endSession, requireAdmin, startSession } from '@/lib/auth';
import {
  bindings,
  createProject,
  deleteMessage,
  deleteProject,
  getProjectById,
  moveProject,
  nextSort,
  rateBlockedFor,
  rateClear,
  rateRecord,
  setMessageRead,
  setProjectFlag,
  slugTaken,
  updateProject,
} from '@/lib/db';
import {
  DISCIPLINES,
  STATUSES,
  TYPES,
  VISUALS,
  type Discipline,
  type Metric,
  type ProjectContent,
  type ProjectInput,
} from '@/lib/types';

const text = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '');

/* ---------- session ---------- */

const minutes = (s: number) => Math.max(1, Math.ceil(s / 60));

// 5 wrong passwords from one IP within 15 minutes blocks that IP for 15 minutes.
const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW = 15 * 60;
const loginBlockedFor = (ip: string) => rateBlockedFor('login-fail', ip, LOGIN_MAX_FAILURES, LOGIN_WINDOW);

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const ip = await clientIp();
  const wait = await loginBlockedFor(ip);
  if (wait > 0) {
    securityLog('login.blocked', { ip });
    return { error: `Too many attempts. Try again in ${minutes(wait)} min.` };
  }

  const ok = await checkPassword(text(form.get('password')));
  if (!ok) {
    await rateRecord('login-fail', ip);
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    const nowBlocked = await loginBlockedFor(ip);
    securityLog(nowBlocked ? 'login.lockout' : 'login.failed', { ip });
    return {
      error: nowBlocked ? `Too many attempts. Try again in ${minutes(nowBlocked)} min.` : 'Wrong password.',
    };
  }
  await rateClear('login-fail', ip);
  await startSession();
  securityLog('login.success', { ip });
  redirect(adminHref());
}

export async function logout() {
  securityLog('logout', { ip: await clientIp() });
  await endSession();
  redirect(adminHref('/login'));
}

/* ---------- projects ---------- */

export type SaveState = { error?: string };

const str = (f: FormData, k: string, max = 2000) => text(f.get(k)).trim().slice(0, max);
const lines = (f: FormData, k: string) =>
  str(f, k, 8000)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
const metrics = (f: FormData, k: string): Metric[] =>
  lines(f, k).map((l) => {
    const [value, ...rest] = l.split('|');
    return { value: value.trim(), label: rest.join('|').trim() };
  });

const content = (f: FormData, lang: 'en' | 'ar'): ProjectContent => ({
  title: str(f, `${lang}.title`, 200),
  summary: str(f, `${lang}.summary`, 400),
  intro: str(f, `${lang}.intro`),
  question: str(f, `${lang}.question`),
  facts: lines(f, `${lang}.facts`),
  flow: lines(f, `${lang}.flow`).slice(0, 8),
  metrics: metrics(f, `${lang}.metrics`),
  note: str(f, `${lang}.note`),
});

const slugify = async (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const MAX_IMAGE = 5 * 1024 * 1024;

/**
 * Identify the image from its first bytes rather than trusting the browser's type or the
 * file name. Only raster formats are allowed: SVG can carry scripts.
 */
function sniffImage(b: Uint8Array): { type: string; ext: string } | null {
  const at = (i: number, ...bytes: number[]) => bytes.every((x, k) => b[i + k] === x);
  const ascii = (i: number, s: string) => Array.from({ length: s.length }, (_, k) => k).every((k) => b[i + k] === s.charCodeAt(k));
  if (at(0, 0xff, 0xd8, 0xff)) return { type: 'image/jpeg', ext: 'jpg' };
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { type: 'image/png', ext: 'png' };
  if (ascii(0, 'GIF87a') || ascii(0, 'GIF89a')) return { type: 'image/gif', ext: 'gif' };
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return { type: 'image/webp', ext: 'webp' };
  if (ascii(4, 'ftypavif') || ascii(4, 'ftypavis')) return { type: 'image/avif', ext: 'avif' };
  return null;
}

async function uploadCover(file: File, slug: string) {
  const bucket = bindings().MEDIA;
  if (!bucket) throw new Error('Image storage is not configured.');
  if (file.size > MAX_IMAGE) throw new Error('Cover image must be 5 MB or smaller.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new Error('Cover must be a JPG, PNG, WebP, GIF or AVIF image.');
  const key = `projects/${slug}-${Date.now().toString(36)}.${kind.ext}`;
  await bucket.put(key, bytes, { httpMetadata: { contentType: kind.type } });
  return key;
}

function refresh(slug?: string) {
  revalidatePath('/');
  revalidatePath('/work');
  if (slug) revalidatePath(`/work/${slug}`);
  revalidatePath('/admin');
}

export async function saveProject(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  const id = Number(form.get('id')) || null;
  const existing = id ? await getProjectById(id) : null;
  if (id && !existing) return { error: 'This project no longer exists.' };

  const en = content(form, 'en');
  const ar = content(form, 'ar');
  if (!en.title) return { error: 'An English title is required.' };

  const slug = await slugify(str(form, 'slug', 120) || en.title);
  if (!slug) return { error: 'The URL slug must contain letters or numbers.' };
  if (await slugTaken(slug, id ?? undefined)) return { error: `The URL “/work/${slug}” is already used.` };

  let coverKey = existing?.coverKey ?? null;
  if (form.get('removeCover') === 'on') coverKey = null;
  const file = form.get('cover');
  if (file instanceof File && file.size > 0) {
    try {
      coverKey = await uploadCover(file, slug);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  const pickOne = <T extends string>(v: string, allowed: readonly T[], fallback: T) =>
    allowed.includes(v as T) ? (v as T) : fallback;

  let visual = pickOne(str(form, 'visual'), VISUALS, 'system');
  if (visual === 'image' && !coverKey) visual = 'system';

  const input: ProjectInput = {
    slug,
    type: pickOne(str(form, 'type'), TYPES, 'work'),
    status: pickOne(str(form, 'status'), STATUSES, 'in-development'),
    disciplines: form.getAll('disciplines').filter((d): d is Discipline => DISCIPLINES.includes(d as Discipline)),
    year: str(form, 'year', 10),
    client: str(form, 'client', 160),
    visual,
    coverKey,
    stack: str(form, 'stack', 600)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    liveUrl: safeUrl(str(form, 'liveUrl', 500)),
    repoUrl: safeUrl(str(form, 'repoUrl', 500)),
    featured: form.get('featured') === 'on',
    published: form.get('published') === 'on',
    sort: existing?.sort ?? (await nextSort()),
    en,
    ar,
  };

  if (existing) await updateProject(existing.id, input);
  else await createProject(input);

  if (existing?.coverKey && existing.coverKey !== coverKey) {
    await bindings().MEDIA?.delete(existing.coverKey);
  }
  refresh(slug);
  if (existing && existing.slug !== slug) revalidatePath(`/work/${existing.slug}`);
  redirect(adminHref(`?saved=${encodeURIComponent(slug)}`));
}

/** Only allow http(s) links so a stored URL can never run script. */
function safeUrl(u: string) {
  if (!u) return '';
  try {
    const url = new URL(u.includes('://') ? u : `https://${u}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export async function toggleFlag(form: FormData) {
  await requireAdmin();
  const flag = form.get('flag') === 'featured' ? 'featured' : 'published';
  await setProjectFlag(Number(form.get('id')), flag, form.get('value') === '1');
  refresh();
}

export async function move(form: FormData) {
  await requireAdmin();
  await moveProject(Number(form.get('id')), form.get('dir') === 'up' ? 'up' : 'down');
  refresh();
}

export async function removeProject(form: FormData) {
  await requireAdmin();
  const p = await getProjectById(Number(form.get('id')));
  if (!p) return;
  await deleteProject(p.id);
  securityLog('project.deleted', { ip: await clientIp(), slug: p.slug });
  if (p.coverKey) await bindings().MEDIA?.delete(p.coverKey);
  refresh(p.slug);
  redirect(adminHref());
}

/* ---------- messages ---------- */

export async function markMessage(form: FormData) {
  await requireAdmin();
  await setMessageRead(Number(form.get('id')), form.get('read') === '1');
  revalidatePath('/admin/messages');
}

export async function removeMessage(form: FormData) {
  await requireAdmin();
  await deleteMessage(Number(form.get('id')));
  securityLog('message.deleted', { ip: await clientIp(), id: Number(form.get('id')) });
  revalidatePath('/admin/messages');
}
