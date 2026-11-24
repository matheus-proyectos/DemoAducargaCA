import Link from "next/link";
import { UserPlus, X } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { getStatuses, statusIndex } from "@/lib/services/packages";
import { Card, Flash, PageHeader, sp } from "@/components/ui";

export default async function AdminCustomers({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  const db = getDb();
  const [customers, pkgs, profiles, statuses] = await Promise.all([db.table("customers").all(), db.table("packages").all(), db.table("profiles").all(), getStatuses()]);
  const idx = statusIndex(statuses);
  const withAccount = new Set(profiles.map((p) => p.customer_id).filter(Boolean));
  const q = sp(searchParams, "q").trim().toLowerCase();
  const list = customers
    .filter((c) => !q || [c.full_name, c.email, c.locker_code, c.document_id, c.phone, c.city].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${customers.length} clientes registrados`} actions={<Link href="/admin/clientes/nuevo" className="btn-primary"><UserPlus className="h-4 w-4" /> Registrar cliente</Link>} />
      <Flash searchParams={searchParams} />
      <form className="mb-5 flex gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Nombre, correo, casillero, cédula…" className="input max-w-md" aria-label="Buscar clientes" />
        <button className="btn-brand">Buscar</button>
        {q && <Link href="/admin/clientes" className="btn-ghost px-3" aria-label="Limpiar"><X className="h-4 w-4" /></Link>}
      </form>
      <Card className="table-wrap">
        <table className="table">
          <thead><tr><th>Cliente</th><th>Casillero</th><th>Contacto</th><th>Ciudad</th><th>Paquetes</th><th>Acceso web</th><th>Alta</th></tr></thead>
          <tbody>
            {list.map((c) => {
              const mine = pkgs.filter((p) => p.customer_id === c.id);
              const active = mine.filter((p) => idx.get(p.status_code)?.phase !== "entregado").length;
              return (
                <tr key={c.id}>
                  <td><Link href={`/admin/clientes/${c.id}`} className="font-semibold text-brand hover:underline">{c.full_name}</Link>{c.is_demo && <span className="ml-2 rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">DEMO</span>}</td>
                  <td className="font-mono text-xs">{c.locker_code}</td>
                  <td><p>{c.email}</p><p className="text-xs text-slate-400">{c.phone}</p></td>
                  <td>{c.city}</td>
                  <td>{mine.length} <span className="text-xs text-slate-400">({active} activos)</span></td>
                  <td>{withAccount.has(c.id) ? <span className="text-xs font-semibold text-emerald-700">Activo</span> : <span className="text-xs text-slate-400">Sin cuenta</span>}</td>
                  <td className="whitespace-nowrap text-slate-500">{fmtDate(c.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
