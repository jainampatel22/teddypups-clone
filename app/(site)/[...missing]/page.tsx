import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

// Any unknown URL renders app/(site)/not-found.tsx inside the site layout.
export default function Missing() {
  notFound();
}
