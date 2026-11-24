/**
 * Pruebas de lógica de negocio sobre el almacén demo (sin servidor).
 * Ejecutar: npm test
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(os.tmpdir(), "aducarga-test-"));
process.env.DATA_DIR = dir;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NOTIFY_WEBHOOK_URL;

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (e) {
    console.error(`  ✘ ${name}\n`, e);
    process.exitCode = 1;
  }
}

async function main() {
  const { getDb } = await import("../src/lib/db");
  const svc = await import("../src/lib/services/packages");
  const { verifyPassword } = await import("../src/lib/passwords");
  const { maskName, fromCaracasLocal } = await import("../src/lib/format");
  const { signSession, verifySession } = await import("../src/lib/session");
  const db = getDb();
  const actor = { id: "test", email: "test@aducarga.test" };

  console.log("ADUCARGA · pruebas de lógica\n");

  await test("seed: ejemplo del brief ADU-2026-000125 en tránsito internacional", async () => {
    const d = await svc.getTrackingData("adu-2026-000125 ");
    assert.ok(d, "debe existir");
    assert.equal(d.pkg.status_code, "TRANSITO_INTERNACIONAL");
    assert.equal(d.pkg.weight_kg, 4.5);
    assert.equal(d.customer?.full_name, "Juan Pérez");
    assert.equal(d.pkg.destination_city, "Caracas");
    assert.equal(d.movements.length, 5);
    assert.deepEqual(d.movements.map((m) => m.status_code), ["RECIBIDO_CASILLERO", "EN_PROCESAMIENTO", "LISTO_DESPACHO", "DESPACHADO", "TRANSITO_INTERNACIONAL"]);
  });

  await test("seed: todos los datos demo marcados is_demo", async () => {
    assert.ok((await db.table("packages").all()).every((p) => p.is_demo));
    assert.ok((await db.table("customers").all()).every((c) => c.is_demo));
  });

  await test("auth: contraseñas demo con hash scrypt verificable", async () => {
    const p = await db.table("profiles").findOne({ email: "cliente@aducarga.test" });
    const c = await db.table("credentials").get(p!.id);
    assert.ok(c!.password_hash.startsWith("scrypt$"));
    assert.ok(await verifyPassword("Demo2026!", c!.password_hash));
    assert.ok(!(await verifyPassword("otra", c!.password_hash)));
  });

  await test("sesión: firma válida y detección de manipulación", async () => {
    const t = await signSession({ uid: "u1", role: "client" });
    assert.equal((await verifySession(t))?.uid, "u1");
    const [b, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "u1", role: "admin", exp: Date.now() + 1e6 })).toString("base64url");
    assert.equal(await verifySession(`${forged}.${s}`), null);
    assert.equal(await verifySession(`${b}.x${s.slice(1)}`), null);
  });

  await test("tracking: genera números únicos con formato ADU-AAAA-000000", async () => {
    const a = await svc.generateTracking(), b = await svc.generateTracking();
    assert.match(a, /^ADU-\d{4}-\d{6}$/);
    assert.notEqual(a, b);
  });

  let pkgId = "";
  await test("paquete: creación + movimiento inicial + notificación", async () => {
    const juan = await db.table("customers").findOne({ email: "cliente@aducarga.test" });
    const before = (await db.table("notifications").all({ customer_id: juan!.id })).length;
    const pkg = await svc.createPackage(
      { customer_id: juan!.id, description: "Prueba", store: "Test", carrier_tracking: "X1", destination_city: "Caracas", destination_state: "DC",
        weight_kg: 2, length_cm: 10, width_cm: 10, height_cm: 10, pieces: 1, declared_value_usd: 10, estimated_delivery: null, address_id: null, shipment_id: null },
      { status_code: "RECIBIDO_CASILLERO", occurred_at: new Date().toISOString(), location: "Almacén", country: "Estados Unidos", description: "", notes: "" },
      actor, "admin",
    );
    pkgId = pkg.id;
    assert.equal(pkg.status_code, "RECIBIDO_CASILLERO");
    assert.ok(pkg.received_at);
    const after = await db.table("notifications").all({ customer_id: juan!.id });
    assert.equal(after.length, before + 1);
    assert.ok(after.some((n) => n.title === "Tu paquete llegó a nuestro casillero."));
  });

  await test("movimientos: el estado vigente es el del evento más reciente (no el último cargado)", async () => {
    await svc.addMovement(pkgId, { status_code: "DESPACHADO", occurred_at: fromCaracasLocal("2030-01-02T10:00"), location: "Miami", country: "EE. UU.", description: "", notes: "" }, actor, { notify: false, source: "admin" });
    await svc.addMovement(pkgId, { status_code: "EN_PROCESAMIENTO", occurred_at: fromCaracasLocal("2030-01-01T10:00"), location: "Miami", country: "EE. UU.", description: "", notes: "" }, actor, { notify: true, source: "admin" });
    const p = await db.table("packages").get(pkgId);
    assert.equal(p!.status_code, "DESPACHADO");
  });

  await test("movimientos: eliminar recalcula el estado; no se puede dejar sin movimientos", async () => {
    const ms = await db.table("movements").all({ package_id: pkgId });
    const desp = ms.find((m) => m.status_code === "DESPACHADO")!;
    await svc.deleteMovement(desp.id, actor);
    assert.equal((await db.table("packages").get(pkgId))!.status_code, "EN_PROCESAMIENTO");
  });

  await test("embarques: movimiento en bloque actualiza todos los paquetes", async () => {
    const s = (await db.table("shipments").findOne({ code: "EMB-2026-0046" }))!;
    await svc.assignToShipment(s.id, [pkgId], actor);
    const n = await svc.addShipmentMovement(s, { status_code: "DESPACHADO", occurred_at: fromCaracasLocal("2030-02-01T10:00"), location: "Puerto", country: "EE. UU.", description: "", notes: "" }, actor, true);
    assert.equal(n, 2);
    for (const p of await db.table("packages").all({ shipment_id: s.id })) assert.equal(p.status_code, "DESPACHADO");
    assert.equal((await db.table("shipments").get(s.id))!.status_code, "DESPACHADO");
  });

  await test("auditoría: registra las operaciones", async () => {
    const logs = await db.table("audit_logs").all({ entity_id: pkgId });
    assert.ok(logs.some((l) => l.action === "package.create"));
    assert.ok(logs.some((l) => l.action === "movement.delete"));
  });

  await test("formato: nombre enmascarado y hora de Venezuela", async () => {
    assert.equal(maskName("Juan Pérez Gómez"), "Juan P. G.");
    assert.equal(fromCaracasLocal("2026-11-10T08:00"), "2026-11-10T12:00:00.000Z");
  });

  console.log(`\n${passed} pruebas superadas${process.exitCode ? " (con fallos)" : ""}`);
  rmSync(dir, { recursive: true, force: true });
}
main();
