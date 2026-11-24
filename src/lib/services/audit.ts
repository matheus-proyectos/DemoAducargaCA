import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import type { Profile } from "../types";

export type Actor = Pick<Profile, "id" | "email"> | null;

/** Historial de auditoría: quién cambió qué y cuándo. Nunca bloquea la operación principal. */
export async function audit(actor: Actor, action: string, entity: string, entity_id: string, details: Record<string, unknown> = {}) {
  try {
    await getDb().table("audit_logs").insert({
      id: randomUUID(), actor_id: actor?.id ?? null, actor_email: actor?.email ?? "sistema",
      action, entity, entity_id, details, created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[audit] no se pudo registrar", e);
  }
}
