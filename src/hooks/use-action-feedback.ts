"use client";

import { startTransition, useActionState, useCallback, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { finishNavigation, startNavigation } from "@/lib/navigation-progress";
import { offlineSafe } from "@/lib/offline";

type Result = { ok: true; message?: string } | { ok: false; error: string };

type FeedbackOptions<S> = {
  success?: string | ((state: S) => string);
  onSuccess?: (state: S) => void;
  /** Action me-redirect saat sukses: tampilkan loading pindah halaman selama diproses. */
  navigates?: boolean;
};

/** Tampilkan toast setiap kali hasil action berubah. */
export function useActionFeedback<S extends Result>(state: S | null, options: FeedbackOptions<S> = {}) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      const { success, onSuccess } = optionsRef.current;
      if (success) toast.success(typeof success === "function" ? success(state) : success);
      onSuccess?.(state);
    } else {
      // Gagal berarti tidak jadi pindah halaman
      finishNavigation();
      toast.error(state.error);
    }
  }, [state]);
}

/**
 * Form + server action tanpa auto-reset bawaan React 19, supaya isian tidak
 * hilang kalau validasi gagal. Reset form sendiri lewat `key` di onSuccess.
 */
export function useFormAction<S extends Result>(
  action: (prev: S | null, formData: FormData) => Promise<S>,
  options: FeedbackOptions<S> = {},
) {
  // Saat offline, gagal kirim jadi pesan biasa, bukan halaman error
  const safeAction = useCallback(
    (prev: S | null, formData: FormData) => offlineSafe(action(prev, formData)) as Promise<S>,
    [action],
  );
  const [state, dispatch, pending] = useActionState(safeAction, null);
  useActionFeedback(state, options);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Form di dalam Dialog (portal) tetap menjalar ke form induk di pohon React
    event.stopPropagation();
    submit(new FormData(event.currentTarget));
  }

  function submit(formData: FormData) {
    if (options.navigates) startNavigation();
    startTransition(() => dispatch(formData));
  }

  return { state, pending, onSubmit, submit };
}

/** Jalankan server action dari tombol biasa (bukan form) dengan status pending + toast. */
export function useActionRunner() {
  const [pending, startActionTransition] = useTransition();

  function run(action: () => Promise<Result>, success?: string, onSuccess?: () => void) {
    startActionTransition(async () => {
      const result = await offlineSafe(action());
      // Action yang redirect tidak mengembalikan hasil
      if (!result) return;
      if (!result.ok) {
        finishNavigation();
        toast.error(result.error);
        return;
      }
      if (success) toast.success(success);
      onSuccess?.();
    });
  }

  return [pending, run] as const;
}
