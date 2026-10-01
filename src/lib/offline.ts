import { useSyncExternalStore } from "react";

export const OFFLINE_MESSAGE = "Kamu sedang offline. Coba lagi setelah koneksi kembali.";
// Harus sama dengan PAGE_CACHE di public/sw.js
const PAGE_CACHE = "nitipdonk-pages";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/** Error karena koneksi putus (bukan penolakan dari server). */
function isNetworkError(error: unknown) {
  return !navigator.onLine || (error instanceof TypeError && /fetch|network|load failed/i.test(error.message));
}

type Result = { ok: true } | { ok: false; error: string };

/** Ubah kegagalan koneksi saat memanggil server action jadi hasil gagal biasa dengan pesan offline. */
export async function offlineSafe<T extends Result>(action: Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await action;
  } catch (error) {
    if (isNetworkError(error)) return { ok: false, error: OFFLINE_MESSAGE };
    throw error;
  }
}

/** Minta service worker menyimpan salinan halaman ini supaya bisa dibuka saat offline. */
export function savePageForOffline(path: string) {
  navigator.serviceWorker?.controller?.postMessage({ type: "SAVE_PAGE", path });
}

/** Hapus salinan halaman saat ganti akun supaya data akun lain tidak tampil saat offline. */
export async function clearSavedPages() {
  if ("caches" in window) await caches.delete(PAGE_CACHE);
}
