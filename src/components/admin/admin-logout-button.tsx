"use client";

import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";
import { adminLogout } from "@/actions/admin";
import { startNavigation } from "@/lib/navigation-progress";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const [, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Keluar admin"
      onClick={() => {
        startNavigation();
        startTransition(() => adminLogout());
      }}
    >
      <LogOutIcon />
    </Button>
  );
}
