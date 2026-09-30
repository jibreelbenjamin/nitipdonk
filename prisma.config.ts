import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrasi butuh koneksi langsung / session mode (bukan pooler transaction mode) di Supabase.
    // POSTGRES_URL_NON_POOLING disuntikkan integrasi Supabase di Vercel.
    url: process.env.DIRECT_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL,
    // Opsional; dibutuhkan saat `prisma migrate dev` memakai `prisma dev` (lokal)
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
