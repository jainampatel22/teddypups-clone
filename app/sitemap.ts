import type { MetadataRoute } from "next";
import { listPuppies } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.SITE_URL || "http://localhost:3077").replace(/\/$/, "");
  const pages = ["/", "/puppies", "/gone-home", "/happy-families", "/how-it-works", "/faq", "/contact"].map((p) => ({ url: base + (p === "/" ? "/" : p) }));
  const pups = listPuppies().map((p) => ({
    url: `${base}/puppies/${p.slug}`,
    images: p.cover ? [base + (p.cover.kind === "video" && p.cover.poster ? p.cover.poster.url : p.cover.url)] : undefined,
  }));
  return [...pages, ...pups];
}
