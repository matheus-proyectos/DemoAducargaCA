import { Check, Clock, MapPin, MessageSquareText } from "lucide-react";
import { fmtDate, fmtTime } from "@/lib/format";
import { PROGRESS_STEPS, progressIndex } from "@/lib/statuses";
import type { Movement, Phase, Status } from "@/lib/types";
import { StatusIcon } from "./StatusIcon";
import { cx } from "./ui";

/** Indicador de progreso por hitos (Casillero → Entregado). */
export function ProgressSteps({ phase }: { phase: Phase }) {
  const current = progressIndex(phase);
  const done = phase === "entregado";
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Progreso del envío">
      {PROGRESS_STEPS.map((step, i) => {
        const reached = i < current || done;
        const active = i === current && !done;
        return (
          <li key={step.label} className="flex flex-col items-center gap-2 text-center">
            <div className="relative flex w-full items-center">
              <div className={cx("h-1.5 flex-1 rounded-full", i === 0 ? "bg-transparent" : reached || active ? "bg-accent" : "bg-slate-200")} />
              <div
                className={cx(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                  reached && "bg-accent text-brand-dark",
                  active && "animate-pulseRing bg-brand text-white ring-4 ring-accent/30",
                  !reached && !active && "bg-slate-200 text-slate-500",
                )}
              >
                {reached ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </div>
              <div className={cx("h-1.5 flex-1 rounded-full", i === PROGRESS_STEPS.length - 1 ? "bg-transparent" : reached ? "bg-accent" : "bg-slate-200")} />
            </div>
            <span className={cx("text-[11px] font-semibold leading-tight sm:text-xs", active ? "text-brand" : reached ? "text-slate-700" : "text-slate-400")}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Línea de tiempo cronológica:
 *  - completados (✓), estado actual destacado, y etapas futuras como pendientes.
 *  - Las etapas futuras se derivan de los estados activos con orden superior al actual.
 */
export function Timeline({ movements, statuses, currentCode }: { movements: Movement[]; statuses: Status[]; currentCode: string }) {
  const byId = new Map(statuses.map((s) => [s.id, s]));
  const current = byId.get(currentCode);
  const delivered = !!current?.is_final;
  const pending = delivered
    ? []
    : statuses.filter((s) => s.active && current && s.sort_order > current.sort_order && s.phase !== "incidencia" && s.phase !== "prealerta");
  const lastIdx = movements.length - 1;

  return (
    <ol className="relative">
      {movements.map((m, i) => {
        const st = byId.get(m.status_code);
        const isCurrent = i === lastIdx;
        return (
          <li key={m.id} className="relative flex gap-4 pb-7 animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
            <Rail done={!isCurrent || delivered} last={i === lastIdx && pending.length === 0} />
            <div
              className={cx(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                isCurrent && !delivered && "animate-pulseRing bg-accent text-brand-dark",
                isCurrent && delivered && "bg-emerald-500 text-white",
                !isCurrent && "bg-brand text-white",
              )}
            >
              {isCurrent ? <StatusIcon code={m.status_code} className="h-5 w-5" /> : <Check className="h-4 w-4" strokeWidth={3} />}
            </div>
            <div className={cx("min-w-0 flex-1 rounded-2xl px-4 py-3", isCurrent ? "border border-accent/40 bg-accent/[.06]" : "bg-transparent px-1 py-1")}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={cx("font-bold", isCurrent ? "text-brand" : "text-slate-800")}>{st?.name ?? m.status_code}</p>
                {isCurrent && (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {delivered ? "Completado" : "Estado actual"}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {fmtDate(m.occurred_at)} · {fmtTime(m.occurred_at)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {m.location}
                  {m.country && m.country !== "Internacional" ? `, ${m.country}` : ""}
                </span>
              </div>
              {m.description && <p className="mt-1.5 text-sm text-slate-600">{m.description}</p>}
              {m.notes && (
                <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[13px] text-slate-700">
                  <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {m.notes}
                </p>
              )}
            </div>
          </li>
        );
      })}
      {pending.map((s, i) => (
        <li key={s.id} className="relative flex gap-4 pb-5 last:pb-0">
          <Rail done={false} last={i === pending.length - 1} dashed />
          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400 ring-4 ring-white">
            <StatusIcon code={s.id} className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 py-2">
            <p className="font-semibold text-slate-400">{s.name}</p>
            <p className="text-xs text-slate-400">Pendiente</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Rail({ done, last, dashed }: { done: boolean; last: boolean; dashed?: boolean }) {
  if (last) return null;
  return (
    <span
      aria-hidden
      className={cx(
        "absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 origin-top",
        dashed ? "border-l-2 border-dashed border-slate-200 bg-transparent" : done ? "animate-grow bg-brand" : "bg-slate-200",
      )}
    />
  );
}
