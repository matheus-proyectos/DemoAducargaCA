import type { Customer } from "@/lib/types";
import { Field, TextArea } from "../ui";

export function CustomerFields({ c }: { c?: Customer }) {
  return (
    <>
      <Field className="sm:col-span-2" label="Nombre completo" name="full_name" required defaultValue={c?.full_name} />
      <Field label="Correo electrónico" name="email" type="email" required defaultValue={c?.email} />
      <Field label="Teléfono / WhatsApp" name="phone" defaultValue={c?.phone} />
      <Field label="Cédula / documento" name="document_id" defaultValue={c?.document_id} />
      <Field label="Ciudad" name="city" defaultValue={c?.city} />
      <Field label="Estado" name="state" defaultValue={c?.state} />
      <TextArea className="sm:col-span-2" label="Notas internas" name="notes" rows={2} defaultValue={c?.notes} />
    </>
  );
}
