import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, must } from "./supabase";

const USER_COOKIE = "nd_user";
const ADMIN_COOKIE = "nd_admin";

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET belum diset (minimal 16 karakter)");
  }
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// ─── Sesi pengguna ───────────────────────────────────────────────────────────
// Cookie berisi `userId.sessionVersion.signature`. sessionVersion dinaikkan saat
// PIN diganti sehingga sesi di perangkat lain otomatis tidak berlaku.

export async function setUserSession(user: { id: string; sessionVersion: number }) {
  const payload = `${user.id}.${user.sessionVersion}`;
  (await cookies()).set(USER_COOKIE, `${payload}.${sign(payload)}`, {
    ...baseCookie,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearUserSession() {
  (await cookies()).delete(USER_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const raw = (await cookies()).get(USER_COOKIE)?.value;
  if (!raw) return null;

  const [id, version, signature] = raw.split(".");
  if (!id || !version || !signature) return null;
  if (!safeEqual(signature, sign(`${id}.${version}`))) return null;

  const user = must(
    await db()
      .from("User")
      .select("*, avatar:Image!User_avatarId_fkey(*), paymentQr:Image!User_paymentQrId_fkey(*)")
      .eq("id", id)
      .maybeSingle(),
  );
  // Akun yang dinonaktifkan admin langsung dianggap keluar
  if (!user || !user.isActive || user.sessionVersion !== Number(version)) return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

// ─── Sesi admin ──────────────────────────────────────────────────────────────
// Token diturunkan dari ADMIN_PASSWORD, jadi mengganti password = semua sesi admin keluar.

function adminToken() {
  const password = process.env.ADMIN_PASSWORD;
  return password ? sign(`admin:${password}`) : null;
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkAdminPassword(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  // Bandingkan HMAC-nya supaya panjang selalu sama untuk timingSafeEqual
  return Boolean(password) && safeEqual(sign(input), sign(password!));
}

export async function setAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, adminToken()!, {
    ...baseCookie,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const token = adminToken();
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(token && raw && safeEqual(raw, token));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
