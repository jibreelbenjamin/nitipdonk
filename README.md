# NitipDonk

Aplikasi internal untuk titip makanan & minuman bareng teman kantor. Seseorang membuka
"titipan" (mis. _Mixue depan kantor, tutup 11:30_), yang lain ikut titip, bayar cash atau
cashless dengan upload bukti transfer.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres + Storage) ·
Prisma 7 (schema & migrasi) · shadcn/ui (Radix, Tailwind v4).

**Arsitektur data:** aplikasi mengakses database dan storage **hanya lewat Supabase**
(`supabase-js` + service role key, di server). Prisma dipakai khusus untuk skema & migrasi
dari komputer developer, jadi deployment tidak butuh connection string database.

## Fitur

- **Pilih akun** seperti profil Netflix. Akun terbuka tanpa password; PIN 6 digit opsional
  (dikunci 5 menit setelah 5x salah). Ganti PIN = sesi di perangkat lain otomatis keluar.
- **Titipan live**: daftar titipan yang sedang buka, auto-refresh tiap 10 detik, tab Riwayat.
- **Lampiran gambar**: pembuka titipan bisa melampirkan sampai 5 gambar (foto menu, daftar
  harga, syarat) saat membuka titipan, lalu menambah/menghapusnya. Semua gambar bisa
  diperbesar: cubit & geser di HP, scroll / klik dua kali / tombol di komputer.
- **Detail titipan**: info pembayaran pembuka titipan (teks + gambar QRIS, tombol salin),
  form titip (pesanan, harga, radio cash/cashless, upload bukti bayar), daftar pesanan
  dengan total, jumlah cash/cashless, dan status lunas.
- **Pembuka titipan** bisa menutup / membuka lagi / menandai selesai, menandai pesanan
  lunas, mengubah harga asli, dan menghapus pesanan.
- **Pengaturan**: foto profil, info pembayaran (teks dan/atau gambar), pasang/ganti/hapus PIN.
- **Admin** (`/admin`, dilindungi password admin di database): tambah / ubah nama / reset PIN / nonaktifkan / hapus
  pengguna, statistik storage, hapus gambar per item atau massal berdasarkan umur, ganti
  password admin. Password disimpan sebagai hash scrypt di tabel `Setting`; mengganti password
  mengeluarkan sesi admin di perangkat lain.
- **Admin – kelola titipan** (`/admin/titipan`): akses penuh ke semua titipan lewat data table
  (shadcn + TanStack Table: cari, filter, urutkan, pilih banyak, atur kolom, paginasi). Admin bisa
  membuka titipan atas nama sendiri (akun khusus **Admin**) atau siapa pun — pembuka dipilih lewat
  combobox yang bisa dicari — mengubah semua datanya (pembuka, judul, catatan, status,
  jam tutup), mengelola lampiran, serta menambah / mengubah / menandai lunas / mengganti bukti /
  menghapus pesanan siapa pun — termasuk di titipan yang sudah ditutup — satu per satu atau massal.
- **Akun Admin** (dibuat oleh migrasi) hanya dipakai sebagai pembuka titipan dari dashboard admin: tidak
  tampil di halaman pilih akun maupun daftar pengguna, dan tidak bisa dipakai masuk.
- **Akun nonaktif** tampil abu-abu di halaman pilih akun; diklik muncul info bahwa akun
  dinonaktifkan. Saat menonaktifkan, admin bisa memilih akun tetap tampil abu-abu atau disembunyikan.
- **Kompresi gambar**: foto dikecilkan dulu di browser (maks 1600px), lalu server
  mengompres ulang ke WebP dengan `sharp` sebelum masuk storage:

  | Jenis        | Ukuran maks     | Kualitas |
  | ------------ | --------------- | -------- |
  | Foto profil  | 256×256 (crop)  | 80       |
  | QR pembayaran| 1080px          | 90       |
  | Bukti bayar  | 1280px          | 70       |
  | Lampiran     | 1600px          | 80       |

- **Pembersihan berkala**: `GET /api/cron/cleanup` menghapus bukti bayar yang lebih tua dari
  `CLEANUP_PROOF_DAYS` hari. `vercel.json` menjadwalkannya tiap hari 03:00 WIB.

## Menjalankan di lokal

```bash
npm install
cp .env.example .env   # isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SESSION_SECRET
npm run admin:password # atur password admin (sekali saja; juga dipakai kalau lupa password)
npm run dev
```

Buka `/admin`, login, tambahkan pengguna, lalu kembali ke halaman depan. Bucket storage
(`SUPABASE_BUCKET`, default `nitipdonk`) dibuat otomatis sebagai bucket public saat upload
pertama.

## Skema & migrasi (Prisma)

Isi `DIRECT_URL` di `.env` lokal dengan connection string **Session pooler (port 5432)** dari
Supabase Dashboard → Connect. Variabel ini hanya untuk Prisma dan tidak perlu ada di Vercel.

- Terapkan migrasi yang sudah ada ke Supabase: `npm run db:deploy`
- Mengubah skema:
  1. Edit `prisma/schema.prisma`.
  2. Buat migrasi dengan database lokal supaya Supabase tidak tersentuh saat mencoba:
     `npm run db:dev`, lalu
     `DIRECT_URL=postgres://postgres:postgres@localhost:51214/template1?sslmode=disable SHADOW_DATABASE_URL=postgres://postgres:postgres@localhost:51215/template1?sslmode=disable npx prisma migrate dev --name <nama>`
  3. Terapkan ke Supabase: `npm run db:deploy`.
  4. Generate ulang tipe: `npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/lib/database.types.ts`

Karena data ditulis lewat Supabase (bukan Prisma Client), nilai bawaan harus dibuat oleh
database: `id` memakai `dbgenerated("(gen_random_uuid())::text")`, `updatedAt` diisi trigger,
dan kolom waktu bertipe `@db.Timestamptz(3)`. Ikuti pola yang sama untuk tabel baru.

Semua tabel memakai Row Level Security tanpa policy, jadi tidak bisa diakses dengan
anon/publishable key. Server memakai service role key yang melewati RLS.

## Deploy (Vercel)

1. Import repo ini sebagai project di Vercel (framework Next.js terdeteksi otomatis).
2. **Settings → Environment Variables** (tipe *Sensitive* untuk yang rahasia):
   - wajib: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`
     (`openssl rand -base64 32`)
   - opsional: `CRON_SECRET`, `CLEANUP_PROOF_DAYS`, `SUPABASE_BUCKET`
3. Deploy. Build hanya menjalankan `next build`; migrasi dijalankan dari komputer developer
   dengan `npm run db:deploy`.

Cron di `vercel.json` otomatis mengirim header `Authorization: Bearer $CRON_SECRET`. Kalau
deploy di tempat lain, panggil endpoint cron dari penjadwal apa pun dengan header yang sama.

## Catatan keamanan

- Ini aplikasi **internal**: siapa pun yang bisa membuka URL bisa memilih akun tanpa PIN.
  Taruh di balik jaringan kantor / proteksi deployment kalau perlu.
- Gambar disajikan lewat `/img/...` di domain aplikasi, jadi URL Supabase tidak terlihat di
  browser. Foto profil terbuka (tampil di halaman pilih akun); bukti bayar, QR, dan lampiran
  hanya untuk yang sudah login atau admin. Bucket storage-nya sendiri masih public, jadi URL
  Supabase lama (kalau pernah tersalin) tetap bisa dibuka.
- Semua server action memverifikasi sesi dan kepemilikan (pemesan vs pembuka titipan vs admin).

## Struktur

```
prisma/                 schema & migrasi
src/actions/            server actions (auth, trips, orders, profile, admin, admin-trips)
src/lib/                klien Supabase + tipe database, sesi & PIN, storage, kompresi gambar
src/app/                halaman: /, /titipan, /titipan/[id], /pengaturan, /admin, /admin/titipan, /admin/gambar
src/components/         komponen aplikasi; src/components/ui berisi komponen shadcn,
                        src/components/data-table komponen data table (pola Data Table shadcn)
```
