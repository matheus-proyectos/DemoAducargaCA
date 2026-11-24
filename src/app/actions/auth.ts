"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createCredentials, endSession, isStaff, startSession, verifyCredentials } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { back, firstError, registerSchema, str } from "@/lib/forms";
import { audit } from "@/lib/services/audit";
import { generateLockerCode } from "@/lib/services/packages";

/** Evita redirecciones abiertas: solo rutas internas. */
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "");

// Limitador simple de intentos por email (en memoria; en producción usar Redis/Upstash o el rate limit de Supabase Auth).
const attempts = new Map<string, { n: number; until: number }>();

export async function login(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = safeNext(str(fd, "next"));
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const a = attempts.get(email);
  if (a && a.n >= 5 && a.until > Date.now()) back(`/login${q}`, "error", "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
  if (!email || !password) back(`/login${q}`, "error", "Introduce tu correo y contraseña.");

  const profile = await verifyCredentials(email, password);
  if (!profile) {
    const cur = attempts.get(email);
    attempts.set(email, { n: (cur && cur.until > Date.now() ? cur.n : 0) + 1, until: Date.now() + 10 * 60_000 });
    back(`/login${q}`, "error", "Correo o contraseña incorrectos.");
  }
  attempts.delete(email);
  await startSession(profile);
  await audit(profile, "auth.login", "profile", profile.id);
  const home = isStaff(profile) ? "/admin" : "/cuenta";
  redirect(next && (isStaff(profile) ? next.startsWith("/admin") : next.startsWith("/cuenta")) ? next : home);
}

export async function register(fd: FormData) {
  const parsed = registerSchema.safeParse({
    full_name: str(fd, "full_name"), email: str(fd, "email").toLowerCase(), phone: str(fd, "phone"),
    document_id: str(fd, "document_id"), city: str(fd, "city"), state: str(fd, "state"), password: String(fd.get("password") ?? ""),
  });
  if (!parsed.success) back("/registro", "error", firstError(parsed.error));
  const v = parsed.data;
  if (String(fd.get("password_confirm") ?? "") !== v.password) back("/registro", "error", "Las contraseñas no coinciden.");
  if (!fd.get("terms")) back("/registro", "error", "Debes aceptar el tratamiento de tus datos para continuar.");

  const db = getDb();
  if (await db.table("profiles").findOne({ email: v.email })) back("/registro", "error", "Ya existe una cuenta con ese correo. Inicia sesión.");

  let userId: string;
  try {
    userId = await createCredentials(v.email, v.password);
  } catch (e) {
    back("/registro", "error", `No se pudo crear la cuenta: ${(e as Error).message}`);
  }
  const now = new Date().toISOString();

  // Si el personal ya registró a este cliente (mismo email) se vincula; si no, se crea.
  let customer = await db.table("customers").findOne({ email: v.email });
  const linked = customer ? await db.table("profiles").findOne({ customer_id: customer.id }) : null;
  if (!customer || linked) {
    customer = await db.table("customers").insert({
      id: randomUUID(), locker_code: await generateLockerCode(), full_name: v.full_name, document_id: v.document_id ?? "",
      email: v.email, phone: v.phone, city: v.city, state: v.state, notes: "", is_demo: false, created_at: now, updated_at: now,
    });
    await db.table("addresses").insert({
      id: randomUUID(), customer_id: customer.id, label: "Principal", recipient: v.full_name, line1: "", city: v.city,
      state: v.state, reference: "", phone: v.phone, is_default: true, created_at: now,
    });
  }
  const profile = await db.table("profiles").insert({
    id: userId, email: v.email, role: "client", customer_id: customer.id, full_name: v.full_name, created_at: now, last_login_at: null,
  });
  await audit(profile, "auth.register", "customer", customer.id, { locker_code: customer.locker_code });
  await startSession(profile);
  redirect("/cuenta?ok=" + encodeURIComponent(`¡Bienvenido! Tu código de casillero es ${customer.locker_code}.`));
}

export async function logout() {
  endSession();
  redirect("/");
}
