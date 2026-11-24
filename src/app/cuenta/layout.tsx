import { LogOut } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { logout } from "../actions/auth";
import { AccountNav } from "@/components/AccountNav";
import { Logo } from "@/components/Logo";
import { DemoBanner } from "@/components/SiteChrome";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { customer } = await requireClient();
  const unread = (await getDb().table("notifications").all({ customer_id: customer.id, channel: "in_app" })).filter((n) => !n.read_at).length;
  return (
    <div className="min-h-screen bg-slate-50">
      <DemoBanner />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/cuenta" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{customer.full_name}</p>
              <p className="text-xs text-slate-500">Casillero {customer.locker_code}</p>
            </div>
            <form action={logout}>
              <button className="btn-ghost h-10 px-3" aria-label="Cerrar sesión"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Salir</span></button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6"><AccountNav unread={unread} /></div>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
