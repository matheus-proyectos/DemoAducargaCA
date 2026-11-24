"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Boxes, History, Inbox, LayoutDashboard, Package, Settings2, Ship, Users } from "lucide-react";
import { cx } from "./ui";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/paquetes", label: "Paquetes", icon: Package },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/embarques", label: "Embarques", icon: Ship },
  { href: "/admin/mensajes", label: "Mensajes", icon: Inbox, badge: true },
  { href: "/admin/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/admin/estados", label: "Estados", icon: Settings2, admin: true },
  { href: "/admin/auditoria", label: "Auditoría", icon: History, admin: true },
];

export function AdminNav({ isAdmin, inbox }: { isAdmin: boolean; inbox: number }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Administración">
      {ITEMS.filter((i) => !i.admin || isAdmin).map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cx(
              "inline-flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
          >
            <it.icon className={cx("h-[18px] w-[18px]", active && "text-accent")} />
            {it.label}
            {it.badge && inbox > 0 && <span className="ml-auto rounded-full bg-accent px-1.5 text-[11px] font-bold text-brand-dark">{inbox}</span>}
          </Link>
        );
      })}
      <span className="hidden"><Boxes /></span>
    </nav>
  );
}
