// Lógica de negocio de paquetes, movimientos y embarques.
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import type { Movement, MovementSource, Package, Phase, Shipment, Status } from "../types";
import { audit, type Actor } from "./audit";
import { notifyStatusChange } from "./notifications";

export const normalizeTracking = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

export async function getStatuses(includeInactive = true): Promise<Status[]> {
  const all = await getDb().table("statuses").all();
  return all.filter((s) => includeInactive || s.active).sort((a, b) => a.sort_order - b.sort_order);
}

export const statusIndex = (statuses: Status[]) => new Map(statuses.map((s) => [s.id, s]));

export async function generateTracking(): Promise<string> {
  const db = getDb();
  const year = new Date().getFullYear();
  for (let i = 0; i < 10; i++) {
    const n = await db.nextSequence(`tracking-${year}`);
    const t = `ADU-${year}-${String(n).padStart(6, "0")}`;
    if (!(await db.table("packages").findOne({ tracking: t }))) return t;
  }
  throw new Error("No se pudo generar un número de tracking único");
}

export async function generateLockerCode(): Promise<string> {
  const db = getDb();
  for (let i = 0; i < 10; i++) {
    const code = `CAS-${String(await db.nextSequence("locker")).padStart(5, "0")}`;
    if (!(await db.table("customers").findOne({ locker_code: code }))) return code;
  }
  throw new Error("No se pudo generar un código de casillero único");
}

export async function generateShipmentCode(): Promise<string> {
  const year = new Date().getFullYear();
  return `EMB-${year}-${String(await getDb().nextSequence(`shipment-${year}`)).padStart(4, "0")}`;
}

export type PackageInput = Pick<
  Package,
  | "customer_id" | "description" | "store" | "carrier_tracking" | "destination_city" | "destination_state" | "weight_kg"
  | "length_cm" | "width_cm" | "height_cm" | "pieces" | "declared_value_usd" | "estimated_delivery" | "address_id" | "shipment_id"
>;

export type MovementInput = Pick<Movement, "status_code" | "occurred_at" | "location" | "country" | "description" | "notes">;

export async function createPackage(input: PackageInput, first: MovementInput, actor: Actor, source: MovementSource): Promise<Package> {
  const db = getDb();
  const now = new Date().toISOString();
  const pkg: Package = {
    ...input, id: randomUUID(), tracking: await generateTracking(), origin: "Casillero internacional", photos: [],
    status_code: first.status_code, current_location: first.location, current_country: first.country,
    received_at: null, delivered_at: null, is_demo: false, created_at: now, updated_at: now,
  };
  await db.table("packages").insert(pkg);
  await audit(actor, "package.create", "package", pkg.id, { tracking: pkg.tracking, source });
  await addMovement(pkg.id, first, actor, { notify: true, source });
  return (await db.table("packages").get(pkg.id))!;
}

/** Registra un movimiento, recalcula el estado del paquete y dispara notificaciones. */
export async function addMovement(
  packageId: string, input: MovementInput, actor: Actor, opts: { notify: boolean; source: MovementSource },
): Promise<Movement> {
  const db = getDb();
  const pkg = await db.table("packages").get(packageId);
  if (!pkg) throw new Error("Paquete no encontrado");
  const status = await db.table("statuses").get(input.status_code);
  if (!status) throw new Error("Estado no válido");
  const mv: Movement = {
    ...input, id: randomUUID(), package_id: packageId, description: input.description || status.description,
    source: opts.source, created_by: actor?.id ?? null, created_at: new Date().toISOString(),
  };
  await db.table("movements").insert(mv);
  const updated = await recomputePackage(packageId);
  await audit(actor, "movement.create", "package", packageId, {
    tracking: pkg.tracking, status: status.id, occurred_at: mv.occurred_at, location: mv.location, source: opts.source,
  });
  // Solo se notifica si el movimiento pasa a ser el estado vigente (no al cargar historial atrasado).
  if (opts.notify && status.notify && updated.status_code === status.id) await notifyStatusChange(updated, status, mv);
  return mv;
}

export async function deleteMovement(movementId: string, actor: Actor) {
  const db = getDb();
  const mv = await db.table("movements").get(movementId);
  if (!mv) return;
  const remaining = (await db.table("movements").all({ package_id: mv.package_id })).length;
  if (remaining <= 1) throw new Error("Un paquete debe conservar al menos un movimiento");
  await db.table("movements").remove(movementId);
  await recomputePackage(mv.package_id);
  await audit(actor, "movement.delete", "package", mv.package_id, { status: mv.status_code, occurred_at: mv.occurred_at, location: mv.location });
}

export const sortMovements = (ms: Movement[]) =>
  [...ms].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.created_at.localeCompare(b.created_at));

/** El estado vigente es el del movimiento más reciente (por fecha del evento). */
export async function recomputePackage(packageId: string): Promise<Package> {
  const db = getDb();
  const statuses = statusIndex(await getStatuses());
  const ms = sortMovements(await db.table("movements").all({ package_id: packageId }));
  const last = ms[ms.length - 1];
  if (!last) return (await db.table("packages").get(packageId))!;
  const received = ms.find((m) => statuses.get(m.status_code)?.phase !== "prealerta");
  const lastStatus = statuses.get(last.status_code);
  return db.table("packages").update(packageId, {
    status_code: last.status_code, current_location: last.location, current_country: last.country,
    received_at: received?.occurred_at ?? null,
    delivered_at: lastStatus?.is_final ? last.occurred_at : null,
    updated_at: new Date().toISOString(),
  });
}

export async function getTrackingData(tracking: string) {
  const db = getDb();
  const pkg = await db.table("packages").findOne({ tracking: normalizeTracking(tracking) });
  if (!pkg) return null;
  const [movements, statuses, customer, shipment] = await Promise.all([
    db.table("movements").all({ package_id: pkg.id }),
    getStatuses(),
    db.table("customers").get(pkg.customer_id),
    pkg.shipment_id ? db.table("shipments").get(pkg.shipment_id) : Promise.resolve(null),
  ]);
  const siblings = pkg.shipment_id ? (await db.table("packages").all({ shipment_id: pkg.shipment_id })).filter((p) => p.customer_id === pkg.customer_id).length : 1;
  return { pkg, movements: sortMovements(movements), statuses, customer, shipment, siblings };
}
export type TrackingData = NonNullable<Awaited<ReturnType<typeof getTrackingData>>>;

export function phaseOf(pkg: Package, statuses: Map<string, Status>): Phase {
  return statuses.get(pkg.status_code)?.phase ?? "incidencia";
}

// ── Embarques ──
export async function assignToShipment(shipmentId: string | null, packageIds: string[], actor: Actor) {
  const db = getDb();
  for (const id of packageIds) {
    await db.table("packages").update(id, { shipment_id: shipmentId, updated_at: new Date().toISOString() });
    await audit(actor, shipmentId ? "shipment.assign" : "shipment.unassign", "package", id, { shipment_id: shipmentId });
  }
}

/** Aplica el mismo movimiento a todos los paquetes de un embarque. */
export async function addShipmentMovement(shipment: Shipment, input: MovementInput, actor: Actor, notify: boolean) {
  const db = getDb();
  const pkgs = await db.table("packages").all({ shipment_id: shipment.id });
  for (const p of pkgs) await addMovement(p.id, input, actor, { notify, source: "embarque" });
  const patch: Partial<Shipment> = { status_code: input.status_code, updated_at: new Date().toISOString() };
  if (input.status_code === "DESPACHADO" && !shipment.departure_at) patch.departure_at = input.occurred_at;
  await db.table("shipments").update(shipment.id, patch);
  await audit(actor, "shipment.movement", "shipment", shipment.id, { status: input.status_code, packages: pkgs.length });
  return pkgs.length;
}
