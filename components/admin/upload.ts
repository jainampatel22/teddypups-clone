"use client";
import type { Media } from "@/lib/types";

export const MAX_UPLOAD = 25 * 1024 * 1024;
const QUALITY = 0.82;

export function thumbUrl(m: Media | null | undefined): string {
  if (!m) return "";
  const img = m.kind === "video" ? m.poster : m;
  if (!img) return "";
  return img.url.replace(/\.webp$/, "-640.webp");
}

type Drawable = ImageBitmap | HTMLVideoElement;

function makeCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

async function toWebp(src: Drawable, srcW: number, srcH: number, maxW: number, quality = QUALITY): Promise<{ blob: Blob; w: number; h: number }> {
  const scale = Math.min(1, maxW / srcW);
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src as any, 0, 0, w, h);
  let blob: Blob | null;
  if ("convertToBlob" in c) blob = await (c as OffscreenCanvas).convertToBlob({ type: "image/webp", quality });
  else blob = await new Promise<Blob | null>((r) => (c as HTMLCanvasElement).toBlob(r, "image/webp", quality));
  if (!blob || blob.type !== "image/webp") throw new Error("This browser can't encode WebP. Use Chrome, Edge or Firefox.");
  return { blob, w, h };
}

const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(b); });

/** Tiny blur placeholder (16px wide WebP data URL) + average colour as #rrggbb. */
async function blurAndColor(src: Drawable, srcW: number, srcH: number) {
  const w = 16;
  const h = Math.max(1, Math.round((srcH / srcW) * 16));
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.drawImage(src as any, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; }
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
  const color = `#${hex(r)}${hex(g)}${hex(b)}`;
  let blob: Blob | null;
  if ("convertToBlob" in c) blob = await (c as OffscreenCanvas).convertToBlob({ type: "image/webp", quality: 0.5 });
  else blob = await new Promise<Blob | null>((res) => (c as HTMLCanvasElement).toBlob(res, "image/webp", 0.5));
  return { color, blurDataUrl: blob ? await blobToDataUrl(blob) : null };
}

async function encodeAll(src: Drawable, w: number, h: number) {
  const main = await toWebp(src, w, h, 1920);
  const small = await toWebp(src, w, h, 640);
  const { color, blurDataUrl } = await blurAndColor(src, w, h);
  return { main: main.blob, small: small.blob, meta: { width: main.w, height: main.h, color, blurDataUrl } };
}

export async function convertImage(file: File) {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as any);
  } catch {
    throw new Error(`Can't read "${file.name}". Use JPG, PNG, WebP, AVIF or GIF.`);
  }
  try {
    return await encodeAll(bmp, bmp.width, bmp.height);
  } finally {
    bmp.close();
  }
}

/** Grab a poster frame (~0.5s in) from an MP4 and encode it as WebP. */
export async function videoPoster(file: File) {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = url;
  try {
    await new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(new Error(`Can't play "${file.name}". Use an H.264 MP4.`)); });
    const t = Math.min(0.5, (v.duration || 1) / 2);
    await new Promise<void>((res) => { v.onseeked = () => res(); v.currentTime = t; });
    const enc = await encodeAll(v, v.videoWidth, v.videoHeight);
    return { ...enc, duration: v.duration, width: v.videoWidth, height: v.videoHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function checkFile(file: File): string | null {
  if (file.size > MAX_UPLOAD) return `"${file.name}" is over 25 MB.`;
  if (file.type.startsWith("image/")) return null;
  if (file.type === "video/mp4" || /\.(mp4|m4v)$/i.test(file.name)) return null;
  return `"${file.name}" isn't an image or MP4 video.`;
}

async function post(form: FormData): Promise<Media> {
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Your session expired. Sign in again.");
  if (!res.ok) throw new Error(json.error || `Upload failed (${res.status}).`);
  return json.media as Media;
}

export async function uploadOne(file: File, alt = ""): Promise<Media> {
  const err = checkFile(file);
  if (err) throw new Error(err);
  const form = new FormData();
  if (file.type.startsWith("image/")) {
    const { main, small, meta } = await convertImage(file);
    form.set("kind", "image");
    form.set("file", main, "image.webp");
    form.set("small", small, "image-640.webp");
    form.set("meta", JSON.stringify({ ...meta, alt }));
  } else {
    const p = await videoPoster(file);
    form.set("kind", "video");
    form.set("file", file, "video.mp4");
    form.set("meta", JSON.stringify({ width: p.width, height: p.height, color: p.meta.color, alt, durationS: p.duration }));
    form.set("poster", p.main, "poster.webp");
    form.set("posterSmall", p.small, "poster-640.webp");
    form.set("posterMeta", JSON.stringify({ ...p.meta, alt }));
  }
  return post(form);
}

export type UploadProgress = { name: string; state: "converting" | "done" | "error"; error?: string };

/** Uploads files one by one (conversion is CPU heavy), reporting progress. Returns the uploaded media. */
export async function uploadMany(files: File[], onProgress?: (p: UploadProgress[]) => void, alt = ""): Promise<{ media: Media[]; errors: string[] }> {
  const prog: UploadProgress[] = files.map((f) => ({ name: f.name, state: "converting" }));
  onProgress?.([...prog]);
  const media: Media[] = [];
  const errors: string[] = [];
  for (let i = 0; i < files.length; i++) {
    try {
      media.push(await uploadOne(files[i], alt));
      prog[i] = { name: files[i].name, state: "done" };
    } catch (e: any) {
      prog[i] = { name: files[i].name, state: "error", error: e.message };
      errors.push(e.message);
    }
    onProgress?.([...prog]);
  }
  return { media, errors };
}
