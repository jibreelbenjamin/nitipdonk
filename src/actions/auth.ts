"use server";

import { redirect } from "next/navigation";
import { ActionError, runAction } from "@/lib/action";
import { PIN_LOCK_MINUTES, PIN_MAX_ATTEMPTS } from "@/lib/constants";
import { verifyPin } from "@/lib/pin";
import { clearUserSession, setUserSession } from "@/lib/session";
import { db, must } from "@/lib/supabase";

export async function signIn(userId: string, pin?: string) {
  return runAction(async () => {
    const user = must(
      await db()
        .from("User")
        .select("id, pinHash, pinFailedCount, pinLockedUntil, sessionVersion")
        .eq("id", userId)
        .maybeSingle(),
    );
    if (!user) throw new ActionError("Akun tidak ditemukan");

    if (user.pinHash) {
      const lockedUntil = user.pinLockedUntil ? new Date(user.pinLockedUntil) : null;
      if (lockedUntil && lockedUntil > new Date()) {
        const minutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        throw new ActionError(`Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`);
      }
      if (!pin) throw new ActionError("Masukkan PIN");

      if (!(await verifyPin(pin, user.pinHash))) {
        const failed = user.pinFailedCount + 1;
        const locked = failed >= PIN_MAX_ATTEMPTS;
        must(
          await db()
            .from("User")
            .update({
              pinFailedCount: locked ? 0 : failed,
              pinLockedUntil: locked
                ? new Date(Date.now() + PIN_LOCK_MINUTES * 60000).toISOString()
                : null,
            })
            .eq("id", user.id),
        );
        throw new ActionError(
          locked
            ? `PIN salah ${PIN_MAX_ATTEMPTS}x. Akun dikunci ${PIN_LOCK_MINUTES} menit.`
            : `PIN salah. Sisa ${PIN_MAX_ATTEMPTS - failed} percobaan.`,
        );
      }
      if (user.pinFailedCount > 0) {
        must(await db().from("User").update({ pinFailedCount: 0 }).eq("id", user.id));
      }
    }

    await setUserSession(user);
  });
}

export async function signOut() {
  await clearUserSession();
  redirect("/");
}
