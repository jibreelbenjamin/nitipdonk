"use client";

import { BanknoteIcon, SmartphoneIcon } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type PaymentMethodValue = "CASH" | "CASHLESS";

export function PaymentMethodField({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: PaymentMethodValue;
  onChange: (value: PaymentMethodValue) => void;
}) {
  const options = [
    { value: "CASHLESS", title: "Cashless", description: "Transfer / QRIS", icon: SmartphoneIcon },
    { value: "CASH", title: "Cash", description: "Bayar tunai", icon: BanknoteIcon },
  ] as const;

  return (
    <FieldSet>
      <FieldLegend variant="label">Bayar pakai</FieldLegend>
      <RadioGroup
        name="paymentMethod"
        value={value}
        onValueChange={(next) => onChange(next as PaymentMethodValue)}
        className="grid-cols-2"
      >
        {options.map((option) => (
          <FieldLabel key={option.value} htmlFor={`${idPrefix}-${option.value}`}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>
                  <option.icon className="size-4" />
                  {option.title}
                </FieldTitle>
                <FieldDescription>{option.description}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={option.value} id={`${idPrefix}-${option.value}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  );
}
