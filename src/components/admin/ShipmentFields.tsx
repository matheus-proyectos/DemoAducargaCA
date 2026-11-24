import type { Shipment } from "@/lib/types";
import { Field, SelectField, TextArea } from "../ui";

export function ShipmentFields({ s }: { s?: Shipment }) {
  return (
    <>
      <SelectField label="Modalidad" name="mode" defaultValue={s?.mode ?? "aereo"}>
        <option value="aereo">Aéreo</option>
        <option value="maritimo">Marítimo</option>
      </SelectField>
      <Field label="Transportista" name="carrier" defaultValue={s?.carrier} />
      <Field label="Referencia (AWB / BL)" name="reference" defaultValue={s?.reference} />
      <Field label="Llegada estimada" name="eta" type="date" defaultValue={s?.eta ?? ""} />
      <Field label="Origen" name="origin" required defaultValue={s?.origin ?? ""} />
      <Field label="Destino" name="destination" required defaultValue={s?.destination ?? ""} />
      <TextArea className="sm:col-span-2" label="Notas" name="notes" rows={2} defaultValue={s?.notes} />
    </>
  );
}
