"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ActionError, type ActionResult, getString, runAction } from "@/lib/action";
import type { Enums } from "@/lib/database.types";
import { deleteImages } from "@/lib/images";
import { requireUser } from "@/lib/session";
import { db, must } from "@/lib/supabase";
import { addTripImagesFromForm, deleteTripsWithFiles, insertTripFromForm } from "@/lib/trip-data";

export async function createTrip(_prev: ActionResult<string> | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    return insertTripFromForm(user.id, formData);
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
    await deleteTripsWithFiles([trip.id]);
  });
  if (result.ok) redirect("/titipan");
  return result;
}

/** Pembuka titipan menambah lampiran gambar (foto menu, syarat, dll.). */
export async function addTripImages(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const trip = await requireHostedTrip(getString(formData, "tripId", 40));
    await addTripImagesFromForm(trip.id, formData);
  });
  if (result.ok) refresh();
  return result;
}

export async function deleteTripImage(imageId: string) {
  const result = await runAction(async () => {
    const image = must(await db().from("Image").select("id, tripId").eq("id", imageId).maybeSingle());
    if (!image?.tripId) throw new ActionError("Gambar tidak ditemukan");
    await requireHostedTrip(image.tripId);
    await deleteImages([image.id]);
  });
  refresh();
  return result;
}
