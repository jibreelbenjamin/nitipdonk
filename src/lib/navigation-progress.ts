import { useSyncExternalStore } from "react";

// Status pindah halaman disimpan di luar React supaya bisa dimulai dari mana saja
// (klik link, router.push, server action yang redirect) dan diselesaikan saat URL berubah.
type Snapshot = { active: boolean; visible: boolean; value: number };

const initial: Snapshot = { active: false, visible: false, value: 0 };
let snapshot = initial;
const listeners = new Set<() => void>();
let trickleTimer: ReturnType<typeof setInterval> | undefined;
let safetyTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function update(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Mulai indikator: bar atas berjalan, halaman diredupkan dan tidak bisa diklik. */
export function startNavigation() {
  if (snapshot.active) return;
  clearTimeout(hideTimer);
  update({ active: true, visible: true, value: 10 });
  trickleTimer = setInterval(() => update({ value: snapshot.value + (90 - snapshot.value) * 0.1 }), 300);
  // Jaga-jaga kalau navigasi batal sehingga URL tidak pernah berubah
  safetyTimer = setTimeout(finishNavigation, 15_000);
}

export function finishNavigation() {
  if (!snapshot.active) return;
  clearInterval(trickleTimer);
  clearTimeout(safetyTimer);
  update({ active: false, value: 100 });
  hideTimer = setTimeout(() => update({ visible: false, value: 0 }), 300);
}

export function useNavigationProgress() {
  return useSyncExternalStore(subscribe, () => snapshot, () => initial);
}
