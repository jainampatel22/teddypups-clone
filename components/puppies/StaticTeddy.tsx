"use client";
// Live, interactive Teddy (same props the original passes to PupBuddy).
import { PupBuddy } from "@/components/pup/runtime";
export function Teddy_sit() {
  return <PupBuddy pose="sit" facing="left" label="Teddy, the TeddyPups puppy" />;
}
export function Teddy_tag({ name = "Max" }: { name?: string }) {
  return <PupBuddy pose="peek" className="absolute -top-[4.8rem] right-6 w-[9.5rem]" label={`Teddy, peeking over ${name}'s tag`} />;
}
export function Teddy_booth() {
  return <PupBuddy pose="peek" className="tp-booth__teddy" />;
}
