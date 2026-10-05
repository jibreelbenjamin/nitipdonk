"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon, ShieldIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import type { UserOption } from "@/components/user-select";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Pencarian hanya mencocokkan nama (bukan id); `value` tiap item adalah id pengguna
const filterByName = (_value: string, search: string, keywords?: string[]) =>
  (keywords ?? []).join(" ").toLocaleLowerCase("id-ID").includes(search.trim().toLocaleLowerCase("id-ID")) ? 1 : 0;

function UserLabel({ user }: { user: UserOption }) {
  return (
    <>
      {user.isAdmin ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ShieldIcon className="size-3.5" />
        </span>
      ) : (
        <UserAvatar name={user.name} src={user.avatarUrl} size="sm" />
      )}
      <span className="truncate">{user.name}</span>
      {!user.isActive && <span className="text-muted-foreground">(nonaktif)</span>}
    </>
  );
}

/** Combobox (Popover + Command ala shadcn) untuk memilih pengguna; nilainya ikut terkirim lewat field `name`. */
export function UserCombobox({
  id,
  name,
  users,
  defaultValue,
  placeholder = "Pilih pengguna",
}: {
  id: string;
  name: string;
  users: UserOption[];
  defaultValue?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const selected = users.find((user) => user.id === value);
  const admins = users.filter((user) => user.isAdmin);
  const others = users.filter((user) => !user.isAdmin);

  const item = (user: UserOption) => (
    <CommandItem
      key={user.id}
      value={user.id}
      keywords={[user.name]}
      onSelect={() => {
        setValue(user.id);
        setOpen(false);
      }}
    >
      <UserLabel user={user} />
      <CheckIcon className={cn("ml-auto", value === user.id ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  );

  return (
    <>
      <input type="hidden" name={name} value={value} />
      {/* modal: di dalam Dialog, kotak cari & daftar tetap bisa diketik dan di-scroll */}
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="flex min-w-0 items-center gap-2">
                <UserLabel user={selected} />
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDownIcon className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <Command filter={filterByName}>
            <CommandInput placeholder="Cari nama…" />
            <CommandList>
              <CommandEmpty>Tidak ada yang cocok.</CommandEmpty>
              {admins.length > 0 && (
                <>
                  <CommandGroup heading="Admin">{admins.map(item)}</CommandGroup>
                  <CommandSeparator />
                </>
              )}
              <CommandGroup heading="Pengguna">{others.map(item)}</CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
