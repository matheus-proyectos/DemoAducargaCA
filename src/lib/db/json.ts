// MODO DEMO — persistencia en un archivo JSON con escritura atómica y un mutex
// en proceso. Pensado para demostración y desarrollo en un solo servidor Node;
// en producción use Supabase (ver README).
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Tables, TableName } from "../types";
import { matches, type Db, type Table } from "./types";

type Store = { [K in TableName]: Tables[K][] } & { sequences: Record<string, number>; seeded_at: string };

const TABLES: TableName[] = [
  "profiles", "credentials", "customers", "addresses", "statuses", "packages",
  "movements", "shipments", "notifications", "audit_logs", "messages",
];

const g = globalThis as unknown as { __aduStore?: Store; __aduLock?: Promise<unknown> };

export const dataDir = () => process.env.DATA_DIR || path.join(process.cwd(), ".data");
const dbFile = () => path.join(dataDir(), "db.json");

async function load(): Promise<Store> {
  if (g.__aduStore) return g.__aduStore;
  let store: Store;
  try {
    store = JSON.parse(await fs.readFile(dbFile(), "utf8")) as Store;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const { buildSeed } = await import("../seed");
    const seed = await buildSeed();
    store = { ...(seed as unknown as Store), seeded_at: new Date().toISOString() };
    g.__aduStore = store;
    await persist(store);
  }
  for (const t of TABLES) if (!Array.isArray(store[t])) (store as Record<string, unknown>)[t] = [];
  store.sequences ??= {};
  g.__aduStore = store;
  return store;
}

async function persist(store: Store) {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = dbFile() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(store, null, 1));
  await fs.rename(tmp, dbFile());
}

/** Serializa todas las operaciones para evitar escrituras concurrentes. */
function locked<R>(fn: (s: Store) => Promise<R> | R, write = false): Promise<R> {
  const run = async () => {
    const s = await load();
    const r = await fn(s);
    if (write) await persist(s);
    return r;
  };
  const p = (g.__aduLock ?? Promise.resolve()).then(run, run);
  g.__aduLock = p.catch(() => undefined);
  return p;
}

const clone = <T>(v: T): T => structuredClone(v);

function table<K extends TableName>(name: K): Table<Tables[K]> {
  type T = Tables[K];
  const rows = (s: Store) => s[name] as T[];
  return {
    all: (where) => locked((s) => rows(s).filter((r) => matches(r, where)).map(clone)),
    get: (id) => locked((s) => clone(rows(s).find((r) => r.id === id) ?? null)),
    findOne: (where) => locked((s) => clone(rows(s).find((r) => matches(r, where)) ?? null)),
    insert: (row) =>
      locked((s) => {
        if (rows(s).some((r) => r.id === row.id)) throw new Error(`Registro duplicado en ${name}`);
        rows(s).push(clone(row));
        return clone(row);
      }, true),
    insertMany: (list) => locked((s) => void rows(s).push(...list.map(clone)), true),
    update: (id, patch) =>
      locked((s) => {
        const r = rows(s).find((x) => x.id === id);
        if (!r) throw new Error(`No existe ${name}/${id}`);
        Object.assign(r, clone(patch), { id });
        return clone(r);
      }, true),
    remove: (id) =>
      locked((s) => {
        (s as Record<string, unknown>)[name] = rows(s).filter((r) => r.id !== id);
      }, true),
  };
}

export const jsonDb: Db = {
  mode: "demo",
  table,
  nextSequence: (name) =>
    locked((s) => {
      s.sequences[name] = (s.sequences[name] ?? 0) + 1;
      return s.sequences[name];
    }, true),
};

/** Solo para pruebas: descarta la caché en memoria. */
export function resetJsonCache() {
  g.__aduStore = undefined;
  g.__aduLock = undefined;
}
