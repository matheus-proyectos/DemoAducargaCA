import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, PackagePlus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDate, fmtDateTime, fmtKg } from "@/lib/format";
import { getStatuses, statusIndex } from "@/lib/services/packages";
import { updateCustomer } from "../../../actions/admin";
import { CustomerFields } from "@/components/admin/CustomerFields";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Flash, PageHeader } from "@/components/ui";

export default async function AdminCustomer({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  const db = getDb();
  const c = await db.table("customers").get(params.id);
  if (!c) notFound();
  const [pkgs, addresses, account, statuses, logs, notes] = await Promise.all([
    db.table("packages").all({ customer_id: c.id }), db.table("addresses").all({ customer_id: c.id }), db.table("profiles").findOne({ customer_id: c.id }),
    getStatuses(), db.table("audit_logs").all({ entity: "customer", entity_id: c.id }), db.table("notifications").all({ customer_id: c.id }),
  ]);
  const idx = statusIndex(statuses);
  pkgs.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  logs.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const totalKg = pkgs.reduce((s, p) => s + (p.weight_kg || 0), 0);

  return (
    <div>
      <Link href="/admin/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand"><ArrowLeft className="h-4 w-4" /> Clientes</Link>
      <PageHeader
        title={c.full_name}
        subtitle={<>Casillero <span className="font-mono font-semibold">{c.locker_code}</span> · {account ? `Acceso web activo (${account.email})` : "Sin cuenta web"}</>}
        actions={<Link href={`/admin/paquetes/nuevo?customer=${c.id}`} className="btn-primary"><PackagePlus className="h-4 w-4" /> Registrar paquete</Link>}
      />
      <Flash searchParams={searchParams} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[["Paquetes", pkgs.length], ["Kg totales", fmtKg(totalKg)], ["Notificaciones", notes.filter((n) => n.channel === "in_app").length]].map(([k, v]) => (
          <Card key={k as string} className="p-4"><p className="text-2xl font-extrabold text-slate-900">{v}</p><p className="text-xs text-slate-500">{k}</p></Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <h2 className="border-b border-slate-100 px-5 py-4 text-lg font-bold text-slate-900">Paquetes del cliente</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Tracking</th><th>Contenido</th><th>Estado</th><th>Actualizado</th></tr></thead>
              <tbody>
                {pkgs.map((p) => (
                  <tr key={p.id}>
                    <td><Link className="font-mono font-semibold text-brand hover:underline" href={`/admin/paquetes/${p.id}`}>{p.tracking}</Link></td>
                    <td className="max-w-[200px] truncate">{p.description}</td>
                    <td><StatusBadge status={idx.get(p.status_code)} code={p.status_code} /></td>
                    <td className="whitespace-nowrap text-slate-500">{fmtDate(p.updated_at)}</td>
                  </tr>
                ))}
                {!pkgs.length && <tr><td colSpan={4} className="text-slate-500">Sin paquetes.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Editar información</h2>
            <form action={updateCustomer} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={c.id} />
              <CustomerFields c={c} />
              <div className="sm:col-span-2"><SubmitButton className="btn-brand">Guardar</SubmitButton></div>
            </form>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Direcciones</h2>
            <ul className="space-y-2 text-sm">
              {addresses.map((a) => (
                <li key={a.id} className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span><strong>{a.label}</strong>{a.is_default && " (predeterminada)"} · {a.recipient} · {a.line1 || "—"} · {a.city}, {a.state}</span></li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="border-b border-slate-100 px-5 py-4 text-lg font-bold text-slate-900">Historial</h2>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto text-sm">
              {logs.map((l) => <li key={l.id} className="px-5 py-2.5"><p className="font-medium text-slate-800">{l.action}</p><p className="text-xs text-slate-400">{fmtDateTime(l.created_at)} · {l.actor_email}</p></li>)}
              {!logs.length && <li className="px-5 py-3 text-slate-500">Sin cambios registrados.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
