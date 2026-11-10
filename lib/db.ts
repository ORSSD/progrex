import { env } from 'cloudflare:workers';
import { seedProjects } from './seed';
import {
  DISCIPLINES,
  STATUSES,
  TYPES,
  VISUALS,
  emptyContent,
  type Message,
  type Project,
  type ProjectContent,
  type ProjectInput,
} from './types';

type Bindings = {
  DB: D1Database;
  MEDIA?: R2Bucket;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
};

export const bindings = () => env as unknown as Bindings;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'work',
    status TEXT NOT NULL DEFAULT 'in-development',
    disciplines TEXT NOT NULL DEFAULT '[]',
    year TEXT NOT NULL DEFAULT '',
    client TEXT NOT NULL DEFAULT '',
    visual TEXT NOT NULL DEFAULT 'system',
    cover_key TEXT,
    stack TEXT NOT NULL DEFAULT '[]',
    live_url TEXT NOT NULL DEFAULT '',
    repo_url TEXT NOT NULL DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 0,
    sort INTEGER NOT NULL DEFAULT 0,
    content_en TEXT NOT NULL DEFAULT '{}',
    content_ar TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    service TEXT NOT NULL DEFAULT '',
    idea TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS rate_events (kind TEXT NOT NULL, ip TEXT NOT NULL, at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS rate_events_lookup ON rate_events (kind, ip, at)`,
];

let ready: Promise<void> | null = null;

/** Creates tables on first use and seeds the original portfolio once. */
async function db(): Promise<D1Database> {
  const DB = bindings().DB;
  ready ??= (async () => {
    await DB.batch(SCHEMA.map((s) => DB.prepare(s)));
    const seeded = await DB.prepare(`SELECT value FROM meta WHERE key = 'seeded'`).first();
    if (!seeded) {
      for (const p of seedProjects) await insertProject(DB, p);
      await DB.prepare(`INSERT INTO meta (key, value) VALUES ('seeded', '1')`).run();
    }
  })().catch((err) => {
    ready = null;
    throw err;
  });
  await ready;
  return DB;
}

/* ---------- row mapping ---------- */

type Row = Record<string, unknown>;

const text = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v as number));

const parse = <T>(v: unknown, fallback: T): T => {
  try {
    return typeof v === 'string' ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

const content = (v: unknown): ProjectContent => ({ ...emptyContent(), ...parse(v, {}) });

function toProject(r: Row): Project {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    type: pick(r.type, TYPES, 'work'),
    status: pick(r.status, STATUSES, 'in-development'),
    disciplines: parse<string[]>(r.disciplines, []).filter((d): d is Project['disciplines'][number] =>
      (DISCIPLINES as readonly string[]).includes(d),
    ),
    year: text(r.year),
    client: text(r.client),
    visual: pick(r.visual, VISUALS, 'system'),
    coverKey: (r.cover_key as string | null) ?? null,
    stack: parse<string[]>(r.stack, []),
    liveUrl: text(r.live_url),
    repoUrl: text(r.repo_url),
    featured: Boolean(r.featured),
    published: Boolean(r.published),
    sort: Number(r.sort ?? 0),
    en: content(r.content_en),
    ar: content(r.content_ar),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

const columns = (p: ProjectInput) => [
  p.slug,
  p.type,
  p.status,
  JSON.stringify(p.disciplines),
  p.year,
  p.client,
  p.visual,
  p.coverKey,
  JSON.stringify(p.stack),
  p.liveUrl,
  p.repoUrl,
  p.featured ? 1 : 0,
  p.published ? 1 : 0,
  p.sort,
  JSON.stringify(p.en),
  JSON.stringify(p.ar),
];

async function insertProject(DB: D1Database, p: ProjectInput) {
  const r = await DB.prepare(
    `INSERT INTO projects (slug, type, status, disciplines, year, client, visual, cover_key, stack,
      live_url, repo_url, featured, published, sort, content_en, content_ar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(...columns(p))
    .first<{ id: number }>();
  return r!.id;
}

/* ---------- projects ---------- */

const ORDER = 'ORDER BY sort ASC, id DESC';

export async function listProjects(opts: { includeDrafts?: boolean } = {}) {
  const DB = await db();
  const where = opts.includeDrafts ? '' : 'WHERE published = 1';
  const { results } = await DB.prepare(`SELECT * FROM projects ${where} ${ORDER}`).all<Row>();
  return results.map(toProject);
}

export async function getProjectBySlug(slug: string, opts: { includeDrafts?: boolean } = {}) {
  const DB = await db();
  const r = await DB.prepare(
    `SELECT * FROM projects WHERE slug = ? ${opts.includeDrafts ? '' : 'AND published = 1'}`,
  )
    .bind(slug)
    .first<Row>();
  return r ? toProject(r) : null;
}

export async function getProjectById(id: number) {
  const DB = await db();
  const r = await DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(id).first<Row>();
  return r ? toProject(r) : null;
}

export async function slugTaken(slug: string, exceptId?: number) {
  const DB = await db();
  const r = await DB.prepare(`SELECT id FROM projects WHERE slug = ? AND id != ?`)
    .bind(slug, exceptId ?? -1)
    .first();
  return Boolean(r);
}

export async function createProject(p: ProjectInput) {
  return insertProject(await db(), p);
}

export async function updateProject(id: number, p: ProjectInput) {
  const DB = await db();
  await DB.prepare(
    `UPDATE projects SET slug = ?, type = ?, status = ?, disciplines = ?, year = ?, client = ?, visual = ?,
      cover_key = ?, stack = ?, live_url = ?, repo_url = ?, featured = ?, published = ?, sort = ?,
      content_en = ?, content_ar = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(...columns(p), id)
    .run();
}

export async function setProjectFlag(id: number, flag: 'published' | 'featured', value: boolean) {
  const DB = await db();
  const col = flag === 'published' ? 'published' : 'featured';
  await DB.prepare(`UPDATE projects SET ${col} = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(value ? 1 : 0, id)
    .run();
}

/** Swaps a project with its neighbour in the display order. */
export async function moveProject(id: number, dir: 'up' | 'down') {
  const DB = await db();
  const { results } = await DB.prepare(`SELECT id FROM projects ${ORDER}`).all<{ id: number }>();
  const ids = results.map((r) => r.id);
  const i = ids.indexOf(id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await DB.batch(ids.map((pid, n) => DB.prepare(`UPDATE projects SET sort = ? WHERE id = ?`).bind(n + 1, pid)));
}

export async function nextSort() {
  const DB = await db();
  const r = await DB.prepare(`SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM projects`).first<{ n: number }>();
  return r?.n ?? 1;
}

export async function deleteProject(id: number) {
  const DB = await db();
  await DB.prepare(`DELETE FROM projects WHERE id = ?`).bind(id).run();
}

/* ---------- messages ---------- */

function toMessage(r: Row): Message {
  return {
    id: Number(r.id),
    name: String(r.name),
    contact: String(r.contact),
    company: text(r.company),
    service: text(r.service),
    idea: String(r.idea),
    read: Boolean(r.read),
    createdAt: String(r.created_at),
  };
}

export async function createMessage(m: Pick<Message, 'name' | 'contact' | 'company' | 'service' | 'idea'>) {
  const DB = await db();
  await DB.prepare(`INSERT INTO messages (name, contact, company, service, idea) VALUES (?, ?, ?, ?, ?)`)
    .bind(m.name, m.contact, m.company, m.service, m.idea)
    .run();
}

export async function listMessages() {
  const DB = await db();
  const { results } = await DB.prepare(`SELECT * FROM messages ORDER BY id DESC`).all<Row>();
  return results.map(toMessage);
}

export async function unreadCount() {
  const DB = await db();
  const r = await DB.prepare(`SELECT COUNT(*) AS n FROM messages WHERE read = 0`).first<{ n: number }>();
  return r?.n ?? 0;
}

export async function setMessageRead(id: number, read: boolean) {
  const DB = await db();
  await DB.prepare(`UPDATE messages SET read = ? WHERE id = ?`).bind(read ? 1 : 0, id).run();
}

export async function deleteMessage(id: number) {
  const DB = await db();
  await DB.prepare(`DELETE FROM messages WHERE id = ?`).bind(id).run();
}

/* ---------- rate limiting (per IP) ---------- */

export type RateKind = 'login-fail' | 'contact';

/**
 * Seconds until this IP may act again, or 0 if allowed.
 * Blocked once it has `max` events of this kind inside `windowSec`; the block lasts
 * a full window after its latest event.
 */
export async function rateBlockedFor(kind: RateKind, ip: string, max: number, windowSec: number) {
  const DB = await db();
  const now = Math.floor(Date.now() / 1000);
  const r = await DB.prepare(
    `SELECT COUNT(*) AS n, MAX(at) AS last FROM rate_events WHERE kind = ? AND ip = ? AND at > ?`,
  )
    .bind(kind, ip, now - windowSec)
    .first<{ n: number; last: number | null }>();
  if (!r || r.n < max || r.last == null) return 0;
  return Math.max(0, r.last + windowSec - now);
}

export async function rateRecord(kind: RateKind, ip: string) {
  const DB = await db();
  const now = Math.floor(Date.now() / 1000);
  await DB.batch([
    DB.prepare(`INSERT INTO rate_events (kind, ip, at) VALUES (?, ?, ?)`).bind(kind, ip, now),
    DB.prepare(`DELETE FROM rate_events WHERE at < ?`).bind(now - 24 * 60 * 60),
  ]);
}

export async function rateClear(kind: RateKind, ip: string) {
  const DB = await db();
  await DB.prepare(`DELETE FROM rate_events WHERE kind = ? AND ip = ?`).bind(kind, ip).run();
}

/* ---------- session epoch (bumped on sign-out to revoke every session) ---------- */

export async function getSessionEpoch() {
  const DB = await db();
  const r = await DB.prepare(`SELECT value FROM meta WHERE key = 'session_epoch'`).first<{ value: string }>();
  return Number(r?.value ?? 0);
}

export async function bumpSessionEpoch() {
  const DB = await db();
  await DB.prepare(
    `INSERT INTO meta (key, value) VALUES ('session_epoch', '1')
     ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1`,
  ).run();
}
