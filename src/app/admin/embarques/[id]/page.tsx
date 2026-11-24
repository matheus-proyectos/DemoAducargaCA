import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtKg } from "@/lib/format";
import { getStatuses, statusIndex } from "@/lib/services/packages";
import { assignPackagesAction, shipmentMovementAction, unassignPackageAction, updateShipment } from "../../../actions/admin";
import { MovementFields } from "@/components/admin/forms";
import { ShipmentFields } from "@/components/admin/ShipmentFields";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Flash, PageHeader } from "@/components/ui";

export default async function AdminShipment({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  const db = getDb();
  const s = await db.table("shipments").get(params.id);
  if (!s) notFound();
  const [pkgs, customers, statuses] = await Promise.all([db.table("packages").all(), db.table("customers").all(), getStatuses()]);
  const idx = statusIndex(statuses);
  const cust = new Map(customers.map((c) => [c.id, c]));
  const mine = pkgs.filter((p) => p.shipment_id === s.id);
  const available = pkgs.filter((p) => !p.shipment_id && idx.get(p.status_code)?.phase === "origen");
  const next = statuses.find((x) => x.active && x.sort_order > (idx.get(s.status_code ?? "")?.sort_order ?? 55) && x.phase !== "incidencia");

  return (
    <div>
      <Link href="/admin/embarques" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand"><ArrowLeft className="h-4 w-4" /> Embarques</Link>
      <PageHeader title={s.code} subtitle={`${s.mode === "aereo" ? "Aéreo" : "Marítimo"} · ${s.origin} → ${s.destination} · ${mine.length} paquetes · ${fmtKg(mine.reduce((t, p) => t + p.weight_kg, 0))}`} />
      <Flash searchParams={searchParams} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="border-b border-slate-100 px-5 py-4 text-lg font-bold text-slate-900">Paquetes del embarque</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Tracking</th><th>Cliente</th><th>Peso</th><th>Estado</th><th /></tr></thead>
                <tbody>
                  {mine.map((p) => (
                    <tr key={p.id}>
                      <td><Link href={`/admin/paquetes/${p.id}`} className="font-mono font-semibold text-brand hover:underline">{p.tracking}</Link></td>
                      <td>{cust.get(p.customer_id)?.full_name}</td>
                      <td>{fmtKg(p.weight_kg)}</td>
                      <td><StatusBadge status={idx.get(p.status_code)} code={p.status_code} /></td>
                      <td>
                        <form action={unassignPackageAction}>
                          <input type="hidden" name="shipment_id" value={s.id} /><input type="hidden" name="package_id" value={p.id} />
                          <SubmitButton className="btn-ghost h-8 px-2" pendingText="…" confirm="¿Retirar este paquete del embarque?"><X className="h-3.5 w-3.5" /></SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {!mine.length && <tr><td colSpan={5} className="text-slate-500">Aún no hay paquetes asignados.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Agregar paquetes pendientes de despacho</h2>
            <p className="mb-4 text-sm text-slate-500">Solo se listan paquetes en casillero sin embarque asignado.</p>
            {available.length ? (
              <form action={assignPackagesAction}>
                <input type="hidden" name="shipment_id" value={s.id} />
                <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                  {available.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50">
                      <input type="checkbox" name="package_ids" value={p.id} className="h-4 w-4 accent-[rgb(var(--brand))]" />
                      <span className="font-mono font-semibold">{p.tracking}</span>
                      <span className="truncate text-slate-500">{cust.get(p.customer_id)?.full_name} · {fmtKg(p.weight_kg)}</span>
                      <span className="ml-auto"><StatusBadge status={idx.get(p.status_code)} code={p.status_code} /></span>
                    </label>
                  ))}
                </div>
                <SubmitButton className="btn-brand mt-4">Agregar seleccionados</SubmitButton>
              </form>
            ) : (
              <p className="text-sm text-slate-500">No hay paquetes disponibles para asignar.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Actualizar todo el embarque</h2>
            <p className="mb-4 text-sm text-slate-500">Registra el mismo movimiento en los {mine.length} paquetes y notifica a sus clientes.</p>
            <form action={shipmentMovementAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="shipment_id" value={s.id} />
              <MovementFields statuses={statuses} defaultStatus={next?.id} defaults={{ location: s.destination, country: "Venezuela" }} />
              <div className="sm:col-span-2"><SubmitButton className="btn-primary" confirm={`¿Aplicar este movimiento a ${mine.length} paquete(s)?`}>Aplicar a {mine.length} paquete(s)</SubmitButton></div>
            </form>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Datos del embarque</h2>
            <form action={updateShipment} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={s.id} />
              <ShipmentFields s={s} />
              <div className="sm:col-span-2"><SubmitButton className="btn-brand">Guardar</SubmitButton></div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
