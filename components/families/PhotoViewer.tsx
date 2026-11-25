"use client";
// Port of the original photo viewer hook (dialog, counter + caption, Close, Previous/Next, arrow keys,
// backdrop click, swipe, spring-like slide between photos, blurred first paint then sharp image).
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import TpImage from "@/components/ui/TpImage";
import type { Media } from "@/lib/types";

const fitW = (m: Media) => Math.ceil(Math.min(innerWidth, Math.max(1, innerHeight - 150) * (m.width / m.height)));

function Slide({ media, pageSizes }: { media: Media; pageSizes: string }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <TpImage media={media} sizes={pageSizes} alt="" loading="eager" className={done ? "tp-viewer__first tp-viewer__first--done" : "tp-viewer__first"}
        style={{ objectFit: "contain", objectPosition: "50% 50%", backgroundColor: "transparent" }} />
      <Image src={media.url} alt={media.alt} fill sizes={`${typeof window === "undefined" ? 1200 : fitW(media)}px`} quality={75} loading="eager"
        className="tp-viewer__sharp object-contain" data-sharp={done || undefined}
        onLoad={(e) => { e.currentTarget.decode().catch(() => {}).then(() => setDone(true)); }} />
    </>
  );
}

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function usePhotoViewer(photos: Media[], pageSizes: string) {
  const ref = useRef<HTMLDialogElement>(null);
  const [at, setAt] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const [prev, setPrev] = useState<{ i: number; dir: number; key: number } | null>(null);
  const n = photos.length;
  const wrap = useCallback((i: number) => ((i % n) + n) % n, [n]);
  const go = useCallback((i: number, d: number) => {
    setAt((cur) => { if (cur !== null && !reduced()) setPrev({ i: cur, dir: d, key: Date.now() }); return wrap(i); });
    setDir(d);
  }, [wrap]);

  useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(at + 1, 1); if (e.key === "ArrowLeft") go(at - 1, -1); };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [at, go]);

  // Drop the outgoing slide after its exit animation.
  useEffect(() => { if (!prev) return; const t = setTimeout(() => setPrev(null), 240); return () => clearTimeout(t); }, [prev]);

  // Swipe
  const drag = useRef<{ x: number; id: number } | null>(null);
  const [dx, setDx] = useState(0);
  const cur = at === null ? null : photos[at];
  const near = at === null || n < 2 ? [] : [...new Set([wrap(at - 1), wrap(at + 1)])].filter((i) => photos[i].kind === "image");

  const viewer = (
    <dialog ref={ref} aria-label="Photo viewer" className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
      onClose={() => { setAt(null); setPrev(null); }} onClick={(e) => e.target === ref.current && ref.current?.close()} data-lenis-prevent="true">
      {cur && at !== null && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="font-scrawl text-lg">{at + 1} / {n}{cur.caption ? ` — ${cur.caption}` : ""}</p>
            <button type="button" onClick={() => ref.current?.close()} className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa">Close</button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            {prev && photos[prev.i] && (
              <div key={`out-${prev.key}`} className="absolute inset-0 tp-clone-viewer-out" style={{ "--dir": prev.dir } as React.CSSProperties}>
                <Slide media={photos[prev.i]} pageSizes={pageSizes} />
              </div>
            )}
            <div key={cur.id} className={`absolute inset-0 touch-pan-y ${prev ? "tp-clone-viewer-in" : ""}`}
              style={{ "--dir": dir, translate: dx ? `${dx}px 0` : undefined } as React.CSSProperties}
              onPointerDown={(e) => { if (e.pointerType === "mouse" && e.button !== 0) return; drag.current = { x: e.clientX, id: e.pointerId }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
              onPointerMove={(e) => { if (drag.current?.id === e.pointerId) setDx((e.clientX - drag.current.x) * 0.6); }}
              onPointerUp={(e) => { if (drag.current?.id !== e.pointerId) return; const off = e.clientX - drag.current.x; drag.current = null; setDx(0); if (off < -80) go(at + 1, 1); else if (off > 80) go(at - 1, -1); }}
              onPointerCancel={() => { drag.current = null; setDx(0); }}>
              <Slide media={cur} pageSizes={pageSizes} />
            </div>
            <span aria-hidden="true" className="sr-only">
              {near.map((i) => <Image key={photos[i].id} src={photos[i].url} alt="" fill sizes="1200px" quality={75} loading="eager" />)}
            </span>
          </div>
          <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={() => go(at - 1, -1)} className="h-12 rounded-full border-2 border-milk px-6 font-semibold">Previous</button>
            <button type="button" onClick={() => go(at + 1, 1)} className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa">Next</button>
          </div>
        </div>
      )}
    </dialog>
  );
  return { open: (i: number) => { setDir(1); setPrev(null); setAt(i); ref.current?.showModal(); }, viewer };
}
