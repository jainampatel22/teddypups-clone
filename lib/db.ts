// SQLite data layer (Node's built-in node:sqlite, no native deps).
// DB file: data/teddypups.db. Created and seeded from data/seed/*.json on first use.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Media, Puppy, HappyPhoto, Faq, Testimonial, Section, Settings, Enquiry, Ref } from "./types";

const ROOT = process.cwd();
const DB_FILE = process.env.TP_DB_FILE || path.join(ROOT, "data", "teddypups.db");
const SEED_DIR = path.join(ROOT, "data", "seed");

const g = globalThis as unknown as { __tpdb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (g.__tpdb) return g.__tpdb;
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  migrate(db);
  const count = (db.prepare("SELECT COUNT(*) AS n FROM puppies").get() as any).n;
  if (!count) seed(db);
  else syncSections(db);
  g.__tpdb = db;
  return db;
}

export const uid = () => crypto.randomUUID();
export const shortId = () => crypto.randomBytes(9).toString("base64url").slice(0, 12);

function migrate(db: DatabaseSync) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'image', url TEXT NOT NULL,
    width INTEGER, height INTEGER, alt TEXT DEFAULT '', caption TEXT DEFAULT '',
    focal_x REAL DEFAULT 0.5, focal_y REAL DEFAULT 0.5, color TEXT DEFAULT '#f2be6b',
    blur_data_url TEXT, duration_s REAL, poster_id TEXT, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS breeds (slug TEXT PRIMARY KEY, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS origins (slug TEXT PRIMARY KEY, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS collections (slug TEXT PRIMARY KEY, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS puppies (
    id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT DEFAULT '', display_name TEXT NOT NULL,
    breed TEXT DEFAULT '', gender TEXT DEFAULT 'male', gender_label TEXT DEFAULT 'Boy', age TEXT DEFAULT '',
    colour TEXT DEFAULT '', description TEXT DEFAULT '', records TEXT DEFAULT '[]',
    status TEXT DEFAULT 'available', featured INTEGER DEFAULT 0, seo_description TEXT DEFAULT '',
    cover_id TEXT, origin_slug TEXT, published INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS puppy_media (puppy_id TEXT NOT NULL, media_id TEXT NOT NULL, sort_order INTEGER DEFAULT 0, PRIMARY KEY (puppy_id, media_id));
  CREATE TABLE IF NOT EXISTS puppy_breeds (puppy_id TEXT NOT NULL, breed_slug TEXT NOT NULL, PRIMARY KEY (puppy_id, breed_slug));
  CREATE TABLE IF NOT EXISTS puppy_collections (puppy_id TEXT NOT NULL, collection_slug TEXT NOT NULL, PRIMARY KEY (puppy_id, collection_slug));
  CREATE TABLE IF NOT EXISTS happy_photos (media_id TEXT PRIMARY KEY, show_on_home INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS faqs (id TEXT PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL, sort_order INTEGER DEFAULT 0, published INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS testimonials (id TEXT PRIMARY KEY, quote TEXT NOT NULL, name TEXT DEFAULT '', location TEXT DEFAULT '', sort_order INTEGER DEFAULT 0, published INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS sections (page TEXT NOT NULL, key TEXT NOT NULL, heading TEXT DEFAULT '', body TEXT DEFAULT '', data TEXT DEFAULT '{}', media_ids TEXT DEFAULT '[]', PRIMARY KEY (page, key));
  CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY, created_at TEXT DEFAULT (datetime('now')), name TEXT NOT NULL, phone TEXT NOT NULL,
    email TEXT DEFAULT '', area TEXT DEFAULT '', message TEXT DEFAULT '', puppy_id TEXT, source TEXT DEFAULT 'contact',
    status TEXT DEFAULT 'new', user_agent TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL);
  `);
}

/* ---------------------------------- seed ---------------------------------- */

const readSeed = (f: string) => {
  const p = path.join(SEED_DIR, f);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};

/** Original media URL (/media/<id>/<hash>/<file>) -> local file URL. */
export function localMediaUrl(url: string, kind: string) {
  const m = url.match(/^\/media\/([^/]+)\//);
  if (!m) return url;
  return kind === "video" ? `/media/${m[1]}.mp4` : `/media/${m[1]}.webp`;
}

export function upsertMedia(db: DatabaseSync, m: any): string | null {
  if (!m) return null;
  const posterId = m.poster ? upsertMedia(db, m.poster) : null;
  let w = m.width, h = m.height;
  if (m.kind !== "video" && w > 1920) { h = Math.round((h * 1920) / w); w = 1920; }
  db.prepare(`INSERT INTO media (id, kind, url, width, height, alt, caption, focal_x, focal_y, color, blur_data_url, duration_s, poster_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET alt=excluded.alt, caption=CASE WHEN excluded.caption<>'' THEN excluded.caption ELSE media.caption END`)
    .run(m.id, m.kind || "image", localMediaUrl(m.url, m.kind), w ?? null, h ?? null, m.alt || "", m.caption || "",
      m.focalX ?? 0.5, m.focalY ?? 0.5, m.color || "#f2be6b", m.blurDataUrl ?? null, m.durationS ?? null, posterId);
  return m.id;
}

export function seed(db: DatabaseSync) {
  db.exec("BEGIN");
  try {
    const settings = readSeed("settings.json") || {};
    for (const [k, v] of Object.entries(settings)) db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(k, JSON.stringify(v));
    for (const [table, file] of [["breeds", "breeds.json"], ["origins", "origins.json"], ["collections", "collections.json"]] as const) {
      (readSeed(file) || []).forEach((r: any, i: number) => db.prepare(`INSERT OR REPLACE INTO ${table} (slug, name, sort_order) VALUES (?,?,?)`).run(r.slug, r.name, r.sortOrder ?? i));
    }
    for (const p of readSeed("puppies.json") || []) {
      const coverId = upsertMedia(db, p.cover);
      db.prepare(`INSERT OR REPLACE INTO puppies (id, slug, name, display_name, breed, gender, gender_label, age, colour, description, records, status, featured, seo_description, cover_id, origin_slug, published, sort_order)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(p.id, p.slug, p.name || "", p.displayName, p.breed || "", p.gender, p.genderLabel, p.age || "",
          p.colour || "", p.description || "", JSON.stringify(p.records || []), p.status === "available" ? "available" : p.status === "reserved" ? "reserved" : "home",
          p.featured ? 1 : 0, p.seoDescription || "", coverId, p.origin?.slug ?? null, p.published === false ? 0 : 1, p.sortOrder ?? 0);
      (p.media || []).forEach((m: any, i: number) => { upsertMedia(db, m); db.prepare("INSERT OR REPLACE INTO puppy_media (puppy_id, media_id, sort_order) VALUES (?,?,?)").run(p.id, m.id, i); });
      (p.breeds || []).forEach((b: Ref) => db.prepare("INSERT OR REPLACE INTO puppy_breeds VALUES (?,?)").run(p.id, b.slug));
      (p.collections || []).forEach((c: Ref) => db.prepare("INSERT OR REPLACE INTO puppy_collections VALUES (?,?)").run(p.id, c.slug));
    }
    (readSeed("happy-photos.json") || []).forEach((h: any, i: number) => {
      upsertMedia(db, h);
      db.prepare("INSERT OR REPLACE INTO happy_photos (media_id, show_on_home, sort_order) VALUES (?,?,?)").run(h.id, h.showOnHome ? 1 : 0, h.sortOrder ?? i);
    });
    (readSeed("faqs.json") || []).forEach((f: any, i: number) => db.prepare("INSERT OR REPLACE INTO faqs (id, question, answer, sort_order) VALUES (?,?,?,?)").run(f.id || uid(), f.question, f.answer, f.sortOrder ?? i));
    (readSeed("testimonials.json") || []).forEach((t: any, i: number) => db.prepare("INSERT OR REPLACE INTO testimonials (id, quote, name, location, sort_order) VALUES (?,?,?,?,?)").run(t.id || uid(), t.quote, t.name, t.location, t.sortOrder ?? i));
    // Page sections: data/seed/sections/<page>.json = { key: {heading, body, data, media[]} }
    const secDir = path.join(SEED_DIR, "sections");
    if (fs.existsSync(secDir)) for (const f of fs.readdirSync(secDir).filter((f) => f.endsWith(".json"))) {
      const page = f.replace(/\.json$/, "");
      const obj = JSON.parse(fs.readFileSync(path.join(secDir, f), "utf8"));
      for (const [key, s] of Object.entries<any>(obj)) {
        const mediaIds = (s.media || []).map((m: any) => upsertMedia(db, m));
        db.prepare("INSERT OR REPLACE INTO sections (page, key, heading, body, data, media_ids) VALUES (?,?,?,?,?,?)").run(page, key, s.heading || "", s.body || "", JSON.stringify(s.data || {}), JSON.stringify(mediaIds));
      }
    }
    // Any other media the static page markup uses (so the admin media library lists them too).
    for (const m of readSeed("media-index.json") || []) {
      const exists = db.prepare("SELECT 1 FROM media WHERE id = ?").get(m.id);
      if (!exists) db.prepare("INSERT INTO media (id, kind, url, width, height) VALUES (?,?,?,?,?)").run(m.id, m.kind, m.file, m.w ?? null, m.h ?? null);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/** Insert page sections from data/seed/sections/*.json that are not in the DB yet (never overwrites admin edits). */
export function syncSections(db: DatabaseSync = getDb()) {
  const secDir = path.join(SEED_DIR, "sections");
  if (!fs.existsSync(secDir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(secDir).filter((f) => f.endsWith(".json"))) {
    const page = f.replace(/\.json$/, "");
    const obj = JSON.parse(fs.readFileSync(path.join(secDir, f), "utf8"));
    for (const [key, s] of Object.entries<any>(obj)) {
      if (db.prepare("SELECT 1 FROM sections WHERE page = ? AND key = ?").get(page, key)) continue;
      const mediaIds = (s.media || []).map((m: any) => upsertMedia(db, m));
      db.prepare("INSERT INTO sections (page, key, heading, body, data, media_ids) VALUES (?,?,?,?,?,?)").run(page, key, s.heading || "", s.body || "", JSON.stringify(s.data || {}), JSON.stringify(mediaIds));
      n++;
    }
  }
  return n;
}

/** Drop everything and re-seed (used by scripts/seed.ts --reset). */
export function resetDb() {
  const db = getDb();
  for (const t of ["settings", "media", "breeds", "origins", "collections", "puppies", "puppy_media", "puppy_breeds", "puppy_collections", "happy_photos", "faqs", "testimonials", "sections"]) db.exec(`DELETE FROM ${t}`);
  seed(db);
}

/* --------------------------------- mappers -------------------------------- */

const mediaCache = () => new Map<string, Media | null>();

export function getMedia(id: string | null | undefined, cache = mediaCache()): Media | null {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id)!;
  const r: any = getDb().prepare("SELECT * FROM media WHERE id = ?").get(id);
  const m: Media | null = r
    ? {
        id: r.id, url: r.url, kind: r.kind, width: r.width, height: r.height, alt: r.alt || "", caption: r.caption || "",
        focalX: r.focal_x ?? 0.5, focalY: r.focal_y ?? 0.5, color: r.color || "#f2be6b", blurDataUrl: r.blur_data_url ?? null,
        durationS: r.duration_s ?? null, poster: r.poster_id ? getMedia(r.poster_id, cache) : null,
      }
    : null;
  cache.set(id, m);
  return m;
}

function rowToPuppy(r: any, cache = mediaCache()): Puppy {
  const db = getDb();
  const media = (db.prepare("SELECT media_id FROM puppy_media WHERE puppy_id = ? ORDER BY sort_order").all(r.id) as any[]).map((x) => getMedia(x.media_id, cache)).filter(Boolean) as Media[];
  const breeds = db.prepare("SELECT b.slug, b.name FROM puppy_breeds pb JOIN breeds b ON b.slug = pb.breed_slug WHERE pb.puppy_id = ? ORDER BY b.sort_order").all(r.id) as Ref[];
  const collections = db.prepare("SELECT c.slug, c.name FROM puppy_collections pc JOIN collections c ON c.slug = pc.collection_slug WHERE pc.puppy_id = ? ORDER BY c.sort_order").all(r.id) as Ref[];
  const origin = r.origin_slug ? ((db.prepare("SELECT slug, name FROM origins WHERE slug = ?").get(r.origin_slug) as Ref) ?? null) : null;
  return {
    id: r.id, slug: r.slug, name: r.name || "", displayName: r.display_name, breed: r.breed || "", gender: r.gender, genderLabel: r.gender_label,
    age: r.age || "", colour: r.colour || "", description: r.description || "", records: JSON.parse(r.records || "[]"), status: r.status,
    featured: !!r.featured, seoDescription: r.seo_description || "", cover: getMedia(r.cover_id, cache) ?? media.find((m) => m.kind === "image") ?? null,
    media, origin: origin ? { slug: origin.slug, name: origin.name } : null, collections: collections.map((c) => ({ slug: c.slug, name: c.name })),
    breeds: breeds.map((b) => ({ slug: b.slug, name: b.name })), published: !!r.published, sortOrder: r.sort_order,
  };
}

/* ------------------------------- public reads ------------------------------ */

export function getSettings(): Settings {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as any[];
  return Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)])) as Settings;
}

export function whatsappHref(s: Settings = getSettings(), text?: string) {
  return `https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(text ?? s.whatsappMessage)}`;
}

export function listPuppies(opts: { status?: Puppy["status"] | Puppy["status"][]; includeUnpublished?: boolean } = {}): Puppy[] {
  const where: string[] = [];
  const args: any[] = [];
  if (!opts.includeUnpublished) where.push("published = 1");
  if (opts.status) {
    const st = Array.isArray(opts.status) ? opts.status : [opts.status];
    where.push(`status IN (${st.map(() => "?").join(",")})`);
    args.push(...st);
  }
  const rows = getDb().prepare(`SELECT * FROM puppies ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY sort_order, created_at`).all(...args) as any[];
  const cache = mediaCache();
  return rows.map((r) => rowToPuppy(r, cache));
}

export function getPuppy(slug: string, includeUnpublished = false): Puppy | null {
  const r = getDb().prepare(`SELECT * FROM puppies WHERE slug = ? ${includeUnpublished ? "" : "AND published = 1"}`).get(slug);
  return r ? rowToPuppy(r) : null;
}

export function getPuppyById(id: string): Puppy | null {
  const r = getDb().prepare("SELECT * FROM puppies WHERE id = ?").get(id);
  return r ? rowToPuppy(r) : null;
}

export const listBreeds = () => getDb().prepare("SELECT slug, name FROM breeds ORDER BY sort_order, name").all() as Ref[];
export const listOrigins = () => getDb().prepare("SELECT slug, name FROM origins ORDER BY sort_order").all() as Ref[];
export const listCollections = () => getDb().prepare("SELECT slug, name FROM collections ORDER BY sort_order").all() as Ref[];

export function listHappyPhotos(opts: { homeOnly?: boolean } = {}): HappyPhoto[] {
  const rows = getDb().prepare(`SELECT * FROM happy_photos ${opts.homeOnly ? "WHERE show_on_home = 1" : ""} ORDER BY sort_order`).all() as any[];
  const cache = mediaCache();
  return rows.map((r) => ({ ...(getMedia(r.media_id, cache) as Media), sortOrder: r.sort_order, showOnHome: !!r.show_on_home })).filter((x) => x.id);
}

export const listFaqs = (): Faq[] =>
  (getDb().prepare("SELECT * FROM faqs WHERE published = 1 ORDER BY sort_order").all() as any[]).map((r) => ({ id: r.id, question: r.question, answer: r.answer, sortOrder: r.sort_order }));

export const listTestimonials = (): Testimonial[] =>
  (getDb().prepare("SELECT * FROM testimonials WHERE published = 1 ORDER BY sort_order").all() as any[]).map((r) => ({ id: r.id, quote: r.quote, name: r.name, location: r.location, sortOrder: r.sort_order }));

/** Page copy. `fallback` is used (and returned) when the row does not exist yet. */
export function getSection(page: string, key: string, fallback?: Partial<Section>): Section {
  const r: any = getDb().prepare("SELECT * FROM sections WHERE page = ? AND key = ?").get(page, key);
  if (!r) return { page, key, heading: fallback?.heading ?? "", body: fallback?.body ?? "", data: fallback?.data ?? {}, media: fallback?.media ?? [] };
  const cache = mediaCache();
  return {
    page, key, heading: r.heading, body: r.body, data: JSON.parse(r.data || "{}"),
    media: (JSON.parse(r.media_ids || "[]") as string[]).map((id) => getMedia(id, cache)).filter(Boolean) as Media[],
  };
}

export function listSections(page?: string): Section[] {
  const rows = (page ? getDb().prepare("SELECT page, key FROM sections WHERE page = ? ORDER BY rowid").all(page) : getDb().prepare("SELECT page, key FROM sections ORDER BY page, rowid").all()) as any[];
  return rows.map((r) => getSection(r.page, r.key));
}

/* ------------------------------- enquiries -------------------------------- */

export function createEnquiry(e: Omit<Enquiry, "id" | "createdAt" | "status"> & { userAgent?: string }) {
  const id = uid();
  getDb().prepare("INSERT INTO enquiries (id, name, phone, email, area, message, puppy_id, source, user_agent) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(id, e.name, e.phone, e.email || "", e.area || "", e.message || "", e.puppyId || null, e.source, e.userAgent || "");
  return id;
}
