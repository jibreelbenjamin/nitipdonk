import Link from "next/link";
import { ExternalLinkIcon, LogOutIcon } from "lucide-react";
import { adminLogout } from "@/actions/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <Logo />
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild aria-label="Buka aplikasi">
              <Link href="/">
                <ExternalLinkIcon />
              </Link>
            </Button>
            <form action={adminLogout}>
              <Button variant="ghost" size="icon" aria-label="Keluar admin">
                <LogOutIcon />
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto w-full max-w-4xl px-4 pb-2">
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">{children}</main>
    </>
  );
}
