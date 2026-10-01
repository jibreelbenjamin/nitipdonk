"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ArrowLeftIcon,
  BanknoteIcon,
  HistoryIcon,
  ReceiptTextIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  WifiOffIcon,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Logo } from "@/components/logo";
import { OrdersSummary } from "@/components/orders-summary";
import { RetryButton } from "@/components/retry-button";
import { TripStatusBadge } from "@/components/trip-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { formatDateTime, formatRelative, formatRupiah, formatTime } from "@/lib/format";
import { useOfflineTrips, type OfflineOrder, type OfflineTrip } from "@/lib/offline-trips";
import { tripRecap } from "@/lib/trips";

const subscribeNothing = () => () => {};

/** Id titipan dari alamat yang gagal dibuka, mis. /titipan/abc saat sinyal hilang. */
function usePathTripId() {
  return useSyncExternalStore(
    subscribeNothing,
    () => /^\/titipan\/([^/]+)\/?$/.exec(window.location.pathname)?.[1] ?? null,
    () => null,
  );
}

/**
 * Isi halaman offline: titipan yang tersimpan di HP ini. Selama belum ada yang tersimpan
 * (atau JavaScript belum jalan), yang tampil `children`, yaitu pesan offline biasa.
 */
export function OfflineTrips({ children }: { children: React.ReactNode }) {
  const trips = useOfflineTrips();
  const pathTripId = usePathTripId();
  // undefined = belum memilih apa-apa, jadi buka titipan sesuai alamat halaman
  const [selectedId, setSelectedId] = useState<string | null>();
  if (!trips?.length) return children;

  const active = trips.find((trip) => trip.id === (selectedId === undefined ? pathTripId : selectedId));

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
          <Logo />
          <Badge variant="outline">
            <WifiOffIcon data-icon="inline-start" />
            Offline
          </Badge>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <Alert>
          <WifiOffIcon />
          <AlertTitle>Kamu sedang offline</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>Ini data terakhir yang tersimpan di HP ini, bisa saja sudah berubah.</span>
            <RetryButton size="sm" variant="outline" href={active ? `/titipan/${active.id}` : "/titipan"} />
          </AlertDescription>
        </Alert>
        {active ? (
          <TripDetail trip={active} onBack={() => setSelectedId(null)} />
        ) : (
          <TripList trips={trips} onSelect={setSelectedId} />
        )}
      </main>
    </>
  );
}

function TripList({ trips, onSelect }: { trips: OfflineTrip[]; onSelect: (id: string) => void }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Titipan tersimpan</h1>
        <p className="text-sm text-muted-foreground">Titipan yang kamu buka saat online dalam 24 jam terakhir.</p>
      </div>
      {trips.map((trip) => (
        <button
          key={trip.id}
          type="button"
          onClick={() => onSelect(trip.id)}
          className="block w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Card className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserAvatar name={trip.hostName} size="sm" />
                <span className="truncate">
                  {trip.isHost ? "Kamu" : trip.hostName} · {formatRelative(trip.createdAt)}
                </span>
              </div>
              <CardTitle className="pt-1 text-lg">{trip.title}</CardTitle>
              {trip.note && <CardDescription className="line-clamp-2">{trip.note}</CardDescription>}
              <CardAction>
                <TripStatusBadge trip={trip} />
              </CardAction>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{trip.orders.length > 0 ? `${trip.orders.length} titipan` : "Belum ada titipan"}</span>
              <span>Diperbarui {formatTime(trip.savedAt)}</span>
            </CardContent>
          </Card>
        </button>
      ))}
    </section>
  );
}

function TripDetail({ trip, onBack }: { trip: OfflineTrip; onBack: () => void }) {
  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 self-start" onClick={onBack}>
        <ArrowLeftIcon data-icon="inline-start" />
        Titipan tersimpan
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar name={trip.hostName} size="sm" />
            <span className="truncate">
              Dibuka {trip.isHost ? "kamu" : trip.hostName} · {formatDateTime(trip.createdAt)}
            </span>
          </div>
          <CardTitle className="pt-1 text-xl">{trip.title}</CardTitle>
          {trip.note && <CardDescription className="whitespace-pre-wrap">{trip.note}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <TripStatusBadge trip={trip} />
            <Badge variant="outline" className="text-muted-foreground">
              <HistoryIcon data-icon="inline-start" />
              Diperbarui {formatTime(trip.savedAt)}
            </Badge>
          </div>
          {trip.orders.length > 0 && <CopyButton value={tripRecap(trip)} label="Salin rekap" />}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <OrdersSummary orders={trip.orders} />
        {trip.orders.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptTextIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada yang titip</EmptyTitle>
              <EmptyDescription>Saat terakhir disimpan, belum ada pesanan di titipan ini.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-2">
            {trip.orders.map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}
          </ItemGroup>
        )}
      </section>
    </>
  );
}

/** Sama seperti di halaman titipan, tapi tanpa gambar dan tombol aksi. */
function OrderItem({ order }: { order: OfflineOrder }) {
  return (
    <Item variant="outline" className="flex-nowrap items-start">
      <ItemMedia>
        <UserAvatar name={order.name} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>
          {order.name}
          {order.isMine && <Badge variant="secondary">Kamu</Badge>}
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
          {order.hasProof ? (
            <Badge variant="outline">
              <ReceiptTextIcon data-icon="inline-start" />
              Ada bukti
            </Badge>
          ) : (
            order.paymentMethod === "CASHLESS" && (
              <Badge variant="destructive">
                <TriangleAlertIcon data-icon="inline-start" />
                Belum ada bukti
              </Badge>
            )
          )}
          <Badge variant={order.isPaid ? "default" : "outline"}>{order.isPaid ? "Lunas" : "Belum lunas"}</Badge>
          <span className="text-xs text-muted-foreground">{formatRelative(order.createdAt)}</span>
        </div>
      </ItemContent>
    </Item>
  );
}
