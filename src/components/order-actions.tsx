"use client";

import { useState } from "react";
import { EllipsisVerticalIcon, ImageUpIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { deleteOrder, updateOrder, uploadProof } from "@/actions/orders";
import { useActionRunner, useFormAction } from "@/hooks/use-action-feedback";
import { ImageInput } from "@/components/image-input";
import { PaymentMethodField, type PaymentMethodValue } from "@/components/payment-method-field";
import { PriceInput } from "@/components/price-input";
import { SubmitButton } from "@/components/submit-button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export type OrderActionsData = {
  id: string;
  items: string;
  price: number | null;
  paymentMethod: PaymentMethodValue;
  hasProof: boolean;
};

type Permissions = {
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function OrderActions({ order, can }: { order: OrderActionsData; can: Permissions }) {
  const [dialog, setDialog] = useState<"edit" | "proof" | "delete" | null>(null);
  const [pending, run] = useActionRunner();
  const close = () => setDialog(null);

  if (!can.canEdit && !can.isOwner && !can.canDelete) return null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Aksi titipan" disabled={pending}>
            {pending ? <Spinner /> : <EllipsisVerticalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {can.canEdit && (
            <DropdownMenuItem onSelect={() => setDialog("edit")}>
              <PencilIcon />
              {can.isOwner ? "Edit titipan" : "Ubah harga"}
            </DropdownMenuItem>
          )}
          {can.isOwner && (
            <DropdownMenuItem onSelect={() => setDialog("proof")}>
              <ImageUpIcon />
              {order.hasProof ? "Ganti bukti bayar" : "Upload bukti bayar"}
            </DropdownMenuItem>
          )}
          {can.canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
                <Trash2Icon />
                Hapus titipan
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "edit"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          {dialog === "edit" && <EditOrderForm order={order} ownerMode={can.isOwner} onDone={close} />}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "proof"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          {dialog === "proof" && <UploadProofForm orderId={order.id} onDone={close} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialog === "delete"} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus titipan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pesanan dan bukti pembayarannya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => deleteOrder(order.id), "Titipan dihapus")}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditOrderForm({
  order,
  ownerMode,
  onDone,
}: {
  order: OrderActionsData;
  ownerMode: boolean;
  onDone: () => void;
}) {
  const [method, setMethod] = useState(order.paymentMethod);
  const { pending, onSubmit } = useFormAction(updateOrder, { success: "Titipan diperbarui", onSuccess: onDone });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldSet disabled={pending} className="contents">
        <DialogHeader>
          <DialogTitle>{ownerMode ? "Edit titipan" : "Ubah harga"}</DialogTitle>
          <DialogDescription>
            {ownerMode ? "Perbarui pesananmu." : "Isi harga sebenarnya setelah dibelikan."}
          </DialogDescription>
        </DialogHeader>
        <input type="hidden" name="orderId" value={order.id} />
        <FieldGroup>
          {ownerMode ? (
            <Field>
              <FieldLabel htmlFor="edit-items">Pesanan</FieldLabel>
              <Textarea id="edit-items" name="items" defaultValue={order.items} maxLength={500} rows={3} required />
            </Field>
          ) : (
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{order.items}</p>
          )}
          <Field>
            <FieldLabel htmlFor="edit-price">Harga</FieldLabel>
            <PriceInput id="edit-price" defaultValue={order.price} />
          </Field>
          {ownerMode && <PaymentMethodField idPrefix="edit-method" value={method} onChange={setMethod} />}
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

function UploadProofForm({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [processing, setProcessing] = useState(false);
  const { pending, onSubmit } = useFormAction(uploadProof, { success: "Bukti bayar diupload", onSuccess: onDone });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldSet disabled={pending} className="contents">
        <DialogHeader>
          <DialogTitle>Bukti pembayaran</DialogTitle>
          <DialogDescription>Upload screenshot transfer / QRIS. Gambar otomatis dikompres.</DialogDescription>
        </DialogHeader>
        <input type="hidden" name="orderId" value={orderId} />
        <Field>
          <FieldLabel htmlFor="proof-file">Foto bukti</FieldLabel>
          <ImageInput id="proof-file" name="proof" onProcessingChange={setProcessing} />
          <FieldDescription>Metode bayar otomatis diubah jadi cashless.</FieldDescription>
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </DialogClose>
          <SubmitButton pending={pending} disabled={processing}>
            Upload
          </SubmitButton>
        </DialogFooter>
      </FieldSet>
    </form>
  );
}
