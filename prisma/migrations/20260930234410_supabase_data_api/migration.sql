-- Aplikasi kini menulis data lewat Supabase (PostgREST), bukan Prisma Client, jadi
-- nilai yang dulu dibuat Prisma Client di sisi aplikasi sekarang dibuat database:
-- id (UUID), updatedAt (default + trigger), dan waktu disimpan sebagai timestamptz.
-- Nilai lama disimpan Prisma dalam UTC, jadi dikonversi dengan AT TIME ZONE 'UTC'.

-- AlterTable
ALTER TABLE "Image" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Trip" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text,
ALTER COLUMN "closesAt" SET DATA TYPE TIMESTAMPTZ(3) USING "closesAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text,
ALTER COLUMN "pinLockedUntil" SET DATA TYPE TIMESTAMPTZ(3) USING "pinLockedUntil" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- updatedAt diperbarui otomatis setiap baris diubah
CREATE OR REPLACE FUNCTION "set_updated_at"() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW."updatedAt" := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "User_set_updated_at" BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "Trip_set_updated_at" BEFORE UPDATE ON "Trip" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "Order_set_updated_at" BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
