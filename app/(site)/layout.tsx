import "../styles/site.css";
import StaticCurtain from "@/_gen/StaticCurtain";
import StaticHeader from "@/_gen/StaticHeader";
import StaticFooter from "@/_gen/StaticFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaticCurtain />
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-cocoa px-5 py-3 font-semibold text-milk">Skip to content</a>
      <StaticHeader />
      <main id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">{children}</main>
      <StaticFooter />
    </>
  );
}
