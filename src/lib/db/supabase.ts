// PRODUCCIÓN — adaptador PostgreSQL vía Supabase. Se usa la service-role key
// EXCLUSIVAMENTE en el servidor (nunca llega al navegador). La autorización se
// aplica en la capa de servicios y, como defensa en profundidad, con las
// políticas RLS de supabase/schema.sql para cualquier acceso con la anon key.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Tables, TableName } from "../types";
import type { Db, Table } from "./types";

let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function supabaseAnon(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fail(name: string, error: { message: string } | null): never {
  throw new Error(`Supabase [${name}]: ${error?.message ?? "error desconocido"}`);
}

function table<K extends TableName>(name: K): Table<Tables[K]> {
  type T = Tables[K];
  const c = () => supabaseAdmin().from(name);
  return {
    async all(where) {
      let q = c().select("*");
      if (where) q = q.match(where as Record<string, unknown>);
      const { data, error } = await q.limit(10000);
      if (error) fail(name, error);
      return (data ?? []) as T[];
    },
    async get(id) {
      const { data, error } = await c().select("*").eq("id", id).maybeSingle();
      if (error) fail(name, error);
      return (data as T) ?? null;
    },
    async findOne(where) {
      const { data, error } = await c().select("*").match(where as Record<string, unknown>).limit(1);
      if (error) fail(name, error);
      return ((data ?? [])[0] as T) ?? null;
    },
    async insert(row) {
      const { data, error } = await c().insert(row).select("*").single();
      if (error) fail(name, error);
      return data as T;
    },
    async insertMany(rows) {
      if (!rows.length) return;
      const { error } = await c().insert(rows);
      if (error) fail(name, error);
    },
    async update(id, patch) {
      const { data, error } = await c().update(patch).eq("id", id).select("*").single();
      if (error) fail(name, error);
      return data as T;
    },
    async remove(id) {
      const { error } = await c().delete().eq("id", id);
      if (error) fail(name, error);
    },
  };
}

export const supabaseDb: Db = {
  mode: "supabase",
  table,
  async nextSequence(name) {
    const { data, error } = await supabaseAdmin().rpc("next_sequence", { seq_name: name });
    if (error) fail("next_sequence", error);
    return Number(data);
  },
};
