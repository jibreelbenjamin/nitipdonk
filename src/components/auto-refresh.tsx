"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Muat ulang data server secara berkala supaya daftar titipan terasa "live". */
export function AutoRefresh({ interval = 10_000 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    // Saat offline jangan coba refresh; begitu online lagi langsung ambil data terbaru
    const tick = () => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    };
    const id = setInterval(tick, interval);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("online", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("online", tick);
    };
  }, [router, interval]);

  return null;
}
