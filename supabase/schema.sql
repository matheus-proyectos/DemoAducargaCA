-- ════════════════════════════════════════════════════════════════════
--  ADUCARGA — Esquema PostgreSQL (Supabase)
--  Ejecutar en: Supabase → SQL Editor → New query → Run
--  Relaciones clave:
--    customers 1─N packages 1─N movements
--    shipments 1─N packages
--    customers 1─N addresses / notifications
--    profiles (auth.users) N─1 customers
-- ════════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ── Secuencias (tracking, casillero, embarques) ──
create table if not exists public.sequences (
  name  text primary key,
  value bigint not null default 0
);
create or replace function public.next_sequence(seq_name text) returns bigint
language sql volatile security definer set search_path = public as $$
  insert into public.sequences(name, value) values (seq_name, 1)
  on conflict (name) do update set value = public.sequences.value + 1
  returning value;
$$;
revoke all on function public.next_sequence(text) from public, anon, authenticated;

-- ── Clientes ──
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  locker_code text not null unique,
  full_name   text not null,
  document_id text not null default '',
  email       text not null unique,
  phone       text not null default '',
  city        text not null default '',
  state       text not null default '',
  notes       text not null default '',
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Perfiles (1:1 con auth.users) ──
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  role          text not null default 'client' check (role in ('client','operator','admin')),
  customer_id   uuid references public.customers(id) on delete set null,
  full_name     text not null default '',
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label       text not null,
  recipient   text not null default '',
  line1       text not null default '',
  city        text not null default '',
  state       text not null default '',
  reference   text not null default '',
  phone       text not null default '',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_customer_idx on public.addresses(customer_id);

-- ── Estados logísticos configurables ──
create table if not exists public.statuses (
  id             text primary key,               -- código, p. ej. 'ENTREGADO'
  name           text not null,
  description    text not null default '',
  sort_order     int  not null,
  phase          text not null check (phase in ('prealerta','origen','transito','venezuela','distribucion','entregado','incidencia')),
  notify         boolean not null default false,
  notify_message text not null default '',
  active         boolean not null default true,
  is_final       boolean not null default false
);

-- ── Embarques ──
create table if not exists public.shipments (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  mode         text not null check (mode in ('aereo','maritimo')),
  carrier      text not null default '',
  reference    text not null default '',
  origin       text not null default '',
  destination  text not null default '',
  departure_at timestamptz,
  eta          date,
  status_code  text references public.statuses(id),
  notes        text not null default '',
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Paquetes ──
create table if not exists public.packages (
  id                 uuid primary key default gen_random_uuid(),
  tracking           text not null unique,
  customer_id        uuid not null references public.customers(id) on delete restrict,
  shipment_id        uuid references public.shipments(id) on delete set null,
  address_id         uuid references public.addresses(id) on delete set null,
  description        text not null,
  store              text not null default '',
  carrier_tracking   text not null default '',
  origin             text not null default 'Casillero internacional',
  destination_city   text not null default '',
  destination_state  text not null default '',
  weight_kg          numeric(10,2) not null default 0,
  length_cm          numeric(8,1),
  width_cm           numeric(8,1),
  height_cm          numeric(8,1),
  pieces             int not null default 1 check (pieces > 0),
  declared_value_usd numeric(12,2),
  photos             jsonb not null default '[]'::jsonb,
  status_code        text not null references public.statuses(id),
  current_location   text not null default '',
  current_country    text not null default '',
  received_at        timestamptz,
  estimated_delivery date,
  delivered_at       timestamptz,
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists packages_customer_idx on public.packages(customer_id);
create index if not exists packages_shipment_idx on public.packages(shipment_id);
create index if not exists packages_status_idx   on public.packages(status_code);

-- ── Movimientos (historial de tracking) ──
create table if not exists public.movements (
  id          uuid primary key default gen_random_uuid(),
  package_id  uuid not null references public.packages(id) on delete cascade,
  status_code text not null references public.statuses(id),
  occurred_at timestamptz not null,
  location    text not null default '',
  country     text not null default '',
  description text not null default '',
  notes       text not null default '',
  source      text not null default 'admin' check (source in ('admin','embarque','cliente','sistema')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists movements_package_idx on public.movements(package_id, occurred_at);

-- ── Notificaciones ──
create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  package_id      uuid references public.packages(id) on delete cascade,
  title           text not null,
  body            text not null default '',
  channel         text not null check (channel in ('in_app','webhook','email','whatsapp')),
  delivery_status text not null check (delivery_status in ('entregada','enviada','pendiente','fallida')),
  read_at         timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);
create index if not exists notifications_customer_idx on public.notifications(customer_id, created_at desc);

-- ── Auditoría ──
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  actor_email text not null,
  action      text not null,
  entity      text not null,
  entity_id   text not null,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_entity_idx on public.audit_logs(entity, entity_id);

-- ── Mensajes de contacto ──
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text not null default '',
  tracking    text not null default '',
  body        text not null,
  customer_id uuid references public.customers(id) on delete set null,
  status      text not null default 'nuevo' check (status in ('nuevo','atendido')),
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
--  SEGURIDAD — Row Level Security
--  El servidor Next.js usa la service-role key (omite RLS) y aplica la
--  autorización en código. Estas políticas protegen cualquier acceso
--  directo con la anon key: un cliente SOLO ve sus propios datos.
-- ════════════════════════════════════════════════════════════════════
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','operator'));
$$;
create or replace function public.my_customer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select customer_id from public.profiles where id = auth.uid();
$$;

alter table public.sequences     enable row level security;
alter table public.customers     enable row level security;
alter table public.profiles      enable row level security;
alter table public.addresses     enable row level security;
alter table public.statuses      enable row level security;
alter table public.shipments     enable row level security;
alter table public.packages      enable row level security;
alter table public.movements     enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs    enable row level security;
alter table public.messages      enable row level security;

drop policy if exists statuses_read on public.statuses;
create policy statuses_read on public.statuses for select using (true);
drop policy if exists statuses_staff on public.statuses;
create policy statuses_staff on public.statuses for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (id = auth.uid() or public.is_staff());

drop policy if exists customers_self on public.customers;
create policy customers_self on public.customers for select using (id = public.my_customer_id() or public.is_staff());
drop policy if exists customers_staff on public.customers;
create policy customers_staff on public.customers for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists addresses_owner on public.addresses;
create policy addresses_owner on public.addresses for all
  using (customer_id = public.my_customer_id() or public.is_staff())
  with check (customer_id = public.my_customer_id() or public.is_staff());

drop policy if exists packages_owner on public.packages;
create policy packages_owner on public.packages for select using (customer_id = public.my_customer_id() or public.is_staff());
drop policy if exists packages_staff on public.packages;
create policy packages_staff on public.packages for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists movements_owner on public.movements;
create policy movements_owner on public.movements for select using (
  public.is_staff() or exists (select 1 from public.packages p where p.id = package_id and p.customer_id = public.my_customer_id())
);
drop policy if exists movements_staff on public.movements;
create policy movements_staff on public.movements for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists shipments_staff on public.shipments;
create policy shipments_staff on public.shipments for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists notifications_owner on public.notifications;
create policy notifications_owner on public.notifications for select using (customer_id = public.my_customer_id() or public.is_staff());
drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for update using (customer_id = public.my_customer_id()) with check (customer_id = public.my_customer_id());

drop policy if exists audit_staff on public.audit_logs;
create policy audit_staff on public.audit_logs for select using (public.is_staff());

drop policy if exists messages_staff on public.messages;
create policy messages_staff on public.messages for all using (public.is_staff()) with check (public.is_staff());
-- sequences: sin políticas → inaccesible salvo service-role.

-- ── Storage: bucket privado de fotografías ──
insert into storage.buckets (id, name, public) values ('package-photos', 'package-photos', false)
on conflict (id) do nothing;

-- ── Estados por defecto ──
insert into public.statuses (id, name, description, sort_order, phase, notify, notify_message, is_final) values
 ('CASILLERO_NOTIFICADO','Casillero notificado','El cliente registró su compra y se espera su llegada al almacén.',10,'prealerta',false,'',false),
 ('RECIBIDO_CASILLERO','Recibido en casillero','El paquete llegó a las instalaciones internacionales de ADUCARGA.',20,'origen',true,'Tu paquete llegó a nuestro casillero.',false),
 ('EN_PROCESAMIENTO','En procesamiento','Se verifica, identifica y registra la mercancía.',30,'origen',false,'',false),
 ('INSPECCIONADO','Inspeccionado y registrado','Se confirman los datos y características del paquete.',40,'origen',false,'',false),
 ('LISTO_DESPACHO','Listo para despacho','El paquete está preparado para su transporte.',50,'origen',true,'Tu paquete está listo para despacho.',false),
 ('DESPACHADO','Despachado internacionalmente','La mercancía salió del almacén de origen.',60,'transito',true,'Tu paquete salió hacia Venezuela.',false),
 ('TRANSITO_INTERNACIONAL','En tránsito internacional','El paquete se encuentra en traslado hacia Venezuela.',70,'transito',false,'',false),
 ('ARRIBO_VENEZUELA','Arribo a Venezuela','La mercancía llegó al país.',80,'venezuela',true,'Tu paquete llegó a Venezuela.',false),
 ('EN_ADUANA','En proceso de aduana','Se encuentra en proceso de revisión y liberación aduanera.',90,'venezuela',false,'',false),
 ('LIBERADO_ADUANA','Liberado de aduana','El paquete está autorizado para continuar su distribución.',100,'venezuela',true,'Tu paquete fue liberado de aduana.',false),
 ('CENTRO_DISTRIBUCION','En centro de distribución','La mercancía llegó al centro logístico nacional.',110,'venezuela',false,'',false),
 ('TRANSITO_NACIONAL','En tránsito nacional','El paquete está siendo trasladado a su destino.',120,'distribucion',false,'',false),
 ('EN_RUTA_ENTREGA','En ruta de entrega','El paquete está próximo a llegar al destinatario.',130,'distribucion',true,'Tu paquete está en ruta de entrega.',false),
 ('ENTREGADO','Entregado','El cliente recibió satisfactoriamente su paquete.',140,'entregado',true,'Tu paquete fue entregado.',true)
on conflict (id) do nothing;
