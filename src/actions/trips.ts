"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { TripStatus } from "@/generated/prisma/enums";
import { ActionError, type ActionResult, getString, runAction } from "@/lib/action";
import { MAX_CLOSE_MINUTES } from "@/lib/constants";
import { deleteImages } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function createTrip(_prev: ActionResult<string> | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const title = getString(formData, "title", 80);
    const note = getString(formData, "note", 300);
    const closesInput = getString(formData, "closesInMinutes", 4);

    if (!title) throw new ActionError("Isi mau beli di mana / apa");

    let closesAt: Date | null = null;
    if (closesInput) {
      const minutes = Number(closesInput);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_CLOSE_MINUTES) {
        throw new ActionError(`Waktu tutup harus 1–${MAX_CLOSE_MINUTES} menit`);
      }
      closesAt = new Date(Date.now() + minutes * 60_000);
    }

    const trip = await prisma.trip.create({
      data: { hostId: user.id, title, note: note || null, closesAt },
    });
    return trip.id;
  });

  if (result.ok) redirect(`/titipan/${result.data}`);
  return result;
}

async function requireHostedTrip(tripId: string) {
  const user = await requireUser();
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new ActionError("Titipan tidak ditemukan");
  if (trip.hostId !== user.id) throw new ActionError("Hanya pembuka titipan yang bisa melakukan ini");
  return trip;
}

export async function setTripStatus(tripId: string, status: TripStatus) {
  const result = await runAction(async () => {
    const trip = await requireHostedTrip(tripId);
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        status,
        // Dibuka lagi setelah jam tutup lewat → hapus batas waktunya
        closesAt: status === "OPEN" && trip.closesAt && trip.closesAt <= new Date() ? null : undefined,
      },
    });
  });
  refresh();
  return result;
}

export async function deleteTrip(tripId: string) {
  const result = await runAction(async () => {
    const trip = await requireHostedTrip(tripId);
    const orders = await prisma.order.findMany({
      where: { tripId: trip.id },
      select: { proofId: true },
    });
    await deleteImages(orders.map((order) => order.proofId));
    await prisma.trip.delete({ where: { id: trip.id } });
  });
  if (result.ok) redirect("/titipan");
  return result;
}
