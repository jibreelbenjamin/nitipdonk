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

/** Daftar id dari client (mis. baris yang dipilih di tabel admin), sudah dibersihkan dari duplikat. */
export function getIds(value: unknown, max = 500): string[] {
  if (!Array.isArray(value)) throw new ActionError("Data tidak valid");
  const ids = [
    ...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 40)),
  ];
  if (ids.length === 0) throw new ActionError("Pilih minimal satu data");
  if (ids.length > max) throw new ActionError(`Maksimal ${max} data sekaligus`);
  return ids;
}

export function getPaymentMethod(formData: FormData) {
  const value = getString(formData, "paymentMethod", 10);
  if (value !== "CASH" && value !== "CASHLESS") throw new ActionError("Pilih metode bayar");
  return value;
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
