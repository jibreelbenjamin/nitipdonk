import Link from "next/link";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import { ForgetOfflineTrip } from "@/components/save-trip-offline";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// Muncul saat titipan tidak ada, termasuk ketika pembuka menghapusnya selagi halaman ini terbuka:
// auto-refresh memuat ulang halaman dan server tidak lagi menemukan titipannya.
export default function TripNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <ForgetOfflineTrip />
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/titipan">
          <ArrowLeftIcon data-icon="inline-start" />
          Semua titipan
        </Link>
      </Button>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Trash2Icon />
          </EmptyMedia>
          <EmptyTitle>Titipan ini telah dihapus</EmptyTitle>
          <EmptyDescription>
            Pembuka titipan sudah menghapusnya, jadi titipan dan semua pesanan di dalamnya tidak bisa dibuka
            lagi.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/titipan">Lihat titipan lain</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
