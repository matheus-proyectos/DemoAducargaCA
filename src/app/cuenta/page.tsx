import Link from "next/link";
import { Bell, Building2, CheckCircle2, Copy, Globe2, PackageOpen, PackagePlus, Warehouse } from "lucide-react";
import { brand } from "@/lib/brand";
import { requireClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getStatuses, statusIndex } from "@/lib/services/packages";
import type { Phase } from "@/lib/types";
import { PackageCard } from "@/components/PackageCard";
import { TrackingSearch } from "@/components/TrackingSearch";
import { Card, cx, EmptyState, Flash, sp } from "@/components/ui";

const GROUPS: { id: string; label: string; phases: Phase[]; icon: React.ElementType }[] = [
  { id: "casillero", label: "En casillero", phases: ["prealerta", "origen"], icon: Warehouse },
  { id: "transito", label: "En tránsito", phases: ["transito"], icon: Globe2 },
  { id: "venezuela", label: "En Venezuela", phases: ["venezuela", "distribucion"], icon: Building2 },
  { id: "entregados", label: "Entregados", phases: ["entregado"], icon: CheckCircle2 },
];

export default async function AccountHome({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { customer } = await requireClient();
  const db = getDb();
  const [pkgs, statuses] = await Promise.all([db.table("packages").all({ customer_id: customer.id }), getStatuses()]);
  const idx = statusIndex(statuses);
  pkgs.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const phaseOf = (code: string) => idx.get(code)?.phase ?? "incidencia";
  const filter = sp(searchParams, "f");
  const group = GROUPS.find((g) => g.id === filter);
  const active = pkgs.filter((p) => phaseOf(p.status_code) !== "entregado");
  const shown = group ? pkgs.filter((p) => group.phases.includes(phaseOf(p.status_code))) : active;
  const history = pkgs.filter((p) => phaseOf(p.status_code) === "entregado");
  const firstName = customer.full_name.split(" ")[0];
  const L = brand.locker;

  return (
    <div className="space-y-8">
      <Flash searchParams={searchParams} />
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-brand p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-2xl" />
          <p className="text-sm text-white/70">Bienvenido de nuevo,</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Hola, {firstName}</h1>
          <p className="mt-2 max-w-md text-white/70">
            Tienes <strong className="text-white">{active.length}</strong> {active.length === 1 ? "envío activo" : "envíos activos"}. Consulta cada movimiento en tiempo real.
          </p>
          <div className="mt-6 rounded-2xl bg-white/10 p-3"><TrackingSearch size="md" /></div>
        </div>
        <Card className="p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">Tu casillero internacional</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-wider text-brand">{customer.locker_code}</p>
          <p className="mt-3 text-sm text-slate-600">
            Usa siempre <strong>{customer.full_name} · {customer.locker_code}</strong> como destinatario en tus compras.
          </p>
          {L.confirmed ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <p>{L.line1}</p>
              <p>{[L.city, L.state, L.zip].filter(Boolean).join(", ")}</p>
              <p>{L.country}</p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">
              <Copy className="mr-1 inline h-3.5 w-3.5" /> La dirección del almacén se mostrará aquí cuando {brand.name} la confirme.
            </p>
          )}
        </Card>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {GROUPS.map((g) => {
            const n = pkgs.filter((p) => g.phases.includes(phaseOf(p.status_code))).length;
            const on = filter === g.id;
            return (
              <Link key={g.id} href={on ? "/cuenta" : `/cuenta?f=${g.id}`} className={cx("card flex items-center gap-3 p-4 transition", on ? "border-brand ring-2 ring-brand/15" : "hover:border-brand/30")}>
                <div className={cx("flex h-11 w-11 items-center justify-center rounded-2xl", on ? "bg-brand text-accent" : "bg-brand-soft text-brand")}><g.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{n}</p>
                  <p className="text-xs font-medium text-slate-500">{g.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{group ? `Paquetes · ${group.label}` : "Envíos activos"}</h2>
          <Link href="/cuenta/prealerta" className="btn-primary"><PackagePlus className="h-4 w-4" /> Prealertar</Link>
        </div>
        {shown.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => <PackageCard key={p.id} pkg={p} status={idx.get(p.status_code)} href={`/cuenta/paquetes/${p.tracking}`} />)}
          </div>
        ) : (
          <EmptyState icon={<PackageOpen className="h-6 w-6" />} title="No hay paquetes en esta categoría" text="Cuando compres, prealerta tu paquete para que lo identifiquemos al llegar." action={<Link href="/cuenta/prealerta" className="btn-brand">Prealertar compra</Link>} />
        )}
      </section>

      {!group && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Historial de envíos</h2>
          {history.length ? (
            <Card className="table-wrap">
              <table className="table">
                <thead><tr><th>Guía</th><th>Contenido</th><th>Peso</th><th>Entregado</th></tr></thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p.id}>
                      <td><Link className="font-mono font-semibold text-brand hover:underline" href={`/cuenta/paquetes/${p.tracking}`}>{p.tracking}</Link></td>
                      <td className="max-w-[220px] truncate">{p.description}</td>
                      <td>{p.weight_kg} kg</td>
                      <td>{p.delivered_at ? new Date(p.delivered_at).toLocaleDateString("es-VE", { timeZone: "America/Caracas" }) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <p className="text-sm text-slate-500">Aún no tienes envíos entregados.</p>
          )}
        </section>
      )}

      <p className="flex items-center gap-2 text-xs text-slate-400"><Bell className="h-3.5 w-3.5" /> Te notificaremos en tu panel cada vez que tu paquete cambie de etapa.</p>
    </div>
  );
}
