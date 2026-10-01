"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/actions/auth";
import { finishNavigation, startNavigation } from "@/lib/navigation-progress";
import { clearSavedPages, OFFLINE_MESSAGE } from "@/lib/offline";
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
            if (!navigator.onLine) {
              toast.error(OFFLINE_MESSAGE);
              return;
            }
            startNavigation();
            startTransition(async () => {
              await clearSavedPages();
              await signOut().catch(() => {
                finishNavigation();
                toast.error(OFFLINE_MESSAGE);
              });
            });
          }}
        >
          <LogOutIcon />
          Ganti akun
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
