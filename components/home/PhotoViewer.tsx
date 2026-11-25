"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import TpImage from "@/components/ui/TpImage";
import type { Media } from "@/lib/types";

const sharpSizes = (m: Media) => Math.ceil(Math.min(innerWidth, Math.max(1, innerHeight - 150) * (m.width / m.height)));

function Slide({ media, pageSizes }: { media: Media; pageSizes: string }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <TpImage media={media} sizes={pageSizes} alt="" loading="eager" className={done ? "tp-viewer__first tp-viewer__first--done" : "tp-viewer__first"} style={{ objectFit: "contain", objectPosition: "50% 50%", backgroundColor: "transparent" }} />
      <Image src={media.url} alt={media.alt} fill sizes={`${sharpSizes(media)}px`} loading="eager" className="tp-viewer__sharp object-contain" data-sharp={done || undefined}
        onLoad={(e) => { e.currentTarget.decode().catch(() => {}).then(() => setDone(true)); }} />
    </>
  );
}

/** Port of the original photo viewer hook (dialog, arrows, swipe, slide-in transition, neighbour preloading). */
export function usePhotoViewer(photos: Media[], pageSizes: string) {
  const ref = useRef<HTMLDialogElement>(null);
  const [at, setAt] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const n = photos.length;
  const wrap = useCallback((i: number) => ((i % n) + n) % n, [n]);
  const go = useCallback((i: number, d: number) => { setDir(d); setAt(wrap(i)); }, [wrap]);
  useEffect(() => {
    if (at === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(at + 1, 1); if (e.key === "ArrowLeft") go(at - 1, -1); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [at, go]);

  const drag = useRef<{ x: number; id: number } | null>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const onDown = (e: RPointerEvent) => { drag.current = { x: e.clientX, id: e.pointerId }; };
  const onMove = (e: RPointerEvent) => { if (drag.current && slideRef.current) slideRef.current.style.translate = `${(e.clientX - drag.current.x) * 0.6}px 0`; };
  const onUp = (e: RPointerEvent) => {
    if (!drag.current || at === null) return;
    const dx = e.clientX - drag.current.x; drag.current = null;
    if (slideRef.current) slideRef.current.style.translate = "";
    if (dx < -80) go(at + 1, 1); else if (dx > 80) go(at - 1, -1);
  };

  const cur = at === null ? null : photos[at];
  const viewer = (
    <dialog ref={ref} aria-label="Photo viewer" className="m-0 h-dvh max-h-none w-screen max-w-none bg-cocoa/95 p-0 text-milk backdrop:bg-cocoa/70"
      onClose={() => setAt(null)} onClick={(e) => e.target === ref.current && ref.current?.close()} data-lenis-prevent="">
      {cur && at !== null && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="font-scrawl text-lg">{at + 1} / {n}{cur.caption ? ` — ${cur.caption}` : ""}</p>
            <button type="button" onClick={() => ref.current?.close()} className="h-11 rounded-full bg-milk px-5 font-semibold text-cocoa">Close</button>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div key={cur.id} ref={slideRef} className="absolute inset-0 touch-pan-y tp-clone-viewer-slide" style={{ ["--dir" as any]: dir }}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <Slide media={cur} pageSizes={pageSizes} />
            </div>
            {n > 1 && (
              <span aria-hidden="true" className="sr-only">
                {[...new Set([(at - 1 + n) % n, (at + 1) % n])].filter((i) => photos[i].kind === "image").map((i) => (
                  <Image key={photos[i].id} src={photos[i].url} alt="" fill sizes={`${sharpSizes(photos[i])}px`} loading="eager" />
                ))}
              </span>
            )}
          </div>
          <div className="flex justify-center gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <button type="button" onClick={() => go(at - 1, -1)} className="h-12 rounded-full border-2 border-milk px-6 font-semibold">Previous</button>
            <button type="button" onClick={() => go(at + 1, 1)} className="h-12 rounded-full bg-honey px-6 font-semibold text-cocoa">Next</button>
          </div>
        </div>
      )}
    </dialog>
  );
  return { open: (i: number) => { setDir(1); setAt(i); ref.current?.showModal(); }, viewer };
}
