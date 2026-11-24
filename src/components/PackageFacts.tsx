import { fmtDims, fmtKg, fmtUsd } from "@/lib/format";
import type { Address, Package, Shipment } from "@/lib/types";
import { Card } from "./ui";

/** Ficha privada del paquete (cliente y admin): contenido, medidas, fotos. */
export function PackageFacts({ pkg, address, shipment }: { pkg: Package; address?: Address | null; shipment?: Shipment | null }) {
  const rows: [string, string][] = [
    ["Contenido", pkg.description],
    ["Tienda", pkg.store || "—"],
    ["Tracking del transportista", pkg.carrier_tracking || "—"],
    ["Peso", pkg.weight_kg ? fmtKg(pkg.weight_kg) : "Por pesar"],
    ["Dimensiones", fmtDims(pkg.length_cm, pkg.width_cm, pkg.height_cm)],
    ["Piezas", String(pkg.pieces)],
    ["Valor declarado", fmtUsd(pkg.declared_value_usd)],
    ["Embarque", shipment ? `${shipment.code} · ${shipment.mode === "aereo" ? "Aéreo" : "Marítimo"}` : "Sin asignar"],
  ];
  if (address) rows.push(["Dirección de entrega", [address.recipient, address.line1, `${address.city}, ${address.state}`].filter(Boolean).join(" · ")]);
  return (
    <>
      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Información del paquete</h2>
        <dl className="divide-y divide-slate-100 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-semibold text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Fotografías</h2>
        {pkg.photos.length ? (
          <div className="grid grid-cols-2 gap-2">
            {pkg.photos.map((k) => (
              <a key={k} href={`/api/files/${k}`} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${k}`} alt={`Fotografía del paquete ${pkg.tracking}`} className="aspect-square w-full object-cover transition hover:scale-105" loading="lazy" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Las fotografías se cargan cuando el paquete se recibe en el almacén.</p>
        )}
      </Card>
    </>
  );
}
