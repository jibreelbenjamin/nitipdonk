// Service worker NitipDonk: membuat aplikasi bisa dipasang di HP dan menampilkan
// halaman offline saat tidak ada koneksi. Data selalu diambil langsung dari server;
// yang disimpan hanya halaman /offline.
const CACHE = "nitipdonk-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Hanya pindah halaman penuh; request data & aset dibiarkan ke browser seperti biasa
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(OFFLINE_URL)) ?? Response.error()),
  );
});
