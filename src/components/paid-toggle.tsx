"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setOrderPaid } from "@/actions/orders";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Result = { ok: true } | { ok: false; error: string };

/** Switch untuk pembuka titipan (atau admin lewat `action`) menandai pesanan lunas, ada bukti bayar atau tidak. */
export function PaidToggle({
  orderId,
  isPaid,
  action = setOrderPaid,
  label = "Lunas",
}: {
  orderId: string;
  isPaid: boolean;
  action?: (orderId: string, isPaid: boolean) => Promise<Result>;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  // Langsung berubah saat diklik; kembali otomatis kalau server menolak
  const [optimisticPaid, setOptimisticPaid] = useOptimistic(isPaid);
  const id = `paid-${orderId}`;

  function toggle(checked: boolean) {
    startTransition(async () => {
      setOptimisticPaid(checked);
      const result = await action(orderId, checked);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Switch id={id} size="sm" checked={optimisticPaid} disabled={pending} onCheckedChange={toggle} />
      <Label htmlFor={id} className="text-xs font-normal">
        {label}
      </Label>
    </div>
  );
}
