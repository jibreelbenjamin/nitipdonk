import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashSecret, verifySecret } from "./hash";
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
// Password admin disimpan sebagai hash di tabel Setting. Token sesi diturunkan dari hash itu,
// jadi mengganti password = semua sesi admin lain keluar.

const ADMIN_PASSWORD_KEY = "adminPasswordHash";

async function getAdminPasswordHash() {
  const row = must(await db().from("Setting").select("value").eq("key", ADMIN_PASSWORD_KEY).maybeSingle());
  return row?.value ?? null;
}

export async function isAdminConfigured() {
  return Boolean(await getAdminPasswordHash());
}

export async function checkAdminPassword(input: string) {
  const hash = await getAdminPasswordHash();
  return Boolean(hash) && (await verifySecret(input, hash!));
}

/** Simpan password admin baru; sesi admin lain otomatis keluar. Mengembalikan hash-nya. */
export async function setAdminPassword(password: string) {
  const hash = await hashSecret(password);
  must(await db().from("Setting").upsert({ key: ADMIN_PASSWORD_KEY, value: hash }));
  return hash;
}

/** Tandai perangkat ini sebagai admin. `hash` diisi saat password baru saja diganti. */
export async function setAdminSession(hash?: string) {
  const passwordHash = hash ?? (await getAdminPasswordHash());
  if (!passwordHash) throw new Error("Password admin belum diatur");
  (await cookies()).set(ADMIN_COOKIE, sign(`admin:${passwordHash}`), {
    ...baseCookie,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const hash = await getAdminPasswordHash();
  return Boolean(hash) && safeEqual(raw, sign(`admin:${hash}`));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
