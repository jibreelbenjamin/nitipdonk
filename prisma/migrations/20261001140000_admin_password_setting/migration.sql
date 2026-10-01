-- Password admin disimpan di database (hash scrypt), bukan di environment ADMIN_PASSWORD.
-- Isinya tidak ditaruh di migrasi karena repo ini publik; atur dengan `npm run admin:password`.

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- Sama seperti tabel lain: tertutup dari anon/authenticated key, server memakai service role
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER "Setting_set_updated_at" BEFORE UPDATE ON "Setting" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
