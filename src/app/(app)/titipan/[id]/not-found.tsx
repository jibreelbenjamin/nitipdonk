import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { TripNotFoundState } from "@/components/trip-not-found-state";
import { Button } from "@/components/ui/button";

// Muncul saat titipan tidak ada, termasuk ketika pembuka menghapusnya selagi halaman ini terbuka
export default function TripNotFound() {
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/titipan">
          <ArrowLeftIcon data-icon="inline-start" />
          Semua titipan
        </Link>
      </Button>
      <TripNotFoundState />
    </div>
  );
}
