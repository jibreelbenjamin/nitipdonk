"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImagesIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Pengguna", icon: UsersIcon },
  { href: "/admin/gambar", label: "Gambar", icon: ImagesIcon },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {links.map((link) => (
        <Button key={link.href} variant={pathname === link.href ? "secondary" : "ghost"} size="sm" asChild>
          <Link href={link.href}>
            <link.icon data-icon="inline-start" />
            {link.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
