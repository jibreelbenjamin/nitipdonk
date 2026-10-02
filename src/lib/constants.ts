export const PIN_LENGTH = 6;
export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCK_MINUTES = 5;

// Batas ukuran file mentah yang diterima server (sebelum dikompres)
export const MAX_UPLOAD_MB = 8;

// Titipan yang belum ditandai selesai tetap muncul di "Live" selama ini
export const LIVE_WINDOW_HOURS = 24;

// Lampiran gambar dari pembuka titipan (foto menu, syarat, dll.)
export const MAX_TRIP_IMAGES = 5;

// Batas "tutup dalam N menit" saat membuka titipan
export const MAX_CLOSE_MINUTES = 24 * 60;

export const TIME_ZONE = "Asia/Jakarta";
// Selisih TIME_ZONE dari UTC; Asia/Jakarta tidak memakai daylight saving, jadi selalu tetap
export const TIME_ZONE_OFFSET = "+07:00";

// Saran unduh aplikasi di browser HP: setelah "Nanti saja", baru muncul lagi
// saat cookie ini kedaluwarsa
export const INSTALL_ALERT_COOKIE = "nd_install_dismissed";
export const INSTALL_ALERT_SNOOZE_DAYS = 7;

export const ADMIN_PASSWORD_MIN_LENGTH = 8;
