// Salud del servicio. Sin autenticación (para HEALTHCHECK de EasyPanel).
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}