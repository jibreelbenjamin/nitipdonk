"use client";

import { ErrorState } from "@/components/error-state";

// Error di halaman aplikasi; header dari (app)/layout tetap tampil
export default function AppError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center py-6">
      <ErrorState {...props} homeHref="/titipan" />
    </div>
  );
}
