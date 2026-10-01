"use client";

import { useState } from "react";
import { CheckCheckIcon, LockIcon, LockOpenIcon, Trash2Icon } from "lucide-react";
import { deleteTrip, setTripStatus } from "@/actions/trips";
import { useActionRunner } from "@/hooks/use-action-feedback";
import { startNavigation } from "@/lib/navigation-progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function TripHostActions({
  tripId,
  status,
  accepting,
}: {
  tripId: string;
  status: "OPEN" | "CLOSED" | "DONE";
  accepting: boolean;
}) {
  const [pending, run] = useActionRunner();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      {accepting ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setTripStatus(tripId, "CLOSED"), "Titipan ditutup")}
        >
          <LockIcon data-icon="inline-start" />
          Tutup titipan
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setTripStatus(tripId, "OPEN"), "Titipan dibuka lagi")}
        >
          <LockOpenIcon data-icon="inline-start" />
          Buka lagi
        </Button>
      )}
      {status !== "DONE" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => setTripStatus(tripId, "DONE"), "Titipan selesai")}
        >
          <CheckCheckIcon data-icon="inline-start" />
          Selesai
        </Button>
      )}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={pending}>
            <Trash2Icon data-icon="inline-start" />
            Hapus
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus titipan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua pesanan dan bukti pembayaran di dalamnya ikut terhapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                startNavigation();
                run(() => deleteTrip(tripId));
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
