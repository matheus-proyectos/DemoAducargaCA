import Link from "next/link";
import { ChevronRight, MapPin, Scale } from "lucide-react";
import { fmtDateTime, fmtKg } from "@/lib/format";
import type { Package, Status } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { StatusIcon } from "./StatusIcon";

export function PackageCard({ pkg, status, href }: { pkg: Package; status?: Status; href: string }) {
  return (
    <Link href={href} className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <StatusIcon code={pkg.status_code} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[15px] font-bold tracking-wide text-slate-900">{pkg.tracking}</p>
            <p className="truncate text-sm text-slate-500">{pkg.description}</p>
          </div>
        </div>
        <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>
      <StatusBadge status={status} code={pkg.status_code} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><Scale className="h-3.5 w-3.5" /> {pkg.weight_kg ? fmtKg(pkg.weight_kg) : "Por pesar"}</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {pkg.destination_city}</span>
        <span className="w-full sm:w-auto">Actualizado: {fmtDateTime(pkg.updated_at)}</span>
      </div>
    </Link>
  );
}
