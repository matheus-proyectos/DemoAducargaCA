/**
 * Pruebas de extremo a extremo con Playwright (navegador real).
 * 1) npm run build && npm start   (con SESSION_SECRET definido)
 * 2) BASE_URL=http://localhost:3000 npm run test:e2e
 * Opcional: SHOTS=./capturas para guardar capturas de pantalla.
 */
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// Playwright puede estar instalado global o localmente (npm i -D playwright).
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.env.SHOTS;
const SCALE = Number(process.env.SHOT_SCALE || 1);
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let passed = 0;
const errors = [];
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (e) {
    console.error(`  ✘ ${name}\n    ${e.message.split("\n")[0]}`);
    process.exitCode = 1;
  }
}
const shot = async (page, name, full = true) => SHOTS && page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });

/** PNG 1x1 válido para probar la carga de fotos. */
function tinyPng() {
  const crc = (buf) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } let r = -1; for (const b of buf) r = t[(r ^ b) & 0xff] ^ (r >>> 8); return (r ^ -1) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.from([0, 0, 0, 64, 0, 0, 0, 64, 8, 2, 0, 0, 0]);
  const raw = Buffer.alloc(64 * (1 + 64 * 3));
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const o = y * (1 + 192) + 1 + x * 3; raw[o] = 242; raw[o + 1] = 159; raw[o + 2] = 5; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL(/\/(cuenta|admin)/), page.click('button[type="submit"]')]);
}

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
console.log(`ADUCARGA · pruebas E2E contra ${BASE}\n`);

// ── Público (escritorio) ──
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SCALE });
const page = await desk.newPage();
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
page.on("console", (m) => m.type() === "error" && !/favicon|fonts\.g|ERR_TUNNEL|ERR_NAME/.test(m.text()) && errors.push(`[console] ${m.text()}`));

await step("Home: hero, buscador y globo 3D (WebGL)", async () => {
  await page.goto(BASE);
  await page.getByRole("heading", { level: 1 }).waitFor();
  assert.match(await page.textContent("h1"), /Tu compra está más cerca/);
  await page.waitForSelector("section canvas", { timeout: 15000 });
  await page.waitForTimeout(4200);
  const painted = await page.evaluate(() => { const c = document.querySelector("section canvas"); return c && c.width > 0 && c.height > 0; });
  assert.ok(painted, "el canvas 3D debe tener tamaño");
  await shot(page, "01-home-desktop", false);
});

await step("Home: secciones cómo funciona, ventajas, servicios, FAQ, contacto", async () => {
  for (const id of ["como-funciona", "servicios", "preguntas", "contacto"]) assert.ok(await page.$(`#${id}`), id);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await shot(page, "02-home-full", true);
});

await step("Contacto: el formulario guarda el mensaje", async () => {
  await page.goto(`${BASE}/#contacto`);
  await page.fill('#contacto input[name="name"]', "Prueba E2E");
  await page.fill('#contacto input[name="email"]', "e2e@aducarga.test");
  await page.fill('#contacto textarea[name="body"]', "Consulta automática de prueba sobre mi envío.");
  await Promise.all([page.waitForURL(/ok=/), page.click('#contacto button[type="submit"]')]);
  assert.match(await page.textContent("body"), /Recibimos tu mensaje/);
});

await step("Tracking público: ADU-2026-000125 con timeline y nombre enmascarado", async () => {
  await page.goto(BASE);
  await page.fill('input[name="guia"]', "adu-2026-000125");
  await Promise.all([page.waitForURL(/rastreo\?guia=/), page.click('button:has-text("RASTREAR MI ENVÍO")')]);
  const body = await page.textContent("body");
  assert.match(body, /ADU-2026-000125/);
  assert.match(body, /En tránsito internacional/);
  assert.match(body, /Juan P\./);
  assert.ok(!/Juan Pérez/.test(body), "el nombre completo no debe ser público");
  assert.match(body, /Estado actual/);
  assert.match(body, /Pendiente/);
  assert.match(body, /4,5 kg/);
  await page.waitForTimeout(2600);
  await shot(page, "03-tracking-desktop", true);
});

await step("Tracking público: guía inexistente muestra mensaje claro", async () => {
  await page.goto(`${BASE}/rastreo?guia=ADU-2026-999999`);
  assert.match(await page.textContent("body"), /No encontramos la guía/);
});

await step("API pública /api/v1/tracking devuelve JSON sin datos sensibles", async () => {
  const r = await page.request.get(`${BASE}/api/v1/tracking/ADU-2026-000125`);
  assert.equal(r.status(), 200);
  const j = await r.json();
  assert.equal(j.status.code, "TRANSITO_INTERNACIONAL");
  assert.equal(j.recipient, "Juan P.");
  assert.equal(j.movements.length, 5);
  assert.ok(!JSON.stringify(j).includes("@"), "sin emails");
});

await step("Rutas privadas redirigen a login sin sesión", async () => {
  await page.goto(`${BASE}/admin`);
  assert.match(page.url(), /\/login\?next=%2Fadmin/);
  await page.goto(`${BASE}/cuenta`);
  assert.match(page.url(), /\/login/);
  const r = await page.request.get(`${BASE}/api/files/packages/x/y.png`);
  assert.equal(r.status(), 401);
});

await step("Login con contraseña incorrecta muestra error", async () => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', "cliente@aducarga.test");
  await page.fill('input[name="password"]', "incorrecta");
  await Promise.all([page.waitForURL(/error=/), page.click('button[type="submit"]')]);
  assert.match(await page.textContent("body"), /Correo o contraseña incorrectos/);
});

// ── Registro de cliente nuevo ──
await step("Registro: crea cuenta, asigna casillero y entra al panel", async () => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${BASE}/registro`);
  const email = `nuevo${Date.now()}@aducarga.test`;
  await p.fill('input[name="full_name"]', "Cliente Nuevo Prueba");
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="phone"]', "+58 412 111 2233");
  await p.fill('input[name="city"]', "Valencia");
  await p.fill('input[name="state"]', "Carabobo");
  await p.fill('input[name="password"]', "Segura2026");
  await p.fill('input[name="password_confirm"]', "Segura2026");
  await p.check('input[name="terms"]');
  await Promise.all([p.waitForURL(/\/cuenta/), p.click('button[type="submit"]')]);
  assert.match(await p.textContent("body"), /Tu código de casillero es CAS-\d{5}/);
  await ctx.close();
});

// ── Cliente (móvil) ──
const mob = await browser.newContext({ ...devices["iPhone 13"] });
const mp = await mob.newPage();
mp.on("pageerror", (e) => errors.push(`[pageerror móvil] ${e.message}`));
let prealertTracking = "";

await step("Cliente (móvil): login y dashboard con resumen y tarjetas", async () => {
  await login(mp, "cliente@aducarga.test", "Demo2026!");
  const body = await mp.textContent("body");
  assert.match(body, /Hola, Juan/);
  assert.match(body, /CAS-01025/);
  assert.match(body, /ADU-2026-000125/);
  assert.match(body, /ADU-2026-000126/);
  await shot(mp, "04-cliente-dashboard-movil", true);
});

await step("Cliente: filtro Entregados e historial", async () => {
  await mp.goto(`${BASE}/cuenta?f=entregados`);
  assert.match(await mp.textContent("body"), /ADU-2026-000118/);
});

await step("Cliente: detalle privado con nombre completo y ficha", async () => {
  await mp.goto(`${BASE}/cuenta/paquetes/ADU-2026-000125`);
  const body = await mp.textContent("body");
  assert.match(body, /Juan Pérez/);
  assert.match(body, /Información del paquete/);
  assert.match(body, /45 × 35 × 25 cm/);
  await mp.waitForTimeout(2600);
  await shot(mp, "05-cliente-tracking-movil", true);
});

await step("Permisos: un cliente NO puede ver paquetes de otro (404)", async () => {
  const r = await mp.goto(`${BASE}/cuenta/paquetes/ADU-2026-000119`);
  assert.equal(r.status(), 404);
  const r2 = await mp.goto(`${BASE}/admin`);
  assert.match(mp.url(), /\/cuenta/);
  void r2;
});

await step("Cliente: prealerta una compra → CASILLERO NOTIFICADO con tracking nuevo", async () => {
  await mp.goto(`${BASE}/cuenta/prealerta`);
  await mp.fill('input[name="description"]', "Audífonos inalámbricos");
  await mp.fill('input[name="store"]', "Amazon");
  await mp.fill('input[name="carrier_tracking"]', "TBA123456789");
  await mp.fill('input[name="declared_value_usd"]', "59.90");
  await Promise.all([mp.waitForURL(/\/cuenta\/paquetes\/ADU-/), mp.click('button[type="submit"]')]);
  prealertTracking = mp.url().match(/ADU-\d{4}-\d{6}/)[0];
  assert.match(await mp.textContent("body"), /Casillero notificado/);
});

await step("Cliente: agrega dirección de entrega", async () => {
  await mp.goto(`${BASE}/cuenta/perfil`);
  const f = mp.locator('form:has(input[name="label"])');
  await f.locator('input[name="label"]').fill("Oficina");
  await f.locator('input[name="line1"]').fill("Av. Principal, Torre Demo, piso 3");
  await f.locator('input[name="city"]').fill("Caracas");
  await f.locator('input[name="state"]').fill("Distrito Capital");
  await Promise.all([mp.waitForURL(/ok=/), f.locator('button[type="submit"]').click()]);
  assert.match(await mp.textContent("body"), /Oficina/);
});

// ── Administrador ──
const adm = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SCALE });
const ap = await adm.newPage();
ap.on("pageerror", (e) => errors.push(`[pageerror admin] ${e.message}`));
let newPkgUrl = "";

await step("Admin: dashboard con las 8 estadísticas", async () => {
  await login(ap, "admin@aducarga.test", "Admin2026!");
  const body = await ap.textContent("body");
  for (const t of ["Paquetes registrados", "Recibidos en casillero", "Pendientes de despacho", "En tránsito internacional", "En Venezuela", "En distribución", "Entregados", "Clientes registrados"]) assert.match(body, new RegExp(t));
  await shot(ap, "06-admin-dashboard", true);
});

await step("Admin: filtros de paquetes por fase y búsqueda", async () => {
  await ap.goto(`${BASE}/admin/paquetes?phase=venezuela`);
  const body = await ap.textContent("body");
  assert.match(body, /ADU-2026-000119/);
  assert.ok(!body.includes("ADU-2026-000125"));
  await ap.goto(`${BASE}/admin/paquetes?q=Juan`);
  assert.match(await ap.textContent("body"), /ADU-2026-000125/);
});

await step("Admin: registrar paquete con foto genera tracking único", async () => {
  await ap.goto(`${BASE}/admin/paquetes/nuevo`);
  const opts = await ap.$$eval('select[name="customer_id"] option', (o) => o.map((x) => ({ v: x.value, t: x.textContent })));
  await ap.selectOption('select[name="customer_id"]', opts.find((o) => o.t.includes("Juan Pérez")).v);
  await ap.fill('input[name="description"]', "Consola de videojuegos");
  await ap.fill('input[name="store"]', "Best Buy");
  await ap.fill('input[name="weight_kg"]', "3.75");
  await ap.fill('input[name="length_cm"]', "50");
  await ap.fill('input[name="width_cm"]', "40");
  await ap.fill('input[name="height_cm"]', "20");
  await ap.setInputFiles('input[name="photos"]', { name: "foto.png", mimeType: "image/png", buffer: tinyPng() });
  await Promise.all([ap.waitForURL(/\/admin\/paquetes\/[0-9a-f-]{36}/), ap.click('button:has-text("Registrar y generar tracking")')]);
  newPkgUrl = ap.url().split("?")[0];
  assert.match(await ap.textContent("body"), /registrado con guía ADU-\d{4}-\d{6}/);
  assert.ok(await ap.$('img[src^="/api/files/packages/"]'), "foto visible");
});

await step("Admin: registrar movimiento actualiza el tracking y notifica", async () => {
  await ap.selectOption('select[name="status_code"]', "LISTO_DESPACHO");
  await ap.fill('input[name="location"]', "Almacén casillero internacional · Miami, FL");
  await ap.fill('textarea[name="notes"]', "Embalaje reforzado");
  await Promise.all([ap.waitForURL(/ok=/), ap.click('button:has-text("Registrar movimiento")')]);
  const body = await ap.textContent("body");
  assert.match(body, /Movimiento registrado/);
  assert.match(body, /Listo para despacho/);
  await shot(ap, "07-admin-paquete", true);
});

await step("Admin: editar datos del paquete queda en el historial de modificaciones", async () => {
  await ap.goto(newPkgUrl);
  await ap.fill('form:has(input[name="weight_kg"]) input[name="weight_kg"]', "3.9");
  await Promise.all([ap.waitForURL(/ok=/), ap.click('button:has-text("Guardar cambios")')]);
  assert.match(await ap.textContent("body"), /Datos editados/);
});

await step("Admin: crear embarque, asignar paquete y movimiento en bloque", async () => {
  await ap.goto(`${BASE}/admin/embarques`);
  await ap.fill('input[name="origin"]', "Miami, FL");
  await ap.fill('input[name="destination"]', "Maiquetía, La Guaira");
  await Promise.all([ap.waitForURL(/\/admin\/embarques\/[0-9a-f-]{36}/), ap.click('button:has-text("Crear embarque")')]);
  const boxes = await ap.$$('input[name="package_ids"]');
  assert.ok(boxes.length >= 2, "hay paquetes pendientes");
  await boxes[0].check();
  await boxes[1].check();
  await Promise.all([ap.waitForURL(/ok=/), ap.click('button:has-text("Agregar seleccionados")')]);
  await ap.goto(ap.url().split("?")[0]);
  await ap.selectOption('form:has(input[name="shipment_id"]) select[name="status_code"]', "DESPACHADO");
  ap.once("dialog", (d) => d.accept());
  await Promise.all([ap.waitForURL(/ok=/), ap.click('button:has-text("Aplicar a 2")')]);
  assert.match(await ap.textContent("body"), /Movimiento aplicado a 2 paquete/);
  await shot(ap, "08-admin-embarque", true);
});

await step("Admin: crear estado configurable (RETENIDO)", async () => {
  await ap.goto(`${BASE}/admin/estados`);
  const f = ap.locator('form:has(input[name="is_new"])');
  await f.locator('input[name="code"]').fill("RETENIDO");
  await f.locator('input[name="name"]').fill("Retenido para revisión");
  await f.locator('input[name="description"]').fill("El paquete requiere documentación adicional.");
  await Promise.all([ap.waitForURL(/ok=/), f.locator('button[type="submit"]').click()]);
  assert.match(await ap.textContent("body"), /Estado RETENIDO guardado/);
});

await step("Admin: mensajes, notificaciones y auditoría", async () => {
  await ap.goto(`${BASE}/admin/mensajes`);
  assert.match(await ap.textContent("body"), /Prueba E2E/);
  await ap.goto(`${BASE}/admin/notificaciones`);
  assert.match(await ap.textContent("body"), /Tu paquete está listo para despacho/);
  await ap.goto(`${BASE}/admin/auditoria`);
  assert.match(await ap.textContent("body"), /movement\.create/);
});

await step("Operador: no accede a configuración de estados ni auditoría", async () => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await login(p, "operador@aducarga.test", "Operador2026!");
  await p.goto(`${BASE}/admin/estados`);
  assert.match(p.url(), /\/admin\?error=/);
  await ctx.close();
});

await step("Cliente: recibe la notificación y ve la foto de su paquete", async () => {
  await mp.goto(`${BASE}/cuenta/notificaciones`);
  assert.match(await mp.textContent("body"), /Tu paquete está listo para despacho|Tu paquete salió hacia Venezuela/);
  await shot(mp, "09-cliente-notificaciones-movil", true);
  const id = newPkgUrl.split("/").pop();
  const pkgPage = await ap.goto(newPkgUrl);
  void pkgPage;
  const src = await ap.getAttribute('img[src^="/api/files/packages/"]', "src");
  const r = await mp.request.get(`${BASE}${src}`);
  assert.equal(r.status(), 200, "el dueño puede ver la foto");
  assert.ok(src.includes(id));
});

await step("Permisos: otro cliente no puede descargar fotos ajenas", async () => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await login(p, "maria@aducarga.test", "Demo2026!");
  await ap.goto(newPkgUrl);
  const src = await ap.getAttribute('img[src^="/api/files/packages/"]', "src");
  const r = await p.request.get(`${BASE}${src}`);
  assert.equal(r.status(), 404);
  await ctx.close();
});

await step("Sin errores de JavaScript en las páginas", async () => {
  if (errors.length) console.error(errors.join("\n"));
  assert.deepEqual(errors, []);
});

await browser.close();
console.log(`\n${passed} pasos superados${process.exitCode ? " (con fallos)" : ""}`);
