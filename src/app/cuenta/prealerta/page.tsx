import { requireClient } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createPrealert } from "../../actions/client";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Field, Flash, PageHeader, SelectField } from "@/components/ui";

export default async function PrealertPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const { customer } = await requireClient();
  const addresses = await getDb().table("addresses").all({ customer_id: customer.id });
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Prealertar una compra" subtitle="Avísanos qué compraste para identificar tu paquete apenas llegue a nuestro casillero." />
      <Flash searchParams={searchParams} />
      <Card className="p-5 sm:p-7">
        <form action={createPrealert} className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2" label="¿Qué compraste?" name="description" required placeholder="Ej.: Zapatos deportivos talla 42" />
          <Field label="Tienda" name="store" required placeholder="Amazon, eBay, Shein…" />
          <Field label="Tracking del transportista" name="carrier_tracking" required placeholder="1Z…, 9400…, TBA…" hint="El número que te dio la tienda o el courier." />
          <Field label="Valor declarado (US$)" name="declared_value_usd" type="number" min="0" step="0.01" inputMode="decimal" />
          <SelectField label="Entregar en" name="address_id" defaultValue={addresses.find((a) => a.is_default)?.id}>
            {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} · {a.city}</option>)}
          </SelectField>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary h-12 w-full sm:w-auto" pendingText="Registrando…">Registrar prealerta</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
