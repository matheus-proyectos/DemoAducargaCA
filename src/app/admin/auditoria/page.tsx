import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { Card, PageHeader, sp } from "@/components/ui";

export default async function AuditPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireAdmin();
  const q = sp(searchParams, "q").toLowerCase();
  const logs = (await getDb().table("audit_logs").all())
    .filter((l) => !q || `${l.action} ${l.actor_email} ${JSON.stringify(l.details)}`.toLowerCase().includes(q))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 300);
  const link = (entity: string, id: string) => (entity === "package" ? `/admin/paquetes/${id}` : entity === "customer" ? `/admin/clientes/${id}` : entity === "shipment" ? `/admin/embarques/${id}` : null);
  return (
    <div>
      <PageHeader title="Historial de auditoría" subtitle="Registro inmutable de quién hizo qué y cuándo (últimos 300 eventos)." />
      <form className="mb-5 flex gap-2" method="get">
        <input name="q" defaultValue={q} className="input max-w-md" placeholder="Filtrar por acción, usuario, tracking…" aria-label="Filtrar" />
        <button className="btn-brand">Filtrar</button>
      </form>
      <Card className="table-wrap">
        <table className="table">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead>
          <tbody>
            {logs.map((l) => {
              const href = link(l.entity, l.entity_id);
              return (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-slate-500">{fmtDateTime(l.created_at)}</td>
                  <td className="text-xs">{l.actor_email}</td>
                  <td className="font-mono text-xs">{l.action}</td>
                  <td className="text-xs">{href ? <Link className="text-brand hover:underline" href={href}>{l.entity}</Link> : l.entity}</td>
                  <td className="max-w-md truncate font-mono text-[11px] text-slate-500" title={JSON.stringify(l.details)}>{JSON.stringify(l.details)}</td>
                </tr>
              );
            })}
            {!logs.length && <tr><td colSpan={5} className="text-slate-500">Sin eventos.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
