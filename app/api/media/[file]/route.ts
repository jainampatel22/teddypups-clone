import fs from "node:fs";
import path from "node:path";
import { MEDIA_DIR } from "@/lib/admin/repo";

export const runtime = "nodejs";

/**
 * Serves files from public/media. `next start` only serves public/ files that existed at build time,
 * so admin uploads made after a production build are served through this route
 * (wire it with a fallback rewrite: /media/:file -> /api/media/:file).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[A-Za-z0-9_-]+(-640)?\.(webp|mp4)$/.test(file)) return new Response("Not found", { status: 404 });
  const p = path.join(MEDIA_DIR, file);
  if (!fs.existsSync(p)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(p), {
    headers: { "content-type": file.endsWith(".mp4") ? "video/mp4" : "image/webp", "cache-control": "public, max-age=31536000, immutable" },
  });
}
