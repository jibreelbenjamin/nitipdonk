"use client";

import { ErrorState } from "@/components/error-state";
import { Logo } from "@/components/logo";
import "./globals.css";

// Error di root layout: menggantikan seluruh dokumen, jadi html/body dan CSS dipasang sendiri
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <title>Error – NitipDonk</title>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
          <Logo />
          <ErrorState {...props} />
        </main>
      </body>
    </html>
  );
}
