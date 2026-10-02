import "server-only";
import type { UserOption } from "@/components/user-select";
import { imageUrl } from "./images";
import { db, must } from "./supabase";

/** Semua pengguna (termasuk yang nonaktif) untuk pilihan pembuka titipan / pemesan di admin. */
export async function getUserOptions(): Promise<UserOption[]> {
  const users = must(
    await db().from("User").select("id, name, isActive, avatar:Image!User_avatarId_fkey(path)").order("name"),
  );
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    isActive: user.isActive,
    avatarUrl: imageUrl(user.avatar),
  }));
}
