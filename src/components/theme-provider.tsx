"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { THEME_COLORS } from "@/lib/theme";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
      <ThemeColorSync />
    </NextThemesProvider>
  );
}

/**
 * Bawaannya warna bilah status/browser hanya mengikuti mode perangkat. Samakan dengan tema yang
 * sedang dipakai, supaya tetap serasi saat tema dipilih manual berbeda dari perangkat.
 */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", THEME_COLORS[resolvedTheme]);
    }
  }, [resolvedTheme]);
  return null;
}
