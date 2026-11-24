"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { back, firstError, optNum, prealertSchema, str } from "@/lib/forms";
import { audit } from "@/lib/services/audit";
import { createPackage } from "@/lib/services/packages";

/** Prealerta: el cliente registra una compra → estado CASILLERO NOTIFICADO. */
export async function createPrealert(fd: FormData) {
  const { profile, customer } = await requireClient();
  const parsed = prealertSchema.safeParse({
    description: str(fd, "description"), store: str(fd, "store"), carrier_tracking: str(fd, "carrier_tracking"),
    declared_value_usd: optNum(fd, "declared_value_usd"),
  });
  if (!parsed.success) back("/cuenta/prealerta", "error", firstError(parsed.error));
  const db = getDb();
  const addressId = str(fd, "address_id");
  const address = addressId ? await db.table("addresses").findOne({ id: addressId, customer_id: customer.id }) : null;
  const pkg = await createPackage(
    {
      customer_id: customer.id, ...parsed.data, destination_city: address?.city || customer.city, destination_state: address?.state || customer.state,
      weight_kg: 0, length_cm: null, width_cm: null, height_cm: null, pieces: 1, estimated_delivery: null, address_id: address?.id ?? null, shipment_id: null,
    },
    {
      status_code: "CASILLERO_NOTIFICADO", occurred_at: new Date().toISOString(), location: "Compra registrada por el cliente",
      country: "Internacional", description: "", notes: `Tienda: ${parsed.data.store} · Tracking transportista: ${parsed.data.carrier_tracking}`,
    },
    profile, "cliente",
  );
  back(`/cuenta/paquetes/${pkg.tracking}`, "ok", `Prealerta registrada. Tu número de guía es ${pkg.tracking}.`);
}

const profileSchema = z.object({
  full_name: z.string().min(3, "Nombre demasiado corto").max(120),
  phone: z.string().min(7, "Teléfono no válido").max(30),
  document_id: z.string().max(30),
  city: z.string().min(2, "Indica tu ciudad").max(80),
  state: z.string().min(2, "Indica tu estado").max(80),
});

export async function updateProfile(fd: FormData) {
  const { profile, customer } = await requireClient();
  const parsed = profileSchema.safeParse({
    full_name: str(fd, "full_name"), phone: str(fd, "phone"), document_id: str(fd, "document_id"), city: str(fd, "city"), state: str(fd, "state"),
  });
  if (!parsed.success) back("/cuenta/perfil", "error", firstError(parsed.error));
  const db = getDb();
  await db.table("customers").update(customer.id, { ...parsed.data, updated_at: new Date().toISOString() });
  await db.table("profiles").update(profile.id, { full_name: parsed.data.full_name });
  await audit(profile, "customer.update_self", "customer", customer.id, parsed.data);
  back("/cuenta/perfil", "ok", "Datos actualizados.");
}

const addressSchema = z.object({
  label: z.string().min(2, "Ponle un nombre a la dirección (Casa, Oficina…)").max(40),
  recipient: z.string().min(3, "Indica quién recibe").max(120),
  line1: z.string().min(5, "Indica la dirección").max(240),
  city: z.string().min(2, "Indica la ciudad").max(80),
  state: z.string().min(2, "Indica el estado").max(80),
  reference: z.string().max(200),
  phone: z.string().max(30),
});

export async function addAddress(fd: FormData) {
  const { profile, customer } = await requireClient();
  const parsed = addressSchema.safeParse({
    label: str(fd, "label"), recipient: str(fd, "recipient"), line1: str(fd, "line1"), city: str(fd, "city"),
    state: str(fd, "state"), reference: str(fd, "reference"), phone: str(fd, "phone"),
  });
  if (!parsed.success) back("/cuenta/perfil#direcciones", "error", firstError(parsed.error));
  const db = getDb();
  const existing = await db.table("addresses").all({ customer_id: customer.id });
  if (existing.length >= 10) back("/cuenta/perfil#direcciones", "error", "Máximo 10 direcciones.");
  const a = await db.table("addresses").insert({
    id: randomUUID(), customer_id: customer.id, ...parsed.data, is_default: existing.length === 0, created_at: new Date().toISOString(),
  });
  await audit(profile, "address.create", "customer", customer.id, { address_id: a.id });
  back("/cuenta/perfil#direcciones", "ok", "Dirección agregada.");
}

export async function setDefaultAddress(fd: FormData) {
  const { customer } = await requireClient();
  const db = getDb();
  const id = str(fd, "id");
  const list = await db.table("addresses").all({ customer_id: customer.id });
  if (!list.some((a) => a.id === id)) back("/cuenta/perfil", "error", "Dirección no encontrada.");
  for (const a of list) if (a.is_default !== (a.id === id)) await db.table("addresses").update(a.id, { is_default: a.id === id });
  back("/cuenta/perfil#direcciones", "ok", "Dirección predeterminada actualizada.");
}

export async function deleteAddress(fd: FormData) {
  const { profile, customer } = await requireClient();
  const db = getDb();
  const a = await db.table("addresses").findOne({ id: str(fd, "id"), customer_id: customer.id });
  if (!a) back("/cuenta/perfil", "error", "Dirección no encontrada.");
  await db.table("addresses").remove(a.id);
  if (a.is_default) {
    const rest = await db.table("addresses").all({ customer_id: customer.id });
    if (rest[0]) await db.table("addresses").update(rest[0].id, { is_default: true });
  }
  await audit(profile, "address.delete", "customer", customer.id, { address_id: a.id });
  back("/cuenta/perfil#direcciones", "ok", "Dirección eliminada.");
}

export async function markNotificationsRead() {
  const { customer } = await requireClient();
  const db = getDb();
  const now = new Date().toISOString();
  for (const n of await db.table("notifications").all({ customer_id: customer.id, channel: "in_app" })) {
    if (!n.read_at) await db.table("notifications").update(n.id, { read_at: now });
  }
  revalidatePath("/cuenta", "layout");
  back("/cuenta/notificaciones", "ok", "Notificaciones marcadas como leídas.");
}
