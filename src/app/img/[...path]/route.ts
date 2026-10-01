import { Constants } from "@/lib/database.types";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { getObject } from "@/lib/storage";

// Path gambar selalu `<jenis>/<uuid>.webp` (lihat saveImage), selain itu ditolak
const KINDS = Constants.public.Enums.ImageKind.map((kind) => kind.toLowerCase()).join("|");
const PATH = new RegExp(`^(${KINDS})/[0-9a-f-]{36}\\.webp$`);

/**
 * Gambar disajikan lewat domain aplikasi, jadi URL storage Supabase tidak pernah sampai ke
 * browser. Foto profil boleh dilihat siapa saja (tampil di halaman pilih akun); gambar lain
 * (bukti bayar, QR, lampiran titipan) hanya untuk yang sudah login atau admin.
 */
export async function GET(_request: Request, ctx: RouteContext<"/img/[...path]">) {
  const key = (await ctx.params).path.join("/");
  const match = PATH.exec(key);
  if (!match) return new Response("Not found", { status: 404 });

  const isPublic = match[1] === "avatar";
  if (!isPublic && !(await getCurrentUser()) && !(await isAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const file = await getObject(key);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file, {
    headers: {
      "Content-Type": "image/webp",
      // Nama file unik dan isinya tidak pernah berubah. Yang butuh login hanya disimpan browser.
      "Cache-Control": `${isPublic ? "public" : "private"}, max-age=31536000, immutable`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
