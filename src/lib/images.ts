import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { ActionError } from "./action";
import { MAX_UPLOAD_MB } from "./constants";
import { Constants, type Enums } from "./database.types";
import { publicUrl, putObject, removeObjects } from "./storage";
import { db, must } from "./supabase";

type ImageKind = Enums<"ImageKind">;

// Setiap gambar dikompres ke WebP sebelum masuk storage
const PRESETS: Record<ImageKind, { size: number; fit: "cover" | "inside"; quality: number }> = {
  AVATAR: { size: 256, fit: "cover", quality: 80 },
  PAYMENT_QR: { size: 1080, fit: "inside", quality: 90 }, // QR harus tetap bisa di-scan
  PROOF: { size: 1280, fit: "inside", quality: 70 },
};

export async function saveImage(file: File, kind: ImageKind) {
  if (!file.type.startsWith("image/")) throw new ActionError("File harus berupa gambar");
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new ActionError(`Ukuran gambar maksimal ${MAX_UPLOAD_MB} MB`);
  }

  const preset = PRESETS[kind];
  const output = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate() // ikuti orientasi EXIF dari kamera HP
    .resize({
      width: preset.size,
      height: preset.size,
      fit: preset.fit,
      withoutEnlargement: true,
    })
    .webp({ quality: preset.quality })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new ActionError("Gambar tidak bisa diproses, coba file lain");
    });

  const path = `${kind.toLowerCase()}/${randomUUID()}.webp`;
  await putObject(path, output.data, "image/webp");

  return must(
    await db()
      .from("Image")
      .insert({
        kind,
        path,
        size: output.info.size,
        width: output.info.width,
        height: output.info.height,
      })
      .select()
      .single(),
  );
}

/** Hapus file dari storage dulu, baru barisnya; relasi yang menunjuk ke gambar otomatis jadi null. */
export async function deleteImages(ids: (string | null | undefined)[]) {
  const validIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const total = { count: 0, bytes: 0 };

  // Filter PostgREST dikirim lewat URL, jadi proses per 100 id
  for (let i = 0; i < validIds.length; i += 100) {
    const images = must(
      await db().from("Image").select("id, path, size").in("id", validIds.slice(i, i + 100)),
    );
    if (images.length === 0) continue;

    await removeObjects(images.map((image) => image.path));
    must(await db().from("Image").delete().in("id", images.map((image) => image.id)));
    total.count += images.length;
    total.bytes += images.reduce((sum, image) => sum + image.size, 0);
  }
  return total;
}

export async function cleanupOldImages(kinds: ImageKind[], olderThanDays: number) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  const total = { count: 0, bytes: 0 };

  // Supabase membatasi jumlah baris per request, jadi hapus bertahap sampai habis
  for (;;) {
    const batch = must(
      await db().from("Image").select("id").in("kind", kinds).lt("createdAt", cutoff).limit(500),
    );
    if (batch.length === 0) break;
    const deleted = await deleteImages(batch.map((image) => image.id));
    total.count += deleted.count;
    total.bytes += deleted.bytes;
    if (deleted.count === 0) break;
  }
  return total;
}

/** Jumlah & total ukuran gambar per jenis. Dibaca bertahap karena Supabase membatasi 1000 baris per request. */
export async function imageStats() {
  const stats = Object.fromEntries(
    Constants.public.Enums.ImageKind.map((kind) => [kind, { count: 0, bytes: 0 }]),
  ) as Record<ImageKind, { count: number; bytes: number }>;

  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const rows = must(
      await db().from("Image").select("kind, size").order("id").range(from, from + pageSize - 1),
    );
    for (const row of rows) {
      stats[row.kind].count += 1;
      stats[row.kind].bytes += row.size;
    }
    if (rows.length < pageSize) break;
  }
  return stats;
}

export function imageUrl(image: { path: string } | null | undefined) {
  return image ? publicUrl(image.path) : undefined;
}
