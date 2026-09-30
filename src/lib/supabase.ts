import "server-only";
import { createClient, type PostgrestSingleResponse } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Nama kedua adalah yang disuntikkan integrasi Supabase di Vercel
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

function createDb() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi");
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Data harus selalu terbaru, jangan biarkan Next.js meng-cache request ke Supabase
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

let client: ReturnType<typeof createDb> | undefined;

/** Klien Supabase dengan service role key. Hanya untuk server; melewati RLS. */
export function db() {
  client ??= createDb();
  return client;
}

/** Ambil `data` dari hasil query Supabase, atau lempar error-nya. */
export function must<T>(result: PostgrestSingleResponse<T>): T {
  if (result.error) throw result.error;
  return result.data;
}
