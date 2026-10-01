"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const STEP = 1.5;
const DOUBLE_TAP_MS = 300;

type View = { scale: number; x: number; y: number };
type Point = { x: number; y: number };

const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const middle = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Gambar yang bisa diperbesar. HP: cubit dua jari, geser satu jari, ketuk dua kali.
 * Komputer: scroll / trackpad, klik dua kali, seret, atau tombol − / +.
 */
export function ZoomableImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const view = useRef<View>({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const moved = useRef(false);
  const lastPointerType = useRef("mouse");
  const lastTap = useRef({ time: 0, x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  /** Terapkan zoom & geser; gambar tidak boleh digeser keluar dari bingkai. */
  function apply(next: View) {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;
    const nextScale = clampScale(next.scale);
    const maxX = Math.max(0, (image.offsetWidth * nextScale - frame.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * nextScale - frame.clientHeight) / 2);
    view.current = {
      scale: nextScale,
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
    image.style.transform = `translate(${view.current.x}px, ${view.current.y}px) scale(${nextScale})`;
    setScale(nextScale);
  }

  /** Posisi layar → koordinat relatif terhadap tengah bingkai (titik asal transform). */
  function fromCenter(clientX: number, clientY: number): Point {
    const rect = frameRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  }

  /** Ubah skala dengan titik `focus` tetap di tempatnya (seperti zoom di aplikasi galeri). */
  function zoomAt(nextScale: number, focus: Point = { x: 0, y: 0 }, pan: Point = { x: 0, y: 0 }) {
    const { scale: current, x, y } = view.current;
    const ratio = clampScale(nextScale) / current;
    apply({
      scale: current * ratio,
      x: focus.x - (focus.x - x) * ratio + pan.x,
      y: focus.y - (focus.y - y) * ratio + pan.y,
    });
  }

  function toggleAt(clientX: number, clientY: number) {
    if (view.current.scale > 1) apply({ scale: 1, x: 0, y: 0 });
    else zoomAt(2.5, fromCenter(clientX, clientY));
  }

  // Scroll / pinch trackpad. Harus listener non-passive supaya halaman tidak ikut ter-scroll.
  const onWheel = useEffectEvent((event: WheelEvent) => {
    event.preventDefault();
    zoomAt(view.current.scale * Math.exp(-event.deltaY * 0.002), fromCenter(event.clientX, event.clientY));
  });
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const listener = (event: WheelEvent) => onWheel(event);
    frame.addEventListener("wheel", listener, { passive: false });
    return () => frame.removeEventListener("wheel", listener);
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPointerType.current = event.pointerType;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    moved.current = false;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const current = { x: event.clientX, y: event.clientY };
    if (distance(previous, current) > 3) moved.current = true;

    if (pointers.current.size === 2) {
      // Cubit: skala mengikuti jarak dua jari, posisi mengikuti titik tengahnya
      const other = [...pointers.current].find(([id]) => id !== event.pointerId)![1];
      const before = middle(previous, other);
      const after = middle(current, other);
      zoomAt(view.current.scale * (distance(current, other) / distance(previous, other)), fromCenter(after.x, after.y), {
        x: after.x - before.x,
        y: after.y - before.y,
      });
    } else if (pointers.current.size === 1 && view.current.scale > 1) {
      apply({ ...view.current, x: view.current.x + current.x - previous.x, y: view.current.y + current.y - previous.y });
    }
    pointers.current.set(event.pointerId, current);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    // Ketuk dua kali di layar sentuh (klik dua kali mouse ditangani onDoubleClick)
    if (event.pointerType === "mouse" || moved.current || pointers.current.size > 0) return;
    const now = Date.now();
    const tap = lastTap.current;
    if (now - tap.time < DOUBLE_TAP_MS && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 30) {
      toggleAt(event.clientX, event.clientY);
      lastTap.current = { time: 0, x: 0, y: 0 };
    } else {
      lastTap.current = { time: now, x: event.clientX, y: event.clientY };
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frameRef}
        className={cn(
          "relative flex h-[60vh] touch-none items-center justify-center overflow-hidden rounded-lg bg-muted/40 select-none",
          scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={(event) => pointers.current.delete(event.pointerId)}
        onDoubleClick={(event) => {
          // Browser juga mengirim dblclick untuk ketuk dua kali; layar sentuh sudah ditangani di atas
          if (lastPointerType.current === "mouse") toggleAt(event.clientX, event.clientY);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- transform diatur langsung, tanpa optimasi */}
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          draggable={false}
          className="h-auto max-h-full w-auto max-w-full origin-center will-change-transform"
        />
      </div>
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Perkecil"
          disabled={scale <= MIN_SCALE}
          onClick={() => zoomAt(scale / STEP)}
        >
          <MinusIcon />
        </Button>
        <span className="w-14 text-center text-sm tabular-nums">{Math.round(scale * 100)}%</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Perbesar"
          disabled={scale >= MAX_SCALE}
          onClick={() => zoomAt(scale * STEP)}
        >
          <PlusIcon />
        </Button>
        <Button variant="ghost" size="sm" disabled={scale === 1} onClick={() => apply({ scale: 1, x: 0, y: 0 })}>
          <RotateCcwIcon data-icon="inline-start" />
          Reset
        </Button>
      </div>
    </div>
  );
}
