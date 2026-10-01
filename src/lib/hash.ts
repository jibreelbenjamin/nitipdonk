import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Hash scrypt untuk PIN pengguna dan password admin, disimpan sebagai `salt:hash` (base64).
// scripts/set-admin-password.mjs memakai format yang sama.
function derive(secret: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(secret, salt, 32, (error, key) => (error ? reject(error) : resolve(key))),
  );
}

export async function hashSecret(secret: string) {
  const salt = randomBytes(16);
  const key = await derive(secret, salt);
  return `${salt.toString("base64")}:${key.toString("base64")}`;
}

export async function verifySecret(secret: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await derive(secret, Buffer.from(salt, "base64"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
