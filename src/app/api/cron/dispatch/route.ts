// Endpoint de tareas programadas (cron).
// Protegido por CRON_SECRET. Lo llama un servicio externo (EasyPanel cron, GitHub Actions, etc.)
// cada 2–5 minutos. Debe ser idempotente y tolerante a fallos.
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notifyStatusChange } from "@/lib/services/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = Date.now();

  const allNotifications = await db.table("notifications").all();
  const pending = allNotifications
    .filter((n) => n.delivery_status === "fallida")
    .filter((n) => new Date(n.created_at).getTime() < now - 5 * 60 * 1000);

  let retried = 0;
  for (const n of pending.slice(0, 50)) {
    const pkgId = n.package_id ?? "";
    const pkg = await db.table("packages").get(pkgId);
    if (!pkg) continue;
    const status = await db.table("statuses").get(pkg.status_code);
    const movement = await db.table("movements").findOne({ package_id: pkg.id, status_code: pkg.status_code });
    const customer = await db.table("customers").get(pkg.customer_id);
    if (!status || !movement || !customer) continue;
    if (n.channel && (await import("@/lib/services/notifications")).channels().find((c) => c.id === n.channel)?.enabled()) {
      await (await import("@/lib/services/notifications")).channels().find((c) => c.id === n.channel)!.send({
        type: "package.status_changed",
        title: n.title,
        body: n.body,
        pkg,
        customer,
        status,
        movement,
      });
      retried++;
    }
  }

  // Alertas operativas: paquetes sin movimiento reciente (más simple que queries SQL)
  const staleAll = await db.table("packages").all();
  const staleThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const stale = staleAll.filter(
    (p) => (p.status_code !== "entregado" && p.status_code !== "devuelto") && p.updated_at < staleThreshold
  );

  return NextResponse.json({
    ok: true,
    retried_notifications: retried,
    stale_packages: stale.length,
    ts: new Date().toISOString(),
  });
}
