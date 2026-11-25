import type { Metadata } from "next";
import { getSection, getSettings, listFaqs, whatsappHref } from "@/lib/db";
import NoticeBoard from "@/components/faq/NoticeBoard";
import TeddyReading from "@/components/faq/TeddyReading";

const FALLBACK = {
  heading: "Questions & answers",
  body: "Can't find what you're looking for? Message us on WhatsApp — our team is available 24/7.",
  data: {
    seoTitle: "Questions & answers",
    seoDescription: "Answers about TeddyPups puppies: health checks and vaccinations, meeting local puppies, imported teacup breeds and delivery.",
    searchLabel: "sniff out a question", searchPlaceholder: "delivery, Korea, vaccinated…", askLabel: "Ask your own question",
    emptyLead: "No note about", emptyLink: "Ask us on WhatsApp", emptyTail: "and we'll answer.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const s = getSection("faq", "header", FALLBACK);
  return { title: s.data.seoTitle || s.heading, description: s.data.seoDescription, alternates: { canonical: "/faq" } };
}

export default function FaqPage() {
  const sec = getSection("faq", "header", FALLBACK);
  const d = { ...FALLBACK.data, ...sec.data };
  const faqs = listFaqs();
  const ask = whatsappHref(getSettings());
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
  return (
    <div data-page="faq" className="tp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <section data-pup-scene="true" data-tone="dark" className="tp-scene tp-faqroom overflow-hidden" style={{ "--sky-top": "#a95e32", "--sky-bottom": "#331c11" } as React.CSSProperties} aria-labelledby="faq-title">
        <div className="gutter relative mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <header className="max-w-4xl">
            <h1 id="faq-title" className="font-plush text-giant">{sec.heading}</h1>
            <p className="text-lede mt-6 max-w-[52ch] text-[var(--ink-soft)]">{sec.body}</p>
          </header>
          <div className="mt-12 md:mt-16">
            <NoticeBoard faqs={faqs} askHref={ask} teddy={<TeddyReading />}
              copy={{ label: d.searchLabel, placeholder: d.searchPlaceholder, ask: d.askLabel, emptyLead: d.emptyLead, emptyLink: d.emptyLink, emptyTail: d.emptyTail }} />
          </div>
        </div>
      </section>
    </div>
  );
}
