"use client";

import { useState } from "react";
import { adminCreateOrder, adminUpdateOrder } from "@/actions/admin-trips";
import { useFormAction } from "@/hooks/use-action-feedback";
import { ImageInput } from "@/components/image-input";
import { PaymentMethodField, type PaymentMethodValue } from "@/components/payment-method-field";
import { PriceInput } from "@/components/price-input";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type EditableOrder = {
  id: string;
  userId: string;
  items: string;
  price: number | null;
  paymentMethod: PaymentMethodValue;
  isPaid: boolean;
};

/**
 * Tambah (tanpa `order`) atau ubah pesanan oleh admin: pemesan, isi pesanan, harga,
 * metode bayar, dan status lunas. Saat menambah, bukti bayar bisa langsung diupload.
 */
export function OrderFormDialog({
  tripId,
  order,
  users,
  open,
  onOpenChange,
}: {
  tripId: string;
  order?: EditableOrder;
  users: UserOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <OrderForm tripId={tripId} order={order} users={users} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function OrderForm({
  tripId,
  order,
  users,
  onDone,
}: {
  tripId: string;
  order?: EditableOrder;
  users: UserOption[];
  onDone: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethodValue>(order?.paymentMethod ?? "CASHLESS");
  const [processing, setProcessing] = useState(false);
  const { pending, onSubmit } = useFormAction(order ? adminUpdateOrder : adminCreateOrder, {
    success: order ? "Pesanan diperbarui" : "Pesanan ditambahkan",
    onSuccess: onDone,
  });
  const id = (field: string) => `admin-order-${field}-${order?.id ?? "new"}`;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldSet disabled={pending} className="contents">
        <DialogHeader>
          <DialogTitle>{order ? "Ubah pesanan" : "Tambah pesanan"}</DialogTitle>
          <DialogDescription>
            {order ? "Semua data pesanan bisa diubah, termasuk pemesannya." : "Tambahkan pesanan atas nama siapa pun."}
          </DialogDescription>
        </DialogHeader>
        <input type="hidden" name={order ? "orderId" : "tripId"} value={order?.id ?? tripId} />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={id("user")}>Pemesan</FieldLabel>
            <UserSelect id={id("user")} name="userId" users={users} defaultValue={order?.userId} />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("items")}>Pesanan</FieldLabel>
            <Textarea
              id={id("items")}
              name="items"
              defaultValue={order?.items}
              placeholder={"Es kopi susu 1, less sugar\nRoti bakar cokelat 1"}
              maxLength={500}
              rows={3}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("price")}>Harga</FieldLabel>
            <PriceInput id={id("price")} defaultValue={order?.price} />
          </Field>
          <PaymentMethodField idPrefix={id("method")} value={method} onChange={setMethod} />
          {!order && method === "CASHLESS" && (
            <Field>
              <FieldLabel htmlFor={id("proof")}>Bukti pembayaran</FieldLabel>
              <ImageInput id={id("proof")} name="proof" onProcessingChange={setProcessing} />
              <FieldDescription>Opsional.</FieldDescription>
            </Field>
          )}
          <Field orientation="horizontal">
            <Switch id={id("paid")} name="isPaid" defaultChecked={order?.isPaid ?? false} />
            <FieldLabel htmlFor={id("paid")}>Sudah lunas</FieldLabel>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </DialogClose>
          <SubmitButton pending={pending} disabled={processing}>
            {order ? "Simpan" : "Tambah"}
          </SubmitButton>
        </DialogFooter>
      </FieldSet>
    </form>
  );
}

/** Konfirmasi hapus satu atau beberapa pesanan. */
export function DeleteOrdersDialog({
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
          <AlertDialogTitle>{count > 1 ? `Hapus ${count} pesanan?` : "Hapus pesanan ini?"}</AlertDialogTitle>
          <AlertDialogDescription>Pesanan dan bukti pembayarannya akan dihapus permanen.</AlertDialogDescription>
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
