"use client";

import { useState } from "react";
import { adminUpdateTrip } from "@/actions/admin-trips";
import { useFormAction } from "@/hooks/use-action-feedback";
import { toDateTimeLocal } from "@/lib/format";
import { SubmitButton } from "@/components/submit-button";
import { type UserOption, UserSelect } from "@/components/user-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TripStatus = "OPEN" | "CLOSED" | "DONE";

export type EditableTrip = {
  id: string;
  hostId: string;
  title: string;
  note: string | null;
  status: TripStatus;
  closesAt: string | null;
};

const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: "OPEN", label: "Buka" },
  { value: "CLOSED", label: "Ditutup (sedang dibeli)" },
  { value: "DONE", label: "Selesai" },
];

/** Admin mengubah semua data titipan: pembuka, judul, catatan, status, dan jam tutup. */
export function EditTripDialog({
  trip,
  users,
  open,
  onOpenChange,
}: {
  trip: EditableTrip;
  users: UserOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <EditTripForm trip={trip} users={users} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EditTripForm({ trip, users, onDone }: { trip: EditableTrip; users: UserOption[]; onDone: () => void }) {
  const [status, setStatus] = useState(trip.status);
  const { pending, onSubmit } = useFormAction(adminUpdateTrip, { success: "Titipan diperbarui", onSuccess: onDone });
  const id = (field: string) => `edit-trip-${field}-${trip.id}`;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldSet disabled={pending} className="contents">
        <DialogHeader>
          <DialogTitle>Ubah titipan</DialogTitle>
          <DialogDescription>Perubahan langsung terlihat oleh semua pengguna.</DialogDescription>
        </DialogHeader>
        <input type="hidden" name="tripId" value={trip.id} />
        <input type="hidden" name="status" value={status} />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={id("host")}>Pembuka titipan</FieldLabel>
            <UserSelect id={id("host")} name="hostId" users={users} defaultValue={trip.hostId} />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("title")}>Beli di mana / apa?</FieldLabel>
            <Input id={id("title")} name="title" defaultValue={trip.title} maxLength={80} required />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("note")}>Catatan</FieldLabel>
            <Textarea id={id("note")} name="note" defaultValue={trip.note ?? ""} maxLength={300} rows={3} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={id("status")}>Status</FieldLabel>
              <Select value={status} onValueChange={(value) => setStatus(value as TripStatus)}>
                <SelectTrigger id={id("status")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={id("closes")}>Jam tutup (WIB)</FieldLabel>
              <Input
                id={id("closes")}
                name="closesAt"
                type="datetime-local"
                defaultValue={trip.closesAt ? toDateTimeLocal(trip.closesAt) : ""}
              />
            </Field>
          </div>
          <FieldDescription>
            Kosongkan jam tutup kalau tanpa batas waktu. Status Buka dengan jam tutup yang sudah lewat tetap
            dianggap tutup.
          </FieldDescription>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </DialogClose>
          <SubmitButton pending={pending}>Simpan</SubmitButton>
        </DialogFooter>
      </FieldSet>
    </form>
  );
}

/** Konfirmasi hapus satu atau beberapa titipan. */
export function DeleteTripsDialog({
  count,
  open,
  onOpenChange,
  onConfirm,
}: {
  count: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{count > 1 ? `Hapus ${count} titipan?` : "Hapus titipan ini?"}</AlertDialogTitle>
          <AlertDialogDescription>
            Semua pesanan, bukti pembayaran, dan lampiran di dalamnya ikut terhapus permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
