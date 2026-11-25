"use client";
// Port of the original MemoryWall: masonry wall of polaroids that reveal on scroll and open the photo viewer.
import Paw from "@/components/contact/Paw";
import RevealScope from "@/components/faq/RevealScope";
import Polaroid from "./Polaroid";
import { usePhotoViewer } from "./PhotoViewer";
import type { Media } from "@/lib/types";

const SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw";

export default function MemoryWall({ photos, showCaptions = true }: { photos: Media[]; showCaptions?: boolean }) {
  const list = showCaptions ? photos : photos.map((p) => ({ ...p, caption: "" }));
  const { open, viewer } = usePhotoViewer(list, SIZES);
  return (
    <>
      <RevealScope>
        <ul className="tp-wall" aria-label="Photos from TeddyPups families">
          {list.map((m, i) => (
            <li key={m.id} className="tp-wall__item" data-reveal="true" style={{ "--d": `${(i % 4) * 60}ms` } as React.CSSProperties}>
              <button type="button" className="tp-wall__print" onClick={() => open(i)} aria-label={`Open photo ${i + 1} of ${list.length}${m.caption ? `: ${m.caption}` : ""}`}>
                <Polaroid media={m} order={i} sizes={SIZES} priority={i < 2} />
                <Paw className="tp-wall__paw" />
              </button>
            </li>
          ))}
        </ul>
      </RevealScope>
      {viewer}
    </>
  );
}
