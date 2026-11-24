import type { Phase, Status } from "./types";

/**
 * Estados logísticos por defecto (los 14 del flujo ADUCARGA).
 * Son configurables desde Admin → Estados: se pueden renombrar, desactivar,
 * reordenar, marcar como notificables o crear estados nuevos (p. ej. "RETENIDO").
 * Ningún paquete está obligado a pasar por todos.
 */
export const DEFAULT_STATUSES: Status[] = [
  s("CASILLERO_NOTIFICADO", "Casillero notificado", "El cliente registró su compra y se espera su llegada al almacén.", 10, "prealerta"),
  s("RECIBIDO_CASILLERO", "Recibido en casillero", "El paquete llegó a las instalaciones internacionales de ADUCARGA.", 20, "origen", "Tu paquete llegó a nuestro casillero."),
  s("EN_PROCESAMIENTO", "En procesamiento", "Se verifica, identifica y registra la mercancía.", 30, "origen"),
  s("INSPECCIONADO", "Inspeccionado y registrado", "Se confirman los datos y características del paquete.", 40, "origen"),
  s("LISTO_DESPACHO", "Listo para despacho", "El paquete está preparado para su transporte.", 50, "origen", "Tu paquete está listo para despacho."),
  s("DESPACHADO", "Despachado internacionalmente", "La mercancía salió del almacén de origen.", 60, "transito", "Tu paquete salió hacia Venezuela."),
  s("TRANSITO_INTERNACIONAL", "En tránsito internacional", "El paquete se encuentra en traslado hacia Venezuela.", 70, "transito"),
  s("ARRIBO_VENEZUELA", "Arribo a Venezuela", "La mercancía llegó al país.", 80, "venezuela", "Tu paquete llegó a Venezuela."),
  s("EN_ADUANA", "En proceso de aduana", "Se encuentra en proceso de revisión y liberación aduanera.", 90, "venezuela"),
  s("LIBERADO_ADUANA", "Liberado de aduana", "El paquete está autorizado para continuar su distribución.", 100, "venezuela", "Tu paquete fue liberado de aduana."),
  s("CENTRO_DISTRIBUCION", "En centro de distribución", "La mercancía llegó al centro logístico nacional.", 110, "venezuela"),
  s("TRANSITO_NACIONAL", "En tránsito nacional", "El paquete está siendo trasladado a su destino.", 120, "distribucion"),
  s("EN_RUTA_ENTREGA", "En ruta de entrega", "El paquete está próximo a llegar al destinatario.", 130, "distribucion", "Tu paquete está en ruta de entrega."),
  { ...s("ENTREGADO", "Entregado", "El cliente recibió satisfactoriamente su paquete.", 140, "entregado", "Tu paquete fue entregado."), is_final: true },
];

function s(id: string, name: string, description: string, sort_order: number, phase: Phase, notify_message = ""): Status {
  return { id, name, description, sort_order, phase, notify: !!notify_message, notify_message, active: true, is_final: false };
}

export const PHASES: { id: Phase; label: string; short: string }[] = [
  { id: "prealerta", label: "Prealertado", short: "Prealerta" },
  { id: "origen", label: "En casillero", short: "Casillero" },
  { id: "transito", label: "Tránsito internacional", short: "Tránsito" },
  { id: "venezuela", label: "En Venezuela", short: "Venezuela" },
  { id: "distribucion", label: "En distribución", short: "Distribución" },
  { id: "entregado", label: "Entregado", short: "Entregado" },
  { id: "incidencia", label: "Incidencia", short: "Incidencia" },
];

export const phaseLabel = (p: Phase) => PHASES.find((x) => x.id === p)?.label ?? p;

/** Etapas del indicador de progreso (5 hitos visibles al cliente). */
export const PROGRESS_STEPS: { label: string; phases: Phase[] }[] = [
  { label: "Casillero", phases: ["prealerta", "origen"] },
  { label: "Tránsito", phases: ["transito"] },
  { label: "Venezuela", phases: ["venezuela"] },
  { label: "Reparto", phases: ["distribucion"] },
  { label: "Entregado", phases: ["entregado"] },
];

export function progressIndex(phase: Phase): number {
  const i = PROGRESS_STEPS.findIndex((st) => st.phases.includes(phase));
  return i === -1 ? 0 : i;
}
