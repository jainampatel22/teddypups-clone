"use client";
// Port of the original RevealScope: marks [data-reveal] children with data-revealed when they scroll into view
// (immediately if already on screen). Waits while the route curtain is down.
import { useEffect, useRef } from "react";

const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function curtainDown() {
  const el = document.querySelector<HTMLElement>(".tp-curtain");
  const st = el?.dataset.state;
  if (st === "covering" || st === "covered" || st === "snap") return true;
  if (st === "intro") {
    const a = el!.getAnimations().find((x: any) => x.animationName === "tp-curtain-rest");
    const t = a && a.playState !== "finished" && typeof a.currentTime === "number" ? (a.currentTime as number) : Infinity;
    return t < 560;
  }
  return false;
}

export default function RevealScope({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (reduced()) {
      const all = () => root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach((e) => (e.dataset.revealed = "true"));
      all();
      const mo = new MutationObserver(all);
      mo.observe(root, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const pending = new Set<HTMLElement>();
    const reveal = (e: HTMLElement) => { e.dataset.revealed = "true"; io.unobserve(e); };
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        curtainDown() ? pending.add(el) : reveal(el);
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    const arm = (e: HTMLElement) => {
      if (e.dataset.armed) return io.observe(e);
      const r = e.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && !curtainDown()) { e.dataset.revealed = "true"; return; }
      e.dataset.armed = "true";
      io.observe(e);
    };
    root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach(arm);
    const mo = new MutationObserver(() => root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])").forEach(arm));
    mo.observe(root, { childList: true, subtree: true });
    const flush = () => { pending.forEach(reveal); pending.clear(); };
    addEventListener("tp:arrived", flush);
    let timer: any;
    const poll = () => (curtainDown() ? (timer = setTimeout(poll, 400)) : flush());
    timer = setTimeout(poll, 1600);
    return () => { clearTimeout(timer); io.disconnect(); mo.disconnect(); removeEventListener("tp:arrived", flush); };
  }, []);
  return <div ref={ref} className={className} {...rest}>{children}</div>;
}
