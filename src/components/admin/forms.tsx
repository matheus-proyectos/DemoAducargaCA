import { caracasLocalInput } from "@/lib/format";
import type { Customer, Package, Status } from "@/lib/types";
import { Field, SelectField, TextArea } from "../ui";

export function PackageFields({ pkg, customers, defaultCustomer }: { pkg?: Package; customers: Customer[]; defaultCustomer?: Customer | null }) {
  const c = defaultCustomer;
  return (
    <>
      <SelectField className="sm:col-span-2" label="Cliente" name="customer_id" required defaultValue={pkg?.customer_id ?? c?.id ?? ""}>
        <option value="" disabled>Selecciona un cliente…</option>
        {customers.map((x) => <option key={x.id} value={x.id}>{x.full_name} · {x.locker_code} · {x.city}</option>)}
      </SelectField>
      <Field className="sm:col-span-2" label="Descripción del contenido" name="description" required defaultValue={pkg?.description} />
      <Field label="Tienda / remitente" name="store" defaultValue={pkg?.store} />
      <Field label="Tracking del transportista" name="carrier_tracking" defaultValue={pkg?.carrier_tracking} />
      <Field label="Ciudad destino" name="destination_city" defaultValue={pkg?.destination_city ?? c?.city} hint={pkg ? undefined : "Si se deja vacío se usa la del cliente."} />
      <Field label="Estado destino" name="destination_state" defaultValue={pkg?.destination_state ?? c?.state} />
      <Field label="Peso (kg)" name="weight_kg" type="number" step="0.01" min="0.01" required inputMode="decimal" defaultValue={pkg?.weight_kg || ""} />
      <Field label="Piezas / bultos" name="pieces" type="number" min="1" step="1" required defaultValue={pkg?.pieces ?? 1} />
      <div className="grid grid-cols-3 gap-2 sm:col-span-2">
        <Field label="Largo (cm)" name="length_cm" type="number" step="0.1" min="0" defaultValue={pkg?.length_cm ?? ""} />
        <Field label="Ancho (cm)" name="width_cm" type="number" step="0.1" min="0" defaultValue={pkg?.width_cm ?? ""} />
        <Field label="Alto (cm)" name="height_cm" type="number" step="0.1" min="0" defaultValue={pkg?.height_cm ?? ""} />
      </div>
      <Field label="Valor declarado (US$)" name="declared_value_usd" type="number" step="0.01" min="0" defaultValue={pkg?.declared_value_usd ?? ""} />
      <Field label="Entrega estimada" name="estimated_delivery" type="date" defaultValue={pkg?.estimated_delivery ?? ""} />
    </>
  );
}

export function MovementFields({ statuses, defaultStatus, defaults }: { statuses: Status[]; defaultStatus?: string; defaults?: { location?: string; country?: string } }) {
  return (
    <>
      <SelectField className="sm:col-span-2" label="Nuevo estado" name="status_code" required defaultValue={defaultStatus}>
        {statuses.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}{s.notify ? " 🔔" : ""}</option>)}
      </SelectField>
      <Field label="Fecha y hora (Venezuela)" name="occurred_at" type="datetime-local" required defaultValue={caracasLocalInput()} />
      <Field label="País" name="country" required defaultValue={defaults?.country ?? ""} list="countries" />
      <Field className="sm:col-span-2" label="Ubicación" name="location" required defaultValue={defaults?.location ?? ""} placeholder="Almacén, aeropuerto, centro de distribución…" />
      <Field className="sm:col-span-2" label="Descripción (opcional)" name="description" placeholder="Si se deja vacío se usa la descripción estándar del estado" />
      <TextArea className="sm:col-span-2" label="Observaciones (visibles para el cliente)" name="notes" rows={2} />
      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
        <input type="checkbox" name="notify" defaultChecked className="h-4 w-4 accent-[rgb(var(--brand))]" /> Notificar al cliente si el estado es notificable (🔔)
      </label>
      <datalist id="countries">
        <option value="Estados Unidos" /><option value="Venezuela" /><option value="Panamá" /><option value="Colombia" /><option value="España" /><option value="Internacional" />
      </datalist>
    </>
  );
}
