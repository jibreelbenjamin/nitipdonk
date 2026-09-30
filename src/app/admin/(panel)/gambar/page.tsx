import Link from "next/link";
import { ImageOffIcon } from "lucide-react";
import { CleanupForm, DeleteImageButton } from "@/components/admin/image-cleanup";
import { ImagePreview } from "@/components/image-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ImageKind } from "@/generated/prisma/enums";
import { formatBytes, formatDateTime, formatRelative } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { prisma } from "@/lib/prisma";

const KIND_LABEL: Record<ImageKind, string> = {
  PROOF: "Bukti bayar",
  PAYMENT_QR: "QR pembayaran",
  AVATAR: "Foto profil",
};

const PAGE_SIZE = 60;

export default async function AdminImagesPage({ searchParams }: PageProps<"/admin/gambar">) {
  const { jenis } = await searchParams;
  const kind = Object.values(ImageKind).find((value) => value === jenis);

  const [stats, images] = await Promise.all([
    prisma.image.groupBy({ by: ["kind"], _count: { _all: true }, _sum: { size: true } }),
    prisma.image.findMany({
      where: kind ? { kind } : undefined,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      include: {
        avatarOf: { select: { name: true } },
        paymentQrOf: { select: { name: true } },
        proofOf: { select: { user: { select: { name: true } }, trip: { select: { title: true } } } },
      },
    }),
  ]);

  const statFor = (value: ImageKind) => stats.find((stat) => stat.kind === value);
  const totalCount = stats.reduce((sum, stat) => sum + stat._count._all, 0);
  const totalBytes = stats.reduce((sum, stat) => sum + (stat._sum.size ?? 0), 0);
  const defaultDays = Number(process.env.CLEANUP_PROOF_DAYS ?? 30) || 30;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" count={totalCount} bytes={totalBytes} />
        {Object.values(ImageKind).map((value) => (
          <StatCard
            key={value}
            label={KIND_LABEL[value]}
            count={statFor(value)?._count._all ?? 0}
            bytes={statFor(value)?._sum.size ?? 0}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bersihkan gambar lama</CardTitle>
          <CardDescription>
            Bukti pembayaran biasanya tidak dibutuhkan lagi setelah beberapa minggu. Kalau cron aktif,
            bukti bayar lebih dari {defaultDays} hari juga dihapus otomatis setiap hari.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CleanupForm defaultDays={defaultDays} />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Gambar terbaru</h2>
          <div className="flex flex-wrap gap-1">
            <FilterLink href="/admin/gambar" active={!kind} label="Semua" />
            {Object.values(ImageKind).map((value) => (
              <FilterLink
                key={value}
                href={`/admin/gambar?jenis=${value}`}
                active={kind === value}
                label={KIND_LABEL[value]}
              />
            ))}
          </div>
        </div>

        {images.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ImageOffIcon />
              </EmptyMedia>
              <EmptyTitle>Tidak ada gambar</EmptyTitle>
              <EmptyDescription>Storage masih bersih.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image) => {
              const owner =
                image.avatarOf?.name ??
                image.paymentQrOf?.name ??
                (image.proofOf ? `${image.proofOf.user.name} · ${image.proofOf.trip.title}` : "Tidak terpakai");
              return (
                <Card key={image.id} size="sm" className="pt-0">
                  <ImagePreview
                    src={imageUrl(image)!}
                    alt={`${KIND_LABEL[image.kind]} ${owner}`}
                    title={KIND_LABEL[image.kind]}
                    description={`${owner} · ${formatDateTime(image.createdAt)} · ${formatBytes(image.size)}`}
                    width={image.width}
                    height={image.height}
                    className="aspect-square w-full rounded-none border-0 border-b"
                  />
                  <CardContent className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Badge variant="secondary">{KIND_LABEL[image.kind]}</Badge>
                      <span className="truncate text-xs" title={owner}>
                        {owner}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelative(image.createdAt)} · {formatBytes(image.size)}
                      </span>
                    </div>
                    <DeleteImageButton imageId={image.id} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {images.length === PAGE_SIZE && (
          <p className="text-center text-xs text-muted-foreground">Menampilkan {PAGE_SIZE} gambar terbaru.</p>
        )}
      </section>
    </>
  );
}

function StatCard({ label, count, bytes }: { label: string; count: number; bytes: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{count}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{formatBytes(bytes)}</CardContent>
    </Card>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Button variant={active ? "secondary" : "ghost"} size="sm" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
