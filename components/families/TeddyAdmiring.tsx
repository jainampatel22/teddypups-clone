"use client";
// Live, interactive Teddy (same props the original passes to PupBuddy).
import { PupBuddy } from "@/components/pup/runtime";
export default function TeddyAdmiring() {
  return <PupBuddy pose="sit" facing="left" className="w-36 md:w-44" label="Teddy, admiring the wall" />;
}
