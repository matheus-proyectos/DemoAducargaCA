import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDateTime, timeAgo } from "@/lib/format";
import { markNotificationsRead } from "../../actions/client";
import { Card, cx, EmptyState, Flash, PageHeader } from "@/components/ui";

export default async function NotificationsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { customer } = await requireClient();
  const db = getDb();
  const list = (await db.table("notifications").all({ customer_id: customer.id, channel: "in_app" })).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pkgs = new Map((await db.table("packages").all({ customer_id: customer.id })).map((p) => [p.id, p]));
  const unread = list.filter((n) => !n.read_at).length;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notificaciones"
        subtitle={unread ? `${unread} sin leer` : "Estás al día"}
        actions={unread > 0 && <form action={markNotificationsRead}><button className="btn-ghost"><CheckCheck className="h-4 w-4" /> Marcar todas como leídas</button></form>}
      />
      <Flash searchParams={searchParams} />
      {list.length === 0 ? (
        <EmptyState icon={<Bell className="h-6 w-6" />} title="Sin notificaciones" text="Aquí verás cada cambio importante de tus envíos." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {list.map((n) => {
            const p = n.package_id ? pkgs.get(n.package_id) : null;
            return (
              <div key={n.id} className={cx("flex gap-4 p-4 sm:p-5", !n.read_at && "bg-accent/[.05]")}>
                <div className={cx("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", n.read_at ? "bg-slate-200" : "bg-accent")} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span title={fmtDateTime(n.created_at)}>{timeAgo(n.created_at)}</span>
                    {p && <Link href={`/cuenta/paquetes/${p.tracking}`} className="font-semibold text-brand hover:underline">Ver envío</Link>}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
