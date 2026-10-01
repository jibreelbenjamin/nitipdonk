import Link from "next/link";
import { InstallAppAlert } from "@/components/install-app-alert";
import { InstallAppButton } from "@/components/install-app-button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { imageUrl } from "@/lib/images";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
          <Link href="/titipan" className="rounded-lg">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <InstallAppButton />
            <ThemeToggle />
            <UserMenu name={user.name} avatarUrl={imageUrl(user.avatar)} />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <InstallAppAlert className="mb-6" />
        {children}
      </main>
    </>
  );
}
