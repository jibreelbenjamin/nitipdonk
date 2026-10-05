import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldIcon, UsersIcon } from "lucide-react";
import { InstallAppAlert } from "@/components/install-app-alert";
import { InstallAppButton } from "@/components/install-app-button";
import { Logo } from "@/components/logo";
import { ProfilePicker } from "@/components/profile-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { imageUrl } from "@/lib/images";
import { getCurrentUser } from "@/lib/session";
import { db, must } from "@/lib/supabase";

export default async function HomePage() {
  if (await getCurrentUser()) redirect("/titipan");

  // Akun nonaktif ikut tampil (abu-abu, di bagian akhir) kecuali admin menyembunyikannya
  const users = must(
    await db()
      .from("User")
      .select("id, name, pinHash, isActive, avatar:Image!User_avatarId_fkey(path)")
      .eq("isAdmin", false)
      .or("isActive.eq.true,showWhenInactive.eq.true")
      .order("isActive", { ascending: false })
      .order("name"),
  );
  const profiles = users.map((user) => ({
    id: user.id,
    name: user.name,
    avatarUrl: imageUrl(user.avatar),
    hasPin: Boolean(user.pinHash),
    isActive: user.isActive,
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-4 py-12">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <InstallAppButton />
        <ThemeToggle />
      </div>
      <InstallAppAlert />
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo />
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Siapa yang lagi pakai?
        </h1>
        <p className="text-sm text-muted-foreground">Pilih akunmu untuk lihat titipan yang lagi buka.</p>
      </div>

      {profiles.length > 0 ? (
        <ProfilePicker profiles={profiles} />
      ) : (
        <Empty className="flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>Belum ada akun</EmptyTitle>
            <EmptyDescription>Minta admin menambahkan akun lewat dashboard admin.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin">
          <ShieldIcon data-icon="inline-start" />
          Admin
        </Link>
      </Button>
    </main>
  );
}
