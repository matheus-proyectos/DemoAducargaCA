// Autenticación y autorización del lado del servidor.
// - Modo demo: credenciales con hash scrypt en la tabla `credentials`.
// - Supabase: Supabase Auth (email + contraseña); el rol vive en `profiles`.
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getDb, isSupabaseConfigured } from "./db";
import { supabaseAdmin, supabaseAnon } from "./db/supabase";
import { hashPassword, verifyPassword } from "./passwords";
import { SESSION_COOKIE, SESSION_TTL_MS, signSession, verifySession } from "./session";
import type { Customer, Profile } from "./types";

export type CurrentUser = { profile: Profile; customer: Customer | null };

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const payload = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const db = getDb();
  const profile = await db.table("profiles").get(payload.uid);
  if (!profile) return null;
  const customer = profile.customer_id ? await db.table("customers").get(profile.customer_id) : null;
  return { profile, customer };
});

export const isStaff = (p: Profile) => p.role === "admin" || p.role === "operator";

export async function requireClient(): Promise<{ profile: Profile; customer: Customer }> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/cuenta");
  if (isStaff(u.profile)) redirect("/admin");
  if (!u.customer) redirect("/login?error=" + encodeURIComponent("Tu cuenta no tiene un cliente asociado."));
  return { profile: u.profile, customer: u.customer };
}

export async function requireStaff(): Promise<Profile> {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/admin");
  if (!isStaff(u.profile)) redirect("/cuenta");
  return u.profile;
}

export async function requireAdmin(): Promise<Profile> {
  const p = await requireStaff();
  if (p.role !== "admin") redirect("/admin?error=" + encodeURIComponent("Solo un administrador puede realizar esta acción."));
  return p;
}

export async function startSession(profile: Profile) {
  const token = await signSession({ uid: profile.id, role: profile.role });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/", maxAge: SESSION_TTL_MS / 1000,
  });
  await getDb().table("profiles").update(profile.id, { last_login_at: new Date().toISOString() });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

/** Crea credenciales y devuelve el id de usuario (= id de perfil). */
export async function createCredentials(email: string, password: string): Promise<string> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error(error?.message ?? "No se pudo crear el usuario");
    return data.user.id;
  }
  const id = randomUUID();
  await getDb().table("credentials").insert({ id, password_hash: await hashPassword(password) });
  return id;
}

/** Verifica email + contraseña y devuelve el perfil, o null. */
export async function verifyCredentials(email: string, password: string): Promise<Profile | null> {
  const db = getDb();
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAnon().auth.signInWithPassword({ email, password });
    if (error || !data.user) return null;
    return db.table("profiles").get(data.user.id);
  }
  const profile = await db.table("profiles").findOne({ email });
  if (!profile) {
    await hashPassword(password); // tiempo constante aproximado ante emails inexistentes
    return null;
  }
  const cred = await db.table("credentials").get(profile.id);
  return cred && (await verifyPassword(password, cred.password_hash)) ? profile : null;
}
