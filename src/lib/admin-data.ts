import "server-only";
import type { UserOption } from "@/components/user-select";
import { imageUrl } from "./images";
import { db, must } from "./supabase";

/** Semua pengguna (termasuk yang nonaktif, tanpa akun Admin) untuk pilihan pemesan di admin. */
export async function getUserOptions(): Promise<UserOption[]> {
  return (await getAllUserOptions()).filter((user) => !user.isAdmin);
}

/** Pilihan pembuka titipan: akun Admin (paling atas) lalu semua pengguna. */
export async function getHostOptions(): Promise<UserOption[]> {
  return (await getAllUserOptions()).sort((a, b) => Number(Boolean(b.isAdmin)) - Number(Boolean(a.isAdmin)));
}

async function getAllUserOptions(): Promise<UserOption[]> {
  const users = must(
    await db()
      .from("User")
      .select("id, name, isActive, isAdmin, avatar:Image!User_avatarId_fkey(path)")
      .order("name"),
  );
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    isActive: user.isActive,
    isAdmin: user.isAdmin,
    avatarUrl: imageUrl(user.avatar),
  }));
}
