"use client";

import { useState } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { addTripImages, deleteTripImage } from "@/actions/trips";
import { useActionRunner, useFormAction } from "@/hooks/use-action-feedback";
import { MAX_TRIP_IMAGES } from "@/lib/constants";
import { ImagePreview } from "@/components/image-preview";
import { MultiImageInput } from "@/components/multi-image-input";
import { SubmitButton } from "@/components/submit-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

export type TripImage = { id: string; url: string; width: number; height: number };

/** Lampiran gambar titipan; pembuka titipan bisa menambah dan menghapusnya. */
export function TripImages({
  tripId,
  title,
  images,
  canEdit,
}: {
  tripId: string;
  title: string;
  images: TripImage[];
  canEdit: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((image, index) => (
        <div key={image.id} className="relative">
          <ImagePreview
            src={image.url}
            alt={`Lampiran ${index + 1} ${title}`}
            title={title}
            description={images.length > 1 ? `Gambar ${index + 1} dari ${images.length}` : undefined}
            width={image.width}
            height={image.height}
            className="size-20"
          />
          {canEdit && <DeleteTripImageButton imageId={image.id} />}
        </div>
      ))}
      {canEdit && images.length < MAX_TRIP_IMAGES && (
        <AddTripImagesDialog tripId={tripId} remaining={MAX_TRIP_IMAGES - images.length} />
      )}
    </div>
  );
}

function AddTripImagesDialog({ tripId, remaining }: { tripId: string; remaining: number }) {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { pending, onSubmit } = useFormAction(addTripImages, {
    success: "Gambar ditambahkan",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="size-20 flex-col gap-1 text-xs leading-tight whitespace-normal">
          <ImagePlusIcon />
          Tambah gambar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <fieldset disabled={pending} className="contents">
            <DialogHeader>
              <DialogTitle>Tambah gambar</DialogTitle>
              <DialogDescription>
                Foto menu, daftar harga, atau syarat titip. Bisa {remaining} gambar lagi.
              </DialogDescription>
            </DialogHeader>
            <input type="hidden" name="tripId" value={tripId} />
            <MultiImageInput id="trip-add-images" name="images" max={remaining} onProcessingChange={setProcessing} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <SubmitButton pending={pending} disabled={processing}>
                Upload
              </SubmitButton>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTripImageButton({ imageId }: { imageId: string }) {
  const [pending, run] = useActionRunner();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="icon-xs"
          variant="secondary"
          className="absolute -top-1.5 -right-1.5 rounded-full shadow-sm"
          disabled={pending}
          aria-label="Hapus gambar"
        >
          {pending ? <Spinner /> : <XIcon />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus gambar ini?</AlertDialogTitle>
          <AlertDialogDescription>Gambar dihapus permanen dari titipan ini.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => run(() => deleteTripImage(imageId), "Gambar dihapus")}>
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
