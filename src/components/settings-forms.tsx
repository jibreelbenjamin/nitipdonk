"use client";

import { useState } from "react";
import { LockIcon, LockOpenIcon, ShieldCheckIcon } from "lucide-react";
import { removePin, setPin, updatePayment, updateProfile } from "@/actions/profile";
import { useFormAction } from "@/hooks/use-action-feedback";
import { PIN_LENGTH } from "@/lib/constants";
import { ImageInput } from "@/components/image-input";
import { PinInput } from "@/components/pin-input";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProfileForm({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const [processing, setProcessing] = useState(false);
  const { pending, onSubmit } = useFormAction(updateProfile, { success: "Profil disimpan" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Foto profil otomatis dipotong persegi & dikompres.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="contents">
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-avatar">Foto profil</FieldLabel>
              <ImageInput
                key={avatarUrl}
                id="profile-avatar"
                name="avatar"
                currentUrl={avatarUrl}
                removeName="removeAvatar"
                shape="circle"
                onProcessingChange={setProcessing}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-name">Nama</FieldLabel>
              <Input id="profile-name" name="name" defaultValue={name} maxLength={40} required />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <SubmitButton pending={pending} disabled={processing}>
            Simpan profil
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}

export function PaymentForm({ paymentInfo, qrUrl }: { paymentInfo?: string; qrUrl?: string }) {
  const [processing, setProcessing] = useState(false);
  const { pending, onSubmit } = useFormAction(updatePayment, { success: "Info pembayaran disimpan" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Info pembayaran</CardTitle>
        <CardDescription>
          Ditampilkan saat kamu membuka titipan, supaya teman bisa transfer ke kamu.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="contents">
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="payment-info">Teks</FieldLabel>
              <Textarea
                id="payment-info"
                name="paymentInfo"
                defaultValue={paymentInfo}
                placeholder={"BCA 1234567890 a.n. Budi\nGoPay / DANA 0812-3456-7890"}
                maxLength={300}
                rows={3}
              />
              <FieldDescription>Nomor rekening, e-wallet, atau catatan lain.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="payment-qr">Gambar (QRIS)</FieldLabel>
              <ImageInput
                key={qrUrl}
                id="payment-qr"
                name="paymentQr"
                currentUrl={qrUrl}
                removeName="removePaymentQr"
                onProcessingChange={setProcessing}
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <SubmitButton pending={pending} disabled={processing}>
            Simpan pembayaran
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}

export function PinSettings({ hasPin }: { hasPin: boolean }) {
  const [formKey, setFormKey] = useState(0);
  const { pending, onSubmit } = useFormAction(setPin, {
    success: (state) => (state.ok && state.data === "changed" ? "PIN diganti" : "PIN dipasang"),
    onSuccess: () => setFormKey((key) => key + 1),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>PIN</CardTitle>
        <CardDescription>
          PIN {PIN_LENGTH} digit diminta setiap kali ada yang memilih akunmu.
        </CardDescription>
        <CardAction>
          {hasPin ? (
            <Badge>
              <LockIcon data-icon="inline-start" />
              Aktif
            </Badge>
          ) : (
            <Badge variant="outline">
              <LockOpenIcon data-icon="inline-start" />
              Terbuka
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        <form key={formKey} id="pin-form" onSubmit={onSubmit}>
          <FieldGroup>
            {!hasPin && (
              <Alert>
                <ShieldCheckIcon />
                <AlertTitle>Akunmu masih terbuka</AlertTitle>
                <AlertDescription>
                  Siapa pun yang membuka aplikasi bisa masuk sebagai kamu. Pasang PIN kalau mau lebih aman.
                </AlertDescription>
              </Alert>
            )}
            {hasPin && (
              <Field>
                <FieldLabel htmlFor="pin-current">PIN lama</FieldLabel>
                <PinInput id="pin-current" name="currentPin" />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="pin-new">PIN baru</FieldLabel>
              <PinInput id="pin-new" name="pin" />
            </Field>
            <Field>
              <FieldLabel htmlFor="pin-confirm">Ulangi PIN baru</FieldLabel>
              <PinInput id="pin-confirm" name="confirmPin" />
              {hasPin && (
                <FieldDescription>Mengganti PIN akan mengeluarkan akunmu dari perangkat lain.</FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-2">
        {hasPin ? <RemovePinDialog /> : <span />}
        <SubmitButton form="pin-form" pending={pending}>
          {hasPin ? "Ganti PIN" : "Pasang PIN"}
        </SubmitButton>
      </CardFooter>
    </Card>
  );
}

function RemovePinDialog() {
  const [open, setOpen] = useState(false);
  const { pending, onSubmit } = useFormAction(removePin, {
    success: "PIN dihapus, akunmu sekarang terbuka",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost">
          Hapus PIN
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Hapus PIN?</DialogTitle>
            <DialogDescription>Akunmu akan terbuka lagi tanpa PIN. Masukkan PIN sekarang untuk konfirmasi.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="pin-remove">PIN sekarang</FieldLabel>
            <PinInput id="pin-remove" name="currentPin" autoFocus />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </DialogClose>
            <SubmitButton pending={pending} variant="destructive">
              Hapus PIN
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
