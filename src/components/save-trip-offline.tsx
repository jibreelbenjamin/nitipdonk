"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { CloudCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { removeOfflineTrip, saveOfflineTrip, useOfflineTrips, type OfflineTrip } from "@/lib/offline-trips";

/** Simpan data titipan ini di HP setiap kali dimuat dari server, supaya bisa dibaca saat offline. */
export function SaveTripOffline({ userId, trip }: { userId: string; trip: OfflineTrip }) {
  // `trip` jadi objek baru setiap kali halaman di-refresh dari server, jadi salinannya ikut diperbarui
  useEffect(() => {
    saveOfflineTrip(userId, trip);
  }, [userId, trip]);

  const saved = useOfflineTrips()?.some((item) => item.id === trip.id);
  if (!saved) return null;
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <CloudCheckIcon data-icon="inline-start" />
      Tersedia offline
    </Badge>
  );
}

/** Hapus salinan offline titipan di alamat ini, dipakai saat titipannya sudah dihapus. */
export function ForgetOfflineTrip() {
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) removeOfflineTrip(id);
  }, [id]);
  return null;
}
