"use client";
import { usePathname } from "next/navigation";
import { PupJourney } from "@/components/pup/runtime";

/** The original mounts PupJourney (global walking mascot + paw prints) only on the home page, inside <main> after the page. */
export default function HomeJourney() {
  return usePathname() === "/" ? <PupJourney /> : null;
}
