"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ActionError, type ActionResult, getFile, getString, runAction } from "@/lib/action";
import { PIN_LENGTH } from "@/lib/constants";
import { Constants } from "@/lib/database.types";
import { cleanupOldImages, deleteImages, saveImage } from "@/lib/images";
import { hashPin, isValidPin } from "@/lib/pin";
import {
  checkAdminPassword,
  clearAdminSession,
  isAdminConfigured,
  requireAdmin,
  setAdminSession,
} from "@/lib/session";
import { db, must } from "@/lib/supabase";

export async function adminLogin(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    if (!isAdminConfigured()) throw new ActionError("ADMIN_PASSWORD belum diset di environment");
    if (!checkAdminPassword(getString(formData, "password", 200))) {
      throw new ActionError("Password salah");
    }
    await setAdminSession();
  });
  if (result.ok) redirect("/admin");
  return result;
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createUser(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const name = getString(formData, "name", 40);
    if (!name) throw new ActionError("Nama wajib diisi");
    const avatarFile = getFile(formData, "avatar");
    const avatar = avatarFile ? await saveImage(avatarFile, "AVATAR") : null;
    must(await db().from("User").insert({ name, avatarId: avatar?.id ?? null }));
  });
  if (result.ok) refresh();
  return result;
}

export async function renameUser(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const name = getString(formData, "name", 40);
    if (!name) throw new ActionError("Nama wajib diisi");
    must(await db().from("User").update({ name }).eq("id", getString(formData, "userId", 40)));
  });
  if (result.ok) refresh();
  return result;
}

export async function resetUserPin(userId: string) {
  const result = await runAction(async () => {
    await requireAdmin();
    must(
      await db()
        .from("User")
        .update({ pinHash: null, pinFailedCount: 0, pinLockedUntil: null })
        .eq("id", userId),
    );
  });
  refresh();
  return result;
}

export async function setUserPin(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const pin = getString(formData, "pin", PIN_LENGTH);
    if (!isValidPin(pin)) throw new ActionError(`PIN harus ${PIN_LENGTH} digit angka`);
    if (pin !== getString(formData, "confirmPin", PIN_LENGTH)) {
      throw new ActionError("Konfirmasi PIN tidak sama");
    }
    const user = must(
      await db()
        .from("User")
        .select("id, sessionVersion")
        .eq("id", getString(formData, "userId", 40))
        .maybeSingle(),
    );
    if (!user) throw new ActionError("Pengguna tidak ditemukan");

    // sessionVersion naik → pengguna ini keluar dari semua perangkat dan harus pakai PIN baru
    must(
      await db()
        .from("User")
        .update({
          pinHash: await hashPin(pin),
          pinFailedCount: 0,
          pinLockedUntil: null,
          sessionVersion: user.sessionVersion + 1,
        })
        .eq("id", user.id),
    );
  });
  if (result.ok) refresh();
  return result;
}

export async function deleteUser(userId: string) {
  const result = await runAction(async () => {
    await requireAdmin();
    const user = must(
      await db().from("User").select("id, avatarId, paymentQrId").eq("id", userId).maybeSingle(),
    );
    if (!user) throw new ActionError("Pengguna tidak ditemukan");

    // Bukti bayar yang ikut terhapus: pesanan milik user + pesanan di titipan yang dia buka
    const ownOrders = must(await db().from("Order").select("proofId").eq("userId", user.id));
    const hostedOrders = must(
      await db()
        .from("Order")
        .select("proofId, trip:Trip!Order_tripId_fkey!inner(hostId)")
        .eq("trip.hostId", user.id),
    );
    await deleteImages([
      user.avatarId,
      user.paymentQrId,
      ...[...ownOrders, ...hostedOrders].map((order) => order.proofId),
    ]);
    // Titipan & pesanannya ikut terhapus lewat ON DELETE CASCADE
    must(await db().from("User").delete().eq("id", user.id));
  });
  refresh();
  return result;
}

export async function deleteImage(imageId: string) {
  const result = await runAction(async () => {
    await requireAdmin();
    return deleteImages([imageId]);
  });
  refresh();
  return result;
}

export async function cleanupImages(
  _prev: ActionResult<{ count: number; bytes: number }> | null,
  formData: FormData,
) {
  const result = await runAction(async () => {
    await requireAdmin();
    const days = Number(getString(formData, "days", 4));
    if (!Number.isInteger(days) || days < 0) throw new ActionError("Jumlah hari tidak valid");

    const kind = getString(formData, "kind", 20);
    const allKinds = Constants.public.Enums.ImageKind;
    const kinds = kind === "ALL" ? [...allKinds] : allKinds.filter((value) => value === kind);
    if (kinds.length === 0) throw new ActionError("Jenis gambar tidak valid");

    return cleanupOldImages(kinds, days);
  });
  if (result.ok) refresh();
  return result;
}
