"use client";
// Live, interactive Teddy (same props the original passes to PupBuddy).
import { PupBuddy } from "@/components/pup/runtime";
export default function TeddyPicking() {
  return <PupBuddy pose="sit" act="tilt" className="tp-journeys__teddy" label="Teddy, waiting to see which way you pick" />;
}
