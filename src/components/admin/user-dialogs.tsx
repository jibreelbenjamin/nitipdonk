"use client";

import { useState } from "react";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon, UserPlusIcon } from "lucide-react";
import { createUser, deleteUser, renameUser, resetUserPin, setUserActive, setUserPin } from "@/actions/admin";
import { useActionRunner, useFormAction } from "@/hooks/use-action-feedback";
import { PIN_LENGTH } from "@/lib/constants";
import { ImageInput } from "@/components/image-input";
import { PinInput } from "@/components/pin-input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { pending, onSubmit } = useFormAction(createUser, {
    success: "Pengguna ditambahkan",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlusIcon data-icon="inline-start" />
          Tambah
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <FieldSet disabled={pending} className="contents">
            <DialogHeader>
              <DialogTitle>Tambah pengguna</DialogTitle>
              <DialogDescription>Akun langsung bisa dipilih di halaman depan tanpa PIN.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="new-user-name">Nama</FieldLabel>
                <Input id="new-user-name" name="name" maxLength={40} required autoFocus />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-user-avatar">Foto profil</FieldLabel>
                <ImageInput id="new-user-avatar" name="avatar" shape="circle" onProcessingChange={setProcessing} />
                <FieldDescription>Opsional, pengguna bisa menggantinya sendiri nanti.</FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <SubmitButton pending={pending} disabled={processing}>
                Tambah
              </SubmitButton>
            </DialogFooter>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserRowActions({ user }: { user: { id: string; name: string } }) {
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [pending, run] = useActionRunner();
  const close = () => setDialog(null);
  const rename = useFormAction(renameUser, { success: "Nama diubah", onSuccess: close });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${user.name}`} disabled={pending}>
            {pending ? <Spinner /> : <EllipsisVerticalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setDialog("rename")}>
            <PencilIcon />
            Ubah nama
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
            <Trash2Icon />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "rename"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={rename.onSubmit} className="flex flex-col gap-6">
            <FieldSet disabled={rename.pending} className="contents">
              <DialogHeader>
                <DialogTitle>Ubah nama</DialogTitle>
                <DialogDescription>Nama ini tampil di halaman pilih akun dan daftar titipan.</DialogDescription>
              </DialogHeader>
              <input type="hidden" name="userId" value={user.id} />
              <Field>
                <FieldLabel htmlFor={`rename-${user.id}`}>Nama</FieldLabel>
                <Input id={`rename-${user.id}`} name="name" defaultValue={user.name} maxLength={40} required />
              </Field>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </DialogClose>
                <SubmitButton pending={rename.pending}>Simpan</SubmitButton>
              </DialogFooter>
            </FieldSet>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialog === "delete"} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua titipan yang dia buka, pesanannya, dan gambarnya ikut terhapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => run(() => deleteUser(user.id), "Pengguna dihapus")}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Switch aktif per pengguna: matikan (dengan konfirmasi) untuk menonaktifkan akun, nyalakan untuk mengaktifkan lagi. */
export function ActiveToggle({ user }: { user: { id: string; name: string; isActive: boolean } }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, run] = useActionRunner();

  return (
    <>
      <Switch
        checked={user.isActive}
        disabled={pending}
        onCheckedChange={(checked) =>
          checked ? run(() => setUserActive(user.id, true), `${user.name} diaktifkan`) : setConfirmOpen(true)
        }
        aria-label={`Akun ${user.name} aktif`}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {user.name} langsung keluar dari semua perangkat dan tidak muncul di halaman pilih akun. Titipan
              dan pesanannya tetap tersimpan, dan akun bisa diaktifkan lagi kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => setUserActive(user.id, false), `${user.name} dinonaktifkan`)}
            >
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Switch PIN per pengguna: nyalakan untuk memasang PIN baru, matikan untuk menghapus PIN. */
export function PinToggle({ user }: { user: { id: string; name: string; hasPin: boolean } }) {
  const [dialog, setDialog] = useState<"set" | "remove" | null>(null);
  const [pending, run] = useActionRunner();
  const close = () => setDialog(null);
  const set = useFormAction(setUserPin, { success: `PIN ${user.name} dipasang`, onSuccess: close });

  return (
    <>
      <Switch
        checked={user.hasPin}
        disabled={pending}
        onCheckedChange={(checked) => setDialog(checked ? "set" : "remove")}
        aria-label={`PIN ${user.name}`}
      />

      <Dialog open={dialog === "set"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={set.onSubmit} className="flex flex-col gap-6">
            <FieldSet disabled={set.pending} className="contents">
              <DialogHeader>
                <DialogTitle>Pasang PIN {user.name}</DialogTitle>
                <DialogDescription>
                  PIN {PIN_LENGTH} digit ini diminta saat memilih akun. {user.name} akan keluar dari semua
                  perangkat.
                </DialogDescription>
              </DialogHeader>
              <input type="hidden" name="userId" value={user.id} />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={`admin-pin-${user.id}`}>PIN baru</FieldLabel>
                  <PinInput id={`admin-pin-${user.id}`} name="pin" autoFocus revealable />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`admin-pin-confirm-${user.id}`}>Ulangi PIN</FieldLabel>
                  <PinInput id={`admin-pin-confirm-${user.id}`} name="confirmPin" revealable />
                  <FieldDescription>Beri tahu PIN ini ke {user.name}, bisa diganti sendiri di Pengaturan.</FieldDescription>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </DialogClose>
                <SubmitButton pending={set.pending}>Pasang PIN</SubmitButton>
              </DialogFooter>
            </FieldSet>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dialog === "remove"} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Matikan PIN {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              PIN dihapus dan akun jadi terbuka. Pengguna bisa memasang PIN baru di Pengaturan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => run(() => resetUserPin(user.id), "PIN dimatikan")}>
              Matikan PIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
