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

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  getDb().prepare("INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?,?,?)").run(token, userId, expires.toISOString());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
  jar.delete(SESSION_COOKIE);
}

export async function getAdmin(): Promise<AdminUser | null> {
  ensureAdmin();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const row: any = db.prepare("SELECT s.expires_at, u.id, u.email FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token = ?").get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
    return null;
  }
  return { id: row.id, email: row.email };
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
