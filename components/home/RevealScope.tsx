"use client";
import { useEffect, useRef, type HTMLAttributes } from "react";
import { curtainDown, prefersReduced } from "./motion";

/** Port of the original RevealScope: arms [data-reveal] children below the fold and reveals them on scroll. */
export default function RevealScope({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const sel = "[data-reveal]:not([data-revealed])";
    if (prefersReduced()) {
      const all = () => root.querySelectorAll<HTMLElement>(sel).forEach((e) => (e.dataset.revealed = "true"));
      all();
      const mo = new MutationObserver(all);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const waiting = new Set<HTMLElement>();
    const reveal = (e: HTMLElement) => { e.dataset.revealed = "true"; io.unobserve(e); };
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        if (curtainDown()) waiting.add(el); else reveal(el);
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    const arm = (e: HTMLElement) => {
      if (e.dataset.armed) return io.observe(e);
      const r = e.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && !curtainDown()) { e.dataset.revealed = "true"; return; }
      e.dataset.armed = "true";
      io.observe(e);
    };
    root.querySelectorAll<HTMLElement>(sel).forEach(arm);
    const mo = new MutationObserver(() => root.querySelectorAll<HTMLElement>(sel).forEach(arm));
    mo.observe(root, { childList: true, subtree: true });
    const flush = () => { waiting.forEach(reveal); waiting.clear(); };
    addEventListener("tp:arrived", flush);
    let timer: ReturnType<typeof setTimeout>;
    const poll = () => (curtainDown() ? (timer = setTimeout(poll, 400)) : flush());
    timer = setTimeout(poll, 1600);
    return () => { clearTimeout(timer); io.disconnect(); mo.disconnect(); removeEventListener("tp:arrived", flush); };
  }, []);
  return <div ref={ref} className={className} {...rest}>{children}</div>;
}
