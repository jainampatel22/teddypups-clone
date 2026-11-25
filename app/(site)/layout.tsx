import "../styles/site.css";
import Header from "@/components/shell/Header";
import Footer from "@/components/shell/Footer";
import HomeJourney from "@/components/shell/HomeJourney";
import { RouteCurtain, SmoothScroll, PawTrailCanvas } from "@/components/pup/runtime";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteCurtain />
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-cocoa px-5 py-3 font-semibold text-milk">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
        {children}
        <HomeJourney />
      </main>
      <Footer />
      <PawTrailCanvas />
      <SmoothScroll />
    </>
  );
}
