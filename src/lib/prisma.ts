import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Nama kedua adalah yang disuntikkan integrasi Supabase di Vercel
function databaseUrl() {
  const raw = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;
  if (!raw) throw new Error("DATABASE_URL belum diset");

  // Driver `pg` memperlakukan sslmode=require sebagai verify-full, padahal sertifikat
  // Supabase ditandatangani CA milik Supabase. Pakai arti libpq: terenkripsi tanpa verifikasi CA.
  const url = new URL(raw);
  if (url.searchParams.has("sslmode") && !url.searchParams.has("uselibpqcompat")) {
    url.searchParams.set("uselibpqcompat", "true");
  }
  return url.toString();
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: databaseUrl() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
