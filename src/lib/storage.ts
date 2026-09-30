import "server-only";
import { db } from "./supabase";

const BUCKET = process.env.SUPABASE_BUCKET || "nitipdonk";

let bucketReady: Promise<void> | undefined;

/** Membuat bucket public secara otomatis kalau belum ada. */
function ensureBucket() {
  bucketReady ??= (async () => {
    const { data } = await db().storage.getBucket(BUCKET);
    if (data) return;
    const { error } = await db().storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ["image/webp"],
      fileSizeLimit: "5MB",
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  })().catch((error) => {
    bucketReady = undefined;
    throw error;
  });
  return bucketReady;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await ensureBucket();
  const { error } = await db()
    .storage.from(BUCKET)
    .upload(key, body, { contentType, cacheControl: "31536000", upsert: false });
  if (error) throw error;
}

export async function removeObjects(keys: string[]) {
  for (let i = 0; i < keys.length; i += 100) {
    const { error } = await db().storage.from(BUCKET).remove(keys.slice(i, i + 100));
    if (error) throw error;
  }
}

export function publicUrl(key: string) {
  return db().storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}
