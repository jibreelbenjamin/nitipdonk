"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { finishNavigation, startNavigation, useNavigationProgress } from "@/lib/navigation-progress";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

/** Selesaikan indikator setiap kali path atau query berganti. */
function RouteChangeListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    finishNavigation();
  }, [pathname, searchParams]);
  return null;
}

function isInternalNavigation(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href);
  return (
    url.origin === location.origin &&
    (url.pathname !== location.pathname || url.search !== location.search)
  );
}

/**
 * Loading saat pindah halaman: bar di atas, halaman diredupkan, dan semua interaksi
 * diblokir sampai halaman tujuan tampil.
 */
export function NavigationShell({ children }: { children: React.ReactNode }) {
  const { active, visible, value } = useNavigationProgress();

  useEffect(() => {
    // Fase capture supaya jalan sebelum <Link> mengambil alih klik
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) startNavigation();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <RouteChangeListener />
      </Suspense>
      <Progress
        value={value}
        aria-label="Memuat halaman"
        aria-hidden={!visible}
        className={cn(
          "fixed inset-x-0 top-0 z-[60] h-1 rounded-none bg-transparent transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0",
        )}
      />
      {active && <div aria-hidden className="fixed inset-0 z-50 cursor-progress" />}
      <div
        inert={active}
        aria-busy={active}
        className={cn(
          "flex flex-1 flex-col transition-opacity duration-200",
          active && "opacity-50 select-none",
        )}
      >
        {children}
      </div>
    </>
  );
}
