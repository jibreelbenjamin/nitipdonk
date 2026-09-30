"use client";

import { PlusIcon } from "lucide-react";
import { createTrip } from "@/actions/trips";
import { useFormAction } from "@/hooks/use-action-feedback";
import { MAX_CLOSE_MINUTES } from "@/lib/constants";
import { SubmitButton } from "@/components/submit-button";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";

export function CreateTripDialog() {
  const { pending, onSubmit } = useFormAction(createTrip);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Buka titipan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Buka titipan</DialogTitle>
            <DialogDescription>
              Mau jalan beli sesuatu? Kabari yang lain biar bisa sekalian titip.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="trip-title">Beli di mana / apa?</FieldLabel>
              <Input id="trip-title" name="title" placeholder="Mixue depan kantor" maxLength={80} required autoFocus />
            </Field>
            <Field>
              <FieldLabel htmlFor="trip-note">Catatan</FieldLabel>
              <Textarea
                id="trip-note"
                name="note"
                placeholder="Jalan jam 12 ya, maksimal 2 item per orang"
                maxLength={300}
                rows={3}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="trip-closes-in">Tutup dalam</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="trip-closes-in"
                  name="closesInMinutes"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_CLOSE_MINUTES}
                  placeholder="30"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>menit</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>Opsional. Setelah itu orang tidak bisa titip lagi.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </DialogClose>
            <SubmitButton pending={pending}>Buka titipan</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
