// API pública de tracking (JSON) para integraciones: chatbots de WhatsApp,
// n8n, sitios aliados. Devuelve solo datos no sensibles (nombre enmascarado).
import { NextResponse } from "next/server";
import { maskName } from "@/lib/format";
import { getTrackingData } from "@/lib/services/packages";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { tracking: string } }) {
  const data = await getTrackingData(decodeURIComponent(params.tracking).slice(0, 40));
  if (!data) return NextResponse.json({ error: "not_found", message: "Guía no encontrada" }, { status: 404 });
  const { pkg, movements, statuses, customer } = data;
  const byId = new Map(statuses.map((s) => [s.id, s]));
  const st = byId.get(pkg.status_code);
  return NextResponse.json(
    {
      tracking: pkg.tracking,
      recipient: customer ? maskName(customer.full_name) : null,
      status: { code: pkg.status_code, name: st?.name ?? pkg.status_code, phase: st?.phase ?? null, description: st?.description ?? "" },
      current_location: { location: pkg.current_location, country: pkg.current_country },
      destination: { city: pkg.destination_city, state: pkg.destination_state, country: "Venezuela" },
      received_at: pkg.received_at,
      weight_kg: pkg.weight_kg,
      pieces: pkg.pieces,
      estimated_delivery: pkg.estimated_delivery,
      delivered_at: pkg.delivered_at,
      movements: movements.map((m) => ({
        status: m.status_code, name: byId.get(m.status_code)?.name ?? m.status_code, occurred_at: m.occurred_at,
        location: m.location, country: m.country, description: m.description, notes: m.notes,
      })),
    },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );
}
