import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  BanknoteIcon,
  InfoIcon,
  ReceiptTextIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { CopyButton } from "@/components/copy-button";
import { ImagePreview } from "@/components/image-preview";
import { OrderActions } from "@/components/order-actions";
import { OrderForm } from "@/components/order-form";
import { PaidToggle } from "@/components/paid-toggle";
import { TripHostActions } from "@/components/trip-host-actions";
import { TripStatusBadge } from "@/components/trip-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { formatDateTime, formatRelative, formatRupiah } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { requireUser } from "@/lib/session";
import { db, must } from "@/lib/supabase";
import { isAcceptingOrders } from "@/lib/trips";

export default async function TripPage({ params }: PageProps<"/titipan/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const trip = must(
    await db()
      .from("Trip")
      .select(
        `*,
        host:User!Trip_hostId_fkey(id, name, paymentInfo, avatar:Image!User_avatarId_fkey(*), paymentQr:Image!User_paymentQrId_fkey(*)),
        orders:Order(*, user:User!Order_userId_fkey(id, name, avatar:Image!User_avatarId_fkey(*)), proof:Image!Order_proofId_fkey(*))`,
      )
      .eq("id", id)
      .order("createdAt", { referencedTable: "orders" })
      .maybeSingle(),
  );
  if (!trip) notFound();

  const isHost = trip.hostId === user.id;
  const accepting = isAcceptingOrders(trip);
  const { host, orders } = trip;
  const total = orders.reduce((sum, order) => sum + (order.price ?? 0), 0);
  const paidCount = orders.filter((order) => order.isPaid).length;
  const cashCount = orders.filter((order) => order.paymentMethod === "CASH").length;

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/titipan">
          <ArrowLeftIcon data-icon="inline-start" />
          Semua titipan
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar name={host.name} src={imageUrl(host.avatar)} size="sm" />
            <span className="truncate">
              Dibuka {isHost ? "kamu" : host.name} · {formatDateTime(trip.createdAt)}
            </span>
          </div>
          <CardTitle className="pt-1 text-xl">{trip.title}</CardTitle>
          {trip.note && <CardDescription className="whitespace-pre-wrap">{trip.note}</CardDescription>}
        </CardHeader>
        <CardContent>
          <TripStatusBadge trip={trip} />
        </CardContent>
        {isHost && (
          <CardFooter>
            <TripHostActions tripId={trip.id} status={trip.status} accepting={accepting} />
          </CardFooter>
        )}
      </Card>

      {!isHost && (
        <Card>
          <CardHeader>
            <CardTitle>Bayar ke {host.name}</CardTitle>
            <CardDescription>Transfer / scan QR, lalu upload bukti di titipanmu.</CardDescription>
          </CardHeader>
          <CardContent>
            {host.paymentQr || host.paymentInfo ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {host.paymentQr && (
                  <ImagePreview
                    src={imageUrl(host.paymentQr)!}
                    alt={`QR pembayaran ${host.name}`}
                    title={`QR pembayaran ${host.name}`}
                    width={host.paymentQr.width}
                    height={host.paymentQr.height}
                    className="size-40 shrink-0"
                  />
                )}
                {host.paymentInfo && (
                  <div className="flex min-w-0 flex-col items-start gap-2">
                    <p className="font-mono text-sm break-words whitespace-pre-wrap">{host.paymentInfo}</p>
                    <CopyButton value={host.paymentInfo} />
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <InfoIcon />
                <AlertTitle>Belum ada info pembayaran</AlertTitle>
                <AlertDescription>
                  <p>{host.name} belum mengisi info pembayaran. Bayar cash atau tanya langsung ya.</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {accepting ? (
        <OrderForm tripId={trip.id} hostName={isHost ? undefined : host.name} />
      ) : (
        <Alert>
          <InfoIcon />
          <AlertTitle>Titipan sudah ditutup</AlertTitle>
          <AlertDescription>
            Sudah tidak bisa titip lagi, tapi bukti pembayaran masih bisa diupload.
          </AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Daftar titipan ({orders.length})
          </h2>
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

        {orders.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptTextIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada yang titip</EmptyTitle>
              <EmptyDescription>Jadi yang pertama!</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-2">
            {orders.map((order) => {
              const isOwner = order.userId === user.id;
              const canEdit = trip.status !== "DONE" && (isOwner || isHost);
              const canDelete = trip.status !== "DONE" && (isHost || (isOwner && accepting));
              return (
                <Item key={order.id} variant="outline" className="flex-nowrap items-start">
                  <ItemMedia>
                    <UserAvatar name={order.user.name} src={imageUrl(order.user.avatar)} />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle>
                      {order.user.name}
                      {isOwner && <Badge variant="secondary">Kamu</Badge>}
                    </ItemTitle>
                    <p className="text-sm break-words whitespace-pre-wrap">{order.items}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {order.price !== null && <Badge variant="secondary">{formatRupiah(order.price)}</Badge>}
                      <Badge variant="outline">
                        {order.paymentMethod === "CASH" ? (
                          <BanknoteIcon data-icon="inline-start" />
                        ) : (
                          <SmartphoneIcon data-icon="inline-start" />
                        )}
                        {order.paymentMethod === "CASH" ? "Cash" : "Cashless"}
                      </Badge>
                      {order.paymentMethod === "CASHLESS" && !order.proof && (
                        <Badge variant="destructive">
                          <TriangleAlertIcon data-icon="inline-start" />
                          Belum ada bukti
                        </Badge>
                      )}
                      {isHost ? (
                        <PaidToggle orderId={order.id} isPaid={order.isPaid} />
                      ) : (
                        <Badge variant={order.isPaid ? "default" : "outline"}>
                          {order.isPaid ? "Lunas" : "Belum lunas"}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{formatRelative(order.createdAt)}</span>
                    </div>
                  </ItemContent>
                  {order.proof && (
                    <ImagePreview
                      src={imageUrl(order.proof)!}
                      alt={`Bukti bayar ${order.user.name}`}
                      title={`Bukti bayar ${order.user.name}`}
                      description={order.price !== null ? formatRupiah(order.price) : undefined}
                      width={order.proof.width}
                      height={order.proof.height}
                      className="size-14 shrink-0"
                    />
                  )}
                  <ItemActions>
                    <OrderActions
                      order={{
                        id: order.id,
                        items: order.items,
                        price: order.price,
                        paymentMethod: order.paymentMethod,
                        hasProof: Boolean(order.proof),
                      }}
                      can={{ isOwner, canEdit, canDelete }}
                    />
                  </ItemActions>
                </Item>
              );
            })}
          </ItemGroup>
        )}
      </section>
    </div>
  );
}
