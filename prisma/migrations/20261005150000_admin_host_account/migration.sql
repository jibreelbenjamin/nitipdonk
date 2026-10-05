-- Admin bisa membuka titipan atas namanya sendiri lewat satu akun khusus "Admin".
-- Akun ini tidak tampil di halaman pilih akun maupun daftar pengguna, dan tidak bisa dipakai masuk.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Akun admin (cukup satu)
INSERT INTO "User" ("name", "isAdmin") VALUES ('Admin', true);
