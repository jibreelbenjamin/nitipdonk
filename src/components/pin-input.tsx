"use client";

import { useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { PIN_LENGTH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export function PinInput({
  revealable = false,
  ...props
}: Omit<React.ComponentProps<typeof InputOTP>, "maxLength" | "render" | "children"> & {
  /** Tampilkan tombol untuk melihat PIN yang sedang diketik. */
  revealable?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  const input = (
    <InputOTP
      maxLength={PIN_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      type={revealed ? "text" : "password"}
      inputMode="numeric"
      autoComplete="off"
      {...props}
    >
      <InputOTPGroup>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <InputOTPSlot key={index} index={index} masked={!revealed} className="size-10 text-base" />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );

  if (!revealable) return input;
  return (
    <div className="flex items-center gap-2">
      {input}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={revealed ? "Sembunyikan PIN" : "Tampilkan PIN"}
        aria-pressed={revealed}
        onClick={() => setRevealed((show) => !show)}
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
    </div>
  );
}
