import {
  BellRing, Boxes, Building2, CheckCheck, ClipboardCheck, Globe2, Landmark, MapPin, PackageCheck, PackageOpen,
  Plane, PlaneLanding, ScanLine, ShieldCheck, Truck, TriangleAlert, Warehouse, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  CASILLERO_NOTIFICADO: BellRing,
  RECIBIDO_CASILLERO: Warehouse,
  EN_PROCESAMIENTO: ScanLine,
  INSPECCIONADO: ClipboardCheck,
  LISTO_DESPACHO: Boxes,
  DESPACHADO: Plane,
  TRANSITO_INTERNACIONAL: Globe2,
  ARRIBO_VENEZUELA: PlaneLanding,
  EN_ADUANA: Landmark,
  LIBERADO_ADUANA: ShieldCheck,
  CENTRO_DISTRIBUCION: Building2,
  TRANSITO_NACIONAL: Truck,
  EN_RUTA_ENTREGA: MapPin,
  ENTREGADO: PackageCheck,
};

export function StatusIcon({ code, className = "h-4 w-4" }: { code: string; className?: string }) {
  const Icon = ICONS[code] ?? (code.includes("RETEN") || code.includes("INCID") ? TriangleAlert : PackageOpen);
  return <Icon className={className} aria-hidden />;
}

export { CheckCheck };
