"use client";
// Port of the original Flight: the plane follows the dotted Korea -> Dubai route as the section scrolls
// (motion useScroll offset ["start 95%", "end 25%"]), banking along the curve. Reduced motion parks it at 62%.
import { useEffect, useId, useRef } from "react";

export default function Flight({ photo, label, from = "Korea", to = "Dubai" }: { photo?: string; label: string; from?: string; to?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const route = useRef<SVGPathElement>(null);
  const plane = useRef<SVGGElement>(null);
  const clip = useId();
  useEffect(() => {
    const place = (p: number) => {
      const path = route.current, g = plane.current;
      if (!path || !g) return;
      const len = path.getTotalLength();
      const at = Math.min(len, Math.max(0, p * len));
      const pt = path.getPointAtLength(at), a = path.getPointAtLength(Math.min(len, at + 1)), b = path.getPointAtLength(Math.max(0, at - 1));
      const deg = (180 * Math.atan2(a.y - b.y, a.x - b.x)) / Math.PI;
      g.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${deg.toFixed(1)})`);
      g.style.opacity = String(Math.min(1, Math.max(0, (p - 0.11) / 0.06)));
    };
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) { place(0.62); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect(), vh = innerHeight;
      const span = vh * 0.95 - vh * 0.25 + r.height;
      place(Math.min(1, Math.max(0, (vh * 0.95 - r.top) / span)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={box} className="tp-flight">
      <svg viewBox="0 0 660 300" role="img" aria-label={label}>
        <defs><clipPath id={clip}><circle r="25" /></clipPath></defs>
        <path ref={route} d="M40 250 C 170 40, 470 20, 620 168" className="tp-flight__route" />
        <circle cx="40" cy="250" r="7" className="tp-flight__dot" />
        <circle cx="620" cy="168" r="7" className="tp-flight__dot" />
        <text x="40" y="284" textAnchor="middle" className="tp-flight__label">{from}</text>
        <text x="620" y="202" textAnchor="middle" className="tp-flight__label">{to}</text>
        <g ref={plane} transform="translate(410 70)">
          <g transform="translate(-126 -78)">
            <path d="M28 60 L8 26 L34 26 L60 54 Z" className="tp-flight__wing" />
            <path d="M108 112 L142 156 L172 156 L158 112 Z" className="tp-flight__wing tp-flight__wing--far" />
            <path d="M20 80 C20 52 52 44 80 44 L168 44 C200 44 224 60 232 80 C224 100 200 112 168 112 L80 112 C52 112 20 104 20 80 Z" className="tp-flight__body" />
            <path d="M104 44 L138 2 L168 2 L154 44 Z" className="tp-flight__wing" />
            <path d="M206 64 C215 67 221 73 224 80" className="tp-flight__line" />
          </g>
          {photo && (
            <g transform="translate(10 2)">
              <image href={photo} x="-25" y="-25" width="50" height="50" clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid slice" />
              <circle r="25" className="tp-flight__porthole" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
