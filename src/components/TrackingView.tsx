import { CalendarClock, CalendarCheck2, Layers, MapPin, Scale, User, Warehouse } from "lucide-react";
import { fmtDate, fmtDateTime, fmtDay, fmtKg, maskName } from "@/lib/format";
import { progressIndex } from "@/lib/statuses";
import type { TrackingData } from "@/lib/services/packages";
import { Globe } from "./three/Globe";
import { StatusBadge } from "./StatusBadge";
import { ProgressSteps, Timeline } from "./Timeline";
import { Card, KV } from "./ui";

/**
 * Vista de seguimiento compartida por el tracking público, el panel del cliente
 * y el panel administrativo. En la vista pública el nombre se enmascara.
 */
export function TrackingView({ data, isPrivate = false, children }: { data: TrackingData; isPrivate?: boolean; children?: React.ReactNode }) {
  const { pkg, movements, statuses, customer, siblings } = data;
  const status = statuses.find((s) => s.id === pkg.status_code) ?? null;
  const phase = status?.phase ?? "incidencia";
  const stage = phase === "entregado" ? 4 : progressIndex(phase);
  const last = movements[movements.length - 1];
  const name = customer ? (isPrivate ? customer.full_name : maskName(customer.full_name)) : "—";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative isolate min-h-[260px] bg-brand-dark text-white sm:min-h-[300px]">
          <Globe mode="tracking" stage={stage} destinationCity={pkg.destination_city} className="absolute inset-0 -z-10" />
          <div className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent max-sm:bg-gradient-to-b max-sm:from-brand-dark max-sm:via-brand-dark/70 max-sm:to-brand-dark/10" />
          <div className="relative p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Número de guía</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-wider sm:text-3xl">{pkg.tracking}</p>
            <div className="mt-4"><StatusBadge status={status} code={pkg.status_code} size="md" /></div>
            <p className="mt-4 max-w-md text-xl font-bold leading-snug sm:text-2xl">{status?.description ?? "Estado en actualización"}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/75">
              <MapPin className="h-4 w-4 text-accent" />
              {pkg.current_location}
              {pkg.current_country && pkg.current_country !== "Internacional" ? ` · ${pkg.current_country}` : ""}
            </p>
            {last && <p className="mt-1 text-xs text-white/50">Última actualización: {fmtDateTime(last.occurred_at)}</p>}
          </div>
        </div>
        <div className="border-t border-slate-100 px-3 py-5 sm:px-8">
          <ProgressSteps phase={phase} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5 sm:p-7">
          <h2 className="mb-6 text-lg font-bold text-slate-900">Historial de movimientos</h2>
          <Timeline movements={movements} statuses={statuses} currentCode={pkg.status_code} />
        </Card>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Detalles del envío</h2>
            <dl className="grid gap-5">
              <KV icon={<User className="h-4 w-4" />} label="Destinatario" value={name} />
              <KV icon={<MapPin className="h-4 w-4" />} label="Destino" value={`${pkg.destination_city}${pkg.destination_state ? `, ${pkg.destination_state}` : ""} · Venezuela`} />
              <KV icon={<Warehouse className="h-4 w-4" />} label="Fecha de recepción" value={pkg.received_at ? fmtDate(pkg.received_at) : "Pendiente de recepción"} />
              <KV icon={<Scale className="h-4 w-4" />} label="Peso" value={fmtKg(pkg.weight_kg)} />
              <KV icon={<Layers className="h-4 w-4" />} label="Paquetes asociados al envío" value={`${pkg.pieces} ${pkg.pieces === 1 ? "pieza" : "piezas"}${siblings > 1 ? ` · ${siblings} guías tuyas en el mismo embarque` : ""}`} />
              {pkg.delivered_at ? (
                <KV icon={<CalendarCheck2 className="h-4 w-4" />} label="Entregado" value={fmtDateTime(pkg.delivered_at)} />
              ) : (
                <KV icon={<CalendarClock className="h-4 w-4" />} label="Entrega estimada" value={pkg.estimated_delivery ? fmtDay(pkg.estimated_delivery) : "Por confirmar"} />
              )}
            </dl>
          </Card>
          {children}
        </div>
      </div>
    </div>
  );
}
