import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { ImageKind } from "@/generated/prisma/enums";
import { ActionError } from "./action";
import { MAX_UPLOAD_MB } from "./constants";
import { prisma } from "./prisma";
import { publicUrl, putObject, removeObjects } from "./storage";

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

  return prisma.image.create({
    data: {
      kind,
      path,
      size: output.info.size,
      width: output.info.width,
      height: output.info.height,
    },
  });
}

/** Hapus file dari storage dulu, baru barisnya; relasi yang menunjuk ke gambar otomatis jadi null. */
export async function deleteImages(ids: (string | null | undefined)[]) {
  const validIds = ids.filter((id): id is string => Boolean(id));
  if (validIds.length === 0) return { count: 0, bytes: 0 };

  const images = await prisma.image.findMany({
    where: { id: { in: validIds } },
    select: { id: true, path: true, size: true },
  });
  await removeObjects(images.map((image) => image.path));
  await prisma.image.deleteMany({ where: { id: { in: images.map((image) => image.id) } } });

  return { count: images.length, bytes: images.reduce((sum, image) => sum + image.size, 0) };
}

export async function cleanupOldImages(kinds: ImageKind[], olderThanDays: number) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const images = await prisma.image.findMany({
    where: { kind: { in: kinds }, createdAt: { lt: cutoff } },
    select: { id: true },
  });
  return deleteImages(images.map((image) => image.id));
}

export function imageUrl(image: { path: string } | null | undefined) {
  return image ? publicUrl(image.path) : undefined;
}
