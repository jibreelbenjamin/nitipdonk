"use client";

import { RotateCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button onClick={() => window.location.reload()}>
      <RotateCwIcon data-icon="inline-start" />
      Coba lagi
    </Button>
  );
}
