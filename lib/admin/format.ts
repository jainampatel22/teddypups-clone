import type { Media } from "@/lib/types";

export function thumbUrlServer(m: Media | null | undefined) {
  const img = m?.kind === "video" ? m.poster : m;
  return img ? img.url.replace(/\.webp$/, "-640.webp") : "";
}

/** SQLite datetime('now') is UTC "YYYY-MM-DD HH:MM:SS". Shown in Dubai time (site is UAE-based). */
export function fmtDate(s: string, withTime = true) {
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
  if (isNaN(+d)) return s;
  return d.toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
}

export const STATUS_LABEL: Record<string, string> = { available: "Available", reserved: "Reserved", home: "Gone home" };

/** node:sqlite rows have a null prototype; React can't pass those to client components. */
export const plain = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
