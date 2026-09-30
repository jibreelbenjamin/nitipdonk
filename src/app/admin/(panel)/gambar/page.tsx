import Link from "next/link";
import { ImageOffIcon } from "lucide-react";
import { CleanupForm, DeleteImageButton } from "@/components/admin/image-cleanup";
import { ImagePreview } from "@/components/image-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Constants, type Enums } from "@/lib/database.types";
import { formatBytes, formatDateTime, formatRelative } from "@/lib/format";
import { imageStats, imageUrl } from "@/lib/images";
import { db, must } from "@/lib/supabase";

type ImageKind = Enums<"ImageKind">;
const IMAGE_KINDS = Constants.public.Enums.ImageKind;

const KIND_LABEL: Record<ImageKind, string> = {
  PROOF: "Bukti bayar",
  PAYMENT_QR: "QR pembayaran",
  AVATAR: "Foto profil",
};

const PAGE_SIZE = 60;

export default async function AdminImagesPage({ searchParams }: PageProps<"/admin/gambar">) {
  const { jenis } = await searchParams;
  const kind = IMAGE_KINDS.find((value) => value === jenis);

  const imagesQuery = db()
    .from("Image")
    .select(
      `*,
      avatarOf:User!User_avatarId_fkey(name),
      paymentQrOf:User!User_paymentQrId_fkey(name),
      proofOf:Order!Order_proofId_fkey(user:User!Order_userId_fkey(name), trip:Trip!Order_tripId_fkey(title))`,
    );
  const [stats, imagesResult] = await Promise.all([
    imageStats(),
    (kind ? imagesQuery.eq("kind", kind) : imagesQuery)
      .order("createdAt", { ascending: false })
      .limit(PAGE_SIZE),
  ]);
  const images = must(imagesResult);

  const totalCount = IMAGE_KINDS.reduce((sum, value) => sum + stats[value].count, 0);
  const totalBytes = IMAGE_KINDS.reduce((sum, value) => sum + stats[value].bytes, 0);
  const defaultDays = Number(process.env.CLEANUP_PROOF_DAYS ?? 30) || 30;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" count={totalCount} bytes={totalBytes} />
        {IMAGE_KINDS.map((value) => (
          <StatCard
            key={value}
            label={KIND_LABEL[value]}
            count={stats[value].count}
            bytes={stats[value].bytes}
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
            {IMAGE_KINDS.map((value) => (
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
              const proof = one(image.proofOf);
              const owner =
                one(image.avatarOf)?.name ??
                one(image.paymentQrOf)?.name ??
                (proof ? `${proof.user.name} · ${proof.trip.title}` : "Tidak terpakai");
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

/** Relasi balik dari Image bisa berupa array atau objek, tergantung deteksi one-to-one PostgREST. */
function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
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
