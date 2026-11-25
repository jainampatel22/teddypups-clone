"use client";
// Port of the original PuppyBrowser: filter sketchpad (where / breed / boy or girl), URL state via
// history.replaceState (?origin ?breed ?gender ?collection), live count, animated sketch grid.
import { useLayoutEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Puppy, Ref } from "@/lib/types";
import SketchCard, { SKETCH_SIZES } from "./SketchCard";
import RevealScope from "./RevealScope";
import { Teddy_sit } from "./StaticTeddy";

const KEYS = ["origin", "breed", "gender", "collection"] as const;
type Key = (typeof KEYS)[number];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="tp-sticker-chip">
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-scrawl mr-1 w-full shrink-0 text-cocoa-soft sm:w-28">{label}</span>
      {children}
    </div>
  );
}

export default function PuppyBrowser({ puppies, breeds, whatsappHref, empty }: { puppies: Puppy[]; breeds: Ref[]; whatsappHref: string; empty: { heading: string; body: string } }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const f: Record<Key, string> = { origin: params.get("origin") ?? "", breed: params.get("breed") ?? "", gender: params.get("gender") ?? "", collection: params.get("collection") ?? "" };
  const listRef = useRef<HTMLUListElement>(null);
  const before = useRef<Map<string, DOMRect> | null>(null);

  const snapshot = () => {
    const m = new Map<string, DOMRect>();
    listRef.current?.querySelectorAll<HTMLElement>(":scope > li").forEach((li) => m.set(li.dataset.id!, li.getBoundingClientRect()));
    before.current = m;
  };
  const go = (qs: string) => {
    snapshot();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  };
  const toggle = (k: Key, v: string) => {
    const p = new URLSearchParams(params.toString());
    if (v && f[k] !== v) p.set(k, v);
    else p.delete(k);
    go(p.toString());
  };
  const clear = () => go("");

  const shown = useMemo(
    () =>
      puppies.filter(
        (p) =>
          (!f.origin || p.origin?.slug === f.origin) &&
          (!f.breed || p.breeds.some((b) => b.slug === f.breed)) &&
          (!f.gender || p.gender === f.gender || p.gender === "male-female") &&
          (!f.collection || p.collections.some((c) => c.slug === f.collection)),
      ),
    [puppies, f.origin, f.breed, f.gender, f.collection],
  );
  const filtered = KEYS.some((k) => f[k]);
  const breedOpts = breeds.filter((b) => puppies.some((p) => p.breeds.some((x) => x.slug === b.slug)));
  const hasKorean = puppies.some((p) => p.collections.some((c) => c.slug === "korean-teacup"));
  const hasLocal = puppies.some((p) => p.origin?.slug === "local");

  // Layout animation (the original used Motion's layout + popLayout springs): FLIP survivors, pop in newcomers.
  useLayoutEffect(() => {
    const prev = before.current;
    before.current = null;
    if (!prev || !listRef.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spring = "cubic-bezier(.34,1.36,.64,1)";
    listRef.current.querySelectorAll<HTMLElement>(":scope > li").forEach((li) => {
      const old = prev.get(li.dataset.id!);
      const now = li.getBoundingClientRect();
      if (old) {
        const dx = old.left - now.left, dy = old.top - now.top;
        if (dx || dy) li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 520, easing: spring });
      } else {
        li.animate([{ opacity: 0, transform: "scale(.86)" }, { opacity: 1, transform: "none" }], { duration: 480, easing: spring });
      }
    });
  });

  return (
    <div>
      <div role="group" aria-label="Filter puppies" className="tp-sketchpad flex flex-col gap-4">
        <Row label="where">
          <Chip active={!f.origin && !f.collection} onClick={clear}>
            Everywhere
          </Chip>
          {hasLocal && (
            <Chip active={f.origin === "local"} onClick={() => toggle("origin", "local")}>
              In Dubai
            </Chip>
          )}
          <Chip active={f.origin === "imported"} onClick={() => toggle("origin", "imported")}>
            Imported
          </Chip>
          {hasKorean && (
            <Chip active={f.collection === "korean-teacup"} onClick={() => toggle("collection", "korean-teacup")}>
              Korean Teacup
            </Chip>
          )}
        </Row>
        <Row label="breed">
          {breedOpts.map((b) => (
            <Chip key={b.slug} active={f.breed === b.slug} onClick={() => toggle("breed", b.slug)}>
              {b.name}
            </Chip>
          ))}
        </Row>
        <Row label="boy or girl">
          <Chip active={f.gender === "male"} onClick={() => toggle("gender", "male")}>
            Boys
          </Chip>
          <Chip active={f.gender === "female"} onClick={() => toggle("gender", "female")}>
            Girls
          </Chip>
          {filtered && (
            <button type="button" onClick={clear} className="link-ink ml-auto text-[0.95rem] font-semibold">
              Clear filters
            </button>
          )}
        </Row>
      </div>
      <p className="font-scrawl mt-10 text-lg text-[var(--ink-soft)]" aria-live="polite">
        {shown.length === 1 ? "1 puppy" : `${shown.length} puppies`} {filtered ? "match" : "looking for a home"}
      </p>
      {shown.length ? (
        <RevealScope>
          <ul ref={listRef} className="tp-sketches mt-8">
            {shown.map((p, i) => (
              <li key={p.id} data-id={p.id}>
                <SketchCard pup={p} index={i} sizes={SKETCH_SIZES} preload={i < 3} />
              </li>
            ))}
          </ul>
        </RevealScope>
      ) : (
        <div className="tp-sketchpad mt-10 grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-10">
          <div className="mx-auto w-44 md:w-52">
            <Teddy_sit />
          </div>
          <div>
            <p className="font-plush text-big">{empty.heading}</p>
            <p className="mt-3 max-w-[48ch] text-cocoa-soft">{empty.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                Ask on WhatsApp
              </a>
              <button type="button" onClick={clear} className="btn btn-ghost">
                Show all puppies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
