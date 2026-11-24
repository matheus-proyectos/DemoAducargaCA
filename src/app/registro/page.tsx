import type { Metadata } from "next";
import Link from "next/link";
import { register } from "../actions/auth";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Flash } from "@/components/ui";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return (
    <AuthShell title="Crea tu cuenta" subtitle="Obtén tu código de casillero y rastrea cada envío.">
      <Flash searchParams={searchParams} />
      <form action={register} className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Nombre completo" name="full_name" required autoComplete="name" />
        <Field label="Correo electrónico" name="email" type="email" required autoComplete="email" />
        <Field label="Teléfono / WhatsApp" name="phone" type="tel" required autoComplete="tel" placeholder="+58 412 000 0000" />
        <Field label="Cédula / documento" name="document_id" placeholder="V-00.000.000" />
        <Field label="Ciudad" name="city" required autoComplete="address-level2" />
        <Field className="sm:col-span-2" label="Estado" name="state" required autoComplete="address-level1" />
        <Field label="Contraseña" name="password" type="password" required minLength={8} autoComplete="new-password" hint="Mínimo 8 caracteres, con letras y números." />
        <Field label="Confirmar contraseña" name="password_confirm" type="password" required autoComplete="new-password" />
        <label className="flex items-start gap-2.5 text-sm text-slate-600 sm:col-span-2">
          <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[rgb(var(--brand))]" />
          Acepto el tratamiento de mis datos para la gestión de mis envíos.
        </label>
        <SubmitButton className="btn-primary h-12 sm:col-span-2" pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-brand hover:text-accent-dark">Inicia sesión</Link>
      </p>
    </AuthShell>
  );
}
