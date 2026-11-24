import type { Db } from "./types";
import { jsonDb } from "./json";
import { supabaseDb } from "./supabase";

export const isSupabaseConfigured = () =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function getDb(): Db {
  return isSupabaseConfigured() ? supabaseDb : jsonDb;
}

export const isDemoMode = () => !isSupabaseConfigured();
