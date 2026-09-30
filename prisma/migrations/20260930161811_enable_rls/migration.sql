-- Supabase mengekspos schema "public" lewat Data API (PostgREST).
-- Aplikasi hanya mengakses database lewat Prisma (role pemilik tabel, tidak kena RLS),
-- jadi RLS tanpa policy menutup akses dari anon/authenticated key tanpa mengganggu app.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Image" ENABLE ROW LEVEL SECURITY;
