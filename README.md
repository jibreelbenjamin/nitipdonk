# NitipDonk

Aplikasi internal untuk titip makanan & minuman bareng teman kantor. Seseorang membuka
"titipan" (mis. _Mixue depan kantor, tutup 11:30_), yang lain ikut titip, bayar cash atau
cashless dengan upload bukti transfer.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres + Storage) ·
Prisma 7 (schema & migrasi) · shadcn/ui (Radix, Tailwind v4).

## Fitur

- **Pilih akun** seperti profil Netflix. Akun terbuka tanpa password; PIN 6 digit opsional
  (dikunci 5 menit setelah 5x salah). Ganti PIN = sesi di perangkat lain otomatis keluar.
- **Titipan live**: daftar titipan yang sedang buka, auto-refresh tiap 10 detik, tab Riwayat.
- **Detail titipan**: info pembayaran pembuka titipan (teks + gambar QRIS, tombol salin),
  form titip (pesanan, harga, radio cash/cashless, upload bukti bayar), daftar pesanan
  dengan total, jumlah cash/cashless, dan status lunas.
- **Pembuka titipan** bisa menutup / membuka lagi / menandai selesai, menandai pesanan
  lunas, mengubah harga asli, dan menghapus pesanan.
- **Pengaturan**: foto profil, info pembayaran (teks dan/atau gambar), pasang/ganti/hapus PIN.
- **Admin** (`/admin`, dilindungi `ADMIN_PASSWORD`): tambah / ubah nama / reset PIN / hapus
  pengguna, statistik storage, hapus gambar per item atau massal berdasarkan umur.
- **Kompresi gambar**: foto dikecilkan dulu di browser (maks 1600px), lalu server
  mengompres ulang ke WebP dengan `sharp` sebelum masuk storage:

  | Jenis        | Ukuran maks     | Kualitas |
  | ------------ | --------------- | -------- |
  | Foto profil  | 256×256 (crop)  | 80       |
  | QR pembayaran| 1080px          | 90       |
  | Bukti bayar  | 1280px          | 70       |

- **Pembersihan berkala**: `GET /api/cron/cleanup` menghapus bukti bayar yang lebih tua dari
  `CLEANUP_PROOF_DAYS` hari. `vercel.json` menjadwalkannya tiap hari 03:00 WIB.

## Menjalankan di lokal

Tanpa Supabase pun bisa: database memakai `prisma dev` (Postgres lokal) dan gambar disimpan
di folder `.uploads/`.

```bash
npm install
cp .env.example .env    # lalu isi, lihat contoh lokal di bawah
npm run db:dev          # Postgres lokal di port 51214 (shadow DB di 51215)
npx prisma migrate dev  # terapkan migrasi
npm run dev
```

Contoh `.env` lokal:

```env
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
DIRECT_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
SHADOW_DATABASE_URL="postgres://postgres:postgres@localhost:51215/template1?sslmode=disable"
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SESSION_SECRET="string-acak-minimal-16-karakter"
ADMIN_PASSWORD="password-admin"
CRON_SECRET="string-acak"
CLEANUP_PROOF_DAYS="30"
```

Buka `/admin`, login, tambahkan pengguna, lalu kembali ke halaman depan.

## Pakai Supabase

1. Buat project di Supabase.
2. **Connect → ORMs → Prisma**: salin connection string pooler (port 6543) ke `DATABASE_URL`
   dan session/direct (port 5432) ke `DIRECT_URL`.
3. **Project Settings → API Keys**: isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`
   (service_role atau `sb_secret_...`). Kunci ini hanya dipakai di server.
4. Terapkan migrasi: `npm run db:deploy`.
5. Bucket storage (`SUPABASE_BUCKET`, default `nitipdonk`) dibuat otomatis sebagai bucket
   public saat upload pertama.

Migrasi `enable_rls` menyalakan Row Level Security tanpa policy di semua tabel, sehingga
tabel tidak bisa diakses lewat Data API Supabase (anon key). Prisma tetap bisa karena
terhubung sebagai pemilik tabel.

## Deploy (Vercel)

Isi semua env di atas di Project Settings → Environment Variables. Cron di `vercel.json`
otomatis mengirim header `Authorization: Bearer $CRON_SECRET`. Kalau deploy di tempat lain,
panggil endpoint cron dari penjadwal apa pun dengan header yang sama.

## Catatan keamanan

- Ini aplikasi **internal**: siapa pun yang bisa membuka URL bisa memilih akun tanpa PIN.
  Taruh di balik jaringan kantor / proteksi deployment kalau perlu.
- URL gambar di bucket public tidak bisa ditebak (UUID), tapi siapa pun yang punya URL-nya
  bisa melihat gambarnya.
- Semua server action memverifikasi sesi dan kepemilikan (pemesan vs pembuka titipan vs admin).

## Struktur

```
prisma/                 schema & migrasi
src/actions/            server actions (auth, trips, orders, profile, admin)
src/lib/                prisma, sesi & PIN, storage (Supabase / lokal), kompresi gambar
src/app/                halaman: /, /titipan, /titipan/[id], /pengaturan, /admin, /admin/gambar
src/components/         komponen aplikasi; src/components/ui berisi komponen shadcn
```
