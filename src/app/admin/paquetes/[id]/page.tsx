import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ImagePlus, Trash2 } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { getTrackingData } from "@/lib/services/packages";
import { addMovementAction, deleteMovementAction, removePhoto, updatePackageAction, uploadPhotos } from "../../../actions/admin";
import { MovementFields, PackageFields } from "@/components/admin/forms";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { ProgressSteps } from "@/components/Timeline";
import { Card, Flash, PageHeader } from "@/components/ui";

const ACTIONS: Record<string, string> = {
  "package.create": "Paquete registrado", "package.update": "Datos editados", "movement.create": "Movimiento registrado",
  "movement.delete": "Movimiento eliminado", "package.photos_add": "Fotografías cargadas", "package.photo_remove": "Fotografía eliminada",
  "shipment.assign": "Asignado a embarque", "shipment.unassign": "Retirado de embarque",
};

export default async function AdminPackage({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  const db = getDb();
  const base = await db.table("packages").get(params.id);
  if (!base) notFound();
  const data = (await getTrackingData(base.tracking))!;
  const { pkg, movements, statuses, customer, shipment } = data;
  const [customers, logs] = await Promise.all([db.table("customers").all(), db.table("audit_logs").all({ entity: "package", entity_id: pkg.id })]);
  customers.sort((a, b) => a.full_name.localeCompare(b.full_name));
  logs.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const byId = new Map(statuses.map((s) => [s.id, s]));
  const current = byId.get(pkg.status_code);
  const next = statuses.find((s) => s.active && current && s.sort_order > current.sort_order && s.phase !== "incidencia");
  const last = movements[movements.length - 1];

  return (
    <div>
      <Link href="/admin/paquetes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand"><ArrowLeft className="h-4 w-4" /> Paquetes</Link>
      <PageHeader
        title={pkg.tracking}
        subtitle={<>{customer?.full_name} · {customer?.locker_code} · {pkg.description}</>}
        actions={<Link href={`/rastreo?guia=${pkg.tracking}`} target="_blank" className="btn-ghost"><ExternalLink className="h-4 w-4" /> Ver tracking público</Link>}
      />
      <Flash searchParams={searchParams} />

      <Card className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <StatusBadge status={current} code={pkg.status_code} size="md" />
          <p className="text-sm text-slate-500">{pkg.current_location} · {pkg.current_country} · {last ? fmtDateTime(last.occurred_at) : ""}</p>
          {shipment && <p className="text-sm">Embarque: <Link className="font-mono font-semibold text-brand" href={`/admin/embarques/${shipment.id}`}>{shipment.code}</Link></p>}
        </div>
        <div className="w-full sm:max-w-md"><ProgressSteps phase={current?.phase ?? "incidencia"} /></div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6" >
            <h2 id="movimientos" className="mb-4 scroll-mt-6 text-lg font-bold text-slate-900">Registrar movimiento</h2>
            <form action={addMovementAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="package_id" value={pkg.id} />
              <MovementFields statuses={statuses} defaultStatus={next?.id ?? pkg.status_code} defaults={{ location: pkg.current_location, country: pkg.current_country }} />
              <div className="sm:col-span-2"><SubmitButton className="btn-primary">Registrar movimiento</SubmitButton></div>
            </form>
          </Card>

          <Card>
            <h2 className="border-b border-slate-100 px-5 py-4 text-lg font-bold text-slate-900">Historial de movimientos ({movements.length})</h2>
            <ul className="divide-y divide-slate-100">
              {[...movements].reverse().map((m) => (
                <li key={m.id} className="flex flex-wrap items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <StatusBadge status={byId.get(m.status_code)} code={m.status_code} />
                    <p className="mt-1.5 text-sm text-slate-700">{m.location} · {m.country}</p>
                    <p className="text-xs text-slate-400">{fmtDateTime(m.occurred_at)} · origen: {m.source}</p>
                    {m.notes && <p className="mt-1 text-xs text-slate-600">Obs.: {m.notes}</p>}
                  </div>
                  {movements.length > 1 && (
                    <form action={deleteMovementAction}>
                      <input type="hidden" name="package_id" value={pkg.id} />
                      <input type="hidden" name="movement_id" value={m.id} />
                      <SubmitButton className="btn-danger h-8 px-2.5 text-xs" pendingText="…" confirm="¿Eliminar este movimiento? Quedará registrado en la auditoría."><Trash2 className="h-3.5 w-3.5" /></SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Datos del paquete</h2>
            <form action={updatePackageAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={pkg.id} />
              <PackageFields pkg={pkg} customers={customers} />
              <div className="sm:col-span-2"><SubmitButton className="btn-brand">Guardar cambios</SubmitButton></div>
            </form>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Fotografías</h2>
            {pkg.photos.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-2">
                {pkg.photos.map((k) => (
                  <div key={k} className="group relative overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/files/${k}`} alt="Fotografía del paquete" className="aspect-square w-full object-cover" />
                    <form action={removePhoto} className="absolute right-1 top-1">
                      <input type="hidden" name="id" value={pkg.id} /><input type="hidden" name="key" value={k} />
                      <SubmitButton className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow" pendingText="…" confirm="¿Eliminar esta fotografía?"><Trash2 className="h-3.5 w-3.5" /></SubmitButton>
                    </form>
                  </div>
                ))}
              </div>
            )}
            <form action={uploadPhotos} className="flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="id" value={pkg.id} />
              <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple required className="input flex-1 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:text-sm file:font-semibold file:text-brand" />
              <SubmitButton className="btn-ghost" pendingText="Subiendo…"><ImagePlus className="h-4 w-4" /> Cargar</SubmitButton>
            </form>
          </Card>

          <Card>
            <h2 className="border-b border-slate-100 px-5 py-4 text-lg font-bold text-slate-900">Historial de modificaciones</h2>
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {logs.map((l) => (
                <li key={l.id} className="px-5 py-3 text-sm">
                  <p className="font-semibold text-slate-800">{ACTIONS[l.action] ?? l.action}{typeof l.details.status === "string" ? ` · ${byId.get(l.details.status)?.name ?? l.details.status}` : ""}</p>
                  <p className="text-xs text-slate-400">{fmtDateTime(l.created_at)} · {l.actor_email}</p>
                </li>
              ))}
              {!logs.length && <li className="px-5 py-4 text-sm text-slate-500">Sin modificaciones registradas (datos de demostración precargados).</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
