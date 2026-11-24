// Modelo de datos de la plataforma. Los nombres de campos son snake_case para
// coincidir 1:1 con las columnas de PostgreSQL (supabase/schema.sql).

export type Role = "client" | "operator" | "admin";
export type Phase = "prealerta" | "origen" | "transito" | "venezuela" | "distribucion" | "entregado" | "incidencia";
export type MovementSource = "admin" | "embarque" | "cliente" | "sistema";
export type Channel = "in_app" | "webhook" | "email" | "whatsapp";
export type DeliveryStatus = "entregada" | "enviada" | "pendiente" | "fallida";

export interface Profile {
  id: string;
  email: string;
  role: Role;
  customer_id: string | null;
  full_name: string;
  created_at: string;
  last_login_at: string | null;
}

/** Solo modo demo: en Supabase las contraseñas las gestiona Supabase Auth. */
export interface Credential {
  id: string; // = profile.id
  password_hash: string;
}

export interface Customer {
  id: string;
  locker_code: string;
  full_name: string;
  document_id: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  notes: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  label: string;
  recipient: string;
  line1: string;
  city: string;
  state: string;
  reference: string;
  phone: string;
  is_default: boolean;
  created_at: string;
}

/** Estado logístico configurable. `id` es el código (p. ej. "ENTREGADO"). */
export interface Status {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  phase: Phase;
  notify: boolean;
  notify_message: string;
  active: boolean;
  is_final: boolean;
}

export interface Package {
  id: string;
  tracking: string;
  customer_id: string;
  shipment_id: string | null;
  address_id: string | null;
  description: string;
  store: string;
  carrier_tracking: string;
  origin: string;
  destination_city: string;
  destination_state: string;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  pieces: number;
  declared_value_usd: number | null;
  photos: string[];
  status_code: string;
  current_location: string;
  current_country: string;
  received_at: string | null;
  estimated_delivery: string | null; // YYYY-MM-DD
  delivered_at: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Movement {
  id: string;
  package_id: string;
  status_code: string;
  occurred_at: string;
  location: string;
  country: string;
  description: string;
  notes: string;
  source: MovementSource;
  created_by: string | null;
  created_at: string;
}

export interface Shipment {
  id: string;
  code: string;
  mode: "aereo" | "maritimo";
  carrier: string;
  reference: string;
  origin: string;
  destination: string;
  departure_at: string | null;
  eta: string | null; // YYYY-MM-DD
  status_code: string | null;
  notes: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  customer_id: string;
  package_id: string | null;
  title: string;
  body: string;
  channel: Channel;
  delivery_status: DeliveryStatus;
  read_at: string | null;
  error: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  entity: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  tracking: string;
  body: string;
  customer_id: string | null;
  status: "nuevo" | "atendido";
  created_at: string;
}

export interface Tables {
  profiles: Profile;
  credentials: Credential;
  customers: Customer;
  addresses: Address;
  statuses: Status;
  packages: Package;
  movements: Movement;
  shipments: Shipment;
  notifications: Notification;
  audit_logs: AuditLog;
  messages: ContactMessage;
}
export type TableName = keyof Tables;
