-- Akun nonaktif tampil abu-abu di halaman pilih akun, kecuali admin memilih menyembunyikannya.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showWhenInactive" BOOLEAN NOT NULL DEFAULT true;
