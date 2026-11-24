// Utilidades de formularios + esquemas de validación (zod).
import { redirect } from "next/navigation";
import { z } from "zod";

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const optNum = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

/** Redirige con un mensaje flash en la URL (?ok= / ?error=). */
export function back(path: string, kind: "ok" | "error", msg: string): never {
  const [base, hash] = path.split("#");
  const sep = base.includes("?") ? "&" : "?";
  redirect(`${base}${sep}${kind}=${encodeURIComponent(msg)}${hash ? `#${hash}` : ""}`);
}

export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Datos no válidos";

const phone = z.string().max(30, "Teléfono demasiado largo");

export const registerSchema = z.object({
  full_name: z.string().min(3, "Indica tu nombre completo").max(120),
  email: z.string().email("Correo electrónico no válido").max(160),
  phone: phone.min(7, "Indica un teléfono de contacto"),
  document_id: z.string().max(30).optional().default(""),
  city: z.string().min(2, "Indica tu ciudad").max(80),
  state: z.string().min(2, "Indica tu estado").max(80),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Za-z]/, "La contraseña debe incluir letras")
    .regex(/\d/, "La contraseña debe incluir al menos un número"),
});

export const customerSchema = z.object({
  full_name: z.string().min(3, "Nombre demasiado corto").max(120),
  email: z.string().email("Correo electrónico no válido").max(160),
  phone: phone,
  document_id: z.string().max(30),
  city: z.string().max(80),
  state: z.string().max(80),
  notes: z.string().max(1000),
});

export const packageSchema = z.object({
  customer_id: z.string().min(1, "Selecciona un cliente"),
  description: z.string().min(3, "Describe el contenido del paquete").max(240),
  store: z.string().max(80),
  carrier_tracking: z.string().max(80),
  destination_city: z.string().min(2, "Indica la ciudad de destino").max(80),
  destination_state: z.string().max(80),
  weight_kg: z.number({ invalid_type_error: "Peso no válido" }).positive("El peso debe ser mayor que 0").max(5000),
  length_cm: z.number().positive().max(1000).nullable(),
  width_cm: z.number().positive().max(1000).nullable(),
  height_cm: z.number().positive().max(1000).nullable(),
  pieces: z.number().int("Número de piezas no válido").min(1).max(999),
  declared_value_usd: z.number().min(0).max(1_000_000).nullable(),
  estimated_delivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const prealertSchema = z.object({
  description: z.string().min(3, "Describe tu compra").max(240),
  store: z.string().min(2, "Indica la tienda").max(80),
  carrier_tracking: z.string().min(4, "Indica el tracking del transportista (USPS, UPS, FedEx, Amazon…)").max(80),
  declared_value_usd: z.number().min(0).max(1_000_000).nullable(),
});

export const movementSchema = z.object({
  status_code: z.string().min(1, "Selecciona un estado"),
  occurred_at: z.string().min(1),
  location: z.string().min(2, "Indica la ubicación").max(160),
  country: z.string().min(2, "Indica el país").max(80),
  description: z.string().max(400),
  notes: z.string().max(600),
});
