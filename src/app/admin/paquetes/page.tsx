import Link from "next/link";
import { PackagePlus, PackageSearch, X } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDate, fmtKg } from "@/lib/format";
import { PHASES } from "@/lib/statuses";
import { getStatuses, statusIndex } from "@/lib/services/packages";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, EmptyState, Flash, PageHeader, sp } from "@/components/ui";

const PAGE = 25;

export default async function AdminPackages({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  const db = getDb();
  const [pkgs, customers, statuses, shipments] = await Promise.all([db.table("packages").all(), db.table("customers").all(), getStatuses(), db.table("shipments").all()]);
  const idx = statusIndex(statuses);
  const cust = new Map(customers.map((c) => [c.id, c]));
  const ship = new Map(shipments.map((s) => [s.id, s]));

  const f = { q: sp(searchParams, "q").trim(), customer: sp(searchParams, "customer"), status: sp(searchParams, "status"), phase: sp(searchParams, "phase"), from: sp(searchParams, "from"), to: sp(searchParams, "to") };
  const q = f.q.toUpperCase();
  const list = pkgs
    .filter((p) => !q || p.tracking.includes(q) || p.carrier_tracking.toUpperCase().includes(q) || p.description.toUpperCase().includes(q) || (cust.get(p.customer_id)?.full_name.toUpperCase().includes(q) ?? false))
    .filter((p) => !f.customer || p.customer_id === f.customer)
    .filter((p) => !f.status || p.status_code === f.status)
    .filter((p) => !f.phase || idx.get(p.status_code)?.phase === f.phase)
    .filter((p) => !f.from || p.created_at >= new Date(`${f.from}T00:00:00-04:00`).toISOString())
    .filter((p) => !f.to || p.created_at <= new Date(`${f.to}T23:59:59-04:00`).toISOString())
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const page = Math.max(1, Number(sp(searchParams, "page")) || 1);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const rows = list.slice((page - 1) * PAGE, page * PAGE);
  const filtered = Object.values(f).some(Boolean);
  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
    u.set("page", String(p));
    return `/admin/paquetes?${u}`;
  };

  return (
    <div>
      <PageHeader title="Paquetes" subtitle={`${list.length} de ${pkgs.length} paquetes`} actions={<Link href="/admin/paquetes/nuevo" className="btn-primary"><PackagePlus className="h-4 w-4" /> Registrar paquete</Link>} />
      <Flash searchParams={searchParams} />
      <Card className="mb-5 p-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" method="get">
          <input name="q" defaultValue={f.q} placeholder="Tracking, cliente, contenido…" className="input lg:col-span-2" aria-label="Buscar" />
          <select name="customer" defaultValue={f.customer} className="input" aria-label="Cliente">
            <option value="">Todos los clientes</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <select name="status" defaultValue={f.status} className="input" aria-label="Estado">
            <option value="">Todos los estados</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="phase" defaultValue={f.phase} className="input" aria-label="Fase">
            <option value="">Todas las fases</option>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <div className="flex gap-2 lg:col-span-1">
            <button className="btn-brand flex-1">Filtrar</button>
            {filtered && <Link href="/admin/paquetes" className="btn-ghost px-3" aria-label="Limpiar filtros"><X className="h-4 w-4" /></Link>}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-500 lg:col-span-3">Registrado desde <input type="date" name="from" defaultValue={f.from} className="input w-auto flex-1" /></label>
          <label className="flex items-center gap-2 text-sm text-slate-500 lg:col-span-3">hasta <input type="date" name="to" defaultValue={f.to} className="input w-auto flex-1" /></label>
        </form>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={<PackageSearch className="h-6 w-6" />} title="Sin resultados" text="Ajusta los filtros o registra un nuevo paquete." />
      ) : (
        <Card className="table-wrap">
          <table className="table">
            <thead><tr><th>Tracking</th><th>Cliente</th><th>Estado</th><th>Peso</th><th>Destino</th><th>Embarque</th><th>Registrado</th></tr></thead>
            <tbody>
              {rows.map((p) => {
                const c = cust.get(p.customer_id);
                return (
                  <tr key={p.id}>
                    <td><Link href={`/admin/paquetes/${p.id}`} className="font-mono font-semibold text-brand hover:underline">{p.tracking}</Link>{p.is_demo && <span className="ml-2 rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">DEMO</span>}</td>
                    <td><Link href={`/admin/clientes/${p.customer_id}`} className="hover:text-brand">{c?.full_name ?? "—"}</Link><p className="text-xs text-slate-400">{c?.locker_code}</p></td>
                    <td><StatusBadge status={idx.get(p.status_code)} code={p.status_code} /></td>
                    <td className="whitespace-nowrap">{p.weight_kg ? fmtKg(p.weight_kg) : "—"}</td>
                    <td>{p.destination_city}</td>
                    <td className="whitespace-nowrap">{p.shipment_id ? <Link className="font-mono text-xs hover:text-brand" href={`/admin/embarques/${p.shipment_id}`}>{ship.get(p.shipment_id)?.code}</Link> : <span className="text-slate-400">—</span>}</td>
                    <td className="whitespace-nowrap text-slate-500">{fmtDate(p.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Página {page} de {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link className="btn-ghost" href={qs(page - 1)}>Anterior</Link>}
            {page < pages && <Link className="btn-ghost" href={qs(page + 1)}>Siguiente</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
