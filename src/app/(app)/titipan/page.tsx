import { ClockIcon, CoffeeIcon } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { CreateTripDialog } from "@/components/create-trip-dialog";
import { TripCard, type TripCardData } from "@/components/trip-card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { liveSince } from "@/lib/trips";

const person = { select: { id: true, name: true, avatar: { select: { path: true } } } };
const tripSelect = {
  id: true,
  title: true,
  note: true,
  status: true,
  closesAt: true,
  createdAt: true,
  host: person,
  orders: { select: { user: person }, orderBy: { createdAt: "asc" as const } },
};

export default async function TripsPage() {
  const user = await requireUser();
  const since = liveSince();

  const [live, history] = await Promise.all([
    prisma.trip.findMany({
      where: { status: { not: "DONE" }, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: tripSelect,
    }),
    prisma.trip.findMany({
      where: { OR: [{ status: "DONE" }, { createdAt: { lt: since } }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: tripSelect,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Titipan live</h1>
          <p className="text-sm text-muted-foreground">Halo {user.name}, ada yang lagi jalan beli nih.</p>
        </div>
        <CreateTripDialog />
      </div>

      <Tabs defaultValue="live" className="gap-4">
        <TabsList>
          <TabsTrigger value="live">
            Live
            {live.length > 0 && <Badge className="h-5 min-w-5 px-1.5">{live.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>
        <TabsContent value="live">
          <TripList
            trips={live}
            userId={user.id}
            empty={
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CoffeeIcon />
                  </EmptyMedia>
                  <EmptyTitle>Belum ada titipan</EmptyTitle>
                  <EmptyDescription>
                    Lagi mau jajan? Buka titipan biar yang lain bisa ikut nitip.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
          />
        </TabsContent>
        <TabsContent value="history">
          <TripList
            trips={history}
            userId={user.id}
            empty={
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ClockIcon />
                  </EmptyMedia>
                  <EmptyTitle>Riwayat kosong</EmptyTitle>
                  <EmptyDescription>Titipan yang sudah selesai akan muncul di sini.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TripList({ trips, userId, empty }: { trips: TripCardData[]; userId: string; empty: React.ReactNode }) {
  if (trips.length === 0) return empty;
  return (
    <div className="flex flex-col gap-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} currentUserId={userId} />
      ))}
    </div>
  );
}
