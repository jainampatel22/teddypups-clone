import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPuppy, getSection, getSettings, listPuppies, whatsappHref } from "@/lib/db";
import type { Puppy } from "@/lib/types";
import TpImage from "@/components/ui/TpImage";
import StoryRibbon from "@/components/puppies/StoryRibbon";
import PuppyGallery from "@/components/puppies/PuppyGallery";
import EnquiryForm from "@/components/puppies/EnquiryForm";
import RevealScope from "@/components/puppies/RevealScope";
import { Teddy_tag } from "@/components/puppies/StaticTeddy";
import { PAW_PATH } from "@/components/puppies/sketch";

type Props = { params: Promise<{ slug: string }> };

const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

function seoDescription(p: Puppy, siteName: string) {
  if (p.seoDescription) return p.seoDescription;
  const who = p.name ? `Meet ${p.name}` : `Meet this ${p.displayName}`;
  const where = p.origin?.slug === "local" ? "in Dubai" : "imported";
  const video = p.media.some((m) => m.kind === "video") ? "Real photos and video" : "Real photos";
  return `${who}: ${p.breed}, ${p.genderLabel.toLowerCase()}, ${p.age} old, ${where}. ${video} from ${siteName.replace(/\.$/, "")}.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPuppy(slug);
  if (!p) return { title: "Puppy not found" };
  const s = getSettings();
  const title = p.name ? `${p.name}, ${p.breed} puppy` : `${p.displayName} puppy (${p.genderLabel.toLowerCase()})`;
  const description = seoDescription(p, s.siteName);
  const img = p.cover?.kind === "video" ? p.cover.poster?.url : p.cover?.url;
  return {
    title,
    description,
    alternates: { canonical: `/puppies/${p.slug}` },
    openGraph: { title, description, images: img ? [img] : undefined },
    twitter: { card: "summary_large_image", title, description, images: img ? [img] : undefined },
  };
}

function Chapter({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="tp-chapter">
      <span aria-hidden className="tp-chapter__n font-plush">
        {n}
      </span>
      <span className="font-scrawl">{children}</span>
    </p>
  );
}

export default async function PuppyPage({ params }: Props) {
  const { slug } = await params;
  const p = getPuppy(slug);
  if (!p) notFound();

  const settings = getSettings();
  const wa = whatsappHref(settings);
  const ch = getSection("puppy", "chapters").data;
  const promise = getSection("puppy", "promise");
  const local = p.origin?.slug === "local";
  const way = getSection("puppy", local ? "way-local" : "way-imported");
  const enq = getSection("puppy", "enquiry");
  const labels = getSection("puppy", "labels").data;

  const home = p.status === "home";
  const group = listPuppies({ status: home ? "home" : ["available", "reserved"] });
  const idx = group.findIndex((x) => x.id === p.id);
  const prevPup = group.length > 1 && idx >= 0 ? group[(idx - 1 + group.length) % group.length] : null;
  const nextPup = group.length > 1 && idx >= 0 ? group[(idx + 1) % group.length] : null;

  const named = !!p.name;
  const label = named ? `${p.name} (${p.breed})` : p.displayName;
  const subject = named ? p.name : `this ${p.displayName}`;
  const media = p.media.length ? p.media : p.cover ? [p.cover] : [];
  const coverColor = (p.cover?.kind === "video" ? p.cover.poster?.color : p.cover?.color) || "#f2be6b";
  const n = home ? { letter: 3 } : { letter: 4 };

  const details: [string, string][] = [
    ["Breed", p.breed],
    ["Boy or girl", p.genderLabel],
    ...(p.age ? ([["Age", p.age]] as [string, string][]) : []),
    ...(p.colour ? ([["Colour", p.colour]] as [string, string][]) : []),
    ...(p.records || []).map((r) => [r.label, r.value] as [string, string]),
    ["Where", local ? labels.whereLocal : labels.whereImported],
  ];

  const base = process.env.SITE_URL || "http://localhost:3077";
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Puppies", item: `${base}/puppies` },
      { "@type": "ListItem", position: 2, name: p.displayName, item: `${base}/puppies/${p.slug}` },
    ],
  };

  return (
    <div data-page="pup" className="tp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="tp-storybook" style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${coverColor} 24%, var(--color-milk)) 0, var(--color-milk) 85%)` }}>
        <StoryRibbon />
        <RevealScope className="gutter mx-auto max-w-[110rem] pb-20 pt-8 md:pt-12">
          <nav aria-label="Breadcrumb" className="text-[0.95rem] font-semibold text-cocoa-soft">
            <Link className="link-ink" href={home ? "/gone-home" : "/puppies"}>
              {home ? labels.breadcrumbHome : labels.breadcrumbAvailable}
            </Link>
            <span aria-hidden> / </span>
            <span aria-current="page">{p.displayName}</span>
          </nav>
          <Chapter n={1}>{home ? ch.helloHome : ch.hello}</Chapter>
          <div className="mt-4 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="min-w-0 lg:col-span-7">
              <PuppyGallery name={p.displayName} media={media} />
            </div>
            <div className="min-w-0 lg:col-span-5">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+5.5rem)]">
                <div className="tp-tag tp-board mt-16 !rounded-[2.2rem_2.2rem_2.2rem_0.6rem] !p-7 md:!p-9 lg:mt-20" data-reveal>
                  <span aria-hidden className="tp-tag__ring" />
                  <Teddy_tag name={p.displayName} />
                  {home ? (
                    <span className="inline-grid place-items-center rounded-full border-[3px] border-current px-3 py-1 font-scrawl text-sm uppercase tracking-wide -rotate-6 text-toffee-deep">Gone home ♥</span>
                  ) : (
                    <span className="chip">
                      <svg viewBox="0 0 64 64" className="size-4 text-toffee" aria-hidden fill="currentColor">
                        <path d={PAW_PATH} />
                      </svg>
                      {p.status === "reserved" ? "Reserved" : "Available"}
                    </span>
                  )}
                  <h1 className="font-plush mt-4 text-[clamp(2.6rem,5vw,4.6rem)]">{p.displayName}</h1>
                  {named && <p className="mt-2 text-lg font-semibold text-cocoa-soft">{p.breed}</p>}
                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4">
                    {details.map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-scrawl text-sm text-cocoa-soft">{k}</dt>
                        <dd className="mt-0.5 text-[1.05rem] font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {p.description && <p className="mt-6 whitespace-pre-line text-cocoa-soft">{p.description}</p>}
                  <div className="mt-8 flex flex-col gap-3">
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                      {home ? enq.data.whatsappHome : named ? fill(enq.data.whatsappNamed, { name: p.name }) : enq.data.whatsappUnnamed}
                    </a>
                    <a href={`#enquire-${p.slug}`} className="btn btn-ghost">
                      {enq.data.enquireLabel}
                    </a>
                  </div>
                </div>
                <div className="tp-paper mt-8 -rotate-1">
                  <Chapter n={2}>
                    {ch.comes} {subject}
                  </Chapter>
                  <h2 className="font-plush mt-1 text-[1.9rem]">{promise.heading}</h2>
                  <ul className="mt-4 space-y-2.5">
                    {(promise.data.items as string[]).map((t) => (
                      <li key={t} className="flex items-start gap-3 font-semibold">
                        <svg viewBox="0 0 32 32" className="mt-0.5 size-6 shrink-0 text-toffee-deep" aria-hidden>
                          <path d="M5 17l7 7L27 8" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {!home && (
            <section aria-labelledby={`home-steps-${p.slug}`} className="mt-20">
              <Chapter n={3}>{ch.wayHome}</Chapter>
              <h2 id={`home-steps-${p.slug}`} className="font-plush text-big mt-3">
                {way.heading}
              </h2>
              <ol className="tp-trail tp-trail--row tp-trail--paws mt-10">
                {(way.data.steps as { title: string; text: string }[]).map((s, i) => (
                  <li key={i}>
                    <span aria-hidden className="tp-trail__num font-plush">
                      {i + 1}
                    </span>
                    <h3 className="font-plush-text text-xl font-bold leading-tight">{s.title}</h3>
                    <p className="mt-2 max-w-[38ch] text-cocoa-soft">{s.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <section id={`enquire-${p.slug}`} aria-labelledby={`enquire-title-${p.slug}`} className="tp-letter mt-20 grid gap-10 lg:grid-cols-12">
            <span aria-hidden className="tp-letter__stamp">
              <svg viewBox="0 0 64 64" className="size-9" aria-hidden fill="currentColor">
                <path d={PAW_PATH} />
              </svg>
            </span>
            <div className="lg:col-span-4">
              <Chapter n={n.letter}>{ch.letter}</Chapter>
              <h2 id={`enquire-title-${p.slug}`} className="font-plush text-big mt-2">
                {home ? enq.data.headingHome : named ? `${enq.heading} ${p.name}` : enq.data.headingUnnamed}
              </h2>
              <p className="mt-4 text-cocoa-soft">{enq.body}</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <EnquiryForm
                puppyId={p.id}
                message={fill(enq.data.messageTemplate, { label })}
                success={{ heading: enq.data.successHeading, body: enq.data.successBody }}
                whatsappHref={wa}
              />
            </div>
          </section>
          {prevPup && nextPup && (
            <nav aria-label="More puppies" className="mt-16 grid gap-4 sm:grid-cols-2">
              {[
                [prevPup, labels.prev],
                [nextPup, labels.next],
              ].map(([q, lab]: any) => (
                <Link
                  key={lab}
                  className="group flex items-center gap-5 rounded-[2rem] border-[3px] border-cocoa bg-milk p-4 transition-transform duration-500 hover:-rotate-1 sm:last:flex-row-reverse sm:last:text-right"
                  href={`/puppies/${q.slug}`}
                >
                  <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[999px_999px_0.6rem_0.6rem] border-[3px] border-cocoa bg-honey-soft">
                    {q.cover && <TpImage media={q.cover} sizes="80px" loading="lazy" />}
                  </span>
                  <span>
                    <span className="font-scrawl block text-sm text-cocoa-soft">{lab}</span>
                    <span className="font-plush text-[1.6rem]">{q.displayName}</span>
                  </span>
                </Link>
              ))}
            </nav>
          )}
        </RevealScope>
      </article>
    </div>
  );
}
