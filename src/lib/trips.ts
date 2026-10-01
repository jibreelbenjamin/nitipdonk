import { LIVE_WINDOW_HOURS } from "./constants";
import { formatTime } from "./format";

type TripState = { status: "OPEN" | "CLOSED" | "DONE"; closesAt: string | null };

export function isAcceptingOrders(trip: TripState, now = new Date()) {
  return trip.status === "OPEN" && (!trip.closesAt || new Date(trip.closesAt) > now);
}

export function liveSince(now = new Date()) {
  return new Date(now.getTime() - LIVE_WINDOW_HOURS * 60 * 60 * 1000);
}

/** Link wa.me berisi ajakan titip yang siap dikirim, mis. ke grup WhatsApp kantor. */
export function whatsappShareUrl(trip: {
  title: string;
  note: string | null;
  closesAt: string | null;
  hostName: string;
  accepting: boolean;
  url: string;
}) {
  const closes = trip.accepting && trip.closesAt ? ` · tutup jam ${formatTime(trip.closesAt)}` : "";
  const lines = [`*Titipan: ${trip.title}*`, `Dibuka ${trip.hostName}${closes}`];
  if (trip.note) lines.push(`Catatan: ${trip.note}`);
  lines.push("", trip.accepting ? "Mau ikut titip? Buka di sini:" : "Lihat titipannya di sini:", trip.url);
  return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
}
