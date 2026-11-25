"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import TpImage from "@/components/ui/TpImage";
import type { Puppy, Section } from "@/lib/types";
import { cuePup, useReducedMotion } from "./motion";
import { DoorPaw, MeetTeddy } from "./stops";

const STATUS: Record<string, string> = { available: "Available", reserved: "Reserved", home: "Gone home" };
const DOOR_COLOURS = ["#a24a1a", "#5a3a28", "#d4893f", "#b8644a", "#7a4a2e"];

export type MeetPup = Pick<Puppy, "id" | "slug" | "name" | "displayName" | "breed" | "genderLabel" | "age" | "status" | "cover"> & { hasVideo: boolean };

function Door({ pup, index }: { pup: MeetPup; index: number }) {
  return (
    <Link href={`/puppies/${pup.slug}`} className="tp-door__link" style={{ "--door": DOOR_COLOURS[index % DOOR_COLOURS.length] } as CSSProperties}>
      <span className="tp-door__plate">
        <span className="font-plush tp-door__name">{pup.displayName}</span>
        <span className="tp-door__meta">
          {pup.name ? `${pup.breed}, ` : ""}{pup.genderLabel.toLowerCase()}{pup.age ? `, ${pup.age}` : ""}{pup.hasVideo ? ", with video" : ""}
        </span>
      </span>
      <span className="tp-door__frame">
        <span className="tp-door__room">{pup.cover && <TpImage media={pup.cover} sizes="(min-width: 1024px) 15rem, 44vw" />}</span>
        <span aria-hidden="true" className="tp-door__way">
          <span className="tp-door__leaf"><DoorPaw /><span className="tp-door__knob" /></span>
        </span>
        <span className="tp-door__tag font-scrawl">{STATUS[pup.status]}</span>
      </span>
    </Link>
  );
}

/**
 * "Meet the pups": on desktop the section pins and the row of doors slides
 * sideways with scroll; each door swings open as it passes 36% of the viewport
 * while Teddy walks on the treadmill floor. Below 1024px (or reduced motion) it
 * is a plain grid of open doors.
 */
export default function Meet({ section, puppies }: { section: Pick<Section, "heading" | "body" | "data">; puppies: MeetPup[] }) {
  const rangeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const hallRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [travel, setTravel] = useState(0);
  const [pinned, setPinned] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const wide = matchMedia("(min-width: 1024px)").matches;
      setPinned(wide && !reduced);
      const track = trackRef.current, hall = hallRef.current;
      if (hall && track && wide && !reduced) {
        const stage = hall.parentElement!;
        const head = stage.querySelector<HTMLElement>(".tp-meet__head");
        const plate = Math.max(64, ...[...track.querySelectorAll<HTMLElement>(".tp-door__plate")].map((e) => e.offsetHeight));
        const floor = hall.querySelector<HTMLElement>(".tp-meet__floor")?.offsetHeight ?? 0;
        const w = Math.max(128, Math.min(256, 0.15 * innerWidth, (stage.clientHeight - (head ? head.offsetTop + head.offsetHeight : 0) - floor - plate - 40) / 1.3));
        hall.style.setProperty("--door-w", `${w.toFixed(0)}px`);
      } else hall?.style.removeProperty("--door-w");
      setTravel(track ? Math.max(0, track.scrollWidth - innerWidth) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    if (hallRef.current?.parentElement) ro.observe(hallRef.current.parentElement);
    addEventListener("resize", measure);
    return () => { ro.disconnect(); removeEventListener("resize", measure); };
  }, [reduced]);

  // Scroll progress through the pin range -> spring-smoothed x offset of the track.
  useEffect(() => {
    const range = rangeRef.current, track = trackRef.current;
    if (!pinned || !range || !track) { if (track) track.style.transform = ""; return; }
    let x = 0, v = 0, raf = 0, last = performance.now(), first = true;
    const target = () => {
      const r = range.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      return -p * travel;
    };
    const apply = (val: number, cue: boolean) => {
      track.style.transform = `translateX(${val.toFixed(2)}px)`;
      hallRef.current?.style.setProperty("--floor-x", `${val.toFixed(1)}px`);
      const edge = 0.36 * innerWidth;
      for (const li of track.children as HTMLCollectionOf<HTMLElement>) {
        const open = li.offsetLeft + val < edge;
        if ((li.dataset.open === "true") !== open) {
          li.dataset.open = String(open);
          if (open && cue) cuePup({ look: li, secs: 0.9 });
        }
      }
    };
    // spring: stiffness 170, damping 32, mass .35 (same as the original useSpring)
    const step = (now: number) => {
      const dt = Math.min(0.064, (now - last) / 1000); last = now;
      const t = target();
      if (first) { x = t; first = false; apply(x, false); }
      else {
        const a = (170 * (t - x) - 32 * v) / 0.35;
        v += a * dt; x += v * dt;
        if (Math.abs(t - x) < 0.05 && Math.abs(v) < 0.05) { x = t; v = 0; }
        apply(x, true);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pinned, travel]);

  if (!puppies.length) return null;
  const ctaHref = section.data.ctaHref ?? "/puppies";
  return (
    <section data-pup-scene="" data-tone="light" className="tp-scene tp-meet" data-pinned={pinned || undefined}
      style={{ "--sky-top": "#fff1d8", "--sky-bottom": "#fbe3b4" } as CSSProperties} aria-labelledby="meet-title">
      <div ref={rangeRef} data-pin-range="" style={{ height: pinned ? `calc(100vh + ${Math.round(0.8 * travel)}px)` : undefined, "--pinned": pinned ? 1 : 0 } as CSSProperties}>
        <div className="tp-meet__stage">
          <header className="tp-meet__head gutter">
            <div>
              <h2 id="meet-title" className="font-plush text-huge">{section.heading}</h2>
              {section.body && <p className="text-lede mt-3 max-w-[44ch] text-[var(--ink-soft)]">{section.body}</p>}
            </div>
            {section.data.ctaLabel && <Link className="btn btn-primary shrink-0" href={ctaHref}>{section.data.ctaLabel}</Link>}
          </header>
          <div ref={hallRef} className="tp-meet__hall">
            <ol ref={trackRef} className="tp-meet__track" data-treadmill="" aria-label="Puppies looking for a family">
              {puppies.map((p, i) => (
                <li key={p.id} className="tp-door" data-open={pinned ? "false" : "true"}><Door pup={p} index={i} /></li>
              ))}
              <li className="tp-door tp-door--all" data-open="true">
                <Link className="tp-door__link" href={ctaHref}>
                  <span className="tp-door__frame tp-door__frame--all"><span className="font-plush tp-door__all">{section.data.allLabel ?? "Meet them all"}</span></span>
                </Link>
              </li>
            </ol>
            <div aria-hidden="true" className="tp-meet__floor" />
            <MeetTeddy walking={pinned} />
          </div>
        </div>
      </div>
    </section>
  );
}
