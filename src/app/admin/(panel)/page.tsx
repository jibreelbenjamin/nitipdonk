import { type AdminUserRow, AdminUsersTable } from "@/components/admin/users-table";
import { imageUrl } from "@/lib/images";
import { requireAdmin } from "@/lib/session";
import { db, must } from "@/lib/supabase";

export default async function AdminUsersPage() {
  // Cek di halaman juga: layout tidak dirender ulang saat pindah halaman, jadi tidak cukup sendirian
  await requireAdmin();
  const users = must(
    await db()
      .from("User")
      .select(
        "id, name, pinHash, isActive, showWhenInactive, createdAt, avatar:Image!User_avatarId_fkey(path), trips:Trip(count), orders:Order(count)",
      )
      .order("name"),
  );
  const rows: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    avatarUrl: imageUrl(user.avatar),
    isActive: user.isActive,
    showWhenInactive: user.showWhenInactive,
    hasPin: Boolean(user.pinHash),
    tripCount: user.trips[0]?.count ?? 0,
    orderCount: user.orders[0]?.count ?? 0,
    createdAt: user.createdAt,
  }));
  const inactive = rows.filter((user) => !user.isActive).length;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} akun terdaftar{inactive > 0 && `, ${inactive} nonaktif`}. Akun nonaktif tampil abu-abu di
          halaman pilih akun, kecuali disembunyikan.
        </p>
      </div>
      <AdminUsersTable users={rows} />
    </>
  );
}
