"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { HomeIcon, RotateCwIcon, TriangleAlertIcon, WifiOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

/** Isi halaman error (error.tsx): pesan yang jelas, coba lagi, atau kembali ke halaman utama. */
export function ErrorState({
  error,
  retry,
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
}) {
  const offline = useSyncExternalStore(subscribeOnline, () => !navigator.onLine, () => false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Empty className="flex-none border">
      <EmptyHeader>
        <EmptyMedia variant="icon">{offline ? <WifiOffIcon /> : <TriangleAlertIcon />}</EmptyMedia>
        <EmptyTitle>{offline ? "Koneksi terputus" : "Waduh, ada yang error"}</EmptyTitle>
        <EmptyDescription>
          {offline
            ? "Periksa sinyal atau Wi-Fi, lalu coba lagi."
            : "Halaman ini gagal dimuat. Coba lagi sebentar; kalau masih error, kabari admin."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>
            <RotateCwIcon data-icon="inline-start" />
            Coba lagi
          </Button>
          <Button variant="outline" asChild>
            <Link href={homeHref}>
              <HomeIcon data-icon="inline-start" />
              Ke halaman utama
            </Link>
          </Button>
        </div>
        {/* Kode ini sama dengan yang tercatat di log server, berguna saat melapor ke admin */}
        {error.digest && <p className="text-xs text-muted-foreground">Kode error: {error.digest}</p>}
      </EmptyContent>
    </Empty>
  );
}
