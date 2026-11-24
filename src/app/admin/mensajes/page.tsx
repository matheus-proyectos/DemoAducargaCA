import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { toggleMessage } from "../../actions/admin";
import { Card, cx, EmptyState, Flash, PageHeader } from "@/components/ui";

export default async function MessagesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  const db = getDb();
  const list = (await db.table("messages").all()).sort((a, b) => Number(a.status === "atendido") - Number(b.status === "atendido") || b.created_at.localeCompare(a.created_at));
  const pkgs = new Map((await db.table("packages").all()).map((p) => [p.tracking, p]));
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Mensajes de atención al cliente" subtitle={`${list.filter((m) => m.status === "nuevo").length} pendientes`} />
      <Flash searchParams={searchParams} />
      {!list.length ? <EmptyState icon={<Inbox className="h-6 w-6" />} title="Sin mensajes" text="Los mensajes del formulario de contacto aparecerán aquí." /> : (
        <div className="space-y-3">
          {list.map((m) => (
            <Card key={m.id} className={cx("p-5", m.status === "nuevo" && "border-accent/50")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{m.name} <span className="font-normal text-slate-500">· {m.email}{m.phone && ` · ${m.phone}`}</span></p>
                  <p className="text-xs text-slate-400">{fmtDateTime(m.created_at)}{m.customer_id && " · cliente registrado"}</p>
                </div>
                <form action={toggleMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className={m.status === "nuevo" ? "btn-primary h-9 text-xs" : "btn-ghost h-9 text-xs"}>{m.status === "nuevo" ? "Marcar atendido" : "Reabrir"}</button>
                </form>
              </div>
              {m.tracking && (
                <p className="mt-2 text-sm">Guía: {pkgs.get(m.tracking) ? <Link className="font-mono font-semibold text-brand hover:underline" href={`/admin/paquetes/${pkgs.get(m.tracking)!.id}`}>{m.tracking}</Link> : <span className="font-mono">{m.tracking}</span>}</p>
              )}
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{m.body}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
