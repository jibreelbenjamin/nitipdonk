import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { PIN_LENGTH } from "./constants";

function derive(pin: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(pin, salt, 32, (error, key) => (error ? reject(error) : resolve(key))),
  );
}

export function isValidPin(pin: string) {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const key = await derive(pin, salt);
  return `${salt.toString("base64")}:${key.toString("base64")}`;
}

export async function verifyPin(pin: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await derive(pin, Buffer.from(salt, "base64"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
