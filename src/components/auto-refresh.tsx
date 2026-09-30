"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Muat ulang data server secara berkala supaya daftar titipan terasa "live". */
export function AutoRefresh({ interval = 10_000 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, interval);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, interval]);

  return null;
}
