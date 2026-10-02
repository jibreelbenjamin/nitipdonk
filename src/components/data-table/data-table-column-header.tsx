"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Judul kolom yang bisa diklik untuk mengurutkan atau menyembunyikan kolom. */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted();
  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-2 h-7 data-[state=open]:bg-muted">
            {title}
            {sorted === "desc" ? (
              <ArrowDownIcon data-icon="inline-end" />
            ) : sorted === "asc" ? (
              <ArrowUpIcon data-icon="inline-end" />
            ) : (
              column.getCanSort() && <ChevronsUpDownIcon data-icon="inline-end" className="text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
                <ArrowUpIcon />
                Urut naik
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
                <ArrowDownIcon />
                Urut turun
              </DropdownMenuItem>
            </>
          )}
          {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator />}
          {column.getCanHide() && (
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <EyeOffIcon />
              Sembunyikan
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
