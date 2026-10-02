import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { type AdminOrderRow, AdminOrdersTable } from "@/components/admin/orders-table";
import { TripAdminActions } from "@/components/admin/trip-admin-actions";
import { CopyButton } from "@/components/copy-button";
import { OrdersSummary } from "@/components/orders-summary";
import { TripImages } from "@/components/trip-images";
import { TripStatusBadge } from "@/components/trip-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserOptions } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { requireAdmin } from "@/lib/session";
import { db, must } from "@/lib/supabase";
import { isAcceptingOrders, tripRecap } from "@/lib/trips";

export default async function AdminTripPage({ params }: PageProps<"/admin/titipan/[id]">) {
  // Cek di halaman juga: layout tidak dirender ulang saat pindah halaman, jadi tidak cukup sendirian
  await requireAdmin();
  const { id } = await params;
  const [tripResult, users] = await Promise.all([
    db()
      .from("Trip")
      .select(
        `*,
        host:User!Trip_hostId_fkey(id, name, isActive, avatar:Image!User_avatarId_fkey(path)),
        orders:Order(*, user:User!Order_userId_fkey(id, name, avatar:Image!User_avatarId_fkey(path)), proof:Image!Order_proofId_fkey(path, width, height)),
        images:Image!Image_tripId_fkey(id, path, width, height, createdAt)`,
      )
      .eq("id", id)
      .order("createdAt", { referencedTable: "orders" })
      .order("createdAt", { referencedTable: "images" })
      .maybeSingle(),
    getUserOptions(),
  ]);
  const trip = must(tripResult);
  if (!trip) notFound();

  const orders: AdminOrderRow[] = trip.orders.map((order) => ({
    id: order.id,
    items: order.items,
    price: order.price,
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    createdAt: order.createdAt,
    user: { id: order.user.id, name: order.user.name, avatarUrl: imageUrl(order.user.avatar) },
    proof: order.proof ? { url: imageUrl(order.proof)!, width: order.proof.width, height: order.proof.height } : null,
  }));
  const { host } = trip;
  const recap = tripRecap({
    title: trip.title,
    hostName: host.name,
    orders: trip.orders.map((order) => ({ ...order, name: order.user.name })),
  });

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/admin/titipan">
          <ArrowLeftIcon data-icon="inline-start" />
          Semua titipan
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar name={host.name} src={imageUrl(host.avatar)} size="sm" />
            <span className="truncate">
              Dibuka {host.name} · {formatDateTime(trip.createdAt)}
            </span>
            {!host.isActive && <Badge variant="outline">Akun nonaktif</Badge>}
          </div>
          <CardTitle className="pt-1 text-xl">{trip.title}</CardTitle>
          {trip.note && <CardDescription className="whitespace-pre-wrap">{trip.note}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <TripStatusBadge trip={trip} />
              {trip.closesAt && (
                <Badge variant="outline" className="text-muted-foreground">
                  Jam tutup {formatDateTime(trip.closesAt)}
                </Badge>
              )}
            </div>
            {trip.orders.length > 0 && <CopyButton value={recap} label="Salin rekap" />}
          </div>
          <TripImages
            tripId={trip.id}
            title={trip.title}
            images={trip.images.map((image) => ({
              id: image.id,
              url: imageUrl(image)!,
              width: image.width,
              height: image.height,
            }))}
            canEdit
            manager="admin"
          />
        </CardContent>
        <CardFooter>
          <TripAdminActions
            trip={{
              id: trip.id,
              hostId: trip.hostId,
              title: trip.title,
              note: trip.note,
              status: trip.status,
              closesAt: trip.closesAt,
            }}
            accepting={isAcceptingOrders(trip)}
            users={users}
          />
        </CardFooter>
      </Card>

      <section className="flex flex-col gap-3">
        <OrdersSummary orders={trip.orders} />
        <AdminOrdersTable tripId={trip.id} tripTitle={trip.title} orders={orders} users={users} />
      </section>
    </>
  );
}
