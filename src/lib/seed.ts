// DATOS DE DEMOSTRACIÓN — todos los clientes, paquetes y embarques son ficticios
// y están marcados con is_demo = true. Las cuentas usan el dominio reservado .test.
import { randomUUID } from "node:crypto";
import { DEFAULT_STATUSES } from "./statuses";
import { hashPassword } from "./passwords";
import type { Address, Credential, Customer, Movement, Notification, Package, Profile, Shipment, Tables } from "./types";

export const DEMO_ACCOUNTS = [
  { email: "cliente@aducarga.test", password: "Demo2026!", role: "client" as const, customer: "juan" },
  { email: "maria@aducarga.test", password: "Demo2026!", role: "client" as const, customer: "maria" },
  { email: "admin@aducarga.test", password: "Admin2026!", role: "admin" as const, customer: null },
  { email: "operador@aducarga.test", password: "Operador2026!", role: "operator" as const, customer: null },
];

const ORIGIN = { location: "Almacén casillero internacional · Miami, FL", country: "Estados Unidos" };
const at = (ddmm: string, hhmm: string) => {
  const [dd, mm, yyyy = "2026"] = ddmm.split("/");
  return new Date(`${yyyy}-${mm}-${dd}T${hhmm}:00-04:00`).toISOString();
};
const st = (code: string) => DEFAULT_STATUSES.find((s) => s.id === code)!;

type Step = [code: string, date: string, time: string, location?: string, country?: string, notes?: string, description?: string];

export type SeedData = { [K in keyof Tables]: Tables[K][] } & { sequences: Record<string, number> };

export async function buildSeed(): Promise<SeedData> {
  const now = new Date().toISOString();
  const c = (key: string, full_name: string, locker: string, city: string, state: string, phone: string, document_id: string): Customer & { key: string } => ({
    key, id: randomUUID(), locker_code: locker, full_name, document_id, email: `${key}@aducarga.test`, phone, city, state,
    notes: "Cliente de demostración", is_demo: true, created_at: at("01/09", "10:00"), updated_at: now,
  });
  const cust = {
    juan: c("juan", "Juan Pérez", "CAS-01025", "Caracas", "Distrito Capital", "+58 412-000-0125", "V-00.000.125"),
    maria: c("maria", "María González", "CAS-01031", "Valencia", "Carabobo", "+58 414-000-0131", "V-00.000.131"),
    carlos: c("carlos", "Carlos Rodríguez", "CAS-01044", "Maracaibo", "Zulia", "+58 424-000-0144", "V-00.000.144"),
    ana: c("ana", "Ana Martínez", "CAS-01052", "Barquisimeto", "Lara", "+58 416-000-0152", "V-00.000.152"),
    luis: c("luis", "Luis Hernández", "CAS-01067", "Mérida", "Mérida", "+58 426-000-0167", "V-00.000.167"),
  };
  cust.juan.email = "cliente@aducarga.test";
  cust.maria.email = "maria@aducarga.test";

  const addresses: Address[] = Object.values(cust).map((cu) => ({
    id: randomUUID(), customer_id: cu.id, label: "Casa", recipient: cu.full_name,
    line1: "Dirección de demostración", city: cu.city, state: cu.state, reference: "Datos ficticios",
    phone: cu.phone, is_default: true, created_at: cu.created_at,
  }));
  const addrOf = (cid: string) => addresses.find((a) => a.customer_id === cid)!.id;

  // ── Embarques ──
  const ship = (code: string, mode: Shipment["mode"], reference: string, departure: string | null, eta: string, status: string | null, notes: string): Shipment => ({
    id: randomUUID(), code, mode, carrier: mode === "aereo" ? "Carga aérea consolidada (demo)" : "Naviera consolidada (demo)",
    reference, origin: "Miami, FL", destination: mode === "aereo" ? "Maiquetía, La Guaira" : "Puerto Cabello, Carabobo",
    departure_at: departure, eta, status_code: status, notes, is_demo: true, created_at: now, updated_at: now,
  });
  const shipments = {
    s38: ship("EMB-2026-0038", "aereo", "AWB 000-00000038", at("14/10", "22:00"), "2026-10-17", "ENTREGADO", "Embarque cerrado"),
    s41: ship("EMB-2026-0041", "aereo", "AWB 000-00000041", at("30/10", "21:30"), "2026-11-03", "ARRIBO_VENEZUELA", "Arribó a Maiquetía"),
    s45: ship("EMB-2026-0045", "aereo", "AWB 000-00000045", at("09/11", "20:15"), "2026-11-12", "TRANSITO_INTERNACIONAL", "Vuelo consolidado semanal"),
    s46: ship("EMB-2026-0046", "maritimo", "BL pendiente", null, "2026-12-05", null, "Consolidando carga marítima"),
  };

  const packages: Package[] = [];
  const movements: Movement[] = [];
  const pkg = (
    tracking: string, cu: Customer, shipment: Shipment | null, description: string, store: string, weight: number,
    dims: [number, number, number], pieces: number, value: number, eta: string | null, steps: Step[],
  ) => {
    const id = randomUUID();
    const ms: Movement[] = steps.map(([code, dd, hh, location, country, notes, description]) => ({
      id: randomUUID(), package_id: id, status_code: code, occurred_at: at(dd, hh),
      location: location ?? ORIGIN.location, country: country ?? ORIGIN.country,
      description: description ?? st(code).description, notes: notes ?? "", source: "admin", created_by: null, created_at: at(dd, hh),
    }));
    const last = ms[ms.length - 1];
    const received = ms.find((m) => st(m.status_code).phase !== "prealerta");
    packages.push({
      id, tracking, customer_id: cu.id, shipment_id: shipment?.id ?? null, address_id: addrOf(cu.id), description, store,
      carrier_tracking: `1Z${tracking.replace(/\D/g, "").slice(-8)}DEMO`, origin: "Casillero internacional",
      destination_city: cu.city, destination_state: cu.state, weight_kg: weight, length_cm: dims[0], width_cm: dims[1], height_cm: dims[2],
      pieces, declared_value_usd: value, photos: [], status_code: last.status_code, current_location: last.location, current_country: last.country,
      received_at: received?.occurred_at ?? null, estimated_delivery: eta, delivered_at: last.status_code === "ENTREGADO" ? last.occurred_at : null,
      is_demo: true, created_at: ms[0].occurred_at, updated_at: last.occurred_at,
    });
    movements.push(...ms);
  };

  const VE_AIR = "Aeropuerto Internacional de Maiquetía, La Guaira";
  const CCS_HUB = "Centro de distribución nacional · Caracas";

  // Paquete del ejemplo del brief
  pkg("ADU-2026-000125", cust.juan, shipments.s45, "Zapatos deportivos y accesorios", "Amazon", 4.5, [45, 35, 25], 2, 186, "2026-11-18", [
    ["RECIBIDO_CASILLERO", "05/11", "10:42"],
    ["EN_PROCESAMIENTO", "06/11", "09:15", undefined, undefined, "", "Procesamiento completado: mercancía verificada e identificada."],
    ["LISTO_DESPACHO", "07/11", "16:30"],
    ["DESPACHADO", "09/11", "20:15", undefined, undefined, "Embarque aéreo EMB-2026-0045"],
    ["TRANSITO_INTERNACIONAL", "10/11", "06:05", "En vuelo hacia Venezuela", "Internacional"],
  ]);
  pkg("ADU-2026-000126", cust.juan, null, "Accesorios de computación", "Best Buy", 1.2, [30, 20, 10], 1, 74.5, null, [
    ["CASILLERO_NOTIFICADO", "08/11", "19:20", "Compra registrada por el cliente", "Estados Unidos"],
    ["RECIBIDO_CASILLERO", "10/11", "11:05"],
  ]);
  pkg("ADU-2026-000118", cust.juan, shipments.s38, "Repuestos de vehículo", "eBay", 7.8, [60, 40, 30], 1, 240, "2026-10-21", [
    ["RECIBIDO_CASILLERO", "10/10", "09:00"], ["EN_PROCESAMIENTO", "11/10", "10:00"], ["LISTO_DESPACHO", "13/10", "15:00"],
    ["DESPACHADO", "14/10", "22:00"], ["ARRIBO_VENEZUELA", "15/10", "08:10", VE_AIR, "Venezuela"],
    ["LIBERADO_ADUANA", "17/10", "14:00", VE_AIR, "Venezuela"], ["CENTRO_DISTRIBUCION", "18/10", "09:30", CCS_HUB, "Venezuela"],
    ["EN_RUTA_ENTREGA", "20/10", "08:45", "Caracas, Distrito Capital", "Venezuela"],
    ["ENTREGADO", "20/10", "13:20", "Caracas, Distrito Capital", "Venezuela", "Recibido por el titular."],
  ]);
  pkg("ADU-2026-000119", cust.maria, shipments.s41, "Electrodoméstico pequeño (licuadora)", "Walmart", 6.1, [50, 35, 35], 1, 129, "2026-11-14", [
    ["RECIBIDO_CASILLERO", "24/10", "13:10"], ["INSPECCIONADO", "26/10", "11:00"], ["LISTO_DESPACHO", "28/10", "17:00"],
    ["DESPACHADO", "30/10", "21:30"], ["ARRIBO_VENEZUELA", "03/11", "07:50", VE_AIR, "Venezuela"],
    ["EN_ADUANA", "04/11", "10:00", VE_AIR, "Venezuela", "Revisión documental en curso."],
  ]);
  pkg("ADU-2026-000121", cust.carlos, shipments.s41, "Ropa y calzado", "Shein", 3.2, [40, 30, 15], 3, 98, "2026-11-08", [
    ["RECIBIDO_CASILLERO", "22/10", "10:00"], ["EN_PROCESAMIENTO", "23/10", "09:00"], ["LISTO_DESPACHO", "28/10", "17:00"],
    ["DESPACHADO", "30/10", "21:30"], ["ARRIBO_VENEZUELA", "03/11", "07:50", VE_AIR, "Venezuela"],
    ["LIBERADO_ADUANA", "05/11", "15:20", VE_AIR, "Venezuela"], ["CENTRO_DISTRIBUCION", "06/11", "09:00", CCS_HUB, "Venezuela"],
    ["TRANSITO_NACIONAL", "06/11", "18:00", "Ruta Caracas – Maracaibo", "Venezuela"],
    ["EN_RUTA_ENTREGA", "08/11", "08:30", "Maracaibo, Zulia", "Venezuela"],
    ["ENTREGADO", "08/11", "12:10", "Maracaibo, Zulia", "Venezuela", "Entregado a familiar autorizado."],
  ]);
  pkg("ADU-2026-000122", cust.ana, shipments.s41, "Suplementos y vitaminas", "iHerb", 2.4, [30, 25, 20], 1, 87, "2026-11-10", [
    ["RECIBIDO_CASILLERO", "23/10", "15:00"], ["LISTO_DESPACHO", "28/10", "17:00"], ["DESPACHADO", "30/10", "21:30"],
    ["ARRIBO_VENEZUELA", "03/11", "07:50", VE_AIR, "Venezuela"], ["LIBERADO_ADUANA", "05/11", "15:20", VE_AIR, "Venezuela"],
    ["CENTRO_DISTRIBUCION", "06/11", "09:00", CCS_HUB, "Venezuela"],
    ["TRANSITO_NACIONAL", "08/11", "07:00", "Ruta Caracas – Barquisimeto", "Venezuela"],
    ["EN_RUTA_ENTREGA", "10/11", "08:20", "Barquisimeto, Lara", "Venezuela"],
  ]);
  pkg("ADU-2026-000123", cust.luis, shipments.s41, "Herramientas eléctricas", "Home Depot", 9.6, [55, 40, 30], 2, 310, "2026-11-13", [
    ["RECIBIDO_CASILLERO", "25/10", "11:30"], ["EN_PROCESAMIENTO", "26/10", "10:00"], ["LISTO_DESPACHO", "28/10", "17:00"],
    ["DESPACHADO", "30/10", "21:30"], ["ARRIBO_VENEZUELA", "03/11", "07:50", VE_AIR, "Venezuela"],
    ["LIBERADO_ADUANA", "06/11", "16:00", VE_AIR, "Venezuela"], ["CENTRO_DISTRIBUCION", "09/11", "10:15", CCS_HUB, "Venezuela"],
  ]);
  pkg("ADU-2026-000127", cust.maria, shipments.s46, "Juego de ollas", "Amazon", 8.3, [50, 50, 30], 1, 145, null, [
    ["RECIBIDO_CASILLERO", "06/11", "14:00"], ["INSPECCIONADO", "07/11", "10:30"], ["LISTO_DESPACHO", "08/11", "12:00"],
  ]);
  pkg("ADU-2026-000128", cust.ana, null, "Teléfono celular", "Amazon", 0.6, [20, 12, 8], 1, 299, null, [
    ["CASILLERO_NOTIFICADO", "09/11", "21:40", "Compra registrada por el cliente", "Estados Unidos"],
  ]);
  pkg("ADU-2026-000124", cust.carlos, null, "Juguetes", "Target", 2.9, [40, 30, 25], 2, 64, null, [
    ["RECIBIDO_CASILLERO", "08/11", "16:20"], ["EN_PROCESAMIENTO", "09/11", "09:40"], ["INSPECCIONADO", "10/11", "10:00"],
  ]);

  // ── Cuentas ──
  const profiles: Profile[] = [];
  const credentials: Credential[] = [];
  for (const a of DEMO_ACCOUNTS) {
    const id = randomUUID();
    const cu = a.customer ? cust[a.customer as keyof typeof cust] : null;
    profiles.push({
      id, email: a.email, role: a.role, customer_id: cu?.id ?? null,
      full_name: cu?.full_name ?? (a.role === "admin" ? "Administrador ADUCARGA (demo)" : "Operador de almacén (demo)"),
      created_at: at("01/09", "10:00"), last_login_at: null,
    });
    credentials.push({ id, password_hash: await hashPassword(a.password) });
  }

  const juanPkgs = packages.filter((p) => p.customer_id === cust.juan.id);
  const notifications: Notification[] = [
    ["Tu paquete llegó a nuestro casillero.", juanPkgs[0], "05/11", "10:43", true],
    ["Tu paquete está listo para despacho.", juanPkgs[0], "07/11", "16:31", true],
    ["Tu paquete salió hacia Venezuela.", juanPkgs[0], "09/11", "20:16", false],
    ["Tu paquete llegó a nuestro casillero.", juanPkgs[1], "10/11", "11:06", false],
  ].map(([title, p, dd, hh, read]) => {
    const pk = p as Package;
    return {
      id: randomUUID(), customer_id: cust.juan.id, package_id: pk.id, title: title as string,
      body: `Guía ${pk.tracking} · ${pk.description}`, channel: "in_app" as const, delivery_status: "entregada" as const,
      read_at: read ? at(dd as string, hh as string) : null, error: null, created_at: at(dd as string, hh as string),
    };
  });

  return {
    statuses: DEFAULT_STATUSES.map((s) => ({ ...s })),
    profiles, credentials,
    customers: Object.values(cust).map(({ key: _k, ...rest }) => rest),
    addresses, packages, movements,
    shipments: Object.values(shipments),
    notifications, audit_logs: [], messages: [],
    sequences: { "tracking-2026": 131, locker: 1100, "shipment-2026": 46 },
  };
}
