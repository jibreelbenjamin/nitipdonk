"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CameraIcon, ImagesIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { shrinkImage } from "@/lib/client-image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Picked = { file: File; url: string };

/**
 * Pilih beberapa gambar sekaligus dari galeri, atau foto langsung pakai kamera (HP/tablet).
 * Tiap foto dikecilkan dulu di browser, lalu semuanya dimasukkan ke input tersembunyi
 * bernama `name` sehingga ikut terkirim lewat FormData.
 */
export function MultiImageInput({
  id,
  name,
  max,
  onProcessingChange,
}: {
  id: string;
  name: string;
  max: number;
  onProcessingChange?: (processing: boolean) => void;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Picked[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!fieldRef.current) return;
    const transfer = new DataTransfer();
    for (const item of items) transfer.items.add(item.file);
    fieldRef.current.files = transfer.files;
  }, [items]);

  // Bebaskan pratinjau saat komponen ditutup (mis. dialog ditutup)
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url)), []);

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = [...(event.currentTarget.files ?? [])].filter((file) => file.type.startsWith("image/"));
    event.currentTarget.value = "";
    const room = max - items.length;
    if (picked.length > room) toast.error(`Maksimal ${max} gambar`);
    const chosen = picked.slice(0, Math.max(room, 0));
    if (chosen.length === 0) return;

    setProcessing(true);
    onProcessingChange?.(true);
    const shrunk = await Promise.all(chosen.map((file) => shrinkImage(file)));
    setItems((current) => [...current, ...shrunk.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    setProcessing(false);
    onProcessingChange?.(false);
  }

  function remove(index: number) {
    setItems((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <div key={item.url} className="relative size-16 overflow-hidden rounded-lg bg-muted">
          <Image src={item.url} alt={`Gambar ${index + 1}`} fill unoptimized className="object-cover" />
          <Button
            type="button"
            size="icon-xs"
            variant="secondary"
            className="absolute top-0.5 right-0.5 rounded-full"
            onClick={() => remove(index)}
            aria-label={`Hapus gambar ${index + 1}`}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      {processing && (
        <div className="flex size-16 items-center justify-center rounded-lg bg-muted">
          <Spinner />
        </div>
      )}
      {items.length < max && (
        <>
          <Button
            type="button"
            variant="outline"
            className="size-16 flex-col gap-1 text-xs"
            disabled={processing}
            onClick={() => galleryRef.current?.click()}
          >
            <ImagesIcon />
            {/* Di komputer tidak ada pilihan kamera, jadi cukup "Tambah" */}
            <span className="pointer-coarse:hidden">Tambah</span>
            <span className="hidden pointer-coarse:inline">Galeri</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="hidden size-16 flex-col gap-1 text-xs pointer-coarse:inline-flex"
            disabled={processing}
            onClick={() => cameraRef.current?.click()}
          >
            <CameraIcon />
            Kamera
          </Button>
        </>
      )}
      <input
        ref={galleryRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        className="sr-only"
        onChange={handlePick}
      />
      {/* `capture` langsung membuka kamera belakang; diabaikan browser komputer */}
      <input
        ref={cameraRef}
        id={`${id}-camera`}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        className="sr-only"
        onChange={handlePick}
      />
      <input ref={fieldRef} type="file" name={name} multiple hidden tabIndex={-1} />
    </div>
  );
}
