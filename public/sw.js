// Service worker NitipDonk: membuat aplikasi bisa dipasang di HP dan tetap bisa dibuka tanpa
// koneksi. Yang disimpan hanya halaman /offline beserta file JS/CSS/font-nya; halaman itu
// menampilkan titipan yang tersimpan di localStorage. Request lain, termasuk SEMUA gambar,
// tidak disentuh dan langsung ke jaringan.
//
// Didaftarkan sebagai /sw.js?v=<build>, jadi setiap deploy memasang ulang service worker
// dan menyimpan halaman offline versi terbaru.
const VERSION = new URL(self.location.href).searchParams.get("v") ?? "0";
const CACHE = `nitipdonk-offline-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(precacheOfflinePage());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Termasuk cache versi lama (halaman & gambar) yang sudah tidak dipakai
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    // Halaman selalu dari server; halaman offline hanya dipakai kalau tidak ada koneksi
    event.respondWith(fetch(request).catch(offlinePage));
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(fromCache(request));
  }
});

async function precacheOfflinePage() {
  const cache = await caches.open(CACHE);
  const response = await fetch(OFFLINE_URL, { cache: "reload" });
  if (!response.ok) throw new Error(`Halaman offline gagal diambil (${response.status})`);
  const html = await response.clone().text();
  await cache.put(OFFLINE_URL, response);
  // File yang dirujuk halaman offline. Nama file-nya berisi hash, jadi isinya tidak pernah berubah.
  const assets = new Set(html.match(/\/_next\/static\/[^"'\\\s)]+/g));
  // Satu file gagal tidak membatalkan semuanya; halaman offline tetap tampil, hanya kurang interaktif
  await Promise.all([...assets].map((asset) => cache.add(asset).catch(() => {})));
}

async function offlinePage() {
  return (await caches.match(OFFLINE_URL, { cacheName: CACHE })) ?? Response.error();
}

async function fromCache(request) {
  return (await caches.match(request, { cacheName: CACHE })) ?? fetch(request);
}
