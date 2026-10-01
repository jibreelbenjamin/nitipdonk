"use client";

import { ErrorState } from "@/components/error-state";
import { Logo } from "@/components/logo";

// Error di halaman mana pun (termasuk admin) yang tidak tertangkap error.tsx yang lebih dalam
export default function RootError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo />
      <ErrorState {...props} />
    </main>
  );
}
