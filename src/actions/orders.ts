"use server";

import { refresh } from "next/cache";
import {
  ActionError,
  type ActionResult,
  getFile,
  getPaymentMethod,
  getPrice,
  getString,
  runAction,
} from "@/lib/action";
import { deleteImages, saveImage } from "@/lib/images";
import { requireUser } from "@/lib/session";
import { db, must } from "@/lib/supabase";
import { deleteOrdersWithFiles } from "@/lib/trip-data";
import { isAcceptingOrders } from "@/lib/trips";

async function findOrder(orderId: string) {
  const order = must(
    await db()
      .from("Order")
      .select("*, trip:Trip!Order_tripId_fkey(*)")
      .eq("id", orderId)
      .maybeSingle(),
  );
  if (!order) throw new ActionError("Titipan tidak ditemukan");
  return order;
}

export async function createOrder(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const trip = must(
      await db().from("Trip").select().eq("id", getString(formData, "tripId", 40)).maybeSingle(),
    );
    if (!trip) throw new ActionError("Titipan tidak ditemukan");
    if (!isAcceptingOrders(trip)) throw new ActionError("Titipan ini sudah ditutup");

    const items = getString(formData, "items", 500);
    if (!items) throw new ActionError("Tulis mau titip apa");
    const price = getPrice(formData, "price");
    const paymentMethod = getPaymentMethod(formData);
    const proofFile = paymentMethod === "CASHLESS" ? getFile(formData, "proof") : null;

    const proof = proofFile ? await saveImage(proofFile, "PROOF") : null;
    must(
      await db().from("Order").insert({
        tripId: trip.id,
        userId: user.id,
        items,
        price,
        paymentMethod,
        proofId: proof?.id ?? null,
      }),
    );
  });
  if (result.ok) refresh();
  return result;
}

/**
 * Pemesan bisa ubah semuanya selama titipan masih buka; setelah ditutup hanya bisa upload bukti.
 * Pembuka titipan hanya bisa ubah harga (harga asli setelah dibeli), termasuk setelah ditutup.
 */
export async function updateOrder(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const order = await findOrder(getString(formData, "orderId", 40));
    const isOwner = order.userId === user.id;
    const isHost = order.trip.hostId === user.id;
    if (!isOwner && !isHost) throw new ActionError("Kamu tidak bisa mengubah titipan ini");
    if (order.trip.status === "DONE") throw new ActionError("Titipan sudah selesai");
    if (!isHost && !isAcceptingOrders(order.trip)) {
      throw new ActionError("Titipan sudah ditutup, pesanan tidak bisa diubah lagi");
    }

    const price = getPrice(formData, "price");
    if (!isOwner) {
      must(await db().from("Order").update({ price }).eq("id", order.id));
      return;
    }

    const items = getString(formData, "items", 500);
    if (!items) throw new ActionError("Tulis mau titip apa");
    must(
      await db()
        .from("Order")
        .update({ items, price, paymentMethod: getPaymentMethod(formData) })
        .eq("id", order.id),
    );
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
    must(
      await db()
        .from("Order")
        .update({ proofId: proof.id, paymentMethod: "CASHLESS" })
        .eq("id", order.id),
    );
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
    must(await db().from("Order").update({ isPaid }).eq("id", order.id));
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

    await deleteOrdersWithFiles([order.id]);
  });
  refresh();
  return result;
}
