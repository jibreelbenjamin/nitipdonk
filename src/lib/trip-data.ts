import "server-only";
import { ActionError, getFiles, getString } from "./action";
import { MAX_CLOSE_MINUTES, MAX_TRIP_IMAGES, TIME_ZONE_OFFSET } from "./constants";
import { deleteImages, saveImage } from "./images";
import { db, must } from "./supabase";

/** Filter PostgREST dikirim lewat URL, jadi daftar id panjang diproses per 100. */
export function chunks<T>(items: T[], size = 100) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

/** Waktu tutup dari isian "tutup dalam N menit"; kosong berarti tanpa batas. */
export function closesAtFromMinutes(input: string) {
  if (!input) return null;
  const minutes = Number(input);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_CLOSE_MINUTES) {
    throw new ActionError(`Waktu tutup harus 1–${MAX_CLOSE_MINUTES} menit`);
  }
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

/** Waktu tutup dari input datetime-local ("2026-10-02T11:30", jam WIB); kosong berarti tanpa batas. */
export function closesAtFromLocalInput(input: string) {
  if (!input) return null;
  const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input) ? new Date(`${input}:00${TIME_ZONE_OFFSET}`) : null;
  if (!date || Number.isNaN(date.getTime())) throw new ActionError("Jam tutup tidak valid");
  return date.toISOString();
}

/** Buat titipan dari form "Buka titipan" (judul, catatan, tutup dalam, gambar) atas nama `hostId`. */
export async function insertTripFromForm(hostId: string, formData: FormData) {
  const title = getString(formData, "title", 80);
  const note = getString(formData, "note", 300);
  if (!title) throw new ActionError("Isi mau beli di mana / apa");
  const files = getFiles(formData, "images");
  if (files.length > MAX_TRIP_IMAGES) throw new ActionError(`Maksimal ${MAX_TRIP_IMAGES} gambar`);
  const closesAt = closesAtFromMinutes(getString(formData, "closesInMinutes", 4));

  const trip = must(
    await db()
      .from("Trip")
      .insert({ hostId, title, note: note || null, closesAt })
      .select("id")
      .single(),
  );
  try {
    await saveTripImages(trip.id, files);
  } catch (error) {
    // Gagal menyimpan gambar → batalkan titipannya supaya bisa dicoba lagi dari awal
    must(await db().from("Trip").delete().eq("id", trip.id));
    throw error;
  }
  return trip.id;
}

/** Simpan lampiran satu per satu; kalau ada yang gagal, yang sudah tersimpan ikut dihapus. */
export async function saveTripImages(tripId: string, files: File[]) {
  const saved: string[] = [];
  try {
    for (const file of files) saved.push((await saveImage(file, "TRIP", { tripId })).id);
  } catch (error) {
    await deleteImages(saved);
    throw error;
  }
}

/** Tambah lampiran ke titipan yang sudah ada, tanpa melewati batas jumlah gambar. */
export async function addTripImagesFromForm(tripId: string, formData: FormData) {
  const files = getFiles(formData, "images");
  if (files.length === 0) throw new ActionError("Pilih gambar dulu");
  const existing = must(await db().from("Image").select("id").eq("tripId", tripId));
  if (existing.length + files.length > MAX_TRIP_IMAGES) {
    throw new ActionError(`Maksimal ${MAX_TRIP_IMAGES} gambar per titipan`);
  }
  await saveTripImages(tripId, files);
}

/** Hapus titipan beserta pesanan, bukti bayar, dan lampirannya (file di storage ikut dihapus). */
export async function deleteTripsWithFiles(tripIds: string[]) {
  for (const ids of chunks(tripIds)) {
    const orders = must(await db().from("Order").select("proofId").in("tripId", ids));
    const images = must(await db().from("Image").select("id").in("tripId", ids));
    await deleteImages([...orders.map((order) => order.proofId), ...images.map((image) => image.id)]);
    // Pesanan ikut terhapus lewat ON DELETE CASCADE
    must(await db().from("Trip").delete().in("id", ids));
  }
}

/** Hapus pesanan beserta file bukti bayarnya. */
export async function deleteOrdersWithFiles(orderIds: string[]) {
  for (const ids of chunks(orderIds)) {
    const orders = must(await db().from("Order").select("proofId").in("id", ids));
    await deleteImages(orders.map((order) => order.proofId));
    must(await db().from("Order").delete().in("id", ids));
  }
}
