import { ClockIcon, CoffeeIcon } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { CreateTripDialog } from "@/components/create-trip-dialog";
import { TripCard, type TripCardData } from "@/components/trip-card";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/lib/session";
import { db, must } from "@/lib/supabase";
import { liveSince } from "@/lib/trips";

const PERSON = "id, name, avatar:Image!User_avatarId_fkey(path)";
const TRIP_CARD = `id, title, note, status, closesAt, createdAt, host:User!Trip_hostId_fkey(${PERSON}), orders:Order(user:User!Order_userId_fkey(${PERSON}))` as const;

export default async function TripsPage() {
  const user = await requireUser();
  const since = liveSince().toISOString();

  const [liveResult, historyResult] = await Promise.all([
    db()
      .from("Trip")
      .select(TRIP_CARD)
      .neq("status", "DONE")
      .gte("createdAt", since)
      .order("createdAt", { ascending: false })
      .order("createdAt", { referencedTable: "orders" }),
    db()
      .from("Trip")
      .select(TRIP_CARD)
      .or(`status.eq.DONE,createdAt.lt."${since}"`)
      .order("createdAt", { ascending: false })
      .order("createdAt", { referencedTable: "orders" })
      .limit(20),
  ]);
  const live = must(liveResult);
  const history = must(historyResult);

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
