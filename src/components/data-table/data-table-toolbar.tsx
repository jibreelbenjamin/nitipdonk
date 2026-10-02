"use client";

import type { Row, Table } from "@tanstack/react-table";
import { SearchIcon, XIcon } from "lucide-react";
import { DataTableFacetedFilter, type FacetOption } from "@/components/data-table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export type ToolbarFilter = { column: string; title: string; options: FacetOption[] };

/**
 * Baris atas data table: pencarian, filter, atur kolom, tombol aksi, dan aksi untuk
 * baris yang dipilih (muncul setelah ada baris yang dicentang).
 */
export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  filters = [],
  actions,
  selectionActions,
}: {
  table: Table<TData>;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  actions?: React.ReactNode;
  selectionActions?: (rows: Row<TData>[]) => React.ReactNode;
}) {
  const { columnFilters, globalFilter } = table.getState();
  const isFiltered = columnFilters.length > 0 || Boolean(globalFilter);
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {searchPlaceholder && (
          <InputGroup className="w-full sm:w-64">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={(globalFilter as string | undefined) ?? ""}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </InputGroup>
        )}
        {filters.map((filter) => {
          const column = table.getAllColumns().find((item) => item.id === filter.column);
          return column ? (
            <DataTableFacetedFilter key={filter.column} column={column} title={filter.title} options={filter.options} />
          ) : null;
        })}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
          >
            Reset
            <XIcon data-icon="inline-end" />
          </Button>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <DataTableViewOptions table={table} />
          {actions}
        </div>
      </div>
      {selectionActions && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium">{selectedRows.length} dipilih</span>
          {selectionActions(selectedRows)}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => table.resetRowSelection()}>
            Batal pilih
          </Button>
        </div>
      )}
    </div>
  );
}
