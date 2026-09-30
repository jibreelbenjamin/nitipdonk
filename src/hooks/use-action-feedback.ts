"use client";

import { startTransition, useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";

type Result = { ok: true; message?: string } | { ok: false; error: string };

type FeedbackOptions<S> = { success?: string | ((state: S) => string); onSuccess?: (state: S) => void };

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
  const [state, dispatch, pending] = useActionState(action, null);
  useActionFeedback(state, options);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Form di dalam Dialog (portal) tetap menjalar ke form induk di pohon React
    event.stopPropagation();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  function submit(formData: FormData) {
    startTransition(() => dispatch(formData));
  }

  return { state, pending, onSubmit, submit };
}

/** Jalankan server action dari tombol biasa (bukan form) dengan status pending + toast. */
export function useActionRunner() {
  const [pending, startActionTransition] = useTransition();

  function run(action: () => Promise<Result>, success?: string, onSuccess?: () => void) {
    startActionTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (success) toast.success(success);
      onSuccess?.();
    });
  }

  return [pending, run] as const;
}
