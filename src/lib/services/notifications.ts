// Sistema de notificaciones con canales enchufables.
//  - in_app  : siempre activo; aparece en el panel del cliente.
//  - webhook : activo si NOTIFY_WEBHOOK_URL está definido. Envía un evento JSON
//              firmado (HMAC-SHA256) que un orquestador (n8n, Make, Zapier) puede
//              convertir en correo electrónico o WhatsApp sin tocar este código.
//  - email / whatsapp directos: implementar `NotificationChannel` y añadirlo a
//    `channels()` cuando existan credenciales del proveedor (Resend, Meta Cloud API…).
// No se simulan envíos: si un canal no está configurado, no se registra como enviado.
import { createHmac, randomUUID } from "node:crypto";
import { getDb } from "../db";
import type { Customer, Movement, Notification, Package, Status } from "../types";

export type NotificationEvent = {
  type: "package.status_changed";
  title: string;
  body: string;
  pkg: Package;
  customer: Customer;
  status: Status;
  movement: Movement;
};

export interface NotificationChannel {
  id: Notification["channel"];
  enabled(): boolean;
  send(ev: NotificationEvent): Promise<{ status: Notification["delivery_status"]; error?: string }>;
}

const inApp: NotificationChannel = {
  id: "in_app",
  enabled: () => true,
  send: async () => ({ status: "entregada" }),
};

const webhook: NotificationChannel = {
  id: "webhook",
  enabled: () => !!process.env.NOTIFY_WEBHOOK_URL,
  async send(ev) {
    const payload = JSON.stringify({
      event: ev.type,
      sent_at: new Date().toISOString(),
      tracking: ev.pkg.tracking,
      message: ev.title,
      status: { code: ev.status.id, name: ev.status.name },
      movement: { occurred_at: ev.movement.occurred_at, location: ev.movement.location, country: ev.movement.country, notes: ev.movement.notes },
      customer: { name: ev.customer.full_name, email: ev.customer.email, phone: ev.customer.phone, locker_code: ev.customer.locker_code },
      package: { description: ev.pkg.description, weight_kg: ev.pkg.weight_kg, estimated_delivery: ev.pkg.estimated_delivery },
    });
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (process.env.NOTIFY_WEBHOOK_SECRET) {
      headers["x-aducarga-signature"] = createHmac("sha256", process.env.NOTIFY_WEBHOOK_SECRET).update(payload).digest("hex");
    }
    try {
      const res = await fetch(process.env.NOTIFY_WEBHOOK_URL!, { method: "POST", headers, body: payload, signal: AbortSignal.timeout(8000) });
      return res.ok ? { status: "enviada" } : { status: "fallida", error: `HTTP ${res.status}` };
    } catch (e) {
      return { status: "fallida", error: (e as Error).message };
    }
  },
};

export const channels = (): NotificationChannel[] => [inApp, webhook];

export function channelStatus() {
  return [
    { id: "in_app", label: "Panel del cliente", enabled: true, detail: "Activo" },
    { id: "webhook", label: "Webhook (n8n / Make)", enabled: webhook.enabled(), detail: webhook.enabled() ? "Configurado" : "Defina NOTIFY_WEBHOOK_URL" },
    { id: "email", label: "Correo electrónico", enabled: false, detail: "Vía webhook o proveedor directo (pendiente de credenciales)" },
    { id: "whatsapp", label: "WhatsApp", enabled: false, detail: "Vía webhook o WhatsApp Cloud API (pendiente de credenciales)" },
  ];
}

export async function notifyStatusChange(pkg: Package, status: Status, movement: Movement) {
  const db = getDb();
  const customer = await db.table("customers").get(pkg.customer_id);
  if (!customer) return;
  const ev: NotificationEvent = {
    type: "package.status_changed",
    title: status.notify_message || `Tu paquete cambió a: ${status.name}`,
    body: `Guía ${pkg.tracking} · ${pkg.description}${movement.location ? ` · ${movement.location}` : ""}`,
    pkg, customer, status, movement,
  };
  for (const ch of channels()) {
    if (!ch.enabled()) continue;
    const r = await ch.send(ev);
    await db.table("notifications").insert({
      id: randomUUID(), customer_id: customer.id, package_id: pkg.id, title: ev.title, body: ev.body,
      channel: ch.id, delivery_status: r.status, read_at: null, error: r.error ?? null, created_at: new Date().toISOString(),
    });
  }
}
