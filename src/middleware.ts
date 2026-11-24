// Protección de rutas privadas (primera barrera). Cada página y acción del
// servidor vuelve a verificar permisos contra la base de datos.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session";

// URL pública del sitio. Detrás de un proxy inverso (Traefik/EasyPanel),
// req.url / req.nextUrl.origin valen "0.0.0.0:3000" y nunca sirven para
// construir redirecciones públicas.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const staff = session && (session.role === "admin" || session.role === "operator");

  if (pathname.startsWith("/admin") || pathname.startsWith("/cuenta")) {
    if (!session) {
      const url = new URL("/login", SITE_URL);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin") && !staff) return NextResponse.redirect(new URL("/cuenta", SITE_URL));
    if (pathname.startsWith("/cuenta") && staff) return NextResponse.redirect(new URL("/admin", SITE_URL));
  }
  if ((pathname === "/login" || pathname === "/registro") && session) {
    return NextResponse.redirect(new URL(staff ? "/admin" : "/cuenta", SITE_URL));
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
}

export const config = { matcher: ["/admin/:path*", "/cuenta/:path*", "/login", "/registro", "/", "/rastreo"] };
