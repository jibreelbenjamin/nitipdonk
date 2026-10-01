// Atur atau reset password admin langsung di database: `npm run admin:password`.
// Butuh SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env. Hash-nya memakai format yang sama
// dengan src/lib/hash.ts (scrypt, `salt:hash` base64). Sesi admin yang lama otomatis keluar.
import "dotenv/config";
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const MIN_LENGTH = 8; // sama dengan ADMIN_PASSWORD_MIN_LENGTH di src/lib/constants.ts

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
rl._writeToOutput = () => {}; // jangan tampilkan ketikan password di layar
const lines = rl[Symbol.asyncIterator]();

async function askHidden(question) {
  process.stdout.write(question);
  const { value = "" } = await lines.next();
  process.stdout.write("\n");
  return value.trim(); // server juga memangkas spasi di awal & akhir
}

const password = await askHidden("Password admin baru: ");
const confirm = await askHidden("Ulangi password: ");
rl.close();
if (password.length < MIN_LENGTH) {
  console.error(`Password minimal ${MIN_LENGTH} karakter`);
  process.exit(1);
}
if (confirm !== password) {
  console.error("Konfirmasi password tidak sama");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = await new Promise((resolve, reject) =>
  scrypt(password, salt, 32, (error, derived) => (error ? reject(error) : resolve(derived))),
);
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await db
  .from("Setting")
  .upsert({ key: "adminPasswordHash", value: `${salt.toString("base64")}:${hash.toString("base64")}` });
if (error) {
  console.error("Gagal menyimpan password:", error.message);
  process.exit(1);
}
console.log("Password admin disimpan. Sesi admin yang lama otomatis keluar.");
