"use client";

import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { adminLogout } from "@/actions/admin";
import { finishNavigation, startNavigation } from "@/lib/navigation-progress";
import { OFFLINE_MESSAGE } from "@/lib/offline";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const [, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Keluar admin"
      onClick={() => {
        if (!navigator.onLine) {
          toast.error(OFFLINE_MESSAGE);
          return;
        }
        startNavigation();
        startTransition(async () => {
          await adminLogout().catch(() => {
            finishNavigation();
            toast.error(OFFLINE_MESSAGE);
          });
        });
      }}
    >
      <LogOutIcon />
    </Button>
  );
}
