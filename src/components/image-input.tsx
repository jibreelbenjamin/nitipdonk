"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { shrinkImage } from "@/lib/client-image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/**
 * Input file gambar dengan pratinjau. Foto dikecilkan dulu di browser, lalu
 * file hasilnya menggantikan isi input sehingga tetap terkirim lewat FormData.
 */
export function ImageInput({
  id,
  name,
  currentUrl,
  removeName,
  shape = "rounded",
  onProcessingChange,
}: {
  id: string;
  name: string;
  currentUrl?: string;
  /** Nama field hidden yang bernilai "1" kalau pengguna menghapus gambar lama. */
  removeName?: string;
  shape?: "circle" | "rounded";
  onProcessingChange?: (processing: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [removed, setRemoved] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setProcessing(true);
    onProcessingChange?.(true);
    const shrunk = await shrinkImage(file);
    if (shrunk !== file) {
      const transfer = new DataTransfer();
      transfer.items.add(shrunk);
      input.files = transfer.files;
    }
    setPreview(URL.createObjectURL(shrunk));
    setRemoved(false);
    setProcessing(false);
    onProcessingChange?.(false);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(undefined);
    setRemoved(Boolean(currentUrl));
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative flex size-16 shrink-0 items-center justify-center overflow-hidden bg-muted",
          shape === "circle" ? "rounded-full" : "rounded-lg",
        )}
      >
        {processing ? (
          <Spinner />
        ) : (
          preview && (
            <Image src={preview} alt="Pratinjau" fill unoptimized className="object-cover" />
          )
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="min-w-0"
        />
        {preview && (
          <Button type="button" variant="ghost" size="icon" onClick={clear} aria-label="Hapus gambar">
            <XIcon />
          </Button>
        )}
      </div>
      {removeName && removed && <input type="hidden" name={removeName} value="1" />}
    </div>
  );
}
