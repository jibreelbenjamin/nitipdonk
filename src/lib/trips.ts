import { LIVE_WINDOW_HOURS } from "./constants";
import { formatRupiah, formatTime } from "./format";

type TripState = { status: "OPEN" | "CLOSED" | "DONE"; closesAt: string | null };

export function isAcceptingOrders(trip: TripState, now = new Date()) {
  return trip.status === "OPEN" && (!trip.closesAt || new Date(trip.closesAt) > now);
}

/** Status yang dilihat orang: OPEN yang sudah lewat jam tutup dibedakan jadi EXPIRED. */
export type TripPhase = "OPEN" | "EXPIRED" | "CLOSED" | "DONE";

export function tripPhase(trip: TripState, now = new Date()): TripPhase {
  if (trip.status !== "OPEN") return trip.status;
  return isAcceptingOrders(trip, now) ? "OPEN" : "EXPIRED";
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

type RecapOrder = {
  name: string;
  items: string;
  price: number | null;
  paymentMethod: "CASH" | "CASHLESS";
  isPaid: boolean;
};

/** Rekap semua pesanan sebagai teks biasa, siap ditempel ke WhatsApp atau catatan. */
export function tripRecap(trip: { title: string; hostName: string; orders: RecapOrder[] }) {
  const { orders } = trip;
  const total = orders.reduce((sum, order) => sum + (order.price ?? 0), 0);
  const cashCount = orders.filter((order) => order.paymentMethod === "CASH").length;
  const paidCount = orders.filter((order) => order.isPaid).length;

  const lines = [`*Rekap titipan: ${trip.title}*`, `Dibuka ${trip.hostName} · ${orders.length} pesanan`];
  orders.forEach((order, index) => {
    const details = [
      order.price !== null ? formatRupiah(order.price) : null,
      order.paymentMethod === "CASH" ? "Cash" : "Cashless",
      order.isPaid ? "Lunas" : "Belum lunas",
    ];
    lines.push("", `${index + 1}. *${order.name}*`, order.items, details.filter(Boolean).join(" · "));
  });
  const summary = [
    total > 0 ? `Total ${formatRupiah(total)}` : null,
    `${orders.length - cashCount} cashless`,
    `${cashCount} cash`,
    `${paidCount}/${orders.length} lunas`,
  ];
  lines.push("", summary.filter(Boolean).join(" · "));
  return lines.join("\n");
}
