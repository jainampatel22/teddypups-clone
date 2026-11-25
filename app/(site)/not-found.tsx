import type { Metadata } from "next";
import LostPoster from "@/components/shell/LostPoster";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return <LostPoster />;
}
