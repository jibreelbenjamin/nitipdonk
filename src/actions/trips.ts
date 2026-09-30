"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ActionError, type ActionResult, getString, runAction } from "@/lib/action";
import { MAX_CLOSE_MINUTES } from "@/lib/constants";
import type { Enums } from "@/lib/database.types";
import { deleteImages } from "@/lib/images";
import { requireUser } from "@/lib/session";
import { db, must } from "@/lib/supabase";

export async function createTrip(_prev: ActionResult<string> | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const title = getString(formData, "title", 80);
    const note = getString(formData, "note", 300);
    const closesInput = getString(formData, "closesInMinutes", 4);

    if (!title) throw new ActionError("Isi mau beli di mana / apa");

    let closesAt: string | null = null;
    if (closesInput) {
      const minutes = Number(closesInput);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_CLOSE_MINUTES) {
        throw new ActionError(`Waktu tutup harus 1–${MAX_CLOSE_MINUTES} menit`);
      }
      closesAt = new Date(Date.now() + minutes * 60_000).toISOString();
    }

    const trip = must(
      await db()
        .from("Trip")
        .insert({ hostId: user.id, title, note: note || null, closesAt })
        .select("id")
        .single(),
    );
    return trip.id;
  });

  if (result.ok) redirect(`/titipan/${result.data}`);
  return result;
}

async function requireHostedTrip(tripId: string) {
  const user = await requireUser();
  const trip = must(await db().from("Trip").select().eq("id", tripId).maybeSingle());
  if (!trip) throw new ActionError("Titipan tidak ditemukan");
  if (trip.hostId !== user.id) throw new ActionError("Hanya pembuka titipan yang bisa melakukan ini");
  return trip;
}

export async function setTripStatus(tripId: string, status: Enums<"TripStatus">) {
  const result = await runAction(async () => {
    const trip = await requireHostedTrip(tripId);
    // Dibuka lagi setelah jam tutup lewat → hapus batas waktunya
    const reopenExpired =
      status === "OPEN" && trip.closesAt !== null && new Date(trip.closesAt) <= new Date();
    must(
      await db()
        .from("Trip")
        .update(reopenExpired ? { status, closesAt: null } : { status })
        .eq("id", trip.id),
    );
  });
  refresh();
  return result;
}

export async function deleteTrip(tripId: string) {
  const result = await runAction(async () => {
    const trip = await requireHostedTrip(tripId);
    const orders = must(await db().from("Order").select("proofId").eq("tripId", trip.id));
    await deleteImages(orders.map((order) => order.proofId));
    // Pesanan ikut terhapus lewat ON DELETE CASCADE
    must(await db().from("Trip").delete().eq("id", trip.id));
  });
  if (result.ok) redirect("/titipan");
  return result;
}
