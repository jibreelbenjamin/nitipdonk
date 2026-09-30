import { readLocalObject } from "@/lib/storage";

// Menyajikan gambar dari folder .uploads/ saat development tanpa Supabase.
// Di production gambar langsung dilayani oleh Supabase Storage.
export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[...path]">) {
  const { path } = await ctx.params;
  const file = await readLocalObject(path.join("/"));
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
