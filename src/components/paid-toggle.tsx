"use client";

import { CheckIcon } from "lucide-react";
import { setOrderPaid } from "@/actions/orders";
import { useActionRunner } from "@/hooks/use-action-feedback";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Tombol cepat untuk pembuka titipan menandai pesanan sudah dibayar. */
export function PaidToggle({ orderId, isPaid }: { orderId: string; isPaid: boolean }) {
  const [pending, run] = useActionRunner();
  return (
    <Button
      size="xs"
      variant={isPaid ? "default" : "outline"}
      disabled={pending}
      onClick={() => run(() => setOrderPaid(orderId, !isPaid))}
    >
      {pending ? <Spinner data-icon="inline-start" /> : isPaid && <CheckIcon data-icon="inline-start" />}
      {isPaid ? "Lunas" : "Tandai lunas"}
    </Button>
  );
}
