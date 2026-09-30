import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrasi butuh koneksi langsung (bukan pooler transaction mode) di Supabase
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    // Opsional; dibutuhkan saat `prisma migrate dev` memakai `prisma dev` (lokal)
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
