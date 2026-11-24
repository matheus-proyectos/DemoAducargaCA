import Link from "next/link";
import { Plane, Ship } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDate, fmtDay, fmtKg } from "@/lib/format";
import { getStatuses, statusIndex } from "@/lib/services/packages";
import { createShipment } from "../../actions/admin";
import { ShipmentFields } from "@/components/admin/ShipmentFields";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Flash, PageHeader } from "@/components/ui";

export default async function AdminShipments({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  const db = getDb();
  const [shipments, pkgs, statuses] = await Promise.all([db.table("shipments").all(), db.table("packages").all(), getStatuses()]);
  const idx = statusIndex(statuses);
  shipments.sort((a, b) => b.code.localeCompare(a.code));
  const ph = (c: string) => idx.get(c)?.phase;
  const pending = pkgs.filter((p) => ph(p.status_code) === "origen");
  const transit = pkgs.filter((p) => ph(p.status_code) === "transito");
  const venezuela = pkgs.filter((p) => ["venezuela", "distribucion"].includes(ph(p.status_code) ?? ""));
  return (
    <div>
      <PageHeader title="Embarques" subtitle="Agrupa paquetes en un mismo transporte y actualiza sus movimientos en bloque." />
      <Flash searchParams={searchParams} />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Pendiente de despacho", pending, "/admin/paquetes?phase=origen"],
          ["En tránsito", transit, "/admin/paquetes?phase=transito"],
          ["Recibida en Venezuela", venezuela, "/admin/paquetes?phase=venezuela"],
        ].map(([label, list, href]) => (
          <Link key={label as string} href={href as string} className="card p-4 hover:border-brand/30">
            <p className="text-2xl font-extrabold text-slate-900">{(list as typeof pkgs).length} <span className="text-sm font-medium text-slate-400">paquetes · {fmtKg((list as typeof pkgs).reduce((s, p) => s + p.weight_kg, 0))}</span></p>
            <p className="text-sm text-slate-500">Mercancía {(label as string).toLowerCase()}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="table-wrap">
          <table className="table">
            <thead><tr><th>Embarque</th><th>Modalidad</th><th>Paquetes</th><th>Estado</th><th>Salida</th><th>ETA</th></tr></thead>
            <tbody>
              {shipments.map((s) => {
                const mine = pkgs.filter((p) => p.shipment_id === s.id);
                return (
                  <tr key={s.id}>
                    <td><Link href={`/admin/embarques/${s.id}`} className="font-mono font-semibold text-brand hover:underline">{s.code}</Link><p className="text-xs text-slate-400">{s.reference}</p></td>
                    <td><span className="inline-flex items-center gap-1.5">{s.mode === "aereo" ? <Plane className="h-4 w-4" /> : <Ship className="h-4 w-4" />}{s.mode === "aereo" ? "Aéreo" : "Marítimo"}</span></td>
                    <td>{mine.length} · {fmtKg(mine.reduce((t, p) => t + p.weight_kg, 0))}</td>
                    <td>{s.status_code ? <StatusBadge status={idx.get(s.status_code)} code={s.status_code} /> : <span className="text-xs font-semibold text-slate-500">Consolidando</span>}</td>
                    <td className="whitespace-nowrap">{fmtDate(s.departure_at)}</td>
                    <td className="whitespace-nowrap">{fmtDay(s.eta)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Nuevo embarque</h2>
          <form action={createShipment} className="grid gap-4 sm:grid-cols-2">
            <ShipmentFields s={undefined} />
            <div className="sm:col-span-2"><SubmitButton className="btn-primary">Crear embarque</SubmitButton></div>
          </form>
        </Card>
      </div>
    </div>
  );
}
