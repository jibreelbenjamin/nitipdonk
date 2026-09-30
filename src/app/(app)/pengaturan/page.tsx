import { PaymentForm, PinSettings, ProfileForm } from "@/components/settings-forms";
import { imageUrl } from "@/lib/images";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-6">
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
