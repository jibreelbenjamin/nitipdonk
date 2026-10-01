"use client";

import { useState, useSyncExternalStore } from "react";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";
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
  const [helpOpen, setHelpOpen] = useState(false);

  if (mode === "hidden") return null;

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
      <Button variant="outline" size="sm" onClick={install}>
        <DownloadIcon data-icon="inline-start" />
        Unduh
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
