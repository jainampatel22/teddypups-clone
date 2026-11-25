"use client";
// Port of the original StoryRibbon: the bookmark ribbon grows (scaleY 0 -> 1) as you read the puppy page.
// Motion's useScroll offset ["start 30%", "end end"] on the ribbon element.
import { useEffect, useRef } from "react";

export default function StoryRibbon() {
  const ref = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const b = band.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = innerHeight;
      // 0 when the element top reaches 30% of the viewport, 1 when its bottom reaches the viewport bottom
      const len = r.height - 0.7 * vh;
      const p = len <= 0 ? 1 : Math.min(1, Math.max(0, -(r.top - 0.3 * vh) / len));
      b.style.transform = `scaleY(${p})`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} aria-hidden className="tp-ribbon">
      <div className="tp-ribbon__track">
        <span ref={band} className="tp-ribbon__band" style={{ transform: "scaleY(0)" }} />
      </div>
    </div>
  );
}
