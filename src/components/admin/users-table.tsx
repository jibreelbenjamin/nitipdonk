"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CircleCheckIcon, CircleOffIcon, LockIcon, LockOpenIcon } from "lucide-react";
import { setUsersActive } from "@/actions/admin";
import {
  ActiveToggle,
  CreateUserDialog,
  DeactivateDialog,
  PinToggle,
  UserRowActions,
} from "@/components/admin/user-dialogs";
import { DataTable, selectColumn } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { FacetOption } from "@/components/data-table/data-table-faceted-filter";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { UserAvatar } from "@/components/user-avatar";
import { useActionRunner } from "@/hooks/use-action-feedback";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export type AdminUserRow = {
  id: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  showWhenInactive: boolean;
  hasPin: boolean;
  tripCount: number;
  orderCount: number;
  createdAt: string;
};

const STATUSES: FacetOption[] = [
  { value: "ACTIVE", label: "Aktif", icon: CircleCheckIcon },
  { value: "INACTIVE", label: "Nonaktif", icon: CircleOffIcon },
];
const PIN_STATES: FacetOption[] = [
  { value: "YES", label: "Pakai PIN", icon: LockIcon },
  { value: "NO", label: "Tanpa PIN", icon: LockOpenIcon },
];

const searchText = (user: AdminUserRow) => user.name;

const columns: ColumnDef<AdminUserRow>[] = [
  selectColumn<AdminUserRow>(),
  {
    id: "name",
    accessorFn: (user) => user.name,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          <UserAvatar name={user.name} src={user.avatarUrl} className={cn(!user.isActive && "opacity-60 grayscale")} />
          <span className={cn("font-medium", !user.isActive && "text-muted-foreground")}>{user.name}</span>
          {!user.isActive && (
            <Badge variant="outline">{user.showWhenInactive ? "Nonaktif" : "Nonaktif · disembunyikan"}</Badge>
          )}
        </div>
      );
    },
    sortingFn: "text",
    enableHiding: false,
    meta: { label: "Nama" },
  },
  {
    id: "status",
    accessorFn: (user) => (user.isActive ? "ACTIVE" : "INACTIVE"),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Aktif" />,
    cell: ({ row }) => <ActiveToggle user={row.original} />,
    filterFn: "facet",
    meta: { label: "Aktif" },
  },
  {
    id: "pin",
    accessorFn: (user) => (user.hasPin ? "YES" : "NO"),
    header: ({ column }) => <DataTableColumnHeader column={column} title="PIN" />,
    cell: ({ row }) => <PinToggle user={row.original} />,
    filterFn: "facet",
    meta: { label: "PIN" },
  },
  {
    id: "trips",
    accessorFn: (user) => user.tripCount,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Titipan dibuka" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.tripCount}</span>,
    meta: { label: "Titipan dibuka" },
  },
  {
    id: "orders",
    accessorFn: (user) => user.orderCount,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pesanan" />,
    cell: ({ row }) => <span className="tabular-nums">{row.original.orderCount}</span>,
    meta: { label: "Pesanan" },
  },
  {
    id: "createdAt",
    accessorFn: (user) => user.createdAt,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dibuat" />,
    cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
    sortingFn: "basic",
    meta: { label: "Dibuat" },
  },
  {
    id: "actions",
    cell: ({ row }) => <UserRowActions user={row.original} />,
    enableSorting: false,
    enableHiding: false,
    meta: { className: "w-10 text-right" },
  },
];

/** Semua akun untuk admin: cari, filter, aktif/nonaktif (satu atau massal), PIN, ubah nama, dan hapus. */
export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={users}
      searchText={searchText}
      initialSorting={[{ id: "name", desc: false }]}
      pageSize={20}
      emptyText="Belum ada pengguna. Tambahkan akun untuk teman-teman kantormu."
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          searchPlaceholder="Cari nama…"
          filters={[
            { column: "status", title: "Status", options: STATUSES },
            { column: "pin", title: "PIN", options: PIN_STATES },
          ]}
          actions={<CreateUserDialog />}
          selectionActions={(rows) => (
            <UserBulkActions userIds={rows.map((row) => row.original.id)} onDone={() => table.resetRowSelection()} />
          )}
        />
      )}
    />
  );
}

function UserBulkActions({ userIds, onDone }: { userIds: string[]; onDone: () => void }) {
  const [pending, run] = useActionRunner();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const count = userIds.length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => setUsersActive(userIds, true), `${count} akun diaktifkan`, onDone)}
      >
        {pending ? <Spinner data-icon="inline-start" /> : <CircleCheckIcon data-icon="inline-start" />}
        Aktifkan
      </Button>
      <Button variant="destructive" size="sm" disabled={pending} onClick={() => setConfirmOpen(true)}>
        <CircleOffIcon data-icon="inline-start" />
        Nonaktifkan
      </Button>
      <DeactivateDialog
        id="bulk"
        title={`Nonaktifkan ${count} akun?`}
        description="Akun yang dipilih langsung keluar dari semua perangkat dan tidak bisa dipakai. Titipan dan pesanannya tetap tersimpan, dan akun bisa diaktifkan lagi kapan saja."
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={(show) => run(() => setUsersActive(userIds, false, show), `${count} akun dinonaktifkan`, onDone)}
      />
    </>
  );
}
