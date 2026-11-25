"use client";
// Live, interactive Teddy (same props the original passes to PupBuddy).
import { PupBuddy } from "@/components/pup/runtime";
export default function TeddyCare() {
  return <PupBuddy pose="bow" facing="left" className="mx-auto w-48 md:w-56" label="Teddy, ready to play" />;
}
