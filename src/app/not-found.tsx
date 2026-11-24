import Link from "next/link";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><PackageX className="h-7 w-7" /></div>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Página no encontrada</h1>
      <p className="mt-1 text-slate-500">El recurso que buscas no existe o no tienes acceso a él.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="btn-brand">Ir al inicio</Link>
        <Link href="/rastreo" className="btn-ghost">Rastrear envío</Link>
      </div>
    </div>
  );
}
