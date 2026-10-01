"use client";

import { useState } from "react";
import { createOrder } from "@/actions/orders";
import { useFormAction } from "@/hooks/use-action-feedback";
import { ImageInput } from "@/components/image-input";
import { PaymentMethodField, type PaymentMethodValue } from "@/components/payment-method-field";
import { PriceInput } from "@/components/price-input";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function OrderForm({ tripId, hostName }: { tripId: string; hostName?: string }) {
  const [formKey, setFormKey] = useState(0);
  const [method, setMethod] = useState<PaymentMethodValue>("CASHLESS");
  const [processing, setProcessing] = useState(false);
  const { pending, onSubmit } = useFormAction(createOrder, {
    success: "Titipan ditambahkan",
    onSuccess: () => setFormKey((key) => key + 1),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mau titip apa?</CardTitle>
        <CardDescription>
          {hostName
            ? `Tulis pesananmu sejelas mungkin biar ${hostName} nggak salah beli.`
            : "Catat juga pesananmu sendiri biar totalnya lengkap."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form key={formKey} onSubmit={onSubmit}>
          <FieldSet disabled={pending} className="contents">
            <input type="hidden" name="tripId" value={tripId} />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="order-items">Pesanan</FieldLabel>
                <Textarea
                  id="order-items"
                  name="items"
                  placeholder={"Es kopi susu 1, less sugar\nRoti bakar cokelat 1"}
                  maxLength={500}
                  rows={3}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="order-price">Harga</FieldLabel>
                <PriceInput id="order-price" />
                <FieldDescription>Opsional, perkiraan aja. Bisa diubah nanti.</FieldDescription>
              </Field>
              <PaymentMethodField idPrefix="order-method" value={method} onChange={setMethod} />
              {method === "CASHLESS" && (
                <Field>
                  <FieldLabel htmlFor="order-proof">Bukti pembayaran</FieldLabel>
                  <ImageInput id="order-proof" name="proof" onProcessingChange={setProcessing} />
                  <FieldDescription>Opsional, bisa diupload nanti setelah harga pasti.</FieldDescription>
                </Field>
              )}
              <SubmitButton pending={pending} disabled={processing}>
                Titip
              </SubmitButton>
            </FieldGroup>
          </FieldSet>
        </form>
      </CardContent>
    </Card>
  );
}
