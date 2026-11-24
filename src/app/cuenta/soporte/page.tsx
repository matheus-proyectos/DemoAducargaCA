import { brand } from "@/lib/brand";
import { requireClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendContactMessage } from "../../actions/public";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Field, Flash, PageHeader, SelectField, TextArea } from "@/components/ui";

export default async function SupportPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { customer } = await requireClient();
  const pkgs = await getDb().table("packages").all({ customer_id: customer.id });
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Atención al cliente" subtitle="Cuéntanos en qué podemos ayudarte. Te responderemos por correo o teléfono." />
      <Flash searchParams={searchParams} />
      <Card className="p-5 sm:p-7">
        <form action={sendContactMessage} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="return_to" value="/cuenta/soporte" />
          <Field label="Nombre" name="name" defaultValue={customer.full_name} required />
          <Field label="Correo" name="email" type="email" defaultValue={customer.email} required />
          <Field label="Teléfono" name="phone" defaultValue={customer.phone} />
          <SelectField label="Envío relacionado" name="tracking" defaultValue="">
            <option value="">— Ninguno —</option>
            {pkgs.map((p) => <option key={p.id} value={p.tracking}>{p.tracking} · {p.description}</option>)}
          </SelectField>
          <TextArea className="sm:col-span-2" label="Mensaje" name="body" required minLength={10} />
          <div className="sm:col-span-2"><SubmitButton className="btn-brand">Enviar mensaje</SubmitButton></div>
        </form>
      </Card>
      {brand.contact.instagram && (
        <p className="mt-4 text-center text-sm text-slate-500">
          También puedes escribirnos por Instagram: <a className="font-semibold text-brand" href={`https://www.instagram.com/${brand.contact.instagram}/`} target="_blank" rel="noopener noreferrer">@{brand.contact.instagram}</a>
        </p>
      )}
    </div>
  );
}
