import "server-only";
import { unstable_rethrow } from "next/navigation";

export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string };

/** Error yang pesannya aman ditampilkan ke pengguna. */
export class ActionError extends Error {}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ActionError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Terjadi kesalahan, coba lagi." };
  }
}

export function getString(formData: FormData, name: string, maxLength = 500) {
  const value = formData.get(name);
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, maxLength) : "";
}

export function getFile(formData: FormData, name: string): File | null {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

export function getFiles(formData: FormData, name: string): File[] {
  return formData.getAll(name).filter((value): value is File => value instanceof File && value.size > 0);
}

/** Harga opsional dalam rupiah; menerima "15000", "15.000", atau "Rp 15.000". */
export function getPrice(formData: FormData, name: string): number | null {
  const digits = getString(formData, name, 20).replace(/\D/g, "");
  if (!digits) return null;
  const price = Number(digits);
  if (!Number.isSafeInteger(price) || price > 100_000_000) {
    throw new ActionError("Harga tidak valid");
  }
  return price;
}
