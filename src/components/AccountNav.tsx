"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Headset, LayoutDashboard, PackagePlus, UserRound } from "lucide-react";
import { cx } from "./ui";

const ITEMS = [
  { href: "/cuenta", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/cuenta/prealerta", label: "Prealertar compra", icon: PackagePlus },
  { href: "/cuenta/notificaciones", label: "Notificaciones", icon: Bell, badge: true },
  { href: "/cuenta/perfil", label: "Mi perfil", icon: UserRound },
  { href: "/cuenta/soporte", label: "Soporte", icon: Headset },
];

export function AccountNav({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Panel del cliente">
      {ITEMS.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cx(
              "relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
              active ? "bg-brand text-white" : "text-slate-600 hover:bg-white hover:text-brand",
            )}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
            {it.badge && unread > 0 && (
              <span className="ml-0.5 rounded-full bg-accent px-1.5 text-[11px] font-bold text-brand-dark">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
