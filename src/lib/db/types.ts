import type { Tables, TableName } from "../types";

/**
 * Contrato de acceso a datos. Dos implementaciones:
 *  - json.ts      → MODO DEMO (archivo .data/db.json, sin dependencias externas)
 *  - supabase.ts  → PRODUCCIÓN (PostgreSQL de Supabase, ver supabase/schema.sql)
 * Toda la lógica de negocio (lib/services) se escribe una sola vez contra este contrato.
 */
export interface Table<T extends { id: string }> {
  all(where?: Partial<T>): Promise<T[]>;
  get(id: string): Promise<T | null>;
  findOne(where: Partial<T>): Promise<T | null>;
  insert(row: T): Promise<T>;
  insertMany(rows: T[]): Promise<void>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface Db {
  mode: "demo" | "supabase";
  table<K extends TableName>(name: K): Table<Tables[K]>;
  nextSequence(name: string): Promise<number>;
}

export function matches<T>(row: T, where?: Partial<T>): boolean {
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => v === undefined || (row as Record<string, unknown>)[k] === v);
}
