"use client";

import Image from "next/image";
import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Thumbnail yang bisa diklik untuk melihat gambar ukuran penuh. */
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          className="max-h-[70vh] w-full rounded-lg object-contain"
        />
        <DialogFooter>
          <Button variant="outline" asChild>
            <a href={src} target="_blank" rel="noreferrer">
              <ExternalLinkIcon data-icon="inline-start" />
              Buka di tab baru
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
