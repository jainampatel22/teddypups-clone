import type { Metadata } from "next";
import "../../styles/clone-pages.css";
import { getSection, listHappyPhotos, listTestimonials } from "@/lib/db";
import MemoryWall from "@/components/families/MemoryWall";
import TeddyAdmiring from "@/components/families/TeddyAdmiring";
import RevealScope from "@/components/faq/RevealScope";

const HEAD = {
  heading: "Happy families",
  body: "Nothing makes us happier than seeing our puppies in loving homes! Here are some beautiful moments shared by our amazing clients after welcoming their furry friends.",
  data: {
    kicker: "our wall of happy endings", countSuffix: "moments and counting", footnote: "every one of them was a Teddy Pup once", showCaptions: false,
    seoTitle: "Happy families", seoDescription: "Real photos shared by TeddyPups families after welcoming their new puppy home.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const s = getSection("happy-families", "header", HEAD);
  return { title: s.data.seoTitle || s.heading, description: s.data.seoDescription, alternates: { canonical: "/happy-families" } };
}

export default function HappyFamiliesPage() {
  const sec = getSection("happy-families", "header", HEAD);
  const d = { ...HEAD.data, ...sec.data };
  const photos = listHappyPhotos();
  const t = listTestimonials()[0];
  return (
    <div data-page="families" className="tp-page">
      <section aria-labelledby="families-title" className="tp-memories">
        <div className="gutter mx-auto max-w-[110rem] pb-24 pt-10 md:pt-16">
          <RevealScope className="tp-memories__head">
            <div>
              <p className="font-scrawl text-lg text-toffee-ink" data-reveal="true">{d.kicker}</p>
              <h1 id="families-title" className="font-plush text-giant tp-memories__title" data-reveal="true">
                {sec.heading}
                <svg viewBox="0 0 48 44" className="tp-memories__heart" aria-hidden="true">
                  <path d="M24 40C10 30 4 22 4 14.5 4 8.7 8.6 4 14.3 4c4.1 0 7.6 2.4 9.7 6 2.1-3.6 5.6-6 9.7-6C39.4 4 44 8.7 44 14.5 44 22 38 30 24 40z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </h1>
              <p className="text-lede mt-6 max-w-[50ch] text-cocoa-soft" data-reveal="true">{sec.body}</p>
              <p className="font-scrawl mt-5 text-lg text-toffee-ink" data-reveal="true">{photos.length} {d.countSuffix}</p>
            </div>
            {t && (
              <figure className="tp-memories__note" data-reveal="true">
                <span aria-hidden="true" className="tp-tape tp-tape--center" style={{ "--tape": "#cfe5f6" } as React.CSSProperties} />
                <blockquote className="font-plush-text">“{t.quote}”</blockquote>
                <figcaption className="font-scrawl">{t.name}{t.location ? `, ${t.location}` : ""}</figcaption>
              </figure>
            )}
          </RevealScope>
          <div className="mt-16 md:mt-20">
            <MemoryWall photos={photos} showCaptions={!!d.showCaptions} />
          </div>
          <div className="tp-memories__foot">
            <TeddyAdmiring />
            <p className="font-scrawl text-lg text-cocoa-soft">{d.footnote}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
