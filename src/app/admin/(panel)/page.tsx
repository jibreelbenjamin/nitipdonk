import { UsersIcon } from "lucide-react";
import { CreateUserDialog, PinToggle, UserRowActions } from "@/components/admin/user-dialogs";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { imageUrl } from "@/lib/images";
import { db, must } from "@/lib/supabase";

export default async function AdminUsersPage() {
  const users = must(
    await db()
      .from("User")
      .select("id, name, pinHash, createdAt, avatar:Image!User_avatarId_fkey(path), trips:Trip(count), orders:Order(count)")
      .order("name"),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengguna</CardTitle>
        <CardDescription>{users.length} akun terdaftar</CardDescription>
        <CardAction>
          <CreateUserDialog />
        </CardAction>
      </CardHeader>
      <CardContent className={users.length > 0 ? "px-0" : undefined}>
        {users.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada pengguna</EmptyTitle>
              <EmptyDescription>Tambahkan akun untuk teman-teman kantormu.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Nama</TableHead>
                <TableHead>PIN</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Titipan dibuka</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Pesanan</TableHead>
                <TableHead className="hidden md:table-cell">Dibuat</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={user.name} src={imageUrl(user.avatar)} />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PinToggle user={{ id: user.id, name: user.name, hasPin: Boolean(user.pinHash) }} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{user.trips[0]?.count ?? 0}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{user.orders[0]?.count ?? 0}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDateTime(user.createdAt)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <UserRowActions user={{ id: user.id, name: user.name }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
