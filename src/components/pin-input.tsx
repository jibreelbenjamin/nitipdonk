"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { PIN_LENGTH } from "@/lib/constants";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function PinInput(
  props: Omit<React.ComponentProps<typeof InputOTP>, "maxLength" | "render" | "children">,
) {
  return (
    <InputOTP
      maxLength={PIN_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      type="password"
      inputMode="numeric"
      autoComplete="off"
      {...props}
    >
      <InputOTPGroup>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <InputOTPSlot key={index} index={index} masked className="size-10 text-base" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
