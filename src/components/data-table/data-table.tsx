"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TableInstance,
  type Updater,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

declare module "@tanstack/react-table" {
  // Nama parameter generik harus sama dengan deklarasi aslinya walau tidak dipakai
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Nama kolom di menu "Kolom". */
    label?: string;
    /** Kelas tambahan untuk judul & sel kolom ini, mis. `hidden md:table-cell`. */
    className?: string;
  }

  interface FilterFns {
    /** Cocok kalau nilai kolom ada di daftar pilihan filter (lihat DataTableFacetedFilter). */
    facet: FilterFn<unknown>;
  }
}

const facet: FilterFn<unknown> = (row, columnId, selected: string[]) =>
  selected.includes(String(row.getValue(columnId)));

const normalize = (text: string) => text.toLocaleLowerCase("id-ID");

/** Kolom centang untuk memilih baris, seperti contoh data table shadcn. */
export function selectColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
        aria-label="Pilih semua di halaman ini"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        aria-label="Pilih baris"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { className: "w-8" },
  };
}

/**
 * Data table ala shadcn (TanStack Table + komponen Table): urut, cari, filter, pilih baris,
 * atur kolom, dan paginasi. Semua di browser, data lengkap dikirim dari server.
 */
export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  searchText,
  initialSorting = [],
  pageSize = 10,
  toolbar,
  emptyText = "Tidak ada data.",
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Teks yang dicari kotak pencarian untuk tiap baris. */
  searchText?: (row: TData) => string;
  initialSorting?: SortingState;
  pageSize?: number;
  toolbar?: (table: TableInstance<TData>) => React.ReactNode;
  emptyText?: React.ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const searchIndex = useMemo(
    () => new Map(searchText ? data.map((row) => [row.id, normalize(searchText(row))]) : []),
    [data, searchText],
  );

  // Ganti filter → kembali ke halaman pertama
  const toFirstPage = () => setPagination((current) => ({ ...current, pageIndex: 0 }));

  // TanStack Table belum kompatibel dengan React Compiler; proyek ini tidak memakainya
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    // id baris = id data, jadi pilihan tetap benar walau data dimuat ulang dari server
    getRowId: (row) => row.id,
    state: { sorting, columnFilters, globalFilter, columnVisibility, rowSelection, pagination },
    filterFns: { facet },
    globalFilterFn: (row, _columnId, value: string) =>
      (searchIndex.get(row.original.id) ?? "").includes(normalize(value.trim())),
    // Pencarian berlaku untuk semua kolom yang punya nilai, bukan hanya kolom teks
    getColumnCanGlobalFilter: () => Boolean(searchText),
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters(updater);
      toFirstPage();
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      setGlobalFilter(updater);
      toFirstPage();
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    // Data dimuat ulang setiap ada perubahan; jangan lompat ke halaman pertama karenanya
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Baris berkurang (mis. dihapus) sampai halaman ini kosong → pindah ke halaman terakhir
  const pageCount = table.getPageCount();
  if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
    setPagination({ ...pagination, pageIndex: Math.max(pageCount - 1, 0) });
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      {toolbar?.(table)}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn("first:pl-3 last:pr-3", header.column.columnDef.meta?.className)}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn("first:pl-3 last:pr-3", cell.column.columnDef.meta?.className)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Di luar <table> supaya tetap di tengah layar walau tabelnya lebih lebar dari layar (HP) */}
        {rows.length === 0 && (
          <p className="flex min-h-24 items-center justify-center px-4 py-6 text-center text-sm text-muted-foreground">
            {data.length > 0 ? "Tidak ada yang cocok dengan pencarian atau filter." : emptyText}
          </p>
        )}
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
