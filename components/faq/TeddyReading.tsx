"use client";
// Live, interactive Teddy (same props the original passes to PupBuddy).
import { PupBuddy } from "@/components/pup/runtime";
export default function TeddyReading() {
  return <PupBuddy pose="sit" act="tilt" label="Teddy, reading the notes" />;
}
