"use client";

import { useState } from "react";
import { CheckCheckIcon, LockIcon, LockOpenIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { adminDeleteTrip, adminSetTripsStatus } from "@/actions/admin-trips";
import { DeleteTripsDialog, type EditableTrip, EditTripDialog } from "@/components/admin/trip-dialogs";
import type { UserOption } from "@/components/user-select";
import { useActionRunner } from "@/hooks/use-action-feedback";
import { startNavigation } from "@/lib/navigation-progress";
import { Button } from "@/components/ui/button";

/** Tombol aksi admin di halaman detail titipan. */
export function TripAdminActions({
  trip,
  accepting,
  users,
}: {
  trip: EditableTrip;
  accepting: boolean;
  users: UserOption[];
}) {
  const [pending, run] = useActionRunner();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setDialog("edit")}>
        <PencilIcon data-icon="inline-start" />
        Ubah titipan
      </Button>
      {accepting ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => adminSetTripsStatus([trip.id], "CLOSED"), "Titipan ditutup")}
        >
          <LockIcon data-icon="inline-start" />
          Tutup titipan
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => adminSetTripsStatus([trip.id], "OPEN"), "Titipan dibuka lagi")}
        >
          <LockOpenIcon data-icon="inline-start" />
          Buka lagi
        </Button>
      )}
      {trip.status !== "DONE" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => adminSetTripsStatus([trip.id], "DONE"), "Titipan selesai")}
        >
          <CheckCheckIcon data-icon="inline-start" />
          Selesai
        </Button>
      )}
      <Button size="sm" variant="destructive" disabled={pending} onClick={() => setDialog("delete")}>
        <Trash2Icon data-icon="inline-start" />
        Hapus
      </Button>

      <EditTripDialog
        trip={trip}
        users={users}
        open={dialog === "edit"}
        onOpenChange={(open) => setDialog(open ? "edit" : null)}
      />
      <DeleteTripsDialog
        count={1}
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        onConfirm={() => {
          startNavigation();
          run(() => adminDeleteTrip(trip.id));
        }}
      />
    </div>
  );
}
