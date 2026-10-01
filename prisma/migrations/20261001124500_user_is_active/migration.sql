-- Admin bisa menonaktifkan akun tanpa menghapus datanya. Akun yang sudah ada tetap aktif.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
