"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { HappyPhoto, Section, Testimonial } from "@/lib/types";
import Polaroid from "./Polaroid";
import { usePhotoViewer } from "./PhotoViewer";
import RevealScope from "./RevealScope";
import { DuskTeddy } from "./stops";

const SIZES = "(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw";
const ORDER = [3, 0, 5, 1, 6, 2, 7, 4]; // staggered reveal delays (x110ms)

/** "Happy families & puppies": dusk sky, testimonial bubble, wooden photo wall (8 home photos), viewer with every photo. */
export default function Dusk({ section, photos, homePhotos, testimonial }: { section: Pick<Section, "heading" | "body" | "data">; photos: HappyPhoto[]; homePhotos: HappyPhoto[]; testimonial: Testimonial | null }) {
  // Viewer order = home photos first (as on the original), then the rest of the wall.
  const all = [...homePhotos, ...photos.filter((p) => !homePhotos.some((h) => h.id === p.id))];
  const { open, viewer } = usePhotoViewer(all, SIZES);
  if (!all.length) return null;
  return (
    <section data-pup-scene="" data-tone="dark" className="tp-scene tp-dusk" style={{ "--sky-top": "#a65a30", "--sky-bottom": "#4d2b19" } as CSSProperties} aria-labelledby="dusk-title">
      <div className="tp-dusk__sky gutter">
        <div className="tp-dusk__head">
          <h2 id="dusk-title" className="font-plush text-huge">{section.heading}</h2>
          {section.body && <p className="text-lede mt-5 max-w-[50ch] text-[var(--ink-soft)]">{section.body}</p>}
        </div>
        {testimonial && (
          <figure className="tp-dusk__note">
            <blockquote className="font-plush-text">“{testimonial.quote}”</blockquote>
            <figcaption className="font-scrawl">{testimonial.name}{testimonial.location ? `, ${testimonial.location}` : ""}</figcaption>
          </figure>
        )}
      </div>
      <div className="tp-photowall">
        <RevealScope className="tp-photowall__wall">
          <ul className="tp-photowall__prints" aria-label="Photos from TeddyPups families">
            {all.slice(0, 8).map((p, i) => (
              <li key={p.id} data-reveal="" data-pup-look={i === 1 || i === 4 ? "" : undefined} style={{ "--d": `${110 * ORDER[i]}ms` } as CSSProperties}>
                <button type="button" className="tp-photowall__print" onClick={() => open(i)} aria-label={`Open photo ${i + 1} of ${all.length}${p.caption ? `: ${p.caption}` : ""}`}>
                  <Polaroid media={p} order={i} sizes={SIZES} />
                </button>
              </li>
            ))}
          </ul>
          <div className="tp-facade__ground">
            <span aria-hidden="true" className="tp-facade__door" />
            <span aria-hidden="true" className="tp-lamp"><span className="tp-lamp__light" /></span>
            {section.data.ctaLabel && <Link href={section.data.ctaHref ?? "/happy-families"} className="btn btn-primary tp-facade__cta">{section.data.ctaLabel}</Link>}
            <DuskTeddy />
          </div>
        </RevealScope>
        <div aria-hidden="true" className="tp-street__pavement" />
      </div>
      {viewer}
    </section>
  );
}
