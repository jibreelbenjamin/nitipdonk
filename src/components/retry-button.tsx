"use client";

import { RotateCwIcon } from "lucide-react";
import { startNavigation } from "@/lib/navigation-progress";
import { Button } from "@/components/ui/button";

/** Muat ulang halaman, atau buka `href` kalau diisi (mis. halaman asli titipan yang sedang dilihat). */
export function RetryButton({ href, ...props }: React.ComponentProps<typeof Button> & { href?: string }) {
  return (
    <Button
      {...props}
      onClick={() => {
        startNavigation();
        if (href) window.location.assign(href);
        else window.location.reload();
      }}
    >
      <RotateCwIcon data-icon="inline-start" />
      Coba lagi
    </Button>
  );
}
