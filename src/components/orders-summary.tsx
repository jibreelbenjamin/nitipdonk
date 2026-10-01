import { BanknoteIcon, SmartphoneIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";

type SummaryOrder = { price: number | null; paymentMethod: "CASH" | "CASHLESS"; isPaid: boolean };

/** Judul "Daftar titipan" beserta total dan jumlah cash/cashless/lunas. */
export function OrdersSummary({ orders }: { orders: SummaryOrder[] }) {
  const total = orders.reduce((sum, order) => sum + (order.price ?? 0), 0);
  const paidCount = orders.filter((order) => order.isPaid).length;
  const cashCount = orders.filter((order) => order.paymentMethod === "CASH").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Daftar titipan ({orders.length})</h2>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            Total <span className="font-medium text-foreground">{formatRupiah(total)}</span>
          </span>
        )}
      </div>
      {orders.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">
            <SmartphoneIcon data-icon="inline-start" />
            {orders.length - cashCount} cashless
          </Badge>
          <Badge variant="outline">
            <BanknoteIcon data-icon="inline-start" />
            {cashCount} cash
          </Badge>
          <Badge variant="secondary">
            {paidCount}/{orders.length} lunas
          </Badge>
        </div>
      )}
    </>
  );
}
