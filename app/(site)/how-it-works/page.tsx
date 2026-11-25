import type { Metadata } from "next";
import { getSection, getSettings, whatsappHref } from "@/lib/db";
import Journeys, { type Journey } from "@/components/howitworks/Journeys";
import Flight from "@/components/howitworks/Flight";
import { PromiseIcon, Skyline } from "@/components/howitworks/Icons";
import TeddyPicking from "@/components/howitworks/TeddyPicking";
import TeddyCare from "@/components/howitworks/TeddyCare";
import seed from "@/data/seed/sections/how-it-works.json";

const PAGE = "how-it-works";
const sec = (key: keyof typeof seed) => {
  const fb = seed[key] as any;
  const s = getSection(PAGE, key, fb);
  return { ...s, data: { ...fb.data, ...s.data } };
};

export async function generateMetadata(): Promise<Metadata> {
  const s = sec("header");
  return { title: s.data.seoTitle || s.heading, description: s.data.seoDescription, alternates: { canonical: "/how-it-works" } };
}

const ANCHORS = ["two-ways", "promise", "delivery", "why"];

export default function HowItWorksPage() {
  const head = sec("header");
  const journeys = sec("journeys");
  const promise = sec("promise");
  const delivery = sec("delivery");
  const why = sec("why");
  const care = sec("care");
  const wa = whatsappHref(getSettings());
  return (
    <div data-page="how" className="tp-page">
      <section data-pup-scene="true" data-tone="light" className="tp-scene " style={{ "--sky-top": "#fffbf3", "--sky-bottom": "#f6cc85" } as React.CSSProperties} aria-labelledby="how-title">
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <header className="grid gap-8 md:grid-cols-12 md:items-end">
            <h1 id="how-title" className="font-plush text-giant md:col-span-7">{head.heading}</h1>
            <p className="text-lede text-[var(--ink-soft)] md:col-span-5 md:pb-4">{head.body}</p>
          </header>
          <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-2">
            {(head.data.chips as string[]).slice(0, 4).map((c, i) => (
              <a key={c} href={`#${ANCHORS[i]}`} className="chip h-11 border-2 border-cocoa !bg-milk px-4 hover:!bg-honey-soft">
                <span className="font-plush text-toffee">{i + 1}</span> {c}
              </a>
            ))}
          </nav>
          <div id="two-ways">
            <Journeys journeys={journeys.data.journeys as Journey[]} kicker={journeys.data.kicker} title={journeys.heading} teddy={<TeddyPicking />} />
          </div>
          <section id="promise" aria-labelledby="promise-title" className="tp-paper mt-24 -rotate-[0.6deg]">
            <p aria-hidden="true" className="font-scrawl text-lg text-toffee-ink">{promise.data.kicker}</p>
            <h2 id="promise-title" className="font-plush text-huge mt-1 max-w-[16ch]">{promise.heading}</h2>
            <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {(promise.data.items as any[]).map((it, i) => (
                <li key={it.title} className="tp-entry" style={{ "--ink-stamp": it.ink, "--tilt": `${it.tilt}deg`, "--i": i } as React.CSSProperties}>
                  <span className={`tp-stamp tp-stamp--${it.shape}`}>
                    <PromiseIcon name={it.icon} className="tp-stamp__icon" />
                    <span className="tp-stamp__title font-plush">{it.title}</span>
                  </span>
                  <p className="tp-entry__text">{it.text}</p>
                </li>
              ))}
            </ul>
          </section>
          <section id="delivery" aria-labelledby="delivery-title" className="mt-24 grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2 id="delivery-title" className="font-plush text-huge">{delivery.heading}</h2>
              <p className="text-lede mt-5 text-[var(--ink-soft)]">{delivery.body}</p>
              <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {(delivery.data.items as any[]).map((it) => (
                  <li key={it.title}>
                    <h3 className="font-plush-text text-[1.3rem] font-bold leading-snug">{it.title}</h3>
                    <p className="mt-1.5 text-[var(--ink-soft)]">{it.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-[clamp(14rem,30vw,22rem)] lg:col-span-6">
              <Skyline className="absolute inset-x-0 bottom-0 w-full text-cocoa/25" />
              <Flight label={delivery.data.flightLabel} from={delivery.data.from} to={delivery.data.to} />
            </div>
          </section>
          <section id="why" aria-labelledby="why-title" className="mt-24 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="why-title" className="font-plush text-huge">{why.heading}</h2>
              <p className="text-lede mt-6 text-[var(--ink-soft)]">{why.body}</p>
            </div>
            <ul className="space-y-8 lg:col-span-6 lg:col-start-7">
              {(why.data.items as any[]).map((it) => (
                <li key={it.title} className="flex gap-5">
                  <PromiseIcon name={it.icon} className="size-14 shrink-0 text-toffee-deep" />
                  <div>
                    <h3 className="font-plush text-[1.7rem]">{it.title}</h3>
                    <p className="mt-2 text-[var(--ink-soft)]">{it.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="care-title" className="tp-board mt-24 grid items-center gap-8 md:grid-cols-[1fr_auto] md:!p-12">
            <div>
              <h2 id="care-title" className="font-plush text-big">{care.heading}</h2>
              <p className="text-lede measure mt-5 text-cocoa-soft">{care.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">{care.data.whatsappLabel}</a>
                <a className="btn btn-ghost" href={care.data.ctaHref}>{care.data.ctaLabel}</a>
              </div>
            </div>
            <TeddyCare />
          </section>
        </div>
      </section>
    </div>
  );
}
