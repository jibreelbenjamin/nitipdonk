import { cleanupOldImages } from "@/lib/images";

// Pembersihan bukti bayar berkala. Jadwalkan lewat Vercel Cron (lihat vercel.json)
// atau layanan cron lain dengan header: Authorization: Bearer <CRON_SECRET>
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Number(process.env.CLEANUP_PROOF_DAYS ?? 30);
  if (!Number.isInteger(days) || days < 1) {
    return Response.json({ error: "CLEANUP_PROOF_DAYS tidak valid" }, { status: 500 });
  }

  const result = await cleanupOldImages(["PROOF"], days);
  return Response.json({ deleted: result.count, freedBytes: result.bytes, olderThanDays: days });
}
