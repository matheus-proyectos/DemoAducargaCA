import type { Metadata } from "next";
import Link from "next/link";
import { login } from "../actions/auth";
import { isDemoMode } from "@/lib/db";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Flash, sp } from "@/components/ui";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return (
    <AuthShell title="Iniciar sesión" subtitle="Accede a tu panel para consultar tus paquetes y envíos.">
      <Flash searchParams={searchParams} />
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={sp(searchParams, "next")} />
        <Field label="Correo electrónico" name="email" type="email" required autoComplete="email" autoFocus />
        <Field label="Contraseña" name="password" type="password" required autoComplete="current-password" />
        <SubmitButton className="btn-brand h-12 w-full" pendingText="Verificando…">Entrar</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tienes cuenta? <Link href="/registro" className="font-semibold text-brand hover:text-accent-dark">Regístrate</Link>
      </p>
      {isDemoMode() && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-800">Cuentas de demostración</p>
          <ul className="mt-2 space-y-1 font-mono text-[13px] text-slate-600">
            <li>Cliente: cliente@aducarga.test · Demo2026!</li>
            <li>Admin: admin@aducarga.test · Admin2026!</li>
            <li>Operador: operador@aducarga.test · Operador2026!</li>
          </ul>
        </div>
      )}
    </AuthShell>
  );
}
