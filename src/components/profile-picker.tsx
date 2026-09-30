"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockIcon } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/actions/auth";
import { PIN_LENGTH } from "@/lib/constants";
import { PinInput } from "@/components/pin-input";
import { SubmitButton } from "@/components/submit-button";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

export type Profile = { id: string; name: string; avatarUrl?: string; hasPin: boolean };

export function ProfilePicker({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pinProfile, setPinProfile] = useState<Profile | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function enter(profile: Profile, pinValue?: string) {
    setPendingId(profile.id);
    setError(null);
    startTransition(async () => {
      const result = await signIn(profile.id, pinValue);
      if (result.ok) {
        router.push("/titipan");
        return;
      }
      setPendingId(null);
      if (profile.hasPin) {
        setError(result.error);
        setPin("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function choose(profile: Profile) {
    if (!profile.hasPin) return enter(profile);
    setPin("");
    setError(null);
    setPinProfile(profile);
  }

  return (
    <>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {profiles.map((profile) => (
          <Button
            key={profile.id}
            variant="ghost"
            className="h-auto flex-col gap-3 p-4"
            disabled={pending}
            onClick={() => choose(profile)}
          >
            <span className="relative">
              <UserAvatar name={profile.name} src={profile.avatarUrl} className="size-20 text-xl" />
              {pendingId === profile.id && !pinProfile && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                  <Spinner />
                </span>
              )}
            </span>
            <span className="flex max-w-full items-center gap-1">
              <span className="truncate">{profile.name}</span>
              {profile.hasPin && <LockIcon className="size-3.5 text-muted-foreground" />}
            </span>
          </Button>
        ))}
      </div>

      <Dialog open={Boolean(pinProfile)} onOpenChange={(open) => !open && setPinProfile(null)}>
        <DialogContent className="sm:max-w-sm">
          {pinProfile && (
            <form
              className="flex flex-col gap-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (pin.length === PIN_LENGTH) enter(pinProfile, pin);
              }}
            >
              <DialogHeader className="items-center text-center">
                <UserAvatar name={pinProfile.name} src={pinProfile.avatarUrl} className="mb-2 size-16" />
                <DialogTitle>Halo, {pinProfile.name}</DialogTitle>
                <DialogDescription>Masukkan PIN {PIN_LENGTH} digit untuk masuk.</DialogDescription>
              </DialogHeader>
              <Field className="items-center">
                <PinInput
                  autoFocus
                  value={pin}
                  onChange={setPin}
                  onComplete={(value: string) => enter(pinProfile, value)}
                  disabled={pending}
                  aria-invalid={Boolean(error)}
                  containerClassName="justify-center"
                />
                <FieldError className="text-center">{error}</FieldError>
              </Field>
              <DialogFooter>
                <SubmitButton pending={pending} disabled={pin.length !== PIN_LENGTH} className="w-full">
                  Masuk
                </SubmitButton>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
