// Every uploaded/seeded image is stored as WebP: /media/<id>.webp (max 1920px wide)
// plus /media/<id>-640.webp. The loader picks the small file for small widths.
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("data:") || src.startsWith("http")) return src;
  if (/^\/media\/[^/]+\.webp$/.test(src)) {
    return `${width <= 640 ? src.replace(/\.webp$/, "-640.webp") : src}?w=${width}`;
  }
  return `${src}?w=${width}`;
}
