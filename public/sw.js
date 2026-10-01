// Service worker NitipDonk: membuat aplikasi bisa dipasang di HP dan tetap bisa dibaca
// saat offline. Halaman selalu diambil dari server dulu (network-first); salinan terakhir
// hanya dipakai kalau tidak ada koneksi. Perubahan data tetap butuh koneksi.
const OFFLINE_URL = "/offline";
const SHELL_CACHE = "nitipdonk-shell-v2"; // halaman offline
const STATIC_CACHE = "nitipdonk-static"; // aset Next.js & ikon (nama file berisi hash, tidak berubah)
const IMAGE_CACHE = "nitipdonk-images"; // gambar Supabase Storage (path UUID, tidak berubah)
const PAGE_CACHE = "nitipdonk-pages"; // halaman terakhir yang dibuka; dihapus saat ganti akun
const CACHES = [SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE];

// Halaman yang disimpan untuk dibaca offline (admin sengaja tidak)
const OFFLINE_PAGES = [/^\/titipan(\/[^/]+)?$/, /^\/pengaturan$/];
const ICONS = ["/favicon.ico", "/icon.svg", "/apple-icon.png", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(page(event, url));
  } else if (url.origin === self.location.origin) {
    // Request data Next.js (RSC), API, dan server action selalu langsung ke server
    if (url.pathname.startsWith("/_next/static/") || ICONS.includes(url.pathname)) {
      event.respondWith(cacheFirst(event, STATIC_CACHE, 300));
    }
  } else if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/v1/object/public/")) {
    event.respondWith(image(event));
  }
});

async function page(event, url) {
  const savable = OFFLINE_PAGES.some((pattern) => pattern.test(url.pathname));
  try {
    const response = await fetch(event.request);
    // Redirect (mis. belum login) tidak bertipe "basic", jadi tidak ikut disimpan
    if (savable && response.ok && response.type === "basic") {
      event.waitUntil(save(PAGE_CACHE, url.pathname, response.clone(), 30));
    }
    return response;
  } catch {
    // Aplikasi terpasang dibuka dari "/" → tampilkan daftar titipan terakhir
    const path = url.pathname === "/" ? "/titipan" : url.pathname;
    const saved = savable || url.pathname === "/" ? await caches.match(path, { cacheName: PAGE_CACHE }) : undefined;
    return saved ?? (await caches.match(OFFLINE_URL)) ?? Response.error();
  }
}

// Pindah halaman lewat link hanya mengambil data RSC, bukan HTML, jadi halaman memberi tahu
// service worker untuk menyimpan salinan HTML terbarunya (paling sering 30 detik sekali).
self.addEventListener("message", (event) => {
  const path = event.data?.type === "SAVE_PAGE" ? event.data.path : null;
  if (typeof path !== "string" || !OFFLINE_PAGES.some((pattern) => pattern.test(path))) return;
  event.waitUntil(savePage(path));
});

async function savePage(path) {
  const saved = await caches.match(path, { cacheName: PAGE_CACHE });
  const age = saved ? Date.now() - new Date(saved.headers.get("date") ?? 0).getTime() : Infinity;
  if (age < 30_000) return;
  try {
    const response = await fetch(path, { credentials: "same-origin", redirect: "manual" });
    if (response.ok && response.type === "basic") await save(PAGE_CACHE, path, response, 30);
  } catch {
    // Sedang offline: biarkan salinan lama
  }
}

async function cacheFirst(event, cacheName, maxEntries) {
  const cached = await caches.match(event.request, { cacheName });
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok) event.waitUntil(save(cacheName, event.request, response.clone(), maxEntries));
  return response;
}

async function image(event) {
  const cached = await caches.match(event.request.url, { cacheName: IMAGE_CACHE });
  if (cached) return cached;
  try {
    // Diambil sebagai CORS: respons "opaque" memakan kuota penyimpanan jauh lebih besar
    const response = await fetch(event.request.url, { mode: "cors", credentials: "omit" });
    if (response.ok) event.waitUntil(save(IMAGE_CACHE, event.request.url, response.clone(), 150));
    return response;
  } catch {
    return fetch(event.request);
  }
}

/** Simpan ke cache lalu buang entri tertua supaya ukurannya tetap kecil. */
async function save(cacheName, key, response, maxEntries) {
  const cache = await caches.open(cacheName);
  await cache.put(key, response);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((old) => cache.delete(old)));
}
