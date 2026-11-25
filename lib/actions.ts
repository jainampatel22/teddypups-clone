"use server";
import { headers } from "next/headers";
import { createEnquiry, getPuppyById } from "./db";

export type EnquiryState = { ok: boolean; error?: string; fieldErrors?: Record<string, string> } | null;

/** Shared server action for the puppy-page EnquiryForm and the contact LetterForm (original name: sendEnquiry). */
export async function sendEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  // Honeypot: real people never fill the hidden "website" field.
  if (String(form.get("website") || "").trim()) return { ok: true };
  const name = String(form.get("name") || "").trim();
  const phone = String(form.get("phone") || "").trim();
  const email = String(form.get("email") || "").trim();
  const area = String(form.get("area") || "").trim().slice(0, 80);
  const message = String(form.get("message") || "").trim().slice(0, 2000);
  const puppyId = String(form.get("puppyId") || "").trim() || null;
  const source = form.get("source") === "puppy" ? "puppy" : "contact";
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2 || name.length > 80) fieldErrors.name = "Please tell us your name.";
  if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) fieldErrors.phone = "Please add a phone or WhatsApp number with country code.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "That email doesn't look right.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, error: Object.values(fieldErrors)[0] };
  if (puppyId && !getPuppyById(puppyId)) return { ok: false, error: "That puppy is no longer listed." };
  const ua = (await headers()).get("user-agent") || "";
  createEnquiry({ name, phone, email, area, message, puppyId, source, userAgent: ua });
  return { ok: true };
}
