import Link from "next/link";
import { ArrowLeftIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function AdminTripNotFound() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>Titipan tidak ditemukan</EmptyTitle>
        <EmptyDescription>Mungkin sudah dihapus, atau alamatnya salah.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/admin/titipan">
            <ArrowLeftIcon data-icon="inline-start" />
            Semua titipan
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
