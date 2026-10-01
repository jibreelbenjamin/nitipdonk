"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { adminLogin } from "@/actions/admin";
import { useFormAction } from "@/hooks/use-action-feedback";
import { SubmitButton } from "@/components/submit-button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { pending, onSubmit } = useFormAction(adminLogin, { navigates: true });
  return (
    <form onSubmit={onSubmit}>
      <FieldSet disabled={pending} className="contents">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="admin-password">Password admin</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                autoFocus
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((show) => !show)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <SubmitButton pending={pending}>Masuk</SubmitButton>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
