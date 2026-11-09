'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkPassword, endSession, requireAdmin, startSession } from '@/lib/auth';
import {
  bindings,
  createProject,
  deleteMessage,
  deleteProject,
  getProjectById,
  moveProject,
  nextSort,
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

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const ok = await checkPassword(text(form.get('password')));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: 'Wrong password.' };
  }
  await startSession();
  redirect('/admin');
}

export async function logout() {
  await endSession();
  redirect('/admin/login');
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

async function uploadCover(file: File, slug: string) {
  const bucket = bindings().MEDIA;
  if (!bucket) throw new Error('Image storage is not configured.');
  if (!file.type.startsWith('image/')) throw new Error('Cover must be an image file.');
  if (file.size > MAX_IMAGE) throw new Error('Cover image must be 5 MB or smaller.');
  const ext = (file.name.split('.').pop() || 'img').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `projects/${slug}-${Date.now().toString(36)}.${ext}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
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
  redirect(`/admin?saved=${encodeURIComponent(slug)}`);
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
  if (p.coverKey) await bindings().MEDIA?.delete(p.coverKey);
  refresh(p.slug);
  redirect('/admin');
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
  revalidatePath('/admin/messages');
}
