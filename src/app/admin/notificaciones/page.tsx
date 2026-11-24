import { CheckCircle2, CircleDashed } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { channelStatus } from "@/lib/services/notifications";
import { Card, cx, PageHeader } from "@/components/ui";

const DELIVERY: Record<string, string> = { entregada: "text-emerald-700", enviada: "text-emerald-700", pendiente: "text-amber-700", fallida: "text-red-600" };

export default async function AdminNotifications() {
  await requireStaff();
  const db = getDb();
  const [list, customers] = await Promise.all([db.table("notifications").all(), db.table("customers").all()]);
  const cust = new Map(customers.map((c) => [c.id, c]));
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <div>
      <PageHeader title="Notificaciones" subtitle="Avisos automáticos generados por cambios de estado notificables." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channelStatus().map((c) => (
          <Card key={c.id} className="p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              {c.enabled ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleDashed className="h-4 w-4 text-slate-400" />} {c.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">{c.detail}</p>
          </Card>
        ))}
      </div>
      <Card className="table-wrap">
        <table className="table">
          <thead><tr><th>Fecha</th><th>Cliente</th><th>Mensaje</th><th>Canal</th><th>Entrega</th><th>Leída</th></tr></thead>
          <tbody>
            {list.slice(0, 200).map((n) => (
              <tr key={n.id}>
                <td className="whitespace-nowrap text-slate-500">{fmtDateTime(n.created_at)}</td>
                <td>{cust.get(n.customer_id)?.full_name}</td>
                <td><p className="font-medium">{n.title}</p><p className="text-xs text-slate-400">{n.body}</p></td>
                <td className="text-xs uppercase">{n.channel}</td>
                <td className={cx("text-xs font-semibold", DELIVERY[n.delivery_status])}>{n.delivery_status}{n.error && <span className="block font-normal text-red-500">{n.error}</span>}</td>
                <td className="text-xs">{n.channel === "in_app" ? (n.read_at ? "Sí" : "No") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
