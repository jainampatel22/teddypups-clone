import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getDb, getMedia, uid, getPuppyById } from "@/lib/db";
import type { Media, Settings } from "@/lib/types";

const db = () => getDb();
// Uploads go to public/media locally; on serverless hosts set MEDIA_DIR to a writable path (e.g. /tmp/media).
export const MEDIA_DIR: string = process.env.MEDIA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "media");

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "puppy";

export function uniquePuppySlug(base: string, exceptId?: string) {
  let slug = slugify(base);
  let i = 1;
  while (db().prepare("SELECT 1 FROM puppies WHERE slug = ? AND id <> ?").get(slug, exceptId ?? "")) slug = `${slugify(base)}-${i++}`;
  return slug;
}

/* ---------------------------------- puppies ---------------------------------- */

export type PuppyInput = {
  id?: string;
  slug?: string;
  name: string;
  displayName: string;
  breed: string;
  gender: "male" | "female" | "male-female";
  genderLabel: string;
  age: string;
  colour: string;
  description: string;
  records: { label: string; value: string }[];
  status: "available" | "reserved" | "home";
  featured: boolean;
  published: boolean;
  seoDescription: string;
  originSlug: string | null;
  breeds: string[];
  collections: string[];
  mediaIds: string[];
  coverId: string | null;
};

export function savePuppy(p: PuppyInput): { id: string; slug: string } {
  const d = db();
  const id = p.id || uid();
  const existing: any = p.id ? d.prepare("SELECT slug FROM puppies WHERE id = ?").get(p.id) : null;
  const slug = uniquePuppySlug(p.slug?.trim() || existing?.slug || p.name || p.displayName || p.breed, id);
  const displayName = p.displayName?.trim() || p.name?.trim() || p.breed?.trim() || "Puppy";
  const coverId = p.coverId && p.mediaIds.includes(p.coverId) ? p.coverId : p.mediaIds.find((m) => getMedia(m)?.kind === "image") ?? p.mediaIds[0] ?? null;
  d.exec("BEGIN");
  try {
    if (existing) {
      d.prepare(`UPDATE puppies SET slug=?, name=?, display_name=?, breed=?, gender=?, gender_label=?, age=?, colour=?, description=?, records=?, status=?, featured=?, seo_description=?, cover_id=?, origin_slug=?, published=?, updated_at=datetime('now') WHERE id=?`)
        .run(slug, p.name.trim(), displayName, p.breed.trim(), p.gender, p.genderLabel.trim(), p.age.trim(), p.colour.trim(), p.description, JSON.stringify(p.records.filter((r) => r.label || r.value)), p.status, p.featured ? 1 : 0, p.seoDescription.trim(), coverId, p.originSlug || null, p.published ? 1 : 0, id);
    } else {
      const minOrder = (d.prepare("SELECT COALESCE(MIN(sort_order), 1) - 1 AS v FROM puppies WHERE status = ?").get(p.status) as any).v;
      d.prepare(`INSERT INTO puppies (id, slug, name, display_name, breed, gender, gender_label, age, colour, description, records, status, featured, seo_description, cover_id, origin_slug, published, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(id, slug, p.name.trim(), displayName, p.breed.trim(), p.gender, p.genderLabel.trim(), p.age.trim(), p.colour.trim(), p.description, JSON.stringify(p.records.filter((r) => r.label || r.value)), p.status, p.featured ? 1 : 0, p.seoDescription.trim(), coverId, p.originSlug || null, p.published ? 1 : 0, minOrder);
    }
    d.prepare("DELETE FROM puppy_media WHERE puppy_id = ?").run(id);
    p.mediaIds.forEach((m, i) => d.prepare("INSERT OR IGNORE INTO puppy_media (puppy_id, media_id, sort_order) VALUES (?,?,?)").run(id, m, i));
    d.prepare("DELETE FROM puppy_breeds WHERE puppy_id = ?").run(id);
    p.breeds.forEach((b) => d.prepare("INSERT OR IGNORE INTO puppy_breeds VALUES (?,?)").run(id, b));
    d.prepare("DELETE FROM puppy_collections WHERE puppy_id = ?").run(id);
    p.collections.forEach((c) => d.prepare("INSERT OR IGNORE INTO puppy_collections VALUES (?,?)").run(id, c));
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
  return { id, slug };
}

export function deletePuppy(id: string) {
  const d = db();
  const mediaIds = (d.prepare("SELECT media_id FROM puppy_media WHERE puppy_id = ?").all(id) as any[]).map((r) => r.media_id);
  d.prepare("DELETE FROM puppy_media WHERE puppy_id = ?").run(id);
  d.prepare("DELETE FROM puppy_breeds WHERE puppy_id = ?").run(id);
  d.prepare("DELETE FROM puppy_collections WHERE puppy_id = ?").run(id);
  d.prepare("UPDATE enquiries SET puppy_id = NULL WHERE puppy_id = ?").run(id);
  d.prepare("DELETE FROM puppies WHERE id = ?").run(id);
  return mediaIds;
}

export function setPuppyField(id: string, field: "published" | "status" | "featured", value: any) {
  const col = { published: "published", status: "status", featured: "featured" }[field];
  db().prepare(`UPDATE puppies SET ${col} = ?, updated_at = datetime('now') WHERE id = ?`).run(typeof value === "boolean" ? (value ? 1 : 0) : value, id);
}

/** Persist an explicit order of ids into a table's sort_order column. */
export function reorder(table: "puppies" | "faqs" | "testimonials" | "happy_photos" | "breeds" | "origins" | "collections", ids: string[]) {
  const key = { puppies: "id", faqs: "id", testimonials: "id", happy_photos: "media_id", breeds: "slug", origins: "slug", collections: "slug" }[table];
  const d = db();
  d.exec("BEGIN");
  ids.forEach((id, i) => d.prepare(`UPDATE ${table} SET sort_order = ? WHERE ${key} = ?`).run(i, id));
  d.exec("COMMIT");
}

/* ---------------------------------- media ---------------------------------- */

export type MediaUsage = { type: "puppy" | "happy" | "section" | "poster" | "settings"; label: string; href: string };

export function mediaUsage(): Map<string, MediaUsage[]> {
  const d = db();
  const map = new Map<string, MediaUsage[]>();
  const add = (id: string, u: MediaUsage) => (map.get(id) ?? map.set(id, []).get(id)!).push(u);
  for (const r of d.prepare("SELECT pm.media_id, p.id, p.display_name FROM puppy_media pm JOIN puppies p ON p.id = pm.puppy_id").all() as any[]) add(r.media_id, { type: "puppy", label: r.display_name, href: `/admin/puppies/${r.id}` });
  for (const r of d.prepare("SELECT id, display_name, cover_id FROM puppies WHERE cover_id IS NOT NULL").all() as any[]) if (!(map.get(r.cover_id) || []).some((u) => u.href.endsWith(r.id))) add(r.cover_id, { type: "puppy", label: r.display_name + " (cover)", href: `/admin/puppies/${r.id}` });
  for (const r of d.prepare("SELECT media_id FROM happy_photos").all() as any[]) add(r.media_id, { type: "happy", label: "Happy families", href: "/admin/families" });
  for (const r of d.prepare("SELECT page, key, media_ids, data FROM sections").all() as any[]) {
    const ids = new Set<string>(JSON.parse(r.media_ids || "[]"));
    const dataStr = r.data || "";
    for (const m of dataStr.matchAll(/"([A-Za-z0-9_-]{12})"/g)) if (d.prepare("SELECT 1 FROM media WHERE id = ?").get(m[1])) ids.add(m[1]);
    for (const id of ids) add(id, { type: "section", label: `${r.page} / ${r.key}`, href: `/admin/sections/${encodeURIComponent(r.page)}/${encodeURIComponent(r.key)}` });
  }
  for (const r of d.prepare("SELECT id, poster_id FROM media WHERE poster_id IS NOT NULL").all() as any[]) add(r.poster_id, { type: "poster", label: "Video poster", href: `/admin/media?focus=${r.id}` });
  return map;
}

/** Media ids that the static page markup references (seeded media-index without other usage) are reported as "page artwork". */
export function listAllMedia(): (Media & { createdAt: string })[] {
  const rows = db().prepare("SELECT id, created_at FROM media ORDER BY created_at DESC, rowid DESC").all() as any[];
  return rows.map((r) => ({ ...(getMedia(r.id) as Media), createdAt: r.created_at }));
}

export function insertMedia(m: { id: string; kind: "image" | "video"; url: string; width: number; height: number; alt?: string; caption?: string; color?: string; blurDataUrl?: string | null; durationS?: number | null; posterId?: string | null }) {
  db().prepare(`INSERT INTO media (id, kind, url, width, height, alt, caption, focal_x, focal_y, color, blur_data_url, duration_s, poster_id) VALUES (?,?,?,?,?,?,?,0.5,0.5,?,?,?,?)`)
    .run(m.id, m.kind, m.url, m.width, m.height, m.alt || "", m.caption || "", m.color || "#f2be6b", m.blurDataUrl ?? null, m.durationS ?? null, m.posterId ?? null);
}

export function updateMedia(id: string, f: { alt?: string; caption?: string; focalX?: number; focalY?: number }) {
  const cur = getMedia(id);
  if (!cur) return;
  const clamp = (v: number) => Math.min(1, Math.max(0, Math.round(v * 1000) / 1000));
  db().prepare("UPDATE media SET alt = ?, caption = ?, focal_x = ?, focal_y = ? WHERE id = ?")
    .run(f.alt ?? cur.alt, f.caption ?? cur.caption, clamp(f.focalX ?? cur.focalX), clamp(f.focalY ?? cur.focalY), id);
}

/** Static page artwork referenced from component markup (seed media-index) must not be deleted. */
function staticArtworkIds(): Set<string> {
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "seed", "media-index.json"), "utf8")) as { id: string }[];
    const used = new Set<string>();
    const d = db();
    for (const m of idx) {
      const inDb = d.prepare("SELECT 1 FROM puppy_media WHERE media_id = ? UNION SELECT 1 FROM happy_photos WHERE media_id = ? UNION SELECT 1 FROM puppies WHERE cover_id = ?").get(m.id, m.id, m.id);
      if (!inDb) used.add(m.id);
    }
    return used;
  } catch {
    return new Set();
  }
}

export function isStaticArtwork(id: string) {
  return staticArtworkIds().has(id);
}

export function deleteMediaIfUnused(id: string): string | null {
  const usage = mediaUsage().get(id);
  if (usage?.length) return `In use: ${usage.map((u) => u.label).join(", ")}`;
  if (isStaticArtwork(id)) return "This file is used by page artwork (seeded site markup) and can't be deleted.";
  const m: any = db().prepare("SELECT * FROM media WHERE id = ?").get(id);
  if (!m) return null;
  db().prepare("DELETE FROM media WHERE id = ?").run(id);
  for (const f of [`${id}.webp`, `${id}-640.webp`, `${id}.mp4`]) fs.rmSync(path.join(/*turbopackIgnore: true*/ MEDIA_DIR, f), { force: true });
  if (m.poster_id) deleteMediaIfUnused(m.poster_id);
  return null;
}

/* ------------------------------- happy photos ------------------------------- */

export function addHappyPhotos(ids: string[]) {
  const d = db();
  const max = (d.prepare("SELECT COALESCE(MAX(sort_order), -1) AS v FROM happy_photos").get() as any).v;
  ids.forEach((id, i) => d.prepare("INSERT OR IGNORE INTO happy_photos (media_id, show_on_home, sort_order) VALUES (?,0,?)").run(id, max + 1 + i));
}
export const setHappyHome = (id: string, on: boolean) => db().prepare("UPDATE happy_photos SET show_on_home = ? WHERE media_id = ?").run(on ? 1 : 0, id);
export const removeHappy = (id: string) => db().prepare("DELETE FROM happy_photos WHERE media_id = ?").run(id);

/* ------------------------------- faqs / testimonials ------------------------------- */

export function saveFaq(f: { id?: string; question: string; answer: string; published: boolean }) {
  const d = db();
  if (f.id) d.prepare("UPDATE faqs SET question = ?, answer = ?, published = ? WHERE id = ?").run(f.question, f.answer, f.published ? 1 : 0, f.id);
  else {
    const max = (d.prepare("SELECT COALESCE(MAX(sort_order), -1) AS v FROM faqs").get() as any).v;
    d.prepare("INSERT INTO faqs (id, question, answer, sort_order, published) VALUES (?,?,?,?,?)").run(uid(), f.question, f.answer, max + 1, f.published ? 1 : 0);
  }
}
export const deleteFaq = (id: string) => db().prepare("DELETE FROM faqs WHERE id = ?").run(id);
export const allFaqs = () => (db().prepare("SELECT * FROM faqs ORDER BY sort_order").all() as any[]).map((r) => ({ id: r.id, question: r.question, answer: r.answer, published: !!r.published }));

export function saveTestimonial(t: { id?: string; quote: string; name: string; location: string; published: boolean }) {
  const d = db();
  if (t.id) d.prepare("UPDATE testimonials SET quote = ?, name = ?, location = ?, published = ? WHERE id = ?").run(t.quote, t.name, t.location, t.published ? 1 : 0, t.id);
  else {
    const max = (d.prepare("SELECT COALESCE(MAX(sort_order), -1) AS v FROM testimonials").get() as any).v;
    d.prepare("INSERT INTO testimonials (id, quote, name, location, sort_order, published) VALUES (?,?,?,?,?,?)").run(uid(), t.quote, t.name, t.location, max + 1, t.published ? 1 : 0);
  }
}
export const deleteTestimonial = (id: string) => db().prepare("DELETE FROM testimonials WHERE id = ?").run(id);
export const allTestimonials = () => (db().prepare("SELECT * FROM testimonials ORDER BY sort_order").all() as any[]).map((r) => ({ id: r.id, quote: r.quote, name: r.name, location: r.location, published: !!r.published }));

/* ------------------------------- taxonomy ------------------------------- */

export type TaxTable = "breeds" | "origins" | "collections";
const TAX_REF: Record<TaxTable, { join: string; col: string } | null> = {
  breeds: { join: "puppy_breeds", col: "breed_slug" },
  collections: { join: "puppy_collections", col: "collection_slug" },
  origins: null,
};

export function taxonomyWithCounts(table: TaxTable) {
  const ref = TAX_REF[table];
  const rows = db().prepare(`SELECT slug, name FROM ${table} ORDER BY sort_order, name`).all() as any[];
  return rows.map((r) => ({
    slug: r.slug, name: r.name,
    count: ref ? (db().prepare(`SELECT COUNT(*) n FROM ${ref.join} WHERE ${ref.col} = ?`).get(r.slug) as any).n : (db().prepare("SELECT COUNT(*) n FROM puppies WHERE origin_slug = ?").get(r.slug) as any).n,
  }));
}

export function saveTaxonomy(table: TaxTable, oldSlug: string | null, name: string, slug: string) {
  const d = db();
  const s = slugify(slug || name);
  if (!name.trim()) return "Name is required.";
  if (d.prepare(`SELECT 1 FROM ${table} WHERE slug = ? AND slug <> ?`).get(s, oldSlug ?? "")) return `"${s}" already exists.`;
  if (!oldSlug) {
    const max = (d.prepare(`SELECT COALESCE(MAX(sort_order), -1) v FROM ${table}`).get() as any).v;
    d.prepare(`INSERT INTO ${table} (slug, name, sort_order) VALUES (?,?,?)`).run(s, name.trim(), max + 1);
    return null;
  }
  d.exec("BEGIN");
  d.prepare(`UPDATE ${table} SET slug = ?, name = ? WHERE slug = ?`).run(s, name.trim(), oldSlug);
  const ref = TAX_REF[table];
  if (ref) d.prepare(`UPDATE ${ref.join} SET ${ref.col} = ? WHERE ${ref.col} = ?`).run(s, oldSlug);
  else d.prepare("UPDATE puppies SET origin_slug = ? WHERE origin_slug = ?").run(s, oldSlug);
  d.exec("COMMIT");
  return null;
}

export function deleteTaxonomy(table: TaxTable, slug: string) {
  const ref = TAX_REF[table];
  if (ref) db().prepare(`DELETE FROM ${ref.join} WHERE ${ref.col} = ?`).run(slug);
  else db().prepare("UPDATE puppies SET origin_slug = NULL WHERE origin_slug = ?").run(slug);
  db().prepare(`DELETE FROM ${table} WHERE slug = ?`).run(slug);
}

/* ------------------------------- sections / settings ------------------------------- */

export function saveSection(page: string, key: string, s: { heading: string; body: string; data: any; mediaIds: string[] }) {
  db().prepare(`INSERT INTO sections (page, key, heading, body, data, media_ids) VALUES (?,?,?,?,?,?)
    ON CONFLICT(page, key) DO UPDATE SET heading = excluded.heading, body = excluded.body, data = excluded.data, media_ids = excluded.media_ids`)
    .run(page, key, s.heading, s.body, JSON.stringify(s.data ?? {}), JSON.stringify(s.mediaIds));
}

export function saveSettings(s: Partial<Settings>) {
  const d = db();
  d.exec("BEGIN");
  for (const [k, v] of Object.entries(s)) d.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(k, JSON.stringify(v));
  d.exec("COMMIT");
}

/* ------------------------------- enquiries ------------------------------- */

export type EnquiryRow = { id: string; createdAt: string; name: string; phone: string; email: string; area: string; message: string; puppyId: string | null; puppyName: string | null; puppySlug: string | null; source: string; status: "new" | "read" | "archived"; userAgent: string };

export function listEnquiries(opts: { status?: string; q?: string } = {}): EnquiryRow[] {
  const where: string[] = [];
  const args: any[] = [];
  if (opts.status && opts.status !== "all") { where.push("e.status = ?"); args.push(opts.status); }
  if (opts.q) { where.push("(e.name LIKE ? OR e.phone LIKE ? OR e.email LIKE ? OR e.message LIKE ?)"); args.push(...Array(4).fill(`%${opts.q}%`)); }
  const rows = db().prepare(`SELECT e.*, p.display_name AS puppy_name, p.slug AS puppy_slug FROM enquiries e LEFT JOIN puppies p ON p.id = e.puppy_id ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY e.created_at DESC, e.rowid DESC`).all(...args) as any[];
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at, name: r.name, phone: r.phone, email: r.email, area: r.area, message: r.message, puppyId: r.puppy_id, puppyName: r.puppy_name, puppySlug: r.puppy_slug, source: r.source, status: r.status, userAgent: r.user_agent }));
}

export const getEnquiry = (id: string) => listEnquiries().find((e) => e.id === id) ?? null;
export const setEnquiryStatus = (id: string, status: "new" | "read" | "archived") => db().prepare("UPDATE enquiries SET status = ? WHERE id = ?").run(status, id);
export const deleteEnquiry = (id: string) => db().prepare("DELETE FROM enquiries WHERE id = ?").run(id);

export function dashboardCounts() {
  const c = (sql: string) => (db().prepare(sql).get() as any).n as number;
  return {
    available: c("SELECT COUNT(*) n FROM puppies WHERE status = 'available' AND published = 1"),
    reserved: c("SELECT COUNT(*) n FROM puppies WHERE status = 'reserved'"),
    home: c("SELECT COUNT(*) n FROM puppies WHERE status = 'home'"),
    drafts: c("SELECT COUNT(*) n FROM puppies WHERE published = 0"),
    newEnquiries: c("SELECT COUNT(*) n FROM enquiries WHERE status = 'new'"),
    enquiries: c("SELECT COUNT(*) n FROM enquiries"),
    happy: c("SELECT COUNT(*) n FROM happy_photos"),
    media: c("SELECT COUNT(*) n FROM media"),
  };
}

export { getPuppyById };
