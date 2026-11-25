import TpImage from "@/components/ui/TpImage";
import type { Media } from "@/lib/types";

const TILT = [-2.2, 1.6, -0.9, 2.4, -1.5, 0.8, -2.6, 1.2];
const TAPE_POS = ["center", "left", "right", "corners", "center", "right", "left", "center"];
const TAPE = ["#f6d79a", "#f9cdbf", "#cfe5f6", "#f6d79a", "#e9dcc4"];

/** Port of the original Polaroid print (natural-size photo, tilt, washi tape). */
export default function Polaroid({ media, order, sizes, caption, priority = false }: { media: Media; order: number; sizes: string; caption?: string; priority?: boolean }) {
  const pos = TAPE_POS[order % TAPE_POS.length];
  return (
    <span className="tp-polaroid" style={{ "--tilt": `${TILT[order % TILT.length]}deg`, "--tape": TAPE[order % TAPE.length], "--i": order } as React.CSSProperties}>
      {pos === "corners" ? (<><span aria-hidden="true" className="tp-tape tp-tape--tl" /><span aria-hidden="true" className="tp-tape tp-tape--tr" /></>) : <span aria-hidden="true" className={`tp-tape tp-tape--${pos}`} />}
      <span className="tp-polaroid__photo">
        <TpImage media={media} fill={false} sizes={sizes} {...(priority ? { priority: true } : { loading: "lazy" as const })}
          style={{ width: "100%", height: "auto", objectPosition: "50% 50%" }} />
      </span>
      <span className="tp-polaroid__caption font-scrawl">{caption ?? media.caption}</span>
    </span>
  );
}
