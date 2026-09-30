import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Foto sudah dikecilkan di browser, tapi beri ruang kalau browser gagal mengecilkannya
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
