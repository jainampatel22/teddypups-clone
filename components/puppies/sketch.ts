// Deterministic hand-drawn sketch geometry for a puppy card, seeded by slug.
// Ported 1:1 from the original PuppyBrowser chunk so every card's mask/outline/doodles match exactly.

export const PAW_PATH =
  "M32 30.5c-7.6 0-15.6 8.3-15.6 15.5 0 5.4 4.2 8.3 9.2 8.3 2.6 0 4.5-1.1 6.4-1.1s3.8 1.1 6.4 1.1c5 0 9.2-2.9 9.2-8.3 0-7.2-8-15.5-15.6-15.5zM19.28 26.71C21.07 30.08 20.42 33.92 17.84 35.29C15.25 36.67 11.71 35.05 9.92 31.69C8.13 28.32 8.78 24.48 11.36 23.11C13.95 21.73 17.49 23.35 19.28 26.71ZM29.62 15.64C30.32 19.62 28.46 23.26 25.47 23.79C22.48 24.32 19.48 21.53 18.78 17.56C18.08 13.58 19.94 9.94 22.93 9.41C25.92 8.88 28.92 11.67 29.62 15.64ZM45.22 17.56C44.52 21.53 41.52 24.32 38.53 23.79C35.54 23.26 33.68 19.62 34.38 15.64C35.08 11.67 38.08 8.88 41.07 9.41C44.06 9.94 45.92 13.58 45.22 17.56ZM54.08 31.69C52.29 35.05 48.75 36.67 46.16 35.29C43.58 33.92 42.93 30.08 44.72 26.71C46.51 23.35 50.05 21.73 52.64 23.11C55.22 24.48 55.87 28.32 54.08 31.69Z";

const f2 = (n: number) => n.toFixed(2);

type Pt = [number, number];

function blob(rnd: () => number, r: number, wob: number, n = 40, start = 0, span = 2 * Math.PI): Pt[] {
  const ph = [6.28 * rnd(), 6.28 * rnd(), 6.28 * rnd()];
  const squash = 1 + (rnd() - 0.5) * 0.05;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i / (span >= 2 * Math.PI ? n : n - 1)) * span;
    const rr = r + wob * (0.55 * Math.sin(2 * a + ph[0]) + 0.3 * Math.sin(3 * a + ph[1]) + 0.15 * Math.sin(5 * a + ph[2]));
    pts.push([50 + Math.cos(a) * rr * squash, 50 + (Math.sin(a) * rr) / squash]);
  }
  return pts;
}

function spline(p: Pt[], closed: boolean) {
  const n = p.length;
  const at = (i: number) => p[closed ? (i + n) % n : Math.min(n - 1, Math.max(0, i))];
  let d = `M${f2(p[0][0])} ${f2(p[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2);
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += `C${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(c[0])} ${f2(c[1])}`;
  }
  return closed ? `${d}Z` : d;
}

const WASHES = ["#f2be6b", "#f9cdbf", "#bfddf5", "#fbe3b4", "#e8c39a"];
const INKS = ["#c2622b", "#a24a1a", "#2a170e", "#d4893f"];
const KINDS = ["sparkle", "heart", "dashes", "swirl", "dots", "paw"] as const;
export type DoodleKind = (typeof KINDS)[number];
export type Doodle = { kind: DoodleKind; x: number; y: number; rot: number; size: number; ink: string };

function seeded(str: string) {
  let h = 0x811c9dc5;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 0x1000193);
  let s = h >>> 0;
  return () => {
    let t = (s = (s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

export function sketchFor(slug: string) {
  const rnd = seeded(slug);
  const mask = spline(blob(rnd, 45.5, 2.6), true);
  const outline = spline(blob(rnd, 47.8, 3.1), true);
  const start = rnd() * Math.PI * 2;
  const retrace = spline(blob(rnd, 49, 3.4, 30, start, Math.PI * (1.15 + 0.5 * rnd())), false);
  const wash = { d: spline(blob(rnd, 46.5, 3.6), true), dx: (rnd() - 0.5) * 9, dy: 3 + 4 * rnd(), color: WASHES[Math.floor(rnd() * WASHES.length)] };
  const tilt = (rnd() - 0.5) * 5;
  const zones = [[0.86, 1.08], [1.16, 1.42], [-0.08, 0.16]].map((z) => ({ z, k: rnd() })).sort((a, b) => a.k - b.k).map((x) => x.z);
  const count = 2 + Math.floor(2 * rnd());
  const doodles: Doodle[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let kind: DoodleKind = KINDS[Math.floor(rnd() * KINDS.length)];
    if (used.has(kind)) kind = KINDS.find((k) => !used.has(k))!;
    used.add(kind);
    const [lo, hi] = zones[i];
    const ang = Math.PI * (lo + rnd() * (hi - lo));
    const rad = 55 + 4 * rnd();
    doodles.push({ kind, x: 50 + Math.cos(ang) * rad, y: 50 + Math.sin(ang) * rad, rot: (rnd() - 0.5) * 50, size: 0.85 + 0.35 * rnd(), ink: INKS[Math.floor(rnd() * INKS.length)] });
  }
  return { mask, outline, retrace, wash, tilt, doodles };
}

export function maskUrl(d: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" fill="#000"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
