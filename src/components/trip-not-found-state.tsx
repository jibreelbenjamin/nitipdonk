"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { SearchXIcon, Trash2Icon } from "lucide-react";
import { wasTripOpened } from "@/components/save-trip-offline";
import { removeOfflineTrip } from "@/lib/offline-trips";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const subscribeNothing = () => () => {};

/**
 * Titipan tidak ada. Kalau titipan ini tadi sedang dibuka di tab ini (auto-refresh lalu tidak
 * menemukannya), berarti pembukanya baru saja menghapusnya.
 */
export function TripNotFoundState() {
  const { id } = useParams<{ id: string }>();
  const deleted = useSyncExternalStore(subscribeNothing, () => wasTripOpened(id), () => false);

  // Salinan offline-nya sudah tidak berguna
  useEffect(() => {
    if (id) removeOfflineTrip(id);
  }, [id]);

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">{deleted ? <Trash2Icon /> : <SearchXIcon />}</EmptyMedia>
        <EmptyTitle>{deleted ? "Titipan ini telah dihapus" : "Titipan tidak ditemukan"}</EmptyTitle>
        <EmptyDescription>
          {deleted
            ? "Pembuka titipan sudah menghapusnya, jadi titipan dan semua pesanan di dalamnya tidak bisa dibuka lagi."
            : "Link-nya mungkin salah, atau titipan ini sudah dihapus pembukanya."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/titipan">Lihat titipan lain</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
