"use client";

import { useState, useSyncExternalStore } from "react";
import { DownloadIcon, SmartphoneIcon } from "lucide-react";
import { toast } from "sonner";
import { INSTALL_ALERT_COOKIE, INSTALL_ALERT_SNOOZE_DAYS } from "@/lib/constants";
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

// Belum ada di lib.dom: event Chrome/Android saat aplikasi siap dipasang
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Ditangkap di level modul karena event bisa muncul sebelum tombol ter-render
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
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

type Mode = "hidden" | "prompt" | "manual";

function getMode(): Mode {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  if (!isAndroid || isStandalone || installed) return "hidden";
  return deferredPrompt ? "prompt" : "manual";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Tombol pasang aplikasi, khusus HP Android yang belum membuka NitipDonk sebagai aplikasi. */
export function InstallAppButton() {
  const mode = useSyncExternalStore(subscribe, getMode, (): Mode => "hidden");
  if (mode === "hidden") return null;
  return (
    <InstallTrigger variant="outline" size="sm">
      Unduh
    </InstallTrigger>
  );
}

/**
 * Saran unduh aplikasi daripada pakai web. Server hanya merendernya untuk browser Android
 * (lihat `InstallAppAlert`); kalau sudah dibuka sebagai aplikasi, CSS menyembunyikannya sejak awal.
 */
export function InstallAppAlertClient({ className }: { className?: string }) {
  const justInstalled = useSyncExternalStore(subscribe, () => installed, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (justInstalled || dismissed) return null;

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

/** Munculkan dialog pasang dari Chrome, atau petunjuk pasang manual kalau dialog itu belum tersedia. */
function InstallTrigger({ children, ...props }: React.ComponentProps<typeof Button>) {
  const [helpOpen, setHelpOpen] = useState(false);

  async function install() {
    const promptEvent = deferredPrompt;
    if (!promptEvent) {
      setHelpOpen(true);
      return;
    }
    // prompt() hanya bisa dipanggil sekali per event
    deferredPrompt = null;
    notify();
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") toast.success("NitipDonk sedang dipasang di HP-mu");
  }

  return (
    <>
      <Button {...props} onClick={install}>
        <DownloadIcon data-icon="inline-start" />
        {children}
      </Button>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pasang NitipDonk</DialogTitle>
            <DialogDescription>
              Pasang ke layar utama supaya bisa dibuka seperti aplikasi biasa.
            </DialogDescription>
          </DialogHeader>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
            <li>Ketuk ikon ⋮ (titik tiga) di pojok kanan atas Chrome.</li>
            <li>Pilih &ldquo;Instal aplikasi&rdquo; atau &ldquo;Tambahkan ke layar utama&rdquo;.</li>
            <li>Ketuk &ldquo;Instal&rdquo;. Ikon NitipDonk akan muncul di layar utama.</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Kalau sudah terpasang, buka NitipDonk langsung dari layar utama.
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
