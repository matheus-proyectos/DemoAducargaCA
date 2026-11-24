// Sesión firmada con HMAC-SHA256 (Web Crypto) — funciona tanto en el middleware
// (Edge runtime) como en el servidor Node. La cookie es httpOnly, SameSite=Lax y
// Secure en producción. La autorización real se re-verifica contra la base de
// datos en cada página/acción (ver lib/auth.ts); la cookie solo identifica.
import type { Role } from "./types";

export const SESSION_COOKIE = "adu_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

export type SessionPayload = { uid: string; role: Role; exp: number };

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(str: string): Uint8Array {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET no está definido (mínimo 32 caracteres). Genere uno con: openssl rand -hex 32");
  }
  return "aducarga-dev-only-secret-do-not-use-in-prod";
}

async function key() {
  return crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(p: Omit<SessionPayload, "exp">): Promise<string> {
  const payload: SessionPayload = { ...p, exp: Date.now() + SESSION_TTL_MS };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
