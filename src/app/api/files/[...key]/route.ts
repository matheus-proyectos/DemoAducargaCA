// Sirve fotografías privadas tras verificar permisos:
// personal → cualquiera; cliente → solo las de sus paquetes.
import { NextResponse } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getFile } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: { key: string[] } }) {
  const key = params.key.join("/");
  const user = await getCurrentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });
  const [scope, packageId] = params.key;
  if (scope !== "packages" || !packageId) return new NextResponse("No encontrado", { status: 404 });
  if (!isStaff(user.profile)) {
    const pkg = await getDb().table("packages").get(packageId);
    if (!pkg || pkg.customer_id !== user.customer?.id || !pkg.photos.includes(key)) return new NextResponse("No encontrado", { status: 404 });
  }
  const file = await getFile(key).catch(() => null);
  if (!file) return new NextResponse("No encontrado", { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: { "content-type": file.contentType, "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff" },
  });
}
