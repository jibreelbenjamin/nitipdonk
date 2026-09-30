import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin, isAdminConfigured } from "@/lib/session";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="flex justify-center">
        <Logo />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-center font-bold">Dashboard admin</CardTitle>
        </CardHeader>
        <CardContent>
          {isAdminConfigured() ? (
            <AdminLoginForm />
          ) : (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Admin belum dikonfigurasi</AlertTitle>
              <AlertDescription>Isi ADMIN_PASSWORD di environment lalu restart server.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <Button variant="ghost" size="sm" asChild className="self-center">
        <Link href="/">
          <ArrowLeftIcon data-icon="inline-start" />
          Kembali ke aplikasi
        </Link>
      </Button>
    </main>
  );
}
