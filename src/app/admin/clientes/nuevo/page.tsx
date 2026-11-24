import { requireStaff } from "@/lib/auth";
import { createCustomer } from "../../../actions/admin";
import { CustomerFields } from "@/components/admin/CustomerFields";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Field, Flash, PageHeader } from "@/components/ui";

export default async function NewCustomer({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Registrar cliente" subtitle="Se asignará un código de casillero. El cliente podrá activar su acceso registrándose con el mismo correo." />
      <Flash searchParams={searchParams} />
      <Card className="p-5 sm:p-7">
        <form action={createCustomer} className="grid gap-4 sm:grid-cols-2">
          <CustomerFields />
          <Field className="sm:col-span-2" label="Dirección de entrega" name="line1" />
          <div className="sm:col-span-2"><SubmitButton className="btn-primary">Registrar cliente</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
