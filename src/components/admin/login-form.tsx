"use client";

import { adminLogin } from "@/actions/admin";
import { useFormAction } from "@/hooks/use-action-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AdminLoginForm() {
  const { pending, onSubmit } = useFormAction(adminLogin);
  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="admin-password">Password admin</FieldLabel>
          <Input id="admin-password" name="password" type="password" autoComplete="current-password" required autoFocus />
        </Field>
        <SubmitButton pending={pending}>Masuk</SubmitButton>
      </FieldGroup>
    </form>
  );
}
