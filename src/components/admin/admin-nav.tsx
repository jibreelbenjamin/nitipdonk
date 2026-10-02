"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImagesIcon, ShoppingBagIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Pengguna", icon: UsersIcon },
  { href: "/admin/titipan", label: "Titipan", icon: ShoppingBagIcon },
  { href: "/admin/gambar", label: "Gambar", icon: ImagesIcon },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {links.map((link) => {
        // Halaman di bawahnya (mis. /admin/titipan/abc) ikut menandai menu induknya
        const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`));
        return (
          <Button key={link.href} variant={active ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={link.href}>
              <link.icon data-icon="inline-start" />
              {link.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
