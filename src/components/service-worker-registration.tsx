"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Hanya di production supaya tidak menempel di localhost saat development
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      // Versi build di alamatnya membuat service worker dipasang ulang setiap deploy
      .register(`/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID}`, { scope: "/", updateViaCache: "none" })
      // Aplikasi tetap jalan tanpa service worker; hanya halaman offline yang tidak tersedia
      .catch((error) => console.warn("Service worker gagal didaftarkan", error));
  }, []);
  return null;
}
