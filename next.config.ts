import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Foto sudah dikecilkan di browser, tapi beri ruang kalau browser gagal mengecilkannya
      bodySizeLimit: "9mb",
    },
  },
  async headers() {
    return [
      {
        // Service worker harus selalu versi terbaru
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
