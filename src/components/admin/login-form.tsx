"use client";

import { adminLogin } from "@/actions/admin";
import { useFormAction } from "@/hooks/use-action-feedback";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

export function AdminLoginForm() {
  const { pending, onSubmit } = useFormAction(adminLogin, { navigates: true });
  return (
    <form onSubmit={onSubmit}>
      <FieldSet disabled={pending} className="contents">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="admin-password">Password admin</FieldLabel>
            <PasswordInput id="admin-password" name="password" autoComplete="current-password" required autoFocus />
          </Field>
          <SubmitButton pending={pending}>Masuk</SubmitButton>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
