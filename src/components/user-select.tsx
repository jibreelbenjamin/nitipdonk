"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UserOption = { id: string; name: string; isActive: boolean; avatarUrl?: string };

/** Pilih pengguna (pembuka titipan / pemesan); nilainya ikut terkirim lewat field `name`. */
export function UserSelect({
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
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-72">
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <UserAvatar name={user.name} src={user.avatarUrl} size="sm" />
              <span className="truncate">{user.name}</span>
              {!user.isActive && <span className="text-muted-foreground">(nonaktif)</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
