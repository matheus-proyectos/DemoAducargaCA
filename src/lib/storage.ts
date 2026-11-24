// Almacenamiento de fotografías de paquetes.
//  - Demo: disco local (.data/uploads)
//  - Supabase: bucket privado "package-photos" (Supabase Storage)
// Las imágenes nunca son públicas: se sirven por /api/files/... tras verificar permisos.
import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured } from "./db";
import { dataDir } from "./db/json";
import { supabaseAdmin } from "./db/supabase";

const BUCKET = "package-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const safe = (key: string) => {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes("..")) throw new Error("Ruta de archivo no válida");
  return key;
};

export async function putFile(key: string, data: Buffer, contentType: string) {
  safe(key);
  if (isSupabaseConfigured()) {
    const { error } = await supabaseAdmin().storage.from(BUCKET).upload(key, data, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    return;
  }
  const file = path.join(dataDir(), "uploads", key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

export async function getFile(key: string): Promise<{ data: Buffer; contentType: string } | null> {
  safe(key);
  const ext = key.split(".").pop() ?? "";
  const contentType = Object.entries(ALLOWED_TYPES).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
  if (isSupabaseConfigured()) {
    const { data, error } = await supabaseAdmin().storage.from(BUCKET).download(key);
    if (error || !data) return null;
    return { data: Buffer.from(await data.arrayBuffer()), contentType };
  }
  try {
    return { data: await fs.readFile(path.join(dataDir(), "uploads", key)), contentType };
  } catch {
    return null;
  }
}

export async function deleteFile(key: string) {
  safe(key);
  if (isSupabaseConfigured()) {
    await supabaseAdmin().storage.from(BUCKET).remove([key]);
    return;
  }
  await fs.rm(path.join(dataDir(), "uploads", key), { force: true });
}
