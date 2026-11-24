import Link from "next/link";
import { ArrowRight, Boxes, Building2, CheckCircle2, Globe2, Package, PackagePlus, Truck, Users, Warehouse } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDateTime, timeAgo } from "@/lib/format";
import { getStatuses, statusIndex } from "@/lib/services/packages";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, Flash, PageHeader } from "@/components/ui";

export default async function AdminDashboard({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const profile = await requireStaff();
  const db = getDb();
  const [pkgs, customers, statuses, movements, shipments] = await Promise.all([
    db.table("packages").all(), db.table("customers").all(), getStatuses(), db.table("movements").all(), db.table("shipments").all(),
  ]);
  const idx = statusIndex(statuses);
  const ph = (code: string) => idx.get(code)?.phase;
  const count = (f: (p: (typeof pkgs)[number]) => boolean) => pkgs.filter(f).length;
  const pendingDispatch = pkgs.filter((p) => ph(p.status_code) === "origen");

  const stats = [
    { label: "Paquetes registrados", value: pkgs.length, icon: Package, href: "/admin/paquetes" },
    { label: "Recibidos en casillero", value: count((p) => !!p.received_at), icon: Warehouse, href: "/admin/paquetes" },
    { label: "Pendientes de despacho", value: pendingDispatch.length, icon: Boxes, href: "/admin/paquetes?phase=origen", accent: true },
    { label: "En tránsito internacional", value: count((p) => ph(p.status_code) === "transito"), icon: Globe2, href: "/admin/paquetes?phase=transito" },
    { label: "En Venezuela", value: count((p) => ph(p.status_code) === "venezuela"), icon: Building2, href: "/admin/paquetes?phase=venezuela" },
    { label: "En distribución", value: count((p) => ph(p.status_code) === "distribucion"), icon: Truck, href: "/admin/paquetes?phase=distribucion" },
    { label: "Entregados", value: count((p) => ph(p.status_code) === "entregado"), icon: CheckCircle2, href: "/admin/paquetes?phase=entregado" },
    { label: "Clientes registrados", value: customers.length, icon: Users, href: "/admin/clientes" },
  ];
  const pkgById = new Map(pkgs.map((p) => [p.id, p]));
  const recent = [...movements].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8);
  const openShipments = shipments.filter((s) => !s.status_code || idx.get(s.status_code)?.phase !== "entregado").sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div>
      <PageHeader
        title={`Hola, ${profile.full_name.split(" ")[0]}`}
        subtitle="Resumen operativo de la mercancía ADUCARGA"
        actions={<Link href="/admin/paquetes/nuevo" className="btn-primary"><PackagePlus className="h-4 w-4" /> Registrar paquete</Link>}
      />
      <Flash searchParams={searchParams} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`card p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${s.accent ? "border-accent/50 bg-accent/[.06]" : ""}`}>
            <div className="flex items-center justify-between">
              <s.icon className={`h-5 w-5 ${s.accent ? "text-accent-dark" : "text-brand"}`} />
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{s.value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Últimos movimientos</h2>
            <Link href="/admin/auditoria" className="text-sm font-semibold text-brand hover:underline">Ver historial</Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recent.map((m) => {
              const p = pkgById.get(m.package_id);
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Link href={p ? `/admin/paquetes/${p.id}` : "#"} className="font-mono text-sm font-semibold text-brand hover:underline">{p?.tracking}</Link>
                  <StatusBadge status={idx.get(m.status_code)} code={m.status_code} />
                  <span className="ml-auto text-xs text-slate-400" title={fmtDateTime(m.created_at)}>{timeAgo(m.created_at)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Pendientes de despacho</h2>
              <Link href="/admin/embarques" className="text-sm font-semibold text-brand hover:underline">Embarques</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {pendingDispatch.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link href={`/admin/paquetes/${p.id}`} className="font-mono font-semibold text-brand hover:underline">{p.tracking}</Link>
                  <span className="text-slate-500">{p.weight_kg} kg · {p.shipment_id ? "Asignado" : "Sin embarque"}</span>
                </li>
              ))}
              {!pendingDispatch.length && <li className="px-5 py-4 text-sm text-slate-500">No hay mercancía pendiente.</li>}
            </ul>
          </Card>
          <Card>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Embarques abiertos</h2></div>
            <ul className="divide-y divide-slate-100">
              {openShipments.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link href={`/admin/embarques/${s.id}`} className="font-mono font-semibold text-brand hover:underline">{s.code}</Link>
                  <span className="text-slate-500">{s.mode === "aereo" ? "Aéreo" : "Marítimo"} · {s.status_code ? idx.get(s.status_code)?.name : "Consolidando"}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
