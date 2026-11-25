"use client";
// Live, interactive Teddy (same props the original passes to PupBuddy).
import { PupBuddy } from "@/components/pup/runtime";
export default function TeddyWaiting() {
  return <PupBuddy pose="sit" facing="left" className="ml-auto mr-6 -mt-3 w-36 md:w-40" label="Teddy, waiting for your letter" />;
}
