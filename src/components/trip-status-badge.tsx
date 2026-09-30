import { CheckCheckIcon, ClockIcon, LockIcon, ShoppingCartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/format";
import { isAcceptingOrders } from "@/lib/trips";

type Trip = { status: "OPEN" | "CLOSED" | "DONE"; closesAt: string | null };

export function TripStatusBadge({ trip }: { trip: Trip }) {
  if (trip.status === "DONE") {
    return (
      <Badge variant="secondary">
        <CheckCheckIcon data-icon="inline-start" />
        Selesai
      </Badge>
    );
  }
  if (trip.status === "CLOSED") {
    return (
      <Badge variant="outline">
        <ShoppingCartIcon data-icon="inline-start" />
        Sedang dibeli
      </Badge>
    );
  }
  if (!isAcceptingOrders(trip)) {
    return (
      <Badge variant="outline">
        <LockIcon data-icon="inline-start" />
        Tutup {trip.closesAt && formatTime(trip.closesAt)}
      </Badge>
    );
  }
  return (
    <Badge>
      <ClockIcon data-icon="inline-start" />
      {trip.closesAt ? `Buka s/d ${formatTime(trip.closesAt)}` : "Buka"}
    </Badge>
  );
}
