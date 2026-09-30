import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_BUCKET || "nitipdonk";
// Fallback khusus development saat Supabase belum dikonfigurasi
const LOCAL_DIR = path.join(process.cwd(), ".uploads");

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isLocalStorage() {
  if (isSupabaseConfigured()) return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di production");
  }
  return true;
}

let client: SupabaseClient | undefined;
let bucketReady: Promise<void> | undefined;

function supabase() {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Membuat bucket public secara otomatis kalau belum ada. */
function ensureBucket() {
  bucketReady ??= (async () => {
    const { data } = await supabase().storage.getBucket(BUCKET);
    if (data) return;
    const { error } = await supabase().storage.createBucket(BUCKET, {
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

function localPath(key: string) {
  const file = path.resolve(LOCAL_DIR, key);
  if (!file.startsWith(LOCAL_DIR + path.sep)) throw new Error("Path tidak valid");
  return file;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  if (isLocalStorage()) {
    const file = localPath(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    return;
  }
  await ensureBucket();
  const { error } = await supabase()
    .storage.from(BUCKET)
    .upload(key, body, { contentType, cacheControl: "31536000", upsert: false });
  if (error) throw error;
}

export async function removeObjects(keys: string[]) {
  if (keys.length === 0) return;
  if (isLocalStorage()) {
    await Promise.all(keys.map((key) => rm(localPath(key), { force: true })));
    return;
  }
  for (let i = 0; i < keys.length; i += 100) {
    const { error } = await supabase().storage.from(BUCKET).remove(keys.slice(i, i + 100));
    if (error) throw error;
  }
}

export function publicUrl(key: string) {
  if (!isSupabaseConfigured()) return `/api/uploads/${key}`;
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
}

/** Hanya untuk route /api/uploads saat development. */
export async function readLocalObject(key: string) {
  if (!isLocalStorage()) return null;
  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}
