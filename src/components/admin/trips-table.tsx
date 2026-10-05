"use client";

import { createContext, use, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCheckIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  LockIcon,
  LockOpenIcon,
  PencilIcon,
  ShoppingCartIcon,
  Trash2Icon,
} from "lucide-react";
import { adminCreateTrip, adminDeleteTrips, adminSetTripsStatus } from "@/actions/admin-trips";
import { DeleteTripsDialog, EditTripDialog } from "@/components/admin/trip-dialogs";
import { CreateTripDialog } from "@/components/create-trip-dialog";
import { DataTable, selectColumn } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { FacetOption } from "@/components/data-table/data-table-faceted-filter";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { TripStatusBadge } from "@/components/trip-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import type { UserOption } from "@/components/user-select";
import { useActionRunner } from "@/hooks/use-action-feedback";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { type TripPhase, tripPhase } from "@/lib/trips";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

type TripStatus = "OPEN" | "CLOSED" | "DONE";

export type AdminTripRow = {
  id: string;
  title: string;
  note: string | null;
  status: TripStatus;
  closesAt: string | null;
  createdAt: string;
  host: { id: string; name: string; avatarUrl?: string };
  orderCount: number;
  paidCount: number;
  total: number;
};

const PHASES: (FacetOption & { value: TripPhase })[] = [
  { value: "OPEN", label: "Buka", icon: ClockIcon },
  { value: "EXPIRED", label: "Lewat jam tutup", icon: LockIcon },
  { value: "CLOSED", label: "Sedang dibeli", icon: ShoppingCartIcon },
  { value: "DONE", label: "Selesai", icon: CheckCheckIcon },
];
const PHASE_ORDER = PHASES.map((phase) => phase.value);

const STATUS_ACTIONS: { status: TripStatus; label: string; done: string; icon: typeof LockIcon }[] = [
  { status: "OPEN", label: "Buka lagi", done: "dibuka lagi", icon: LockOpenIcon },
  { status: "CLOSED", label: "Tutup (sedang dibeli)", done: "ditutup", icon: LockIcon },
  { status: "DONE", label: "Tandai selesai", done: "ditandai selesai", icon: CheckCheckIcon },
];

const searchText = (trip: AdminTripRow) => `${trip.title} ${trip.note ?? ""} ${trip.host.name}`;

// Pilihan pembuka titipan (akun Admin + pengguna) untuk dialog ubah titipan. Lewat context (bukan dari luar kolom) supaya definisi
// kolom tetap sama; kalau kolom dibuat ulang, isi sel ikut dipasang ulang setiap data dimuat ulang.
const HostsContext = createContext<UserOption[]>([]);

const columns: ColumnDef<AdminTripRow>[] = [
  selectColumn<AdminTripRow>(),
  {
    id: "title",
    accessorFn: (trip) => trip.title,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Titipan" />,
    cell: ({ row }) => (
      <div className="flex max-w-xs min-w-48 flex-col whitespace-normal">
        <Link href={`/admin/titipan/${row.original.id}`} className="font-medium underline-offset-4 hover:underline">
          {row.original.title}
        </Link>
        {row.original.note && <span className="line-clamp-1 text-xs text-muted-foreground">{row.original.note}</span>}
      </div>
    ),
    sortingFn: "text",
    enableHiding: false,
    meta: { label: "Titipan" },
  },
  {
    id: "host",
    accessorFn: (trip) => trip.host.id,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pembuka" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <UserAvatar name={row.original.host.name} src={row.original.host.avatarUrl} size="sm" />
        <span>{row.original.host.name}</span>
      </div>
    ),
    sortingFn: (a, b) => a.original.host.name.localeCompare(b.original.host.name, "id"),
    filterFn: "facet",
    meta: { label: "Pembuka" },
  },
  {
    id: "phase",
    accessorFn: (trip) => tripPhase(trip),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <TripStatusBadge trip={row.original} />,
    sortingFn: (a, b) =>
      PHASE_ORDER.indexOf(a.getValue<TripPhase>("phase")) - PHASE_ORDER.indexOf(b.getValue<TripPhase>("phase")),
    filterFn: "facet",
    meta: { label: "Status" },
  },
  {
    id: "orders",
    accessorFn: (trip) => trip.orderCount,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pesanan" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.orderCount}</span>,
    meta: { label: "Pesanan" },
  },
  {
    id: "paid",
    accessorFn: (trip) => (trip.orderCount === 0 ? -1 : trip.paidCount / trip.orderCount),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lunas" />,
    cell: ({ row }) =>
      row.original.orderCount === 0 ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="tabular-nums">
          {row.original.paidCount}/{row.original.orderCount}
        </span>
      ),
    meta: { label: "Lunas" },
  },
  {
    id: "total",
    accessorFn: (trip) => trip.total,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
    cell: ({ row }) =>
      row.original.total > 0 ? (
        <span className="tabular-nums">{formatRupiah(row.original.total)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    meta: { label: "Total" },
  },
  {
    id: "createdAt",
    accessorFn: (trip) => trip.createdAt,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dibuat" />,
    cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
    sortingFn: "basic",
    meta: { label: "Dibuat" },
  },
  {
    id: "actions",
    cell: ({ row }) => <TripRowActions trip={row.original} />,
    enableSorting: false,
    enableHiding: false,
    meta: { className: "w-10 text-right" },
  },
];

/** Semua titipan untuk admin: cari, filter, urutkan, ubah, ubah status, dan hapus (satu atau banyak). */
export function AdminTripsTable({ trips, hosts }: { trips: AdminTripRow[]; hosts: UserOption[] }) {
  const tripHosts = [...new Map(trips.map((trip) => [trip.host.id, trip.host])).values()].sort((a, b) =>
    a.name.localeCompare(b.name, "id"),
  );

  return (
    <HostsContext value={hosts}>
      <DataTable
        columns={columns}
        data={trips}
        searchText={searchText}
        initialSorting={[{ id: "createdAt", desc: true }]}
        pageSize={20}
        emptyText="Belum ada titipan."
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            searchPlaceholder="Cari titipan, catatan, pembuka…"
            filters={[
              { column: "phase", title: "Status", options: PHASES },
              {
                column: "host",
                title: "Pembuka",
                options: tripHosts.map((host) => ({ value: host.id, label: host.name })),
              },
            ]}
            actions={<CreateTripDialog hosts={hosts} action={adminCreateTrip} size="sm" />}
            selectionActions={(rows) => (
              <TripBulkActions tripIds={rows.map((row) => row.original.id)} onDone={() => table.resetRowSelection()} />
            )}
          />
        )}
      />
    </HostsContext>
  );
}

function TripBulkActions({ tripIds, onDone }: { tripIds: string[]; onDone: () => void }) {
  const [pending, run] = useActionRunner();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            Ubah status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {STATUS_ACTIONS.map((action) => (
            <DropdownMenuItem
              key={action.status}
              onSelect={() =>
                run(
                  () => adminSetTripsStatus(tripIds, action.status),
                  `${tripIds.length} titipan ${action.done}`,
                  onDone,
                )
              }
            >
              <action.icon />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="destructive" size="sm" disabled={pending} onClick={() => setConfirmDelete(true)}>
        <Trash2Icon data-icon="inline-start" />
        Hapus
      </Button>
      <DeleteTripsDialog
        count={tripIds.length}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={() => run(() => adminDeleteTrips(tripIds), `${tripIds.length} titipan dihapus`, onDone)}
      />
    </>
  );
}

function TripRowActions({ trip }: { trip: AdminTripRow }) {
  const hosts = use(HostsContext);
  const [pending, run] = useActionRunner();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const phase = tripPhase(trip);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${trip.title}`} disabled={pending}>
            {pending ? <Spinner /> : <EllipsisVerticalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="truncate">{trip.title}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/titipan/${trip.id}`}>
              <ExternalLinkIcon />
              Kelola pesanan
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("edit")}>
            <PencilIcon />
            Ubah titipan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {STATUS_ACTIONS.filter((action) =>
            action.status === "OPEN" ? phase !== "OPEN" : action.status !== trip.status,
          ).map((action) => (
            <DropdownMenuItem
              key={action.status}
              onSelect={() => run(() => adminSetTripsStatus([trip.id], action.status), `Titipan ${action.done}`)}
            >
              <action.icon />
              {action.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
            <Trash2Icon />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTripDialog
        trip={{ ...trip, hostId: trip.host.id }}
        users={hosts}
        open={dialog === "edit"}
        onOpenChange={(open) => setDialog(open ? "edit" : null)}
      />
      <DeleteTripsDialog
        count={1}
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        onConfirm={() => run(() => adminDeleteTrips([trip.id]), "Titipan dihapus")}
      />
    </>
  );
}
