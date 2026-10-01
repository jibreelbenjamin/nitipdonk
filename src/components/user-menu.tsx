"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { signOut } from "@/actions/auth";
import { startNavigation } from "@/lib/navigation-progress";
import { clearOfflineTrips } from "@/lib/offline-trips";
import { UserAvatar } from "@/components/user-avatar";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <DropdownMenu modal={false}>
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
          <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>
            <LogOutIcon />
            Ganti akun
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ganti akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu keluar dari akun {name} di perangkat ini dan kembali ke halaman pilih akun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // HP bisa dipakai bergantian: titipan yang tersimpan untuk offline ikut dihapus
                clearOfflineTrips();
                startNavigation();
                startTransition(() => signOut());
              }}
            >
              Ganti akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
