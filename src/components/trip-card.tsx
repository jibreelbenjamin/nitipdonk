import Link from "next/link";
import { ShoppingBasketIcon } from "lucide-react";
import { TripStatusBadge } from "@/components/trip-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import { imageUrl } from "@/lib/images";

type Person = { id: string; name: string; avatar: { path: string } | null };

export type TripCardData = {
  id: string;
  title: string;
  note: string | null;
  status: "OPEN" | "CLOSED" | "DONE";
  closesAt: string | null;
  createdAt: string;
  host: Person;
  orders: { user: Person }[];
};

export function TripCard({ trip, currentUserId }: { trip: TripCardData; currentUserId: string }) {
  const people = [...new Map(trip.orders.map((order) => [order.user.id, order.user])).values()];
  const joined = people.some((person) => person.id === currentUserId);

  return (
    <Link
      href={`/titipan/${trip.id}`}
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="transition-colors hover:bg-muted/40">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar name={trip.host.name} src={imageUrl(trip.host.avatar)} size="sm" />
            <span className="truncate">
              {trip.host.id === currentUserId ? "Kamu" : trip.host.name} · {formatRelative(trip.createdAt)}
            </span>
          </div>
          <CardTitle className="pt-1 text-lg">{trip.title}</CardTitle>
          {trip.note && <CardDescription className="line-clamp-2">{trip.note}</CardDescription>}
          <CardAction>
            <TripStatusBadge trip={trip} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {people.length > 0 ? (
              <AvatarGroup>
                {people.slice(0, 4).map((person) => (
                  <UserAvatar key={person.id} name={person.name} src={imageUrl(person.avatar)} size="sm" />
                ))}
                {people.length > 4 && <AvatarGroupCount className="size-6 text-xs">+{people.length - 4}</AvatarGroupCount>}
              </AvatarGroup>
            ) : (
              <ShoppingBasketIcon className="size-4" />
            )}
            <span>{trip.orders.length > 0 ? `${trip.orders.length} titipan` : "Belum ada titipan"}</span>
          </div>
          {joined && <Badge variant="secondary">Kamu ikut titip</Badge>}
        </CardContent>
      </Card>
    </Link>
  );
}
