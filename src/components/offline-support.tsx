"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { WifiOffIcon } from "lucide-react";
import { savePageForOffline, useOnline } from "@/lib/offline";
import { Badge } from "@/components/ui/badge";

/**
 * Simpan salinan halaman yang sedang dibuka untuk dibaca offline, dan tampilkan
 * penanda selama tidak ada koneksi.
 */
export function OfflineSupport() {
  const online = useOnline();
  const pathname = usePathname();

  useEffect(() => {
    savePageForOffline(pathname);
  }, [pathname]);

  useEffect(() => {
    // Saat aplikasi ditinggal, simpan versi terbaru halaman yang terakhir dilihat
    const onHide = () => {
      if (document.visibilityState === "hidden") savePageForOffline(location.pathname);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  if (online) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <Badge
        variant="outline"
        className="h-auto gap-1.5 bg-popover px-3 py-1.5 text-popover-foreground shadow-lg"
      >
        <WifiOffIcon data-icon="inline-start" />
        Offline · menampilkan data terakhir
      </Badge>
    </div>
  );
}
