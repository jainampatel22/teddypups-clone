import type { Metadata, Viewport } from "next";
import "./styles/fonts.css";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = getSettings();
  return {
    metadataBase: new URL(process.env.SITE_URL || "http://localhost:3077"),
    title: { default: s.seo.title, template: `%s | ${s.siteName}` },
    description: s.seo.description,
    applicationName: s.siteName,
    openGraph: { title: s.seo.title, description: s.seo.description, images: [s.seo.ogImage] },
    twitter: { card: "summary_large_image", title: s.seo.title, description: s.seo.description, images: [s.seo.ogImage] },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#fffdf8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="Veu4Sq_variable hpvSLW_variable _91XIoq_variable" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
