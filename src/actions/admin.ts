"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ImageKind } from "@/generated/prisma/enums";
import { ActionError, type ActionResult, getFile, getString, runAction } from "@/lib/action";
import { PIN_LENGTH } from "@/lib/constants";
import { cleanupOldImages, deleteImages, saveImage } from "@/lib/images";
import { hashPin, isValidPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import {
  checkAdminPassword,
  clearAdminSession,
  isAdminConfigured,
  requireAdmin,
  setAdminSession,
} from "@/lib/session";

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
    await prisma.user.create({ data: { name, avatarId: avatar?.id } });
  });
  if (result.ok) refresh();
  return result;
}

export async function renameUser(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const name = getString(formData, "name", 40);
    if (!name) throw new ActionError("Nama wajib diisi");
    await prisma.user.update({ where: { id: getString(formData, "userId", 40) }, data: { name } });
  });
  if (result.ok) refresh();
  return result;
}

export async function resetUserPin(userId: string) {
  const result = await runAction(async () => {
    await requireAdmin();
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash: null, pinFailedCount: 0, pinLockedUntil: null },
    });
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
    // sessionVersion naik → pengguna ini keluar dari semua perangkat dan harus pakai PIN baru
    await prisma.user.update({
      where: { id: getString(formData, "userId", 40) },
      data: {
        pinHash: await hashPin(pin),
        pinFailedCount: 0,
        pinLockedUntil: null,
        sessionVersion: { increment: 1 },
      },
    });
  });
  if (result.ok) refresh();
  return result;
}

export async function deleteUser(userId: string) {
  const result = await runAction(async () => {
    await requireAdmin();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ActionError("Pengguna tidak ditemukan");

    // Bukti bayar yang ikut terhapus: pesanan milik user + pesanan di titipan yang dia buka
    const orders = await prisma.order.findMany({
      where: { OR: [{ userId }, { trip: { hostId: userId } }] },
      select: { proofId: true },
    });
    await deleteImages([user.avatarId, user.paymentQrId, ...orders.map((order) => order.proofId)]);
    await prisma.user.delete({ where: { id: userId } });
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
    const kinds =
      kind === "ALL"
        ? Object.values(ImageKind)
        : Object.values(ImageKind).filter((value) => value === kind);
    if (kinds.length === 0) throw new ActionError("Jenis gambar tidak valid");

    return cleanupOldImages(kinds, days);
  });
  if (result.ok) refresh();
  return result;
}
