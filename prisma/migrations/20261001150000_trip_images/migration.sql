-- Pembuka titipan bisa melampirkan gambar (foto menu, daftar harga, syarat, dll.)

-- AlterEnum
ALTER TYPE "ImageKind" ADD VALUE 'TRIP';

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "tripId" TEXT;

-- CreateIndex
CREATE INDEX "Image_tripId_idx" ON "Image"("tripId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
