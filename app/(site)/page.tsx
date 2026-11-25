import "../styles/clone-home.css";
import Chat from "@/components/home/Chat";
import Dusk from "@/components/home/Dusk";
import HeroLineup from "@/components/home/HeroLineup";
import Meet, { type MeetPup } from "@/components/home/Meet";
import CtaSection from "@/components/home/sections/CtaSection";
import HeroSection from "@/components/home/sections/HeroSection";
import PathsSection from "@/components/home/sections/PathsSection";
import QaSpark from "@/components/home/sections/QaSpark";
import QuestionsSection from "@/components/home/sections/QuestionsSection";
import TrustSection from "@/components/home/sections/TrustSection";
import { getSection, getSettings, listBreeds, listFaqs, listHappyPhotos, listPuppies, listTestimonials, whatsappHref } from "@/lib/db";

export const dynamic = "force-dynamic";

// Generated section components (components/home/sections/*) already include their <div data-section> wrapper.
export default function Home() {
  const settings = getSettings();
  const wa = whatsappHref(settings);
  const sec = (key: string) => getSection("home", key);
  const hero = sec("hero"), meet = sec("meet"), paths = sec("paths"), journey = sec("journey"), trust = sec("trust");
  const families = sec("families"), questions = sec("questions"), cta = sec("cta");

  const available = listPuppies({ status: ["available", "reserved"] });
  const friends = available.filter((p) => p.cover).map((p) => ({ id: p.id, slug: p.slug, displayName: p.displayName, breed: p.breed, cover: p.cover }));
  const meetPups: MeetPup[] = available.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, displayName: p.displayName, breed: p.breed, genderLabel: p.genderLabel,
    age: p.age, status: p.status, cover: p.cover, hasVideo: p.media.some((m) => m.kind === "video"),
  }));
  // Chat chips: breeds that have puppies right now.
  const liveBreeds = new Set(available.flatMap((p) => p.breeds.map((b) => b.slug)));
  const breedsNow = listBreeds().filter((b) => liveBreeds.has(b.slug)).map((b) => ({ slug: b.slug, name: b.name }));
  const faqs = listFaqs().slice(0, questions.data.count ?? 3);
  const testimonial = listTestimonials()[0] ?? null;

  const ld = {
    "@context": "https://schema.org", "@type": "PetStore", name: settings.siteName, description: settings.footerBlurb,
    url: process.env.SITE_URL || "http://localhost:3077", logo: "/brand/logo.png", image: "/brand/logo.png",
    telephone: settings.phoneDisplay, email: settings.email,
    address: { "@type": "PostalAddress", streetAddress: settings.address, addressLocality: "Dubai", addressCountry: "AE" },
    sameAs: settings.socials.map((s) => s.href),
  };

  return (
    <div data-page="home" className="tp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <HeroSection t={{ ...hero.data, body: hero.body, whatsappHref: wa }} slots={{ lineup: <HeroLineup friends={friends} /> }} />
      <div data-section="meet"><Meet section={meet} puppies={meetPups} /></div>
      <PathsSection t={{ heading: paths.heading }} slots={{}} />
      <div data-section="journey">
        <Chat section={journey} business={settings.siteName} greeting={journey.data.greeting ?? "Hi TeddyPups! I'd love to know more about your puppies."} whatsappHref={wa} breeds={breedsNow} />
      </div>
      <TrustSection t={{ heading: trust.heading, kicker: trust.data.kicker }} slots={{}} />
      <div data-section="families">
        <Dusk section={families} photos={listHappyPhotos()} homePhotos={listHappyPhotos({ homeOnly: true })} testimonial={testimonial} />
      </div>
      <QuestionsSection
        t={{ heading: questions.heading, ctaLabel: questions.data.ctaLabel, ctaHref: questions.data.ctaHref ?? "/faq" }}
        slots={{
          faqs: (
            <dl className="tp-night__list">
              {faqs.map((f, i) => (
                <div key={f.id} className="tp-qa" data-pup-look={i < 2 ? "" : undefined}>
                  <dt className="font-plush tp-qa__q"><QaSpark />{f.question}</dt>
                  <dd className="tp-qa__a">{f.answer}</dd>
                </div>
              ))}
            </dl>
          ),
        }}
      />
      <CtaSection t={{ heading: cta.heading, body: cta.body, whatsappHref: wa }} slots={{}} />
    </div>
  );
}
