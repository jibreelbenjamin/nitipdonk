import type { Metadata } from "next";
import { WifiOffIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { OfflineTrips } from "@/components/offline-trips";
import { RetryButton } from "@/components/retry-button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = { title: "Offline – NitipDonk" };

// Ditampilkan service worker saat aplikasi dibuka tanpa koneksi internet
export default function OfflinePage() {
  return (
    <OfflineTrips>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
        <Logo />
        <Empty className="flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WifiOffIcon />
            </EmptyMedia>
            <EmptyTitle>Kamu sedang offline</EmptyTitle>
            <EmptyDescription>
              Periksa sinyal atau Wi-Fi, lalu coba lagi. Titipan yang pernah kamu buka saat online akan
              muncul di sini.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <RetryButton />
          </EmptyContent>
        </Empty>
      </main>
    </OfflineTrips>
  );
}
