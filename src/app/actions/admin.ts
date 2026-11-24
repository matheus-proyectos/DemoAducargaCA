"use server";
// Acciones del panel administrativo. Cada una re-verifica el rol en el servidor.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fromCaracasLocal } from "@/lib/format";
import { back, customerSchema, firstError, movementSchema, optNum, packageSchema, str } from "@/lib/forms";
import { audit } from "@/lib/services/audit";
import {
  addMovement, addShipmentMovement, assignToShipment, createPackage, deleteMovement, generateLockerCode,
  generateShipmentCode, recomputePackage,
} from "@/lib/services/packages";
import { ALLOWED_TYPES, MAX_PHOTO_BYTES, deleteFile, putFile } from "@/lib/storage";
import type { Phase } from "@/lib/types";

// ───────────── Clientes ─────────────
function parseCustomer(fd: FormData) {
  return customerSchema.safeParse({
    full_name: str(fd, "full_name"), email: str(fd, "email").toLowerCase(), phone: str(fd, "phone"), document_id: str(fd, "document_id"),
    city: str(fd, "city"), state: str(fd, "state"), notes: str(fd, "notes"),
  });
}

export async function createCustomer(fd: FormData) {
  const actor = await requireStaff();
  const parsed = parseCustomer(fd);
  if (!parsed.success) back("/admin/clientes/nuevo", "error", firstError(parsed.error));
  const db = getDb();
  if (await db.table("customers").findOne({ email: parsed.data.email })) back("/admin/clientes/nuevo", "error", "Ya existe un cliente con ese correo.");
  const now = new Date().toISOString();
  const c = await db.table("customers").insert({
    id: randomUUID(), locker_code: await generateLockerCode(), ...parsed.data, is_demo: false, created_at: now, updated_at: now,
  });
  await db.table("addresses").insert({
    id: randomUUID(), customer_id: c.id, label: "Principal", recipient: c.full_name, line1: str(fd, "line1"), city: c.city, state: c.state,
    reference: "", phone: c.phone, is_default: true, created_at: now,
  });
  await audit(actor, "customer.create", "customer", c.id, { locker_code: c.locker_code });
  back(`/admin/clientes/${c.id}`, "ok", `Cliente registrado con casillero ${c.locker_code}. Podrá activar su acceso registrándose con el mismo correo.`);
}

export async function updateCustomer(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "id");
  const parsed = parseCustomer(fd);
  if (!parsed.success) back(`/admin/clientes/${id}`, "error", firstError(parsed.error));
  const db = getDb();
  const before = await db.table("customers").get(id);
  if (!before) back("/admin/clientes", "error", "Cliente no encontrado.");
  const dup = await db.table("customers").findOne({ email: parsed.data.email });
  if (dup && dup.id !== id) back(`/admin/clientes/${id}`, "error", "Otro cliente ya usa ese correo.");
  await db.table("customers").update(id, { ...parsed.data, updated_at: new Date().toISOString() });
  const changes = Object.fromEntries(Object.entries(parsed.data).filter(([k, v]) => (before as unknown as Record<string, unknown>)[k] !== v));
  await audit(actor, "customer.update", "customer", id, changes);
  back(`/admin/clientes/${id}`, "ok", "Cliente actualizado.");
}

// ───────────── Paquetes ─────────────
async function parsePackage(fd: FormData) {
  let city = str(fd, "destination_city"), state = str(fd, "destination_state");
  if (!city) {
    const c = await getDb().table("customers").get(str(fd, "customer_id"));
    city = c?.city ?? "";
    state = state || c?.state || "";
  }
  return packageSchema.safeParse({
    customer_id: str(fd, "customer_id"), description: str(fd, "description"), store: str(fd, "store"), carrier_tracking: str(fd, "carrier_tracking"),
    destination_city: city, destination_state: state, weight_kg: optNum(fd, "weight_kg") ?? NaN,
    length_cm: optNum(fd, "length_cm"), width_cm: optNum(fd, "width_cm"), height_cm: optNum(fd, "height_cm"),
    pieces: optNum(fd, "pieces") ?? 1, declared_value_usd: optNum(fd, "declared_value_usd"), estimated_delivery: str(fd, "estimated_delivery") || null,
  });
}

export async function createPackageAction(fd: FormData) {
  const actor = await requireStaff();
  const parsed = await parsePackage(fd);
  if (!parsed.success) back("/admin/paquetes/nuevo", "error", firstError(parsed.error));
  const db = getDb();
  const customer = await db.table("customers").get(parsed.data.customer_id);
  if (!customer) back("/admin/paquetes/nuevo", "error", "Cliente no encontrado.");
  const address = (await db.table("addresses").all({ customer_id: customer.id })).find((a) => a.is_default);
  const status_code = str(fd, "status_code") || "RECIBIDO_CASILLERO";
  const pkg = await createPackage(
    { ...parsed.data, address_id: address?.id ?? null, shipment_id: null },
    {
      status_code, occurred_at: fromCaracasLocal(str(fd, "occurred_at")), location: str(fd, "location") || "Almacén casillero internacional",
      country: str(fd, "country") || "Estados Unidos", description: "", notes: str(fd, "notes"),
    },
    actor, "admin",
  );
  let photoError = "";
  try {
    const uploaded = await savePhotos(pkg.id, fd);
    if (uploaded.length) await db.table("packages").update(pkg.id, { photos: uploaded });
  } catch (e) {
    photoError = (e as Error).message;
  }
  if (photoError) back(`/admin/paquetes/${pkg.id}`, "error", `Paquete ${pkg.tracking} registrado, pero las fotos no se cargaron: ${photoError}`);
  back(`/admin/paquetes/${pkg.id}`, "ok", `Paquete registrado con guía ${pkg.tracking}.`);
}

export async function updatePackageAction(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "id");
  const parsed = await parsePackage(fd);
  if (!parsed.success) back(`/admin/paquetes/${id}`, "error", firstError(parsed.error));
  const db = getDb();
  const before = await db.table("packages").get(id);
  if (!before) back("/admin/paquetes", "error", "Paquete no encontrado.");
  await db.table("packages").update(id, { ...parsed.data, updated_at: new Date().toISOString() });
  const changes = Object.fromEntries(
    Object.entries(parsed.data).filter(([k, v]) => (before as unknown as Record<string, unknown>)[k] !== v).map(([k, v]) => [k, { de: (before as unknown as Record<string, unknown>)[k], a: v }]),
  );
  await audit(actor, "package.update", "package", id, { tracking: before.tracking, cambios: changes });
  back(`/admin/paquetes/${id}`, "ok", "Datos del paquete actualizados.");
}

async function savePhotos(packageId: string, fd: FormData): Promise<string[]> {
  const files = fd.getAll("photos").filter((f): f is File => typeof f !== "string" && f.size > 0);
  const keys: string[] = [];
  for (const f of files.slice(0, 8)) {
    const ext = ALLOWED_TYPES[f.type];
    if (!ext) throw new Error(`Formato no permitido (${f.name}). Use JPG, PNG o WEBP.`);
    if (f.size > MAX_PHOTO_BYTES) throw new Error(`La imagen ${f.name} supera 5 MB.`);
    const key = `packages/${packageId}/${randomUUID()}.${ext}`;
    await putFile(key, Buffer.from(await f.arrayBuffer()), f.type);
    keys.push(key);
  }
  return keys;
}

export async function uploadPhotos(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "id");
  const db = getDb();
  const pkg = await db.table("packages").get(id);
  if (!pkg) back("/admin/paquetes", "error", "Paquete no encontrado.");
  let keys: string[] = [];
  try {
    keys = await savePhotos(id, fd);
  } catch (e) {
    back(`/admin/paquetes/${id}`, "error", (e as Error).message);
  }
  if (!keys.length) back(`/admin/paquetes/${id}`, "error", "Selecciona al menos una imagen.");
  await db.table("packages").update(id, { photos: [...pkg.photos, ...keys], updated_at: new Date().toISOString() });
  await audit(actor, "package.photos_add", "package", id, { count: keys.length });
  back(`/admin/paquetes/${id}`, "ok", `${keys.length} fotografía(s) cargada(s).`);
}

export async function removePhoto(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "id");
  const key = str(fd, "key");
  const db = getDb();
  const pkg = await db.table("packages").get(id);
  if (!pkg || !pkg.photos.includes(key)) back(`/admin/paquetes/${id}`, "error", "Fotografía no encontrada.");
  await deleteFile(key);
  await db.table("packages").update(id, { photos: pkg.photos.filter((k) => k !== key) });
  await audit(actor, "package.photo_remove", "package", id, { key });
  back(`/admin/paquetes/${id}`, "ok", "Fotografía eliminada.");
}

// ───────────── Movimientos ─────────────
function parseMovement(fd: FormData) {
  return movementSchema.safeParse({
    status_code: str(fd, "status_code"), occurred_at: fromCaracasLocal(str(fd, "occurred_at")), location: str(fd, "location"),
    country: str(fd, "country"), description: str(fd, "description"), notes: str(fd, "notes"),
  });
}

export async function addMovementAction(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "package_id");
  const parsed = parseMovement(fd);
  if (!parsed.success) back(`/admin/paquetes/${id}`, "error", firstError(parsed.error));
  try {
    await addMovement(id, parsed.data, actor, { notify: fd.get("notify") === "on", source: "admin" });
  } catch (e) {
    back(`/admin/paquetes/${id}`, "error", (e as Error).message);
  }
  back(`/admin/paquetes/${id}#movimientos`, "ok", "Movimiento registrado. El tracking del cliente ya está actualizado.");
}

export async function deleteMovementAction(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "package_id");
  try {
    await deleteMovement(str(fd, "movement_id"), actor);
  } catch (e) {
    back(`/admin/paquetes/${id}`, "error", (e as Error).message);
  }
  back(`/admin/paquetes/${id}#movimientos`, "ok", "Movimiento eliminado y estado recalculado.");
}

// ───────────── Embarques ─────────────
const shipmentSchema = z.object({
  mode: z.enum(["aereo", "maritimo"]),
  carrier: z.string().max(120),
  reference: z.string().max(120),
  origin: z.string().min(2, "Indica el origen").max(120),
  destination: z.string().min(2, "Indica el destino").max(120),
  eta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notes: z.string().max(1000),
});
const parseShipment = (fd: FormData) =>
  shipmentSchema.safeParse({
    mode: str(fd, "mode"), carrier: str(fd, "carrier"), reference: str(fd, "reference"), origin: str(fd, "origin"),
    destination: str(fd, "destination"), eta: str(fd, "eta") || null, notes: str(fd, "notes"),
  });

export async function createShipment(fd: FormData) {
  const actor = await requireStaff();
  const parsed = parseShipment(fd);
  if (!parsed.success) back("/admin/embarques", "error", firstError(parsed.error));
  const now = new Date().toISOString();
  const s = await getDb().table("shipments").insert({
    id: randomUUID(), code: await generateShipmentCode(), ...parsed.data, departure_at: null, status_code: null, is_demo: false, created_at: now, updated_at: now,
  });
  await audit(actor, "shipment.create", "shipment", s.id, { code: s.code });
  back(`/admin/embarques/${s.id}`, "ok", `Embarque ${s.code} creado. Ahora asigna los paquetes.`);
}

export async function updateShipment(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "id");
  const parsed = parseShipment(fd);
  if (!parsed.success) back(`/admin/embarques/${id}`, "error", firstError(parsed.error));
  await getDb().table("shipments").update(id, { ...parsed.data, updated_at: new Date().toISOString() });
  await audit(actor, "shipment.update", "shipment", id, parsed.data);
  back(`/admin/embarques/${id}`, "ok", "Embarque actualizado.");
}

export async function assignPackagesAction(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "shipment_id");
  const ids = fd.getAll("package_ids").map(String).filter(Boolean);
  if (!ids.length) back(`/admin/embarques/${id}`, "error", "Selecciona al menos un paquete.");
  await assignToShipment(id, ids, actor);
  back(`/admin/embarques/${id}`, "ok", `${ids.length} paquete(s) agregado(s) al embarque.`);
}

export async function unassignPackageAction(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "shipment_id");
  await assignToShipment(null, [str(fd, "package_id")], actor);
  back(`/admin/embarques/${id}`, "ok", "Paquete retirado del embarque.");
}

export async function shipmentMovementAction(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "shipment_id");
  const parsed = parseMovement(fd);
  if (!parsed.success) back(`/admin/embarques/${id}`, "error", firstError(parsed.error));
  const s = await getDb().table("shipments").get(id);
  if (!s) back("/admin/embarques", "error", "Embarque no encontrado.");
  const n = await addShipmentMovement(s, parsed.data, actor, fd.get("notify") === "on");
  if (!n) back(`/admin/embarques/${id}`, "error", "El embarque no tiene paquetes asignados.");
  back(`/admin/embarques/${id}`, "ok", `Movimiento aplicado a ${n} paquete(s).`);
}

// ───────────── Estados (solo administrador) ─────────────
const PHASE_IDS: Phase[] = ["prealerta", "origen", "transito", "venezuela", "distribucion", "entregado", "incidencia"];
const statusSchema = z.object({
  name: z.string().min(3, "Nombre demasiado corto").max(60),
  description: z.string().max(240),
  sort_order: z.number().int().min(0).max(10000),
  phase: z.enum(PHASE_IDS as [Phase, ...Phase[]]),
  notify_message: z.string().max(160),
});

export async function saveStatus(fd: FormData) {
  const actor = await requireAdmin();
  const db = getDb();
  const isNew = fd.get("is_new") === "1";
  const id = isNew ? str(fd, "code").toUpperCase().replace(/[^A-Z0-9_]/g, "_") : str(fd, "id");
  if (!/^[A-Z][A-Z0-9_]{2,40}$/.test(id)) back("/admin/estados", "error", "Código no válido (use MAYÚSCULAS y guiones bajos).");
  const parsed = statusSchema.safeParse({
    name: str(fd, "name"), description: str(fd, "description"), sort_order: optNum(fd, "sort_order") ?? 0,
    phase: str(fd, "phase"), notify_message: str(fd, "notify_message"),
  });
  if (!parsed.success) back("/admin/estados", "error", firstError(parsed.error));
  const flags = { notify: fd.get("notify") === "on", active: fd.get("active") === "on", is_final: fd.get("is_final") === "on" };
  if (isNew) {
    if (await db.table("statuses").get(id)) back("/admin/estados", "error", "Ya existe un estado con ese código.");
    await db.table("statuses").insert({ id, ...parsed.data, ...flags });
  } else {
    await db.table("statuses").update(id, { ...parsed.data, ...flags });
  }
  await audit(actor, isNew ? "status.create" : "status.update", "status", id, { ...parsed.data, ...flags });
  back("/admin/estados", "ok", `Estado ${id} guardado.`);
}

// ───────────── Mensajes de contacto ─────────────
export async function toggleMessage(fd: FormData) {
  const actor = await requireStaff();
  const id = str(fd, "id");
  const db = getDb();
  const m = await db.table("messages").get(id);
  if (!m) back("/admin/mensajes", "error", "Mensaje no encontrado.");
  await db.table("messages").update(id, { status: m.status === "nuevo" ? "atendido" : "nuevo" });
  await audit(actor, "message.toggle", "message", id, { status: m.status === "nuevo" ? "atendido" : "nuevo" });
  back("/admin/mensajes", "ok", "Mensaje actualizado.");
}

/** Recalcula el estado vigente de todos los paquetes (mantenimiento). */
export async function recomputeAll() {
  const actor = await requireAdmin();
  const pkgs = await getDb().table("packages").all();
  for (const p of pkgs) await recomputePackage(p.id);
  await audit(actor, "maintenance.recompute", "package", "*", { count: pkgs.length });
  back("/admin/estados", "ok", `${pkgs.length} paquetes recalculados.`);
}
