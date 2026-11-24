import type { Phase, Status } from "@/lib/types";
import { StatusIcon } from "./StatusIcon";
import { cx } from "./ui";

export const PHASE_STYLE: Record<Phase, string> = {
  prealerta: "bg-slate-100 text-slate-700 ring-slate-200",
  origen: "bg-sky-50 text-sky-800 ring-sky-200",
  transito: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  venezuela: "bg-amber-50 text-amber-900 ring-amber-200",
  distribucion: "bg-orange-50 text-orange-800 ring-orange-200",
  entregado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  incidencia: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status, code, size = "sm" }: { status?: Status | null; code: string; size?: "sm" | "md" }) {
  const phase = status?.phase ?? "incidencia";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        PHASE_STYLE[phase],
      )}
    >
      <StatusIcon code={code} className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {status?.name ?? code}
    </span>
  );
}
