"use server";

import { refresh } from "next/cache";
import { ActionError, type ActionResult, getFile, getString, runAction } from "@/lib/action";
import { PIN_LENGTH } from "@/lib/constants";
import { deleteImages, saveImage } from "@/lib/images";
import { hashPin, isValidPin, verifyPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { requireUser, setUserSession } from "@/lib/session";

export async function updateProfile(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const name = getString(formData, "name", 40);
    if (!name) throw new ActionError("Nama wajib diisi");

    const avatarFile = getFile(formData, "avatar");
    const removeAvatar = formData.get("removeAvatar") === "1";

    let avatarId: string | null | undefined;
    if (avatarFile) avatarId = (await saveImage(avatarFile, "AVATAR")).id;
    else if (removeAvatar) avatarId = null;

    await prisma.user.update({ where: { id: user.id }, data: { name, avatarId } });
    if (avatarId !== undefined) await deleteImages([user.avatarId]);
  });
  if (result.ok) refresh();
  return result;
}

export async function updatePayment(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    const paymentInfo = getString(formData, "paymentInfo", 300);
    const qrFile = getFile(formData, "paymentQr");
    const removeQr = formData.get("removePaymentQr") === "1";

    let paymentQrId: string | null | undefined;
    if (qrFile) paymentQrId = (await saveImage(qrFile, "PAYMENT_QR")).id;
    else if (removeQr) paymentQrId = null;

    await prisma.user.update({
      where: { id: user.id },
      data: { paymentInfo: paymentInfo || null, paymentQrId },
    });
    if (paymentQrId !== undefined) await deleteImages([user.paymentQrId]);
  });
  if (result.ok) refresh();
  return result;
}

async function checkCurrentPin(pinHash: string | null, formData: FormData) {
  if (!pinHash) return;
  const currentPin = getString(formData, "currentPin", PIN_LENGTH);
  if (!(await verifyPin(currentPin, pinHash))) throw new ActionError("PIN lama salah");
}

export async function setPin(_prev: ActionResult<"set" | "changed"> | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    await checkCurrentPin(user.pinHash, formData);

    const pin = getString(formData, "pin", PIN_LENGTH);
    if (!isValidPin(pin)) throw new ActionError(`PIN harus ${PIN_LENGTH} digit angka`);
    if (pin !== getString(formData, "confirmPin", PIN_LENGTH)) {
      throw new ActionError("Konfirmasi PIN tidak sama");
    }

    // sessionVersion naik → sesi akun ini di perangkat lain otomatis keluar
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        pinHash: await hashPin(pin),
        pinFailedCount: 0,
        pinLockedUntil: null,
        sessionVersion: { increment: 1 },
      },
    });
    await setUserSession(updated);
    return user.pinHash ? ("changed" as const) : ("set" as const);
  });
  if (result.ok) refresh();
  return result;
}

export async function removePin(_prev: ActionResult | null, formData: FormData) {
  const result = await runAction(async () => {
    const user = await requireUser();
    if (!user.pinHash) throw new ActionError("Akun ini belum memakai PIN");
    await checkCurrentPin(user.pinHash, formData);
    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash: null, pinFailedCount: 0, pinLockedUntil: null },
    });
  });
  if (result.ok) refresh();
  return result;
}
