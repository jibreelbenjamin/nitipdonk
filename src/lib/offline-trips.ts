import { useSyncExternalStore } from "react";
import { LIVE_WINDOW_HOURS } from "./constants";

// Salinan data titipan yang terakhir dibuka saat online, untuk dibaca di halaman /offline.
// Hanya teks (tanpa gambar) dan hanya tersimpan di browser/HP ini.
const STORAGE_KEY = "nitipdonk:titipan-offline";
const MAX_TRIPS = 10;
const MAX_AGE_MS = LIVE_WINDOW_HOURS * 60 * 60 * 1000;

export type OfflineOrder = {
  id: string;
  name: string;
  items: string;
  price: number | null;
  paymentMethod: "CASH" | "CASHLESS";
  isPaid: boolean;
  hasProof: boolean;
  isMine: boolean;
  createdAt: string;
};

export type OfflineTrip = {
  id: string;
  title: string;
  note: string | null;
  hostName: string;
  isHost: boolean;
  status: "OPEN" | "CLOSED" | "DONE";
  closesAt: string | null;
  createdAt: string;
  /** Waktu data ini diambil dari server. */
  savedAt: string;
  orders: OfflineOrder[];
};

type Saved = { version: 1; userId: string; trips: OfflineTrip[] };

const listeners = new Set<() => void>();

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Saved | null {
  try {
    const saved = raw ? (JSON.parse(raw) as Saved) : null;
    return saved?.version === 1 && Array.isArray(saved.trips) ? saved : null;
  } catch {
    return null;
  }
}

function write(saved: Saved | null) {
  try {
    if (saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Penyimpanan penuh atau diblokir (mis. mode privat): titipan tidak tersedia offline
  }
  listeners.forEach((listener) => listener());
}

/** Buang yang lebih lama dari 24 jam, sisakan yang terbaru. */
function prune(trips: OfflineTrip[], now = Date.now()) {
  return trips
    .filter((trip) => now - new Date(trip.savedAt).getTime() < MAX_AGE_MS)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, MAX_TRIPS);
}

export function saveOfflineTrip(userId: string, trip: OfflineTrip) {
  const saved = parse(readRaw());
  // Data akun lain di HP yang sama tidak ikut ditampilkan
  const others = saved?.userId === userId ? saved.trips.filter((item) => item.id !== trip.id) : [];
  write({ version: 1, userId, trips: prune([trip, ...others]) });
}

export function removeOfflineTrip(id: string) {
  const saved = parse(readRaw());
  if (saved) write({ ...saved, trips: saved.trips.filter((trip) => trip.id !== id) });
}

export function clearOfflineTrips() {
  write(null);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Perubahan dari tab lain
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// useSyncExternalStore butuh hasil yang sama selama isi penyimpanan tidak berubah
let snapshot: { raw: string | null; trips: OfflineTrip[] } | null = null;

function getSnapshot() {
  const raw = readRaw();
  if (snapshot?.raw !== raw) snapshot = { raw, trips: prune(parse(raw)?.trips ?? []) };
  return snapshot.trips;
}

/** Titipan tersimpan, terbaru dulu. `null` selama render di server dan saat hydration. */
export function useOfflineTrips() {
  return useSyncExternalStore<OfflineTrip[] | null>(subscribe, getSnapshot, () => null);
}
