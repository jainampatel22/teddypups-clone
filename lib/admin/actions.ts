"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkLogin, createSession, destroySession, requireAdmin, changePassword } from "./auth";
import * as repo from "./repo";
import { getPuppyById } from "@/lib/db";
import type { Settings } from "@/lib/types";

/* Public pages that read each kind of data. Pages are force-dynamic today; this keeps caching correct if that changes. */
const PUPPY_PATHS = ["/", "/puppies", "/gone-home", "/contact", "/sitemap.xml"];
function revalidate(paths: string[]) {
  for (const p of new Set(paths)) revalidatePath(p);
}
function revalidatePuppy(slug?: string | null) {
  revalidate(PUPPY_PATHS);
  if (slug) revalidatePath(`/puppies/${slug}`);
  revalidatePath("/puppies/[slug]", "page");
  revalidatePath("/admin", "layout");
}

/* ---------------------------------- auth ---------------------------------- */

export type FormState = { ok?: boolean; error?: string; message?: string; email?: string } | null;

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const user = checkLogin(email, password);
  if (!user) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: "That email and password don't match.", email };
  }
  await createSession(user.id);
  const next = String(form.get("next") || "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const u = await requireAdmin();
  const err = changePassword(u.id, String(form.get("current") || ""), String(form.get("next") || ""));
  return err ? { error: err } : { ok: true, message: "Password updated." };
}

/* ---------------------------------- puppies ---------------------------------- */

export async function savePuppyAction(input: repo.PuppyInput): Promise<{ ok: boolean; id?: string; slug?: string; error?: string }> {
  await requireAdmin();
  if (!input.name?.trim() && !input.displayName?.trim() && !input.breed?.trim()) return { ok: false, error: "Give the puppy a name, display name or breed." };
  if (!["available", "reserved", "home"].includes(input.status)) return { ok: false, error: "Invalid status." };
  const before = input.id ? getPuppyById(input.id) : null;
  const res = repo.savePuppy(input);
  revalidatePuppy(res.slug);
  if (before && before.slug !== res.slug) revalidatePath(`/puppies/${before.slug}`);
  return { ok: true, ...res };
}

export async function deletePuppyAction(id: string, deleteMedia: boolean) {
  await requireAdmin();
  const p = getPuppyById(id);
  const mediaIds = repo.deletePuppy(id);
  if (deleteMedia) for (const m of mediaIds) repo.deleteMediaIfUnused(m);
  revalidatePuppy(p?.slug);
  return { ok: true };
}

export async function setPuppyFieldAction(id: string, field: "published" | "status" | "featured", value: any) {
  await requireAdmin();
  if (field === "status" && !["available", "reserved", "home"].includes(value)) return { ok: false };
  repo.setPuppyField(id, field, value);
  revalidatePuppy(getPuppyById(id)?.slug);
  return { ok: true };
}

export async function reorderAction(table: Parameters<typeof repo.reorder>[0], ids: string[]) {
  await requireAdmin();
  repo.reorder(table, ids);
  const paths: Record<string, string[]> = {
    puppies: PUPPY_PATHS, faqs: ["/", "/faq"], testimonials: ["/", "/happy-families"], happy_photos: ["/", "/happy-families"],
    breeds: ["/puppies"], origins: ["/puppies"], collections: ["/puppies"],
  };
  revalidate(paths[table] ?? ["/"]);
  return { ok: true };
}

/* ---------------------------------- media ---------------------------------- */

export async function updateMediaAction(id: string, f: { alt?: string; caption?: string; focalX?: number; focalY?: number }) {
  await requireAdmin();
  repo.updateMedia(id, f);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteMediaAction(id: string) {
  await requireAdmin();
  const err = repo.deleteMediaIfUnused(id);
  if (err) return { ok: false, error: err };
  revalidatePath("/admin/media");
  return { ok: true };
}

/* ------------------------------- happy families ------------------------------- */

export async function addHappyPhotosAction(ids: string[]) {
  await requireAdmin();
  repo.addHappyPhotos(ids);
  revalidate(["/", "/happy-families", "/admin/families"]);
  return { ok: true };
}
export async function setHappyHomeAction(id: string, on: boolean) {
  await requireAdmin();
  repo.setHappyHome(id, on);
  revalidate(["/", "/happy-families"]);
  return { ok: true };
}
export async function removeHappyAction(id: string, alsoDeleteFile: boolean) {
  await requireAdmin();
  repo.removeHappy(id);
  if (alsoDeleteFile) repo.deleteMediaIfUnused(id);
  revalidate(["/", "/happy-families", "/admin/families"]);
  return { ok: true };
}

/* ------------------------------- faqs / testimonials ------------------------------- */

export async function saveFaqAction(f: { id?: string; question: string; answer: string; published: boolean }) {
  await requireAdmin();
  if (!f.question.trim() || !f.answer.trim()) return { ok: false, error: "Question and answer are required." };
  repo.saveFaq({ ...f, question: f.question.trim(), answer: f.answer.trim() });
  revalidate(["/", "/faq", "/admin/faqs"]);
  return { ok: true };
}
export async function deleteFaqAction(id: string) {
  await requireAdmin();
  repo.deleteFaq(id);
  revalidate(["/", "/faq", "/admin/faqs"]);
  return { ok: true };
}
export async function saveTestimonialAction(t: { id?: string; quote: string; name: string; location: string; published: boolean }) {
  await requireAdmin();
  if (!t.quote.trim()) return { ok: false, error: "Quote is required." };
  repo.saveTestimonial(t);
  revalidate(["/", "/happy-families", "/admin/families"]);
  return { ok: true };
}
export async function deleteTestimonialAction(id: string) {
  await requireAdmin();
  repo.deleteTestimonial(id);
  revalidate(["/", "/happy-families", "/admin/families"]);
  return { ok: true };
}

/* ---------------------------------- taxonomy ---------------------------------- */

export async function saveTaxonomyAction(table: repo.TaxTable, oldSlug: string | null, name: string, slug: string) {
  await requireAdmin();
  if (!["breeds", "origins", "collections"].includes(table)) return { ok: false, error: "Bad table" };
  const err = repo.saveTaxonomy(table, oldSlug, name, slug);
  if (err) return { ok: false, error: err };
  revalidate([...PUPPY_PATHS, "/admin/taxonomy"]);
  revalidatePath("/puppies/[slug]", "page");
  return { ok: true };
}
export async function deleteTaxonomyAction(table: repo.TaxTable, slug: string) {
  await requireAdmin();
  repo.deleteTaxonomy(table, slug);
  revalidate([...PUPPY_PATHS, "/admin/taxonomy"]);
  return { ok: true };
}

/* ---------------------------------- sections / settings ---------------------------------- */

const pageToPath = (page: string) => (page === "home" ? "/" : page === "puppy" ? "/puppies/[slug]" : `/${page}`);

export async function saveSectionAction(page: string, key: string, s: { heading: string; body: string; data: any; mediaIds: string[] }) {
  await requireAdmin();
  if (typeof s.data !== "object" || s.data === null || Array.isArray(s.data)) return { ok: false, error: "Data must be a JSON object." };
  repo.saveSection(page, key, s);
  const p = pageToPath(page);
  if (p.includes("[")) revalidatePath(p, "page");
  else revalidatePath(p);
  return { ok: true };
}

export async function saveSettingsAction(s: Partial<Settings>) {
  await requireAdmin();
  if (s.whatsappNumber !== undefined && !/^\d{6,16}$/.test(s.whatsappNumber)) return { ok: false, error: "WhatsApp number: digits only with country code, e.g. 971500000000." };
  repo.saveSettings(s);
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------------------------------- enquiries ---------------------------------- */

export async function setEnquiryStatusAction(id: string, status: "new" | "read" | "archived") {
  await requireAdmin();
  repo.setEnquiryStatus(id, status);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
export async function deleteEnquiryAction(id: string) {
  await requireAdmin();
  repo.deleteEnquiry(id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function listMediaAction() {
  await requireAdmin();
  return repo.listAllMedia();
}
