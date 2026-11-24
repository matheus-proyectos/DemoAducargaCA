import { requireStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { caracasLocalInput } from "@/lib/format";
import { createPackageAction } from "../../../actions/admin";
import { getStatuses } from "@/lib/services/packages";
import { PackageFields } from "@/components/admin/forms";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Field, Flash, PageHeader, SelectField, sp, TextArea } from "@/components/ui";

export default async function NewPackage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  await requireStaff();
  const db = getDb();
  const [customers, statuses] = await Promise.all([db.table("customers").all(), getStatuses(false)]);
  customers.sort((a, b) => a.full_name.localeCompare(b.full_name));
  const pre = customers.find((c) => c.id === sp(searchParams, "customer")) ?? null;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Registrar paquete" subtitle="Se generará automáticamente un número de tracking único (ADU-AAAA-000000)." />
      <Flash searchParams={searchParams} />
      <form action={createPackageAction} className="space-y-6">
        <Card className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <h2 className="font-bold text-slate-900 sm:col-span-2">Datos del paquete</h2>
          <PackageFields customers={customers} defaultCustomer={pre} />
        </Card>
        <Card className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <h2 className="font-bold text-slate-900 sm:col-span-2">Estado inicial</h2>
          <SelectField label="Estado" name="status_code" defaultValue="RECIBIDO_CASILLERO">
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </SelectField>
          <Field label="Fecha y hora (Venezuela)" name="occurred_at" type="datetime-local" defaultValue={caracasLocalInput()} />
          <Field label="Ubicación" name="location" defaultValue="Almacén casillero internacional" />
          <Field label="País" name="country" defaultValue="Estados Unidos" />
          <TextArea className="sm:col-span-2" label="Observaciones" name="notes" rows={2} />
          <label className="block sm:col-span-2">
            <span className="label">Fotografías (JPG, PNG o WEBP · máx. 5 MB c/u)</span>
            <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand" />
          </label>
        </Card>
        <SubmitButton className="btn-primary h-12 w-full sm:w-auto" pendingText="Registrando…">Registrar y generar tracking</SubmitButton>
      </form>
    </div>
  );
}
