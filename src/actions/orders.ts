"use server";

import { refresh } from "next/cache";
import { PaymentMethod } from "@/generated/prisma/enums";
import {
  ActionError,
  type ActionResult,
  getFile,
  getPrice,
  getString,
  runAction,
} from "@/lib/action";
import { deleteImages, saveImage } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isAcceptingOrders } from "@/lib/trips";

function getPaymentMethod(formData: FormData) {
  const value = getString(formData, "paymentMethod", 10);
  if (value !== PaymentMethod.CASH && value !== PaymentMethod.CASHLESS) {
    throw new ActionError("Pilih metode bayar");
  }
  return value;
}

async function findOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { trip: true } });
  if (!order) throw new ActionError("Titipan tidak ditemukan");
  return order;
}

export async function createOrder(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const trip = await prisma.trip.findUnique({ where: { id: getString(formData, "tripId", 40) } });
    if (!trip) throw new ActionError("Titipan tidak ditemukan");
    if (!isAcceptingOrders(trip)) throw new ActionError("Titipan ini sudah ditutup");

    const items = getString(formData, "items", 500);
    if (!items) throw new ActionError("Tulis mau titip apa");
    const price = getPrice(formData, "price");
    const paymentMethod = getPaymentMethod(formData);
    const proofFile = paymentMethod === "CASHLESS" ? getFile(formData, "proof") : null;

    const proof = proofFile ? await saveImage(proofFile, "PROOF") : null;
    await prisma.order.create({
      data: {
        tripId: trip.id,
        userId: user.id,
        items,
        price,
        paymentMethod,
        proofId: proof?.id,
      },
    });
  });
  if (result.ok) refresh();
  return result;
}

/** Pemesan bisa ubah semuanya; pembuka titipan hanya bisa ubah harga (harga asli setelah dibeli). */
export async function updateOrder(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const order = await findOrder(getString(formData, "orderId", 40));
    const isOwner = order.userId === user.id;
    const isHost = order.trip.hostId === user.id;
    if (!isOwner && !isHost) throw new ActionError("Kamu tidak bisa mengubah titipan ini");
    if (order.trip.status === "DONE") throw new ActionError("Titipan sudah selesai");

    const price = getPrice(formData, "price");
    if (!isOwner) {
      await prisma.order.update({ where: { id: order.id }, data: { price } });
      return;
    }

    const items = getString(formData, "items", 500);
    if (!items) throw new ActionError("Tulis mau titip apa");
    await prisma.order.update({
      where: { id: order.id },
      data: { items, price, paymentMethod: getPaymentMethod(formData) },
    });
  });
  if (result.ok) refresh();
  return result;
}

/** Upload / ganti bukti bayar. Bisa kapan saja, termasuk setelah titipan ditutup. */
export async function uploadProof(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const order = await findOrder(getString(formData, "orderId", 40));
    if (order.userId !== user.id) throw new ActionError("Hanya pemesan yang bisa upload bukti");

    const file = getFile(formData, "proof");
    if (!file) throw new ActionError("Pilih foto bukti pembayaran");

    const proof = await saveImage(file, "PROOF");
    await prisma.order.update({
      where: { id: order.id },
      data: { proofId: proof.id, paymentMethod: "CASHLESS" },
    });
    await deleteImages([order.proofId]);
  });
  if (result.ok) refresh();
  return result;
}

export async function setOrderPaid(orderId: string, isPaid: boolean) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const order = await findOrder(orderId);
    if (order.trip.hostId !== user.id) {
      throw new ActionError("Hanya pembuka titipan yang bisa menandai lunas");
    }
    await prisma.order.update({ where: { id: order.id }, data: { isPaid } });
  });
  refresh();
  return result;
}

export async function deleteOrder(orderId: string) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const order = await findOrder(orderId);
    const isHost = order.trip.hostId === user.id;
    if (order.userId !== user.id && !isHost) {
      throw new ActionError("Kamu tidak bisa menghapus titipan ini");
    }
    if (!isHost && !isAcceptingOrders(order.trip)) {
      throw new ActionError("Titipan sudah ditutup, minta pembuka titipan untuk menghapus");
    }
    if (order.trip.status === "DONE") throw new ActionError("Titipan sudah selesai");

    await deleteImages([order.proofId]);
    await prisma.order.delete({ where: { id: order.id } });
  });
  refresh();
  return result;
}
