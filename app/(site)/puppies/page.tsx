import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getSection, getSettings, listBreeds, listPuppies, whatsappHref } from "@/lib/db";
import PuppyBrowser from "@/components/puppies/PuppyBrowser";
import SketchCard, { SKETCH_SIZES } from "@/components/puppies/SketchCard";
import RevealScope from "@/components/puppies/RevealScope";
import { Teddy_sit } from "@/components/puppies/StaticTeddy";

export async function generateMetadata(): Promise<Metadata> {
  const h = getSection("puppies", "header");
  return { title: h.data.seoTitle || h.heading, description: h.data.seoDescription, alternates: { canonical: "/puppies" } };
}

export default function PuppiesPage() {
  const header = getSection("puppies", "header");
  const empty = getSection("puppies", "empty");
  const gone = getSection("puppies", "gone");
  const available = listPuppies({ status: ["available", "reserved"] });
  const home = listPuppies({ status: "home" }).slice(0, Number(gone.data.count) || 5);
  const breeds = listBreeds().map((b) => ({ slug: b.slug, name: b.name }));
  const wa = whatsappHref(getSettings());

  return (
    <div data-page="pups" className="tp-page">
      <section aria-labelledby="pups-title" className="tp-sketchbook">
          <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
            <RevealScope className="tp-sketchbook__head">
              <div className="tp-sketchbook__words">
                <p className="font-scrawl text-lg text-toffee-ink" data-reveal>
                  {header.data.kicker}
                </p>
                <h1 id="pups-title" className="font-plush text-giant tp-sketchbook__title" data-reveal>
                  {header.heading}
                  <svg aria-hidden viewBox="0 0 400 24" preserveAspectRatio="none" className="tp-sketchbook__underline">
                    <path d="M4 15c40-9 70 5 112-2s70-9 112 0 74 8 116-1 38-4 52 1" pathLength={1} />
                  </svg>
                </h1>
                <p className="tp-sketchbook__lede text-lede mt-6 max-w-[46ch] text-cocoa-soft" data-reveal>
                  {header.body}
                </p>
              </div>
              <div className="tp-sketchbook__self" data-reveal>
                <Teddy_sit />
                <span className="font-scrawl tp-sketchbook__caption">{header.data.caption}</span>
              </div>
            </RevealScope>
            <div className="mt-12">
              <Suspense
                fallback={
                  <ul className="tp-sketches mt-20">
                    {available.map((p, i) => (
                      <li key={p.id}>
                        <SketchCard pup={p} index={i} sizes={SKETCH_SIZES} preload={i < 3} />
                      </li>
                    ))}
                  </ul>
                }
              >
                <PuppyBrowser puppies={available} breeds={breeds} whatsappHref={wa} empty={{ heading: empty.heading, body: empty.body }} />
              </Suspense>
            </div>
          </div>
        </section>
        {home.length > 0 && (
          <section aria-labelledby="gone-title" className="tp-gone-strip">
            <RevealScope className="gutter mx-auto flex max-w-[110rem] flex-col gap-10 md:flex-row md:items-center">
              <div className="md:w-1/3" data-reveal>
                <h2 id="gone-title" className="font-plush text-big">
                  {gone.heading}
                </h2>
                <p className="mt-3 text-cocoa-soft">{gone.body}</p>
                <Link className="btn btn-primary mt-6" href={gone.data.ctaHref || "/gone-home"}>
                  {gone.data.ctaLabel}
                </Link>
              </div>
              <ul className="tp-gone-strip__row" aria-label="Some puppies who have gone home">
                {home.map((p, i) => (
                  <li key={p.id}>
                    <SketchCard pup={p} index={i} small sizes="9rem" />
                  </li>
                ))}
              </ul>
            </RevealScope>
          </section>
        )}
    </div>
  );
}
