import type { Metadata } from "next";
import { getSection, getSettings, listPuppies, whatsappHref } from "@/lib/db";
import LetterForm from "@/components/contact/LetterForm";
import TeddyWaiting from "@/components/contact/TeddyWaiting";
import Paw from "@/components/contact/Paw";
import TpImage from "@/components/ui/TpImage";

const HEADER = {
  heading: "Get in touch with us",
  body: "Have questions about our puppies or adoption process? Fill out the form, and our team will get back to you promptly. Whether ready to adopt or just seeking info, we'd love to hear from you!",
  data: { seoTitle: "Visit & contact", seoDescription: "Visit TeddyPups in Downtown Dubai or get in touch on WhatsApp, by phone or email.", callLabel: "call us", emailLabel: "email" },
};
const LETTER = {
  heading: "Message received!",
  body: "Thank you — our team will get back to you promptly. For the quickest reply, message us on WhatsApp.",
  data: { greeting: "Dear TeddyPups,", sign: "with love, a future puppy parent", submit: "Post my letter", pending: "Sealing the envelope…", anyPuppy: "any puppy (not sure yet)", messagePlaceholder: "Anything else you'd like to tell us…", successCta: "WhatsApp us" },
};
const VISIT = {
  heading: "Visit us in Downtown Dubai",
  body: "Step into our Downtown Dubai showroom and experience the joy of choosing your puppy face-to-face.",
  data: { mapsLabel: "Open in Google Maps", mapsHref: "https://www.instabizweb.com/" },
};

export async function generateMetadata(): Promise<Metadata> {
  const s = getSection("contact", "header", HEADER);
  return { title: s.data.seoTitle, description: s.data.seoDescription, alternates: { canonical: "/contact" } };
}

export default function ContactPage() {
  const settings = getSettings();
  const wa = whatsappHref(settings);
  const head = getSection("contact", "header", HEADER);
  const letter = getSection("contact", "letter", LETTER);
  const visit = getSection("contact", "visit", VISIT);
  const ld = { ...LETTER.data, ...letter.data };
  const hd = { ...HEADER.data, ...head.data };
  const vd = { ...VISIT.data, ...visit.data };
  const puppies = listPuppies({ status: "available" }).map((p) => ({
    id: p.id,
    label: p.name ? `${p.displayName} (${p.breed}, ${p.genderLabel.toLowerCase()})` : `${p.displayName} (${p.genderLabel.toLowerCase()})`,
  }));
  const photo = visit.media[0];
  return (
    <div data-page="contact" className="tp-page">
      <section data-pup-scene="true" data-tone="light" className="tp-scene " style={{ "--sky-top": "#fff9ee", "--sky-bottom": "#f9dca4" } as React.CSSProperties} aria-labelledby="contact-title">
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <h1 id="contact-title" className="font-plush text-giant max-w-[12ch] lg:col-span-7">{head.heading}</h1>
            <p className="text-lede text-[var(--ink-soft)] lg:col-span-5 lg:pb-3">{head.body}</p>
          </header>
          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
              <LetterForm puppies={puppies} whatsappHref={wa}
                copy={{ greeting: ld.greeting, sign: ld.sign, submit: ld.submit, pending: ld.pending, anyPuppy: ld.anyPuppy, messagePlaceholder: ld.messagePlaceholder, successHeading: letter.heading, successBody: letter.body, successCta: ld.successCta }} />
              <TeddyWaiting />
            </div>
            <div className="lg:col-span-5 lg:row-start-1">
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full sm:w-auto">WhatsApp {settings.phoneDisplay}</a>
              <dl className="mt-10 space-y-6">
                <div><dt className="font-scrawl text-[var(--ink-soft)]">{hd.callLabel}</dt><dd className="mt-1 text-lg font-semibold"><a className="link-ink" href={`tel:${settings.phoneTel}`}>{settings.phoneDisplay}</a></dd></div>
                <div><dt className="font-scrawl text-[var(--ink-soft)]">{hd.emailLabel}</dt><dd className="mt-1 break-all text-lg font-semibold"><a className="link-ink" href={`mailto:${settings.email}`}>{settings.email}</a></dd></div>
              </dl>
              <section aria-labelledby="visit-title" className="tp-shopfront mt-12">
                <svg viewBox="0 0 300 120" className="absolute -bottom-1 right-0 w-3/4 text-toffee/30" aria-hidden="true">
                  <path d="M4 116h292M20 116V78h16v38M44 116V60h18v56M70 116V84h12v32M150 116V36l4-6v-14l3-4 3 4v14l4 6v80M118 116V70l12-8v54M174 116V64l14 8v44M200 116V82h18v34M226 116V56h14v60M248 116V88h22v28" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="tp-visit relative p-7 pt-6">
                  <div>
                    <h2 id="visit-title" className="font-plush text-[2rem] leading-tight">{visit.heading}</h2>
                    <p className="mt-3 max-w-[38ch] text-cocoa-soft">{visit.body}</p>
                    <p className="mt-4 flex items-center gap-2 font-semibold"><Paw className="size-5 shrink-0 text-toffee-deep" />{settings.address}</p>
                    <a href={settings.mapsUrl || vd.mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-6 !bg-milk">{vd.mapsLabel}</a>
                  </div>
                  {photo && (
                    <figure className="tp-visit__photo">
                      <TpImage media={photo} sizes="(min-width: 640px) 11rem, 90vw" loading="lazy" />
                    </figure>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
