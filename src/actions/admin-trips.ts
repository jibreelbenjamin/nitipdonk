"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  ActionError,
  type ActionResult,
  getFile,
  getIds,
  getPaymentMethod,
  getPrice,
  getString,
  runAction,
} from "@/lib/action";
import { Constants, type Enums } from "@/lib/database.types";
import { deleteImages, saveImage } from "@/lib/images";
import { requireAdmin } from "@/lib/session";
import { db, must } from "@/lib/supabase";
import {
  addTripImagesFromForm,
  chunks,
  closesAtFromLocalInput,
  deleteOrdersWithFiles,
  deleteTripsWithFiles,
  insertTripFromForm,
} from "@/lib/trip-data";

// Admin boleh mengelola semua titipan & pesanan tanpa batasan pembuka/pemesan maupun status titipan.

type TripStatus = Enums<"TripStatus">;

function getStatus(value: unknown): TripStatus {
  const status = Constants.public.Enums.TripStatus.find((item) => item === value);
  if (!status) throw new ActionError("Status titipan tidak valid");
  return status;
}

async function getUserId(formData: FormData, name: string, emptyMessage: string) {
  const id = getString(formData, name, 40);
  if (!id) throw new ActionError(emptyMessage);
  const user = must(await db().from("User").select("id").eq("id", id).maybeSingle());
  if (!user) throw new ActionError("Pengguna tidak ditemukan");
  return user.id;
}

async function findTrip(tripId: string) {
  const trip = must(await db().from("Trip").select("id").eq("id", tripId).maybeSingle());
  if (!trip) throw new ActionError("Titipan tidak ditemukan");
  return trip;
}

async function findOrder(orderId: string) {
  const order = must(await db().from("Order").select("id, proofId").eq("id", orderId).maybeSingle());
  if (!order) throw new ActionError("Pesanan tidak ditemukan");
  return order;
}

// ─── Titipan ─────────────────────────────────────────────────────────────────

/** Buka titipan atas nama pengguna mana pun. */
export async function adminCreateTrip(_prev: ActionResult<string> | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const hostId = await getUserId(formData, "hostId", "Pilih pembuka titipan");
    return insertTripFromForm(hostId, formData);
  });
  if (result.ok) redirect(`/admin/titipan/${result.data}`);
  return result;
}

/** Ubah semua data titipan, termasuk pembuka, status, dan jam tutup. */
export async function adminUpdateTrip(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const trip = await findTrip(getString(formData, "tripId", 40));
    const hostId = await getUserId(formData, "hostId", "Pilih pembuka titipan");
    const title = getString(formData, "title", 80);
    if (!title) throw new ActionError("Isi mau beli di mana / apa");
    const note = getString(formData, "note", 300);
    must(
      await db()
        .from("Trip")
        .update({
          hostId,
          title,
          note: note || null,
          status: getStatus(getString(formData, "status", 10)),
          closesAt: closesAtFromLocalInput(getString(formData, "closesAt", 20)),
        })
        .eq("id", trip.id),
    );
  });
  if (result.ok) refresh();
  return result;
}

/** Ubah status beberapa titipan sekaligus. Dibuka lagi setelah jam tutup lewat → batas waktunya dihapus. */
export async function adminSetTripsStatus(tripIds: string[], status: TripStatus) {
  const result = await runAction(async () => {
    await requireAdmin();
    const ids = getIds(tripIds);
    const nextStatus = getStatus(status);
    const now = new Date();
    for (const chunk of chunks(ids)) {
      const trips = must(await db().from("Trip").select("id, closesAt").in("id", chunk));
      const expired = new Set(
        nextStatus === "OPEN"
          ? trips.filter((trip) => trip.closesAt && new Date(trip.closesAt) <= now).map((trip) => trip.id)
          : [],
      );
      const others = trips.filter((trip) => !expired.has(trip.id)).map((trip) => trip.id);
      if (others.length > 0) must(await db().from("Trip").update({ status: nextStatus }).in("id", others));
      if (expired.size > 0) {
        must(await db().from("Trip").update({ status: nextStatus, closesAt: null }).in("id", [...expired]));
      }
    }
  });
  refresh();
  return result;
}

/** Hapus beberapa titipan sekaligus beserta pesanan, bukti bayar, dan lampirannya. */
export async function adminDeleteTrips(tripIds: string[]) {
  const result = await runAction(async () => {
    await requireAdmin();
    await deleteTripsWithFiles(getIds(tripIds));
  });
  refresh();
  return result;
}

/** Hapus satu titipan dari halaman detailnya, lalu kembali ke daftar titipan. */
export async function adminDeleteTrip(tripId: string) {
  const result = await runAction(async () => {
    await requireAdmin();
    const trip = await findTrip(tripId);
    await deleteTripsWithFiles([trip.id]);
  });
  if (result.ok) redirect("/admin/titipan");
  return result;
}

export async function adminAddTripImages(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const trip = await findTrip(getString(formData, "tripId", 40));
    await addTripImagesFromForm(trip.id, formData);
  });
  if (result.ok) refresh();
  return result;
}

export async function adminDeleteTripImage(imageId: string) {
  const result = await runAction(async () => {
    await requireAdmin();
    const image = must(await db().from("Image").select("id, tripId").eq("id", imageId).maybeSingle());
    if (!image?.tripId) throw new ActionError("Gambar tidak ditemukan");
    await deleteImages([image.id]);
  });
  refresh();
  return result;
}

// ─── Pesanan ─────────────────────────────────────────────────────────────────

/** Tambah pesanan atas nama siapa pun, termasuk ke titipan yang sudah ditutup. */
export async function adminCreateOrder(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const trip = await findTrip(getString(formData, "tripId", 40));
    const userId = await getUserId(formData, "userId", "Pilih pemesan");
    const items = getString(formData, "items", 500);
    if (!items) throw new ActionError("Tulis pesanannya");
    const price = getPrice(formData, "price");
    const paymentMethod = getPaymentMethod(formData);
    const proofFile = paymentMethod === "CASHLESS" ? getFile(formData, "proof") : null;

    const proof = proofFile ? await saveImage(proofFile, "PROOF") : null;
    try {
      must(
        await db().from("Order").insert({
          tripId: trip.id,
          userId,
          items,
          price,
          paymentMethod,
          isPaid: formData.get("isPaid") === "on",
          proofId: proof?.id ?? null,
        }),
      );
    } catch (error) {
      await deleteImages([proof?.id]);
      throw error;
    }
  });
  if (result.ok) refresh();
  return result;
}

/** Ubah semua data pesanan, termasuk pemesan dan status lunas. */
export async function adminUpdateOrder(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const order = await findOrder(getString(formData, "orderId", 40));
    const userId = await getUserId(formData, "userId", "Pilih pemesan");
    const items = getString(formData, "items", 500);
    if (!items) throw new ActionError("Tulis pesanannya");
    must(
      await db()
        .from("Order")
        .update({
          userId,
          items,
          price: getPrice(formData, "price"),
          paymentMethod: getPaymentMethod(formData),
          isPaid: formData.get("isPaid") === "on",
        })
        .eq("id", order.id),
    );
  });
  if (result.ok) refresh();
  return result;
}

export async function adminSetOrdersPaid(orderIds: string[], isPaid: boolean) {
  const result = await runAction(async () => {
    await requireAdmin();
    if (typeof isPaid !== "boolean") throw new ActionError("Data tidak valid");
    for (const chunk of chunks(getIds(orderIds))) {
      must(await db().from("Order").update({ isPaid }).in("id", chunk));
    }
  });
  refresh();
  return result;
}

/** Upload / ganti bukti bayar pesanan siapa pun. */
export async function adminUploadProof(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const order = await findOrder(getString(formData, "orderId", 40));
    const file = getFile(formData, "proof");
    if (!file) throw new ActionError("Pilih foto bukti pembayaran");

    const proof = await saveImage(file, "PROOF");
    must(await db().from("Order").update({ proofId: proof.id, paymentMethod: "CASHLESS" }).eq("id", order.id));
    await deleteImages([order.proofId]);
  });
  if (result.ok) refresh();
  return result;
}

export async function adminDeleteProof(orderId: string) {
  const result = await runAction(async () => {
    await requireAdmin();
    const order = await findOrder(orderId);
    if (!order.proofId) throw new ActionError("Pesanan ini belum punya bukti bayar");
    // proofId otomatis jadi null lewat ON DELETE SET NULL
    await deleteImages([order.proofId]);
  });
  refresh();
  return result;
}

/** Hapus beberapa pesanan sekaligus beserta bukti bayarnya. */
export async function adminDeleteOrders(orderIds: string[]) {
  const result = await runAction(async () => {
    await requireAdmin();
    await deleteOrdersWithFiles(getIds(orderIds));
  });
  refresh();
  return result;
}
