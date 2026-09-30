"use client";

import { useRef, useState } from "react";
import { EraserIcon, Trash2Icon } from "lucide-react";
import { cleanupImages, deleteImage } from "@/actions/admin";
import { useActionRunner, useFormAction } from "@/hooks/use-action-feedback";
import { formatBytes } from "@/lib/format";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const KIND_OPTIONS = [
  { value: "PROOF", label: "Bukti pembayaran" },
  { value: "PAYMENT_QR", label: "QR pembayaran" },
  { value: "AVATAR", label: "Foto profil" },
  { value: "ALL", label: "Semua jenis" },
] as const;

export function CleanupForm({ defaultDays }: { defaultDays: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<string>("PROOF");
  const [days, setDays] = useState(String(defaultDays));
  const { pending, submit } = useFormAction(cleanupImages, {
    success: (state) =>
      state.ok && state.data.count > 0
        ? `${state.data.count} gambar dihapus (${formatBytes(state.data.bytes)} dibebaskan)`
        : "Tidak ada gambar yang cocok",
  });
  const kindLabel = KIND_OPTIONS.find((option) => option.value === kind)?.label.toLowerCase();

  return (
    <form ref={formRef} onSubmit={(event) => event.preventDefault()}>
      <input type="hidden" name="kind" value={kind} />
      <FieldGroup className="sm:flex-row sm:items-end">
        <Field>
          <FieldLabel htmlFor="cleanup-kind">Jenis gambar</FieldLabel>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger id="cleanup-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="cleanup-days">Lebih lama dari</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="cleanup-days"
              name="days"
              type="number"
              min={0}
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>hari</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={pending} className="sm:w-auto">
              {pending ? <Spinner data-icon="inline-start" /> : <EraserIcon data-icon="inline-start" />}
              Bersihkan
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus gambar lama?</AlertDialogTitle>
              <AlertDialogDescription>
                Semua {kindLabel} yang diupload lebih dari {days || 0} hari lalu akan dihapus permanen
                dari storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => formRef.current && submit(new FormData(formRef.current))}
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </FieldGroup>
      <FieldDescription className="mt-3">
        Isi 0 hari untuk menghapus semua gambar jenis tersebut.
      </FieldDescription>
    </form>
  );
}

export function DeleteImageButton({ imageId }: { imageId: string }) {
  const [pending, run] = useActionRunner();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Hapus gambar" disabled={pending}>
          {pending ? <Spinner /> : <Trash2Icon />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus gambar ini?</AlertDialogTitle>
          <AlertDialogDescription>Gambar dihapus permanen dari storage.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => run(() => deleteImage(imageId), "Gambar dihapus")}>
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
