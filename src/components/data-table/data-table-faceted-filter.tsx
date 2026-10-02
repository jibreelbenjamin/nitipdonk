"use client";

import type { Column } from "@tanstack/react-table";
import { type LucideIcon, PlusCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export type FacetOption = { value: string; label: string; icon?: LucideIcon };

/** Filter beberapa pilihan untuk satu kolom, lengkap dengan jumlah baris tiap pilihan. */
export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: {
  column: Column<TData, TValue>;
  title: string;
  options: FacetOption[];
}) {
  const counts = column.getFacetedUniqueValues();
  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? []);

  function toggle(value: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    column.setFilterValue(next.size > 0 ? [...next] : undefined);
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed" aria-label={`Filter ${title}`}>
          <PlusCircleIcon data-icon="inline-start" />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4 w-px" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selected.size > 2
                  ? `${selected.size} dipilih`
                  : options
                      .filter((option) => selected.has(option.value))
                      .map((option) => option.label)
                      .join(", ")}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.has(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked === true)}
            // Menu tetap terbuka supaya bisa memilih beberapa sekaligus
            onSelect={(event) => event.preventDefault()}
          >
            {option.icon && <option.icon className="text-muted-foreground" />}
            <span className="truncate">{option.label}</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
              {counts.get(option.value) ?? 0}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center" onSelect={() => column.setFilterValue(undefined)}>
              Hapus filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
