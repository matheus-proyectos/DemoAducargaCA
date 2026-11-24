import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb, isDemoMode } from "@/lib/db";
import { logout } from "../actions/auth";
import { AdminNav } from "@/components/AdminNav";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const inbox = (await getDb().table("messages").all({ status: "nuevo" })).length;
  return (
    <div className="min-h-screen bg-slate-100/70 lg:flex">
      <aside className="sticky top-0 z-30 bg-brand-dark lg:h-screen lg:w-64 lg:shrink-0">
        <div className="flex h-16 items-center justify-between px-4 lg:px-5">
          <Logo light href="/admin" />
          <form action={logout} className="lg:hidden"><button className="text-white/70 hover:text-white" aria-label="Cerrar sesión"><LogOut className="h-5 w-5" /></button></form>
        </div>
        <div className="px-3 pb-3 lg:px-3 lg:pt-4"><AdminNav isAdmin={profile.role === "admin"} inbox={inbox} /></div>
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-white/10 p-4 lg:block">
          <p className="truncate text-sm font-semibold text-white">{profile.full_name}</p>
          <p className="truncate text-xs text-white/50">{profile.email} · {profile.role === "admin" ? "Administrador" : "Operador"}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white"><ExternalLink className="h-3.5 w-3.5" /> Sitio</Link>
            <form action={logout}><button className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white"><LogOut className="h-3.5 w-3.5" /> Salir</button></form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {isDemoMode() && <div className="bg-accent px-4 py-1.5 text-center text-xs font-semibold text-brand-dark">Modo demostración · datos ficticios guardados localmente</div>}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
