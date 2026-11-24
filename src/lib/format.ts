// Formatos de fecha/hora en hora de Venezuela (UTC-4, sin horario de verano).
export const TZ = "America/Caracas";

const d = (iso: string) => new Date(iso);

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("es-VE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(d(iso)) : "—";

export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("es-VE", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true }).format(d(iso));

export const fmtDateTime = (iso: string | null | undefined) => (iso ? `${fmtDate(iso)} · ${fmtTime(iso)}` : "—");

export const fmtLongDate = (iso: string) =>
  new Intl.DateTimeFormat("es-VE", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d(iso));

/** Fecha sin hora (YYYY-MM-DD) → dd/mm/aaaa */
export const fmtDay = (day: string | null | undefined) => (day ? fmtDate(`${day}T12:00:00-04:00`) : "—");

export const fmtKg = (n: number | null | undefined) =>
  n == null ? "—" : `${n.toLocaleString("es-VE", { maximumFractionDigits: 2 })} kg`;

export const fmtUsd = (n: number | null | undefined) =>
  n == null ? "—" : `US$ ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtDims = (l: number | null, w: number | null, h: number | null) =>
  l && w && h ? `${l} × ${w} × ${h} cm` : "—";

/** Valor para <input type="datetime-local"> en hora de Venezuela. */
export function caracasLocalInput(date: Date | string = new Date()): string {
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(date));
  return s.replace(" ", "T");
}

/** Interpreta un datetime-local como hora de Venezuela y lo devuelve en ISO UTC. */
export function fromCaracasLocal(v: string | null | undefined): string {
  if (!v) return new Date().toISOString();
  const dt = new Date(`${v.length === 16 ? v + ":00" : v}-04:00`);
  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

/** "Juan Pérez Gómez" → "Juan P. G." — para el tracking público. */
export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return [parts[0], ...parts.slice(1).map((p) => `${p[0].toUpperCase()}.`)].join(" ");
}

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "hace un momento";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
};
