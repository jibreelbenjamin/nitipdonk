"use client";

import { createContext, use, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BanknoteIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  EllipsisVerticalIcon,
  ImageIcon,
  ImageOffIcon,
  ImageUpIcon,
  PencilIcon,
  PlusIcon,
  SmartphoneIcon,
  Trash2Icon,
} from "lucide-react";
import { adminDeleteOrders, adminDeleteProof, adminSetOrdersPaid, adminUploadProof } from "@/actions/admin-trips";
import { DeleteOrdersDialog, OrderFormDialog } from "@/components/admin/order-dialogs";
import { DataTable, selectColumn } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { FacetOption } from "@/components/data-table/data-table-faceted-filter";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ImagePreview } from "@/components/image-preview";
import { UploadProofForm } from "@/components/order-actions";
import { PaidToggle } from "@/components/paid-toggle";
import { UserAvatar } from "@/components/user-avatar";
import type { UserOption } from "@/components/user-select";
import { useActionRunner } from "@/hooks/use-action-feedback";
import { formatDateTime, formatRupiah } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

export type AdminOrderRow = {
  id: string;
  items: string;
  price: number | null;
  paymentMethod: "CASH" | "CASHLESS";
  isPaid: boolean;
  createdAt: string;
  user: { id: string; name: string; avatarUrl?: string };
  proof: { url: string; width: number; height: number } | null;
};

const METHODS: FacetOption[] = [
  { value: "CASHLESS", label: "Cashless", icon: SmartphoneIcon },
  { value: "CASH", label: "Cash", icon: BanknoteIcon },
];
const PROOF_STATES: FacetOption[] = [
  { value: "YES", label: "Ada bukti", icon: ImageIcon },
  { value: "NO", label: "Belum ada bukti", icon: ImageOffIcon },
];
const PAID_STATES: FacetOption[] = [
  { value: "PAID", label: "Lunas", icon: CircleCheckIcon },
  { value: "UNPAID", label: "Belum lunas", icon: CircleDashedIcon },
];

const searchText = (order: AdminOrderRow) => `${order.user.name} ${order.items}`;
const setPaid = (orderId: string, isPaid: boolean) => adminSetOrdersPaid([orderId], isPaid);

// Data titipan & daftar pengguna untuk dialog di tiap baris. Lewat context supaya definisi kolom
// tetap sama; kalau kolom dibuat ulang, isi sel (dan dialognya) ikut dipasang ulang saat data dimuat ulang.
const TripContext = createContext<{ tripId: string; tripTitle: string; users: UserOption[] }>({
  tripId: "",
  tripTitle: "",
  users: [],
});

const columns: ColumnDef<AdminOrderRow>[] = [
  selectColumn<AdminOrderRow>(),
  {
    id: "user",
    accessorFn: (order) => order.user.name,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pemesan" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <UserAvatar name={row.original.user.name} src={row.original.user.avatarUrl} size="sm" />
        <span className="font-medium">{row.original.user.name}</span>
      </div>
    ),
    sortingFn: "text",
    enableHiding: false,
    meta: { label: "Pemesan" },
  },
  {
    id: "items",
    accessorFn: (order) => order.items,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pesanan" />,
    cell: ({ row }) => <p className="max-w-sm min-w-48 break-words whitespace-pre-wrap">{row.original.items}</p>,
    enableSorting: false,
    meta: { label: "Pesanan" },
  },
  {
    id: "price",
    accessorFn: (order) => order.price ?? undefined,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
    cell: ({ row }) =>
      row.original.price !== null ? (
        <span className="tabular-nums">{formatRupiah(row.original.price)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    sortUndefined: "last",
    meta: { label: "Harga" },
  },
  {
    id: "method",
    accessorFn: (order) => order.paymentMethod,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Metode" />,
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.paymentMethod === "CASH" ? (
          <BanknoteIcon data-icon="inline-start" />
        ) : (
          <SmartphoneIcon data-icon="inline-start" />
        )}
        {row.original.paymentMethod === "CASH" ? "Cash" : "Cashless"}
      </Badge>
    ),
    filterFn: "facet",
    meta: { label: "Metode" },
  },
  {
    id: "proof",
    accessorFn: (order) => (order.proof ? "YES" : "NO"),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bukti" />,
    cell: ({ row }) => {
      const { proof, user, price } = row.original;
      if (proof) {
        return (
          <ImagePreview
            src={proof.url}
            alt={`Bukti bayar ${user.name}`}
            title={`Bukti bayar ${user.name}`}
            description={price !== null ? formatRupiah(price) : undefined}
            width={proof.width}
            height={proof.height}
            className="size-10"
          />
        );
      }
      return row.original.paymentMethod === "CASHLESS" ? (
        <Badge variant="destructive">Belum ada</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    filterFn: "facet",
    meta: { label: "Bukti" },
  },
  {
    id: "paid",
    accessorFn: (order) => (order.isPaid ? "PAID" : "UNPAID"),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lunas" />,
    cell: ({ row }) => <PaidToggle orderId={row.original.id} isPaid={row.original.isPaid} action={setPaid} />,
    filterFn: "facet",
    meta: { label: "Lunas" },
  },
  {
    id: "createdAt",
    accessorFn: (order) => order.createdAt,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu" />,
    cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
    sortingFn: "basic",
    meta: { label: "Waktu" },
  },
  {
    id: "actions",
    cell: ({ row }) => <OrderRowActions order={row.original} />,
    enableSorting: false,
    enableHiding: false,
    meta: { className: "w-10 text-right" },
  },
];

/** Semua pesanan di satu titipan untuk admin: tambah, ubah, tandai lunas, bukti bayar, hapus. */
export function AdminOrdersTable({
  tripId,
  tripTitle,
  orders,
  users,
}: {
  tripId: string;
  tripTitle: string;
  orders: AdminOrderRow[];
  users: UserOption[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <TripContext value={{ tripId, tripTitle, users }}>
      <DataTable
        columns={columns}
        data={orders}
        searchText={searchText}
        initialSorting={[{ id: "createdAt", desc: false }]}
        pageSize={20}
        emptyText="Belum ada pesanan di titipan ini."
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            searchPlaceholder="Cari pemesan atau pesanan…"
            filters={[
              { column: "method", title: "Metode", options: METHODS },
              { column: "proof", title: "Bukti", options: PROOF_STATES },
              { column: "paid", title: "Lunas", options: PAID_STATES },
            ]}
            actions={
              <Button size="sm" onClick={() => setAdding(true)}>
                <PlusIcon data-icon="inline-start" />
                Tambah pesanan
              </Button>
            }
            selectionActions={(rows) => (
              <OrderBulkActions
                orderIds={rows.map((row) => row.original.id)}
                onDone={() => table.resetRowSelection()}
              />
            )}
          />
        )}
      />
      <OrderFormDialog tripId={tripId} users={users} open={adding} onOpenChange={setAdding} />
    </TripContext>
  );
}

function OrderBulkActions({ orderIds, onDone }: { orderIds: string[]; onDone: () => void }) {
  const [pending, run] = useActionRunner();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = orderIds.length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => adminSetOrdersPaid(orderIds, true), `${count} pesanan ditandai lunas`, onDone)}
      >
        {pending ? <Spinner data-icon="inline-start" /> : <CircleCheckIcon data-icon="inline-start" />}
        Tandai lunas
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(() => adminSetOrdersPaid(orderIds, false), `${count} pesanan ditandai belum lunas`, onDone)}
      >
        <CircleDashedIcon data-icon="inline-start" />
        Belum lunas
      </Button>
      <Button variant="destructive" size="sm" disabled={pending} onClick={() => setConfirmDelete(true)}>
        <Trash2Icon data-icon="inline-start" />
        Hapus
      </Button>
      <DeleteOrdersDialog
        count={count}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={() => run(() => adminDeleteOrders(orderIds), `${count} pesanan dihapus`, onDone)}
      />
    </>
  );
}

function OrderRowActions({ order }: { order: AdminOrderRow }) {
  const { tripId, tripTitle, users } = use(TripContext);
  const [pending, run] = useActionRunner();
  const [dialog, setDialog] = useState<"edit" | "proof" | "delete-proof" | "delete" | null>(null);
  const openChange = (name: typeof dialog) => (open: boolean) => setDialog(open ? name : null);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Aksi untuk pesanan ${order.user.name}`}
            disabled={pending}
          >
            {pending ? <Spinner /> : <EllipsisVerticalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="truncate">Pesanan {order.user.name}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setDialog("edit")}>
            <PencilIcon />
            Ubah pesanan
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("proof")}>
            <ImageUpIcon />
            {order.proof ? "Ganti bukti" : "Upload bukti"}
          </DropdownMenuItem>
          {order.proof && (
            <DropdownMenuItem onSelect={() => setDialog("delete-proof")}>
              <ImageOffIcon />
              Hapus bukti
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}>
            <Trash2Icon />
            Hapus pesanan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <OrderFormDialog
        tripId={tripId}
        order={{ ...order, userId: order.user.id }}
        users={users}
        open={dialog === "edit"}
        onOpenChange={openChange("edit")}
      />
      <Dialog open={dialog === "proof"} onOpenChange={openChange("proof")}>
        <DialogContent className="sm:max-w-md">
          {dialog === "proof" && (
            <UploadProofForm orderId={order.id} onDone={() => setDialog(null)} action={adminUploadProof} />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={dialog === "delete-proof"} onOpenChange={openChange("delete-proof")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus bukti bayar?</AlertDialogTitle>
            <AlertDialogDescription>
              Bukti bayar {order.user.name} di titipan {tripTitle} dihapus permanen. Pesanannya tetap ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => adminDeleteProof(order.id), "Bukti bayar dihapus")}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DeleteOrdersDialog
        count={1}
        open={dialog === "delete"}
        onOpenChange={openChange("delete")}
        onConfirm={() => run(() => adminDeleteOrders([order.id]), "Pesanan dihapus")}
      />
    </>
  );
}
