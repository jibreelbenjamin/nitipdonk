import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma hanya dipakai untuk migrasi dari komputer developer; aplikasi sendiri
// mengakses data lewat Supabase, jadi DIRECT_URL tidak perlu diset di Vercel.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Koneksi langsung / session pooler (port 5432), bukan transaction pooler
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    // Opsional; dibutuhkan saat membuat migrasi dengan database lokal `npm run db:dev`
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
