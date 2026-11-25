"use client";
import { useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";
export const prefersReduced = () => typeof window !== "undefined" && matchMedia(REDUCED).matches;

export function useMedia(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => { const m = matchMedia(query); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => matchMedia(query).matches,
    () => serverValue,
  );
}
/** true while reduced motion (server render assumes reduced, like the original). */
export const useReducedMotion = () => useMedia(REDUCED, true);

/** The route curtain still covers the page (intro / navigating). */
export function curtainDown() {
  const c = document.querySelector<HTMLElement>(".tp-curtain");
  const st = c?.dataset.state;
  if (!c) return false;
  if (st === "intro") {
    const a = c.getAnimations().find((x: any) => x.animationName === "tp-curtain-rest");
    const t = a && a.playState !== "finished" && typeof a.currentTime === "number" ? a.currentTime : Infinity;
    return t < 560;
  }
  return st === "covering" || st === "covered" || st === "snap";
}

/** Ask the global mascot to look at something / say something (handled by components/pup engine). */
export function cuePup(detail: { look?: Element | null; secs?: number; say?: string }) {
  dispatchEvent(new CustomEvent("pup:cue", { detail }));
}
