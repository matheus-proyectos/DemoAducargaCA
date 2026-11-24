import { MapPin, Star, Trash2 } from "lucide-react";
import { requireClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { addAddress, deleteAddress, setDefaultAddress, updateProfile } from "../../actions/client";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Field, Flash, PageHeader } from "@/components/ui";

export default async function ProfilePage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { profile, customer } = await requireClient();
  const addresses = (await getDb().table("addresses").all({ customer_id: customer.id })).sort((a, b) => Number(b.is_default) - Number(a.is_default));
  return (
    <div className="space-y-6">
      <PageHeader title="Mi perfil" subtitle={`Casillero ${customer.locker_code} · ${profile.email}`} />
      <Flash searchParams={searchParams} />
      <Card className="p-5 sm:p-7">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Datos de contacto</h2>
        <form action={updateProfile} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" name="full_name" defaultValue={customer.full_name} required />
          <Field label="Correo electrónico" name="email_ro" defaultValue={customer.email} disabled hint="Para cambiarlo, contacta a soporte." />
          <Field label="Teléfono / WhatsApp" name="phone" defaultValue={customer.phone} required />
          <Field label="Cédula / documento" name="document_id" defaultValue={customer.document_id} />
          <Field label="Ciudad" name="city" defaultValue={customer.city} required />
          <Field label="Estado" name="state" defaultValue={customer.state} required />
          <div className="sm:col-span-2"><SubmitButton className="btn-brand">Guardar cambios</SubmitButton></div>
        </form>
      </Card>

      <Card className="p-5 sm:p-7">
        <h2 id="direcciones" className="mb-5 scroll-mt-24 text-lg font-bold text-slate-900">Direcciones de entrega</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="inline-flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-4 w-4 text-brand" /> {a.label}</p>
                {a.is_default && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent-dark">Predeterminada</span>}
              </div>
              <p className="mt-2 text-sm text-slate-600">{a.recipient}</p>
              <p className="text-sm text-slate-600">{a.line1 || "Dirección por completar"}</p>
              <p className="text-sm text-slate-600">{a.city}, {a.state}</p>
              {a.reference && <p className="text-xs text-slate-400">Ref.: {a.reference}</p>}
              <div className="mt-3 flex gap-2">
                {!a.is_default && (
                  <form action={setDefaultAddress}><input type="hidden" name="id" value={a.id} /><button className="btn-ghost h-9 px-3 text-xs"><Star className="h-3.5 w-3.5" /> Predeterminar</button></form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton className="btn-danger h-9 px-3 text-xs" confirm="¿Eliminar esta dirección?" pendingText="…"><Trash2 className="h-3.5 w-3.5" /> Eliminar</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
        <form action={addAddress} className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <p className="font-semibold text-slate-800 sm:col-span-2">Agregar dirección</p>
          <Field label="Nombre" name="label" placeholder="Casa, Oficina…" required />
          <Field label="Quién recibe" name="recipient" defaultValue={customer.full_name} required />
          <Field className="sm:col-span-2" label="Dirección" name="line1" required />
          <Field label="Ciudad" name="city" required />
          <Field label="Estado" name="state" required />
          <Field label="Punto de referencia" name="reference" />
          <Field label="Teléfono de contacto" name="phone" defaultValue={customer.phone} />
          <div className="sm:col-span-2"><SubmitButton className="btn-ghost">Agregar dirección</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
