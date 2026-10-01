"use client";

import { useState } from "react";
import { KeyRoundIcon } from "lucide-react";
import { changeAdminPassword } from "@/actions/admin";
import { useFormAction } from "@/hooks/use-action-feedback";
import { ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";
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
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const { pending, onSubmit } = useFormAction(changeAdminPassword, {
    success: "Password admin diganti",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ganti password admin">
          <KeyRoundIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <FieldSet disabled={pending} className="contents">
            <DialogHeader>
              <DialogTitle>Ganti password admin</DialogTitle>
              <DialogDescription>Perangkat ini tetap masuk, sesi admin di perangkat lain akan keluar.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="admin-current-password">Password lama</FieldLabel>
                <PasswordInput
                  id="admin-current-password"
                  name="currentPassword"
                  autoComplete="current-password"
                  required
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-new-password">Password baru</FieldLabel>
                <PasswordInput
                  id="admin-new-password"
                  name="password"
                  autoComplete="new-password"
                  minLength={ADMIN_PASSWORD_MIN_LENGTH}
                  required
                />
                <FieldDescription>Minimal {ADMIN_PASSWORD_MIN_LENGTH} karakter, jangan yang mudah ditebak.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-confirm-password">Ulangi password baru</FieldLabel>
                <PasswordInput
                  id="admin-confirm-password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  minLength={ADMIN_PASSWORD_MIN_LENGTH}
                  required
                />
              </Field>
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
      </DialogContent>
    </Dialog>
  );
}
