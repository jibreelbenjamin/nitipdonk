// Chrome/Edge mengirim event `beforeinstallprompt` sekali per halaman, bisa sebelum JavaScript
// aplikasi selesai dimuat. Skrip ini dipasang di <head> supaya event-nya tetap tertangkap dan
// tombol "Unduh" bisa langsung membuka dialog pasang.
export const INSTALL_PROMPT_KEY = "__nitipdonkInstallPrompt";

export const INSTALL_PROMPT_SCRIPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.${INSTALL_PROMPT_KEY}=e})`;
