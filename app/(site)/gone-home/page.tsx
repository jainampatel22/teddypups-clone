import type { Metadata } from "next";
import Link from "next/link";
import { getSection, listPuppies } from "@/lib/db";
import TpImage from "@/components/ui/TpImage";
import RevealScope from "@/components/puppies/RevealScope";
import { Teddy_booth } from "@/components/puppies/StaticTeddy";

const TILTS = [-1.4, 1.1, -0.6, 1.6, -1.1, 0.8];

export async function generateMetadata(): Promise<Metadata> {
  const h = getSection("gone-home", "header");
  return { title: h.data.seoTitle || h.heading, description: h.data.seoDescription, alternates: { canonical: "/gone-home" } };
}

export default function GoneHomePage() {
  const h = getSection("gone-home", "header");
  const d = h.data;
  const pups = listPuppies({ status: "home" });
  return (
    <div data-page="gone" className="tp-page">
      <RevealScope className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
        <header className="tp-boothhead">
          <div className="max-w-3xl">
            <h1 className="font-plush text-giant">
              {h.heading}
              <svg viewBox="0 0 48 44" className="ml-3 inline-block w-[0.45em] -translate-y-[0.15em] text-toffee" aria-hidden>
                <path d="M24 40C10 30 4 22 4 14.5 4 8.7 8.6 4 14.3 4c4.1 0 7.6 2.4 9.7 6 2.1-3.6 5.6-6 9.7-6C39.4 4 44 8.7 44 14.5 44 22 38 30 24 40z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </h1>
            <p className="text-lede mt-6 text-cocoa-soft">{h.body}</p>
            <Link className="btn btn-primary mt-8" href={d.ctaHref || "/puppies"}>
              {d.ctaLabel}
            </Link>
          </div>
          <div aria-hidden className="tp-booth">
            <Teddy_booth />
            <div className="tp-booth__counter">
              <span className="font-plush">{d.boothLabel}</span>
            </div>
          </div>
        </header>
        <div>
          <ul className="tp-tickets" aria-label="Puppies who have gone home">
            {pups.map((p, i) => (
              <li key={p.id} className="tp-ticket" data-reveal style={{ "--tilt": `${TILTS[i % 6]}deg`, "--i": i % 6 } as React.CSSProperties}>
                <Link className="tp-ticket__link" href={`/puppies/${p.slug}`}>
                  <span className="tp-ticket__main">
                    <span className="tp-ticket__photo">{p.cover && <TpImage media={p.cover} sizes="7rem" loading="lazy" />}</span>
                    <span className="tp-ticket__body">
                      <span className="font-scrawl tp-ticket__kicker">{d.ticketKicker}</span>
                      <span className="font-plush tp-ticket__name">{p.displayName}</span>
                      <span className="tp-ticket__meta">{p.name ? `${p.breed}, ${p.genderLabel.toLowerCase()}` : p.genderLabel}</span>
                      <span className="tp-ticket__route">
                        <span>{p.origin?.slug === "local" ? d.routeFromLocal : d.routeFrom}</span>
                        <svg viewBox="0 0 60 12" aria-hidden>
                          <path d="M2 6h46" />
                          <path d="M44 2l6 4-6 4" />
                        </svg>
                        <span>{d.routeTo}</span>
                      </span>
                    </span>
                  </span>
                  <span aria-hidden className="tp-ticket__stub">
                    <span className="font-plush">{d.stubLabel}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </RevealScope>
    </div>
  );
}
