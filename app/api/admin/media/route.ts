import fs from "node:fs";
import path from "node:path";
import { adminOr401 } from "@/lib/admin/auth";
import { insertMedia, MEDIA_DIR } from "@/lib/admin/repo";
import { getMedia, shortId } from "@/lib/db";

export const runtime = "nodejs";
const MAX = 25 * 1024 * 1024;

const isWebp = (b: Buffer) => b.length > 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP";
const isMp4 = (b: Buffer) => b.length > 12 && b.toString("latin1", 4, 8) === "ftyp";

async function buf(f: FormDataEntryValue | null): Promise<Buffer | null> {
  if (!f || typeof f === "string") return null;
  if (f.size > MAX) throw new Error(`File too large (max 25 MB).`);
  return Buffer.from(await f.arrayBuffer());
}

function parseMeta(v: FormDataEntryValue | null) {
  try {
    const m = JSON.parse(String(v || "{}"));
    return {
      width: Math.max(1, Math.round(+m.width || 1)), height: Math.max(1, Math.round(+m.height || 1)),
      color: /^#[0-9a-f]{6}$/i.test(m.color) ? m.color : "#f2be6b",
      blurDataUrl: typeof m.blurDataUrl === "string" && m.blurDataUrl.startsWith("data:image/webp;base64,") && m.blurDataUrl.length < 4000 ? m.blurDataUrl : null,
      alt: String(m.alt || "").slice(0, 300), caption: String(m.caption || "").slice(0, 300),
      durationS: m.durationS ? Math.round(+m.durationS * 100) / 100 : null,
    };
  } catch { return null; }
}

function writeImage(main: Buffer, small: Buffer, meta: NonNullable<ReturnType<typeof parseMeta>>, alt: string) {
  if (!isWebp(main) || !isWebp(small)) throw new Error("Images must be converted to WebP before upload.");
  const id = shortId();
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.writeFileSync(path.join(MEDIA_DIR, `${id}.webp`), main);
  fs.writeFileSync(path.join(MEDIA_DIR, `${id}-640.webp`), small);
  insertMedia({ id, kind: "image", url: `/media/${id}.webp`, width: meta.width, height: meta.height, alt, caption: meta.caption, color: meta.color, blurDataUrl: meta.blurDataUrl });
  return id;
}

/** POST multipart: kind=image|video, file, small, meta (JSON); for video also poster, posterSmall, posterMeta. */
export async function POST(req: Request) {
  const auth = await adminOr401();
  if (auth instanceof Response) return auth;
  try {
    const len = +(req.headers.get("content-length") || 0);
    if (len > MAX * 2 + 1_000_000) return Response.json({ error: "Upload too large (max 25 MB per file)." }, { status: 413 });
    const form = await req.formData();
    const kind = String(form.get("kind"));
    const meta = parseMeta(form.get("meta"));
    if (!meta) return Response.json({ error: "Bad metadata." }, { status: 400 });

    if (kind === "image") {
      const main = await buf(form.get("file"));
      const small = await buf(form.get("small"));
      if (!main || !small) return Response.json({ error: "Missing file." }, { status: 400 });
      const id = writeImage(main, small, meta, meta.alt);
      return Response.json({ media: getMedia(id) });
    }

    if (kind === "video") {
      const file = await buf(form.get("file"));
      if (!file || !isMp4(file)) return Response.json({ error: "Videos must be MP4 (H.264) files." }, { status: 400 });
      const poster = await buf(form.get("poster"));
      const posterSmall = await buf(form.get("posterSmall"));
      const pmeta = parseMeta(form.get("posterMeta"));
      const posterId = poster && posterSmall && pmeta ? writeImage(poster, posterSmall, pmeta, meta.alt) : null;
      const id = shortId();
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
      fs.writeFileSync(path.join(MEDIA_DIR, `${id}.mp4`), file);
      insertMedia({ id, kind: "video", url: `/media/${id}.mp4`, width: meta.width, height: meta.height, alt: meta.alt, caption: meta.caption, color: pmeta?.color || meta.color, blurDataUrl: null, durationS: meta.durationS, posterId });
      return Response.json({ media: getMedia(id) });
    }
    return Response.json({ error: "Only images and videos can be uploaded." }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e?.message || "Upload failed." }, { status: 400 });
  }
}
