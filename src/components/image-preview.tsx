"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { ZoomableImage } from "@/components/zoomable-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Thumbnail yang bisa diklik untuk melihat gambar ukuran penuh, bisa diperbesar. */
export function ImagePreview({
  src,
  alt,
  title,
  description,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  title: string;
  description?: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("relative h-auto overflow-hidden p-0", className)}
          aria-label={`Lihat ${alt}`}
        >
          {/* `fill` → gambar absolut, jadi ukuran kotak hanya ditentukan className */}
          <Image src={src} alt={alt} fill unoptimized className="object-cover" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ZoomableImage src={src} alt={alt} width={width} height={height} />
      </DialogContent>
    </Dialog>
  );
}
