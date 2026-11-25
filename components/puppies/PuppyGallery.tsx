"use client";
// Port of the original PuppyGallery: page-turn reveal (clip-path + rotateY) on the stacked "storypage",
// prev/next + counter, tilted thumbnails, autoplaying muted videos with posters, and a full-screen
// photo viewer <dialog> with keyboard arrows and swipe.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import TpImage from "@/components/ui/TpImage";
import type { Media } from "@/lib/types";

const SIZES = "(min-width: 1024px) 55vw, 92vw";
const EASE = "cubic-bezier(.22,1,.36,1)";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function Slide({ m, dir, first, entering, onOpen, label }: { m: Media; dir: number; first: boolean; entering: boolean; onOpen: () => void; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !entering || reduced()) return;
    el.animate(
      [
        { clipPath: dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)", transform: `perspective(1400px) rotateY(${-14 * dir}deg)` },
        { clipPath: "inset(0% 0% 0% 0%)", transform: "perspective(1400px) rotateY(0deg)" },
      ],
      { duration: 700, easing: EASE },
    );
  }, [entering, dir]);
  return (
    <button ref={ref} type="button" className="absolute inset-0 block size-full" style={{ transformOrigin: dir > 0 ? "0% 50%" : "100% 50%" }} onClick={onOpen} aria-label={`Open ${label} full screen`}>
      {m.kind === "video" ? (
        <video src={m.url} poster={m.poster?.url} className="size-full object-cover" muted loop playsInline autoPlay aria-label={m.alt} />
      ) : (
        <TpImage media={m} sizes={SIZES} priority={first} quality={85} />
      )}
    </button>
  );
}

function Leaving({ m }: { m: Media }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.animate([{ opacity: 1, transform: "none" }, { opacity: 0.4, transform: "scale(.97)" }], { duration: 700, easing: EASE, fill: "forwards" });
  }, []);
  return (
    <div ref={ref} aria-hidden className="absolute inset-0 block size-full">
      {m.kind === "video" ? (m.poster ? <TpImage media={m.poster} sizes={SIZES} /> : null) : <TpImage media={m} sizes={SIZES} quality={85} />}
    </div>
  );
}

function ViewerImage({ m }: { m: Media }) {
  // Blurry fill first, then the sharp full-size WebP fades in (original: tp-viewer__first / tp-viewer__sharp).
  const [done, setDone] = useState(false);
  const w = typeof window === "undefined" ? 1200 : Math.ceil(Math.min(innerWidth, Math.max(1, innerHeight - 150) * (m.width / m.height)));
  return (
    <>
      <TpImage media={m} sizes={SIZES} alt="" className={done ? "tp-viewer__first tp-viewer__first--done" : "tp-viewer__first"} style={{ objectFit: "contain", objectPosition: "50% 50%", backgroundColor: "transparent" }} />
      <Image src={m.url} alt={m.alt} fill sizes={`${w}px`} quality={85} loading="eager" className="tp-viewer__sharp object-contain" data-sharp={done || undefined} onLoad={(e) => e.currentTarget.decode().catch(() => {}).then(() => setDone(true))} />
    </>
  );
}

export default function PuppyGallery({ name, media }: { name: string; media: Media[] }) {
  const [state, setState] = useState<{ at: number; dir: number; prev: number | null; n: number }>({ at: 0, dir: 1, prev: null, n: 0 });
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  const viewerStage = useRef<HTMLDivElement>(null);
  const total = media.length;
  const { at, dir, prev } = state;
  const cur = media[at];

  const go = useCallback(
    (i: number) => {
      setState((s) => {
        const next = ((i % total) + total) % total;
        if (next === s.at) return s;
        return { at: next, dir: i > s.at ? 1 : -1, prev: s.at, n: s.n + 1 };
      });
    },
    [total],
  );

  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setState((s) => (s.prev === prev ? { ...s, prev: null } : s)), 720);
    return () => clearTimeout(t);
  }, [prev, state.n]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [open, at, go]);

  // Viewer slide pops in (opacity .96 scale) on every change; swipe with pointer drag.
  useLayoutEffect(() => {
    if (!open || reduced()) return;
    viewerStage.current?.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: EASE });
  }, [open, at]);

  const drag = useRef<{ x: number; id: number } | null>(null);
  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, id: e.pointerId }; };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || !viewerStage.current) return;
    viewerStage.current.style.transform = `translateX(${(e.clientX - drag.current.x) * 0.6}px)`;
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    drag.current = null;
    if (viewerStage.current) viewerStage.current.style.transform = "";
    if (dx < -80) go(at + 1);
    else if (dx > 80) go(at - 1);
  };

  if (!cur) return null;
  const label = (i: number) => `${name}, ${media[i].kind === "video" ? "video" : "photo"} ${i + 1} of ${total}`;

  return (
    <div>
      <div className="tp-storypage relative aspect-[4/5] md:aspect-[5/6]">
        {prev !== null && media[prev] && <Leaving key={`leave-${state.n}`} m={media[prev]} />}
        <Slide
          key={cur.id}
          m={cur}
          dir={dir}
          first={state.n === 0}
          entering={state.n > 0}
          label={label(at)}
          onOpen={() => {
            dlg.current?.showModal();
            setOpen(true);
          }}
        />
        {total > 1 && (
          <div className="absolute inset-x-4 bottom-4 flex justify-between">
            <button type="button" onClick={() => go(at - 1)} className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold" aria-label="Previous photo">
              ‹
            </button>
            <span className="self-center rounded-full bg-cocoa/80 px-3 py-1 text-sm font-semibold text-milk">
              {at + 1} / {total}
            </span>
            <button type="button" onClick={() => go(at + 1)} className="grid size-12 place-items-center rounded-full border-2 border-cocoa bg-milk/95 text-xl font-bold" aria-label="Next photo">
              ›
            </button>
          </div>
        )}
      </div>
      {total > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto px-1 pb-2 pt-2 [scrollbar-width:thin]" aria-label={`All photos of ${name}`}>
          {media.map((m, i) => {
            const thumb = m.kind === "video" ? m.poster : m;
            return (
              <li key={m.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={label(i)}
                  aria-current={i === at}
                  className={`relative block h-24 w-20 overflow-hidden rounded-[0.9rem] border-[3px] transition-transform duration-300 md:h-28 md:w-24 ${i === at ? "-rotate-3 -translate-y-1 border-toffee-deep" : "border-cocoa/30 hover:-rotate-2 hover:border-cocoa"}`}
                >
                  {thumb && <TpImage media={thumb} sizes="96px" alt="" />}
                  {m.kind === "video" && <span className="absolute inset-0 grid place-items-center bg-cocoa/30 text-lg text-milk">▶</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <dialog
        ref={dlg}
        aria-label={`${name} photos`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dlg.current && dlg.current?.close()}
        data-lenis-prevent
      >
        {open && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="font-scrawl text-lg">{label(at)}</p>
              <button type="button" onClick={() => dlg.current?.close()} className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa">
                Close
              </button>
            </div>
            <div className="relative flex-1 touch-pan-y">
              <div ref={viewerStage} key={cur.id} className="absolute inset-0" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: "pan-y" }}>
                {cur.kind === "video" ? <video src={cur.url} poster={cur.poster?.url} controls autoPlay playsInline className="size-full object-contain" /> : <ViewerImage m={cur} />}
              </div>
            </div>
            {total > 1 && (
              <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <button type="button" onClick={() => go(at - 1)} className="h-12 rounded-full border-2 border-milk px-6 font-semibold">
                  Previous
                </button>
                <button type="button" onClick={() => go(at + 1)} className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
