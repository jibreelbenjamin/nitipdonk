"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { signOut } from "@/actions/auth";
import { startNavigation } from "@/lib/navigation-progress";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const [, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu akun">
          <UserAvatar name={name} src={avatarUrl} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/pengaturan">
            <SettingsIcon />
            Pengaturan
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            startNavigation();
            startTransition(() => signOut());
          }}
        >
          <LogOutIcon />
          Ganti akun
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
