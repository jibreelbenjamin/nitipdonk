import type { Metadata } from "next";
import { type AdminTripRow, AdminTripsTable } from "@/components/admin/trips-table";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHostOptions } from "@/lib/admin-data";
import { imageUrl } from "@/lib/images";
import { requireAdmin } from "@/lib/session";
import { db, must } from "@/lib/supabase";
import { isAcceptingOrders } from "@/lib/trips";

export const metadata: Metadata = { title: "Titipan – Admin NitipDonk" };

const TRIP_ROW = `id, title, note, status, closesAt, createdAt,
  host:User!Trip_hostId_fkey(id, name, avatar:Image!User_avatarId_fkey(path)),
  orders:Order(price, isPaid)` as const;

// Supabase membatasi 1000 baris per request
const PAGE_SIZE = 1000;

async function allTrips() {
  const trips = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = must(
      await db()
        .from("Trip")
        .select(TRIP_ROW)
        .order("createdAt", { ascending: false })
        .order("id")
        .range(from, from + PAGE_SIZE - 1),
    );
    trips.push(...page);
    if (page.length < PAGE_SIZE) return trips;
  }
}

export default async function AdminTripsPage() {
  // Cek di halaman juga: layout tidak dirender ulang saat pindah halaman, jadi tidak cukup sendirian
  await requireAdmin();
  const [trips, hosts] = await Promise.all([allTrips(), getHostOptions()]);

  const rows: AdminTripRow[] = trips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    note: trip.note,
    status: trip.status,
    closesAt: trip.closesAt,
    createdAt: trip.createdAt,
    host: { id: trip.host.id, name: trip.host.name, avatarUrl: imageUrl(trip.host.avatar) },
    orderCount: trip.orders.length,
    paidCount: trip.orders.filter((order) => order.isPaid).length,
    total: trip.orders.reduce((sum, order) => sum + (order.price ?? 0), 0),
  }));

  const running = trips.filter((trip) => trip.status !== "DONE").length;
  const accepting = trips.filter((trip) => isAcceptingOrders(trip)).length;
  const orders = rows.reduce((sum, trip) => sum + trip.orderCount, 0);
  const unpaid = rows.reduce((sum, trip) => sum + trip.orderCount - trip.paidCount, 0);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Titipan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola semua titipan dan pesanannya: ubah, ganti status, tandai lunas, atau hapus.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Semua titipan" value={trips.length} />
        <StatCard label="Belum selesai" value={running} hint={`${accepting} masih menerima titipan`} />
        <StatCard label="Pesanan" value={orders} />
        <StatCard label="Belum lunas" value={unpaid} hint="Pesanan yang belum ditandai lunas" />
      </div>
      <AdminTripsTable trips={rows} hosts={hosts} />
    </>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
    </Card>
  );
}
