import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, uid } from "@/lib/db";

export const SESSION_COOKIE = "tp_admin";
const SESSION_DAYS = 14;

/* ------------------------------ password hashing ------------------------------ */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [alg, N, r, p, saltB64, keyB64] = stored.split("$");
  if (alg !== "scrypt") return false;
  const key = Buffer.from(keyB64, "base64");
  const test = crypto.scryptSync(password, Buffer.from(saltB64, "base64"), key.length, { N: +N, r: +r, p: +p });
  return crypto.timingSafeEqual(key, test);
}

/* ------------------------------ first admin ------------------------------ */

const g = globalThis as unknown as { __tpAdminChecked?: boolean };

/** Create the first admin from ADMIN_EMAIL/ADMIN_PASSWORD, or a random one written to data/ADMIN_CREDENTIALS.txt. */
export function ensureAdmin() {
  if (g.__tpAdminChecked) return;
  const db = getDb();
  const n = (db.prepare("SELECT COUNT(*) AS n FROM admin_users").get() as any).n;
  if (!n) {
    const email = (process.env.ADMIN_EMAIL || "admin@teddypups.local").toLowerCase().trim();
    const fromEnv = !!process.env.ADMIN_PASSWORD;
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
    db.prepare("INSERT INTO admin_users (id, email, password_hash) VALUES (?,?,?)").run(uid(), email, hashPassword(password));
    if (!fromEnv) {
      const file = path.join(process.cwd(), "data", "ADMIN_CREDENTIALS.txt");
      fs.writeFileSync(file, `TeddyPups admin (created ${new Date().toISOString()})\nURL: /admin/login\nEmail: ${email}\nPassword: ${password}\n\nChange it in Admin > Settings > Account, then delete this file.\n`, { mode: 0o600 });
      console.log(`\n[teddypups] First admin created: ${email} / ${password}\n[teddypups] Saved to data/ADMIN_CREDENTIALS.txt\n`);
    } else {
      console.log(`[teddypups] First admin created from ADMIN_EMAIL/ADMIN_PASSWORD: ${email}`);
    }
  }
  g.__tpAdminChecked = true;
}

/* ------------------------------ sessions ------------------------------ */

export type AdminUser = { id: string; email: string };

/*
 * Stateless sessions: the cookie is "<payload>.<hmac>" where payload = base64url(JSON {email, exp}).
 * Works across serverless instances (no session table lookup). Secret: ADMIN_SESSION_SECRET env,
 * or locally a value derived from the first admin's password hash (so a password change logs everyone out).
 */
function sessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  const row: any = getDb().prepare("SELECT password_hash FROM admin_users ORDER BY created_at LIMIT 1").get();
  return crypto.createHash("sha256").update("tp-session:" + (row?.password_hash || "none")).digest("hex");
}
const sign = (payload: string) => crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

export async function createSession(userId: string) {
  const row: any = getDb().prepare("SELECT email FROM admin_users WHERE id = ?").get(userId);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const payload = Buffer.from(JSON.stringify({ email: row?.email, exp: expires.getTime() })).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getAdmin(): Promise<AdminUser | null> {
  ensureAdmin();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !token.includes(".")) return null;
  const [payload, mac] = token.split(".");
  const expected = sign(payload);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  let data: { email?: string; exp?: number };
  try { data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { return null; }
  if (!data.email || !data.exp || data.exp < Date.now()) return null;
  const row: any = getDb().prepare("SELECT id, email FROM admin_users WHERE email = ?").get(data.email);
  return row ? { id: String(row.id), email: String(row.email) } : null;
}

/** For pages and server actions: redirects to the login page when not signed in. */
export async function requireAdmin(): Promise<AdminUser> {
  const u = await getAdmin();
  if (!u) redirect("/admin/login");
  return u;
}

/** For route handlers: returns a 401 Response when not signed in. */
export async function adminOr401(): Promise<AdminUser | Response> {
  const u = await getAdmin();
  return u ?? Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function checkLogin(email: string, password: string): AdminUser | null {
  ensureAdmin();
  const row: any = getDb().prepare("SELECT id, email, password_hash FROM admin_users WHERE email = ?").get(email.toLowerCase().trim());
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, email: row.email };
}

export function changePassword(userId: string, current: string, next: string): string | null {
  const row: any = getDb().prepare("SELECT password_hash FROM admin_users WHERE id = ?").get(userId);
  if (!row || !verifyPassword(current, row.password_hash)) return "Current password is wrong.";
  if (next.length < 8) return "New password must be at least 8 characters.";
  getDb().prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(hashPassword(next), userId);
  return null;
}
