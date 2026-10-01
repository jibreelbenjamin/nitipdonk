import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { PaymentForm, PinSettings, ProfileForm } from "@/components/settings-forms";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/images";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/titipan">
          <ArrowLeftIcon data-icon="inline-start" />
          Kembali
        </Link>
      </Button>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Atur profil, info pembayaran, dan PIN akunmu.</p>
      </div>
      <ProfileForm name={user.name} avatarUrl={imageUrl(user.avatar)} />
      <PaymentForm paymentInfo={user.paymentInfo ?? undefined} qrUrl={imageUrl(user.paymentQr)} />
      <PinSettings hasPin={Boolean(user.pinHash)} />
    </div>
  );
}
