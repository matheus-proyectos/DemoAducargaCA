import { requireAdmin } from "@/lib/auth";
import { PHASES } from "@/lib/statuses";
import { getStatuses } from "@/lib/services/packages";
import { recomputeAll, saveStatus } from "../../actions/admin";
import { StatusIcon } from "@/components/StatusIcon";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Flash, PageHeader } from "@/components/ui";
import type { Status } from "@/lib/types";

export default async function StatusesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireAdmin();
  const statuses = await getStatuses();
  return (
    <div>
      <PageHeader
        title="Estados logísticos"
        subtitle="Configura nombres, orden, fase y notificaciones. Ningún paquete está obligado a pasar por todos los estados."
        actions={<form action={recomputeAll}><SubmitButton className="btn-ghost" pendingText="Recalculando…">Recalcular paquetes</SubmitButton></form>}
      />
      <Flash searchParams={searchParams} />
      <div className="space-y-3">
        {statuses.map((s) => <StatusRow key={s.id} s={s} />)}
      </div>
      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Crear estado</h2>
        <StatusForm />
      </Card>
    </div>
  );
}

function StatusRow({ s }: { s: Status }) {
  return (
    <details className="card group">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand"><StatusIcon code={s.id} /></span>
        <span className="font-semibold text-slate-900">{s.name}</span>
        <span className="font-mono text-xs text-slate-400">{s.id}</span>
        <span className="ml-auto flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-0.5">{PHASES.find((p) => p.id === s.phase)?.label}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">Orden {s.sort_order}</span>
          {s.notify && <span className="rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent-dark">Notifica</span>}
          {!s.active && <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-600">Inactivo</span>}
        </span>
      </summary>
      <div className="border-t border-slate-100 p-5"><StatusForm s={s} /></div>
    </details>
  );
}

function StatusForm({ s }: { s?: Status }) {
  return (
    <form action={saveStatus} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {s ? <input type="hidden" name="id" value={s.id} /> : (
        <>
          <input type="hidden" name="is_new" value="1" />
          <label className="block"><span className="label">Código</span><input name="code" required className="input font-mono uppercase" placeholder="RETENIDO" /></label>
        </>
      )}
      <label className="block"><span className="label">Nombre</span><input name="name" required defaultValue={s?.name} className="input" /></label>
      <label className="block"><span className="label">Orden</span><input name="sort_order" type="number" defaultValue={s?.sort_order ?? 75} className="input" /></label>
      <label className="block"><span className="label">Fase</span>
        <select name="phase" defaultValue={s?.phase ?? "incidencia"} className="input">{PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
      </label>
      <label className="block sm:col-span-2"><span className="label">Descripción para el cliente</span><input name="description" defaultValue={s?.description} className="input" /></label>
      <label className="block sm:col-span-2"><span className="label">Mensaje de notificación</span><input name="notify_message" defaultValue={s?.notify_message} className="input" placeholder="Tu paquete…" /></label>
      <div className="flex flex-wrap gap-5 text-sm sm:col-span-2 lg:col-span-4">
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="h-4 w-4 accent-[rgb(var(--brand))]" /> Activo</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="notify" defaultChecked={s?.notify} className="h-4 w-4 accent-[rgb(var(--brand))]" /> Notificar al cliente</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="is_final" defaultChecked={s?.is_final} className="h-4 w-4 accent-[rgb(var(--brand))]" /> Estado final (entrega)</label>
      </div>
      <div className="lg:col-span-4"><SubmitButton className="btn-brand">{s ? "Guardar" : "Crear estado"}</SubmitButton></div>
    </form>
  );
}
