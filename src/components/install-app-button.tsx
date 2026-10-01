"use client";

import { useState, useSyncExternalStore } from "react";
import { DownloadIcon, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";
import { INSTALL_ALERT_COOKIE, INSTALL_ALERT_SNOOZE_DAYS } from "@/lib/constants";
import { INSTALL_PROMPT_KEY } from "@/lib/install-prompt";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

// Belum ada di lib.dom: event Chrome/Edge (HP & komputer) saat aplikasi siap dipasang
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Ditangkap di level modul karena event bisa muncul sebelum tombol ter-render
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

type InstallPromptWindow = Window & { [INSTALL_PROMPT_KEY]?: BeforeInstallPromptEvent };

if (typeof window !== "undefined") {
  // Event yang sudah ditangkap skrip di <head> sebelum modul ini dimuat
  deferredPrompt = (window as InstallPromptWindow)[INSTALL_PROMPT_KEY] ?? null;
  window.addEventListener("beforeinstallprompt", (event) => {
    // Pakai tombol "Unduh" sendiri, bukan banner bawaan Chrome
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

/** Sedang dibuka sebagai aplikasi yang sudah terpasang, bukan lewat browser. */
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS lama hanya mengenal penanda ini untuk aplikasi di layar utama
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Tunggu event pasang dari Chrome/Edge paling lama `timeout` ms. */
function waitForPrompt(timeout: number) {
  return new Promise<BeforeInstallPromptEvent | null>((resolve) => {
    if (deferredPrompt) return resolve(deferredPrompt);
    const done = () => {
      clearTimeout(timer);
      listeners.delete(check);
      resolve(deferredPrompt);
    };
    const check = () => deferredPrompt && done();
    const timer = setTimeout(done, timeout);
    listeners.add(check);
  });
}

type Platform = "android" | "ios" | "mac-safari" | "firefox" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  // iPadOS memakai user agent Mac, bedakan lewat layar sentuh
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Macintosh/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua)) return "mac-safari";
  return "desktop";
}

// Petunjuk pasang manual untuk browser yang tidak punya dialog pasang (iOS, Safari, Firefox),
// atau saat dialog dari Chrome/Edge belum tersedia
const GUIDES: Record<Platform, { description: string; steps: React.ReactNode[]; openFrom: string }> = {
  android: {
    description: "Pasang ke layar utama supaya bisa dibuka seperti aplikasi biasa.",
    steps: [
      "Ketuk ikon ⋮ (titik tiga) di pojok kanan atas Chrome.",
      <>Pilih &ldquo;Instal aplikasi&rdquo; atau &ldquo;Tambahkan ke layar utama&rdquo;.</>,
      <>Ketuk &ldquo;Instal&rdquo;. Ikon NitipDonk akan muncul di layar utama.</>,
    ],
    openFrom: "layar utama",
  },
  ios: {
    description: "Pasang ke layar utama supaya bisa dibuka seperti aplikasi biasa.",
    steps: [
      "Ketuk tombol Bagikan (kotak dengan panah ke atas). Di iOS terbaru, ketuk ⋯ dulu.",
      <>Gulir ke bawah, lalu pilih &ldquo;Tambah ke Layar Utama&rdquo;.</>,
      <>Ketuk &ldquo;Tambah&rdquo;. Ikon NitipDonk akan muncul di layar utama.</>,
    ],
    openFrom: "layar utama",
  },
  "mac-safari": {
    description: "Pasang ke Dock supaya bisa dibuka seperti aplikasi biasa.",
    steps: [
      "Klik tombol Bagikan di toolbar Safari, atau buka menu File.",
      <>Pilih &ldquo;Tambahkan ke Dock&rdquo;.</>,
      <>Klik &ldquo;Tambahkan&rdquo;. NitipDonk akan muncul di Dock.</>,
    ],
    openFrom: "Dock",
  },
  firefox: {
    description: "Firefox belum bisa memasang aplikasi web, jadi pakai Chrome atau Edge.",
    steps: [
      "Buka NitipDonk di Chrome atau Edge.",
      "Klik ikon Instal di ujung kanan kolom alamat.",
      <>Klik &ldquo;Instal&rdquo;. NitipDonk akan terbuka di jendelanya sendiri.</>,
    ],
    openFrom: "daftar aplikasi di komputermu",
  },
  desktop: {
    description: "Pasang di komputer supaya bisa dibuka di jendelanya sendiri seperti aplikasi biasa.",
    steps: [
      "Klik ikon Instal di ujung kanan kolom alamat Chrome atau Edge.",
      <>
        Kalau ikonnya tidak ada, buka menu browser (⋮ atau ⋯) lalu pilih &ldquo;Instal NitipDonk&rdquo; atau
        &ldquo;Instal halaman sebagai aplikasi&rdquo;.
      </>,
      <>Klik &ldquo;Instal&rdquo;. NitipDonk akan terbuka di jendelanya sendiri.</>,
    ],
    openFrom: "daftar aplikasi di komputermu",
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Tombol pasang aplikasi. Selalu tampil di browser (sudah ada sejak dirender server), hanya
 * disembunyikan saat NitipDonk sudah dibuka sebagai aplikasi.
 */
export function InstallAppButton() {
  const inApp = useSyncExternalStore(subscribe, isStandalone, () => false);
  if (inApp) return null;
  return (
    <InstallTrigger variant="outline" size="sm" className="[@media(display-mode:standalone)]:hidden">
      Unduh
    </InstallTrigger>
  );
}

/**
 * Saran unduh aplikasi daripada pakai web. Server hanya merendernya untuk browser HP/tablet
 * (lihat `InstallAppAlert`); kalau sudah dibuka sebagai aplikasi, CSS menyembunyikannya sejak awal.
 */
export function InstallAppAlertClient({ className }: { className?: string }) {
  const hidden = useSyncExternalStore(subscribe, () => installed || isStandalone(), () => false);
  const [dismissed, setDismissed] = useState(false);
  if (hidden || dismissed) return null;

  function dismiss() {
    // Server tidak merender saran ini lagi sampai cookie-nya kedaluwarsa
    const maxAge = INSTALL_ALERT_SNOOZE_DAYS * 24 * 60 * 60;
    document.cookie = `${INSTALL_ALERT_COOKIE}=1; path=/; max-age=${maxAge}; samesite=lax`;
    setDismissed(true);
  }

  return (
    <Alert className={cn("[@media(display-mode:standalone)]:hidden", className)}>
      <SmartphoneIcon />
      <AlertTitle>Lebih enak pakai aplikasinya</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>
          Daripada buka lewat browser, unduh NitipDonk ke HP-mu supaya bisa dibuka langsung dari layar
          utama dan tampil layar penuh.
        </span>
        <div className="flex flex-wrap gap-2">
          <InstallTrigger size="sm">Unduh aplikasi</InstallTrigger>
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Nanti saja
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Langsung membuka dialog pasang bawaan Chrome/Edge. Browser yang tidak menyediakannya untuk
 * situs web (Safari, Firefox) mendapat petunjuk pasang manual sesuai perangkat.
 */
function InstallTrigger({ children, disabled, ...props }: React.ComponentProps<typeof Button>) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [waiting, setWaiting] = useState(false);
  // Dideteksi saat diklik karena tombol ini ikut dirender di server
  const [platform, setPlatform] = useState<Platform | null>(null);
  const guide = platform && GUIDES[platform];

  async function install() {
    const current = detectPlatform();
    if (installed) {
      toast.info(`NitipDonk sudah terpasang. Buka dari ${GUIDES[current].openFrom}.`);
      return;
    }
    let promptEvent = deferredPrompt;
    // Chrome/Edge kadang baru siap beberapa detik setelah halaman dimuat. Tunggu sebentar,
    // masih dalam batas waktu klik, supaya dialog pasangnya tetap bisa langsung muncul.
    if (!promptEvent && "onbeforeinstallprompt" in window) {
      setWaiting(true);
      promptEvent = await waitForPrompt(3000);
      setWaiting(false);
    }
    if (!promptEvent) {
      setPlatform(current);
      setHelpOpen(true);
      return;
    }
    // prompt() hanya bisa dipanggil sekali per event
    deferredPrompt = null;
    delete (window as InstallPromptWindow)[INSTALL_PROMPT_KEY];
    notify();
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") toast.success("NitipDonk sedang dipasang");
  }

  return (
    <>
      <Button {...props} disabled={disabled || waiting} onClick={install}>
        {waiting ? <Spinner data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
        {children}
      </Button>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pasang NitipDonk</DialogTitle>
            <DialogDescription>{guide?.description}</DialogDescription>
          </DialogHeader>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
            {guide?.steps.map((step, index) => <li key={index}>{step}</li>)}
          </ol>
          <p className="text-sm text-muted-foreground">
            Kalau sudah terpasang, buka NitipDonk langsung dari {guide?.openFrom}.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Mengerti</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
