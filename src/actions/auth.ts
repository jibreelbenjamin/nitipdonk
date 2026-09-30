"use server";

import { redirect } from "next/navigation";
import { ActionError, runAction } from "@/lib/action";
import { PIN_LOCK_MINUTES, PIN_MAX_ATTEMPTS } from "@/lib/constants";
import { verifyPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { clearUserSession, setUserSession } from "@/lib/session";

export async function signIn(userId: string, pin?: string) {
  return runAction(async () => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ActionError("Akun tidak ditemukan");

    if (user.pinHash) {
      if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
        const minutes = Math.ceil((user.pinLockedUntil.getTime() - Date.now()) / 60000);
        throw new ActionError(`Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`);
      }
      if (!pin) throw new ActionError("Masukkan PIN");

      if (!(await verifyPin(pin, user.pinHash))) {
        const failed = user.pinFailedCount + 1;
        const locked = failed >= PIN_MAX_ATTEMPTS;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            pinFailedCount: locked ? 0 : failed,
            pinLockedUntil: locked ? new Date(Date.now() + PIN_LOCK_MINUTES * 60000) : null,
          },
        });
        throw new ActionError(
          locked
            ? `PIN salah ${PIN_MAX_ATTEMPTS}x. Akun dikunci ${PIN_LOCK_MINUTES} menit.`
            : `PIN salah. Sisa ${PIN_MAX_ATTEMPTS - failed} percobaan.`,
        );
      }
      if (user.pinFailedCount > 0) {
        await prisma.user.update({ where: { id: user.id }, data: { pinFailedCount: 0 } });
      }
    }

    await setUserSession(user);
  });
}

export async function signOut() {
  await clearUserSession();
  redirect("/");
}
