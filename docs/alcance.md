# Documento de Alcance — ADUCARGA PWA
## Estado actual, pendientes y dependencias del cliente

**Fecha:** 2026-11-23  
**Versión:** 1.0  
**Proyecto:** ADUCARGA - Plataforma de logística y rastreo de envíos (Venezuela)

---

## 1. Qué está HECHO ✅

### 1.1 Núcleo de la aplicación
- [x] **Next.js 14.2.30** (App Router, Server Components, Server Actions) + TypeScript 5.6.3 + Tailwind CSS
- [x] **PWA completa**: manifest.json, service worker (sw.js), íconos (192, 512, 180), página offline, experiencia de instalación
- [x] **Autenticación y roles**: cliente / operador / administrador con doble barrera (middleware + verificación por página/acción)
- [x] **Sesión HMAC-SHA256** en cookie httpOnly (no cookies nativas de Supabase)
- [x] **Modo demo** (JSON en `.data/db.json`) y **modo producción** (Supabase PostgreSQL) con adaptador intercambiable

### 1.2 Funcionalidades por rol

| Funcionalidad | Cliente | Operador | Admin |
|---|---|---|---|
| Rastreo público | ✅ | ✅ | ✅ |
| Panel de paquetes propios | ✅ | ✅ (asignados) | ✅ (todos) |
| Prealerta de envíos | ✅ | — | ✅ |
| Direcciones de entrega | ✅ | — | ✅ |
| Notificaciones in-app | ✅ | ✅ | ✅ |
| Crear/editar paquetes | — | ✅ | ✅ |
| Movimientos individuales | — | ✅ | ✅ |
| Embarques (lotes) | — | ✅ | ✅ |
| Gestión de clientes | — | — | ✅ |
| Gestión de estados | — | — | ✅ |
| Configurar webhooks | — | — | ✅ |
| Auditoría completa | — | — | ✅ |
| Panel administrativo | — | — | ✅ |

### 1.3 Notificaciones multicanal
- [x] Canal **in_app** (siempre activo, persiste en BD)
- [x] Canal **webhook** (HMAC-SHA256, payload JSON para n8n/Make/Resend/WhatsApp Cloud API)
- [x] Interfaz `NotificationChannel` extensible en `src/lib/services/notifications.ts`
- [x] Envío automático al cambiar estado de paquete (estados notificables configurables)

### 1.4 API y tracking
- [x] `GET /api/v1/tracking/:guia` — tracking público (datos no sensibles, nombre enmascarado)
- [x] `POST /api/cron/dispatch` — cron protegido con `Bearer $CRON_SECRET` (idempotente, tolerante a fallos)
- [x] `GET /api/health` — healthcheck público (para Docker HEALTHCHECK)

### 1.5 Despliegue Docker / EasyPanel
- [x] **Dockerfile** multi-stage Node 20 Alpine + `output: "standalone"`
- [x] **HEALTHCHECK** → `/api/health`
- [x] **docker-compose.yml** con volumen persistente `aducarga_data:/app/.data`
- [x] **.env.production.example** con todas las variables (solo nombres)
- [x] **.dockerignore** optimizado
- [x] **README.md** sección 4 documentada

### 1.6 Manuales de uso por rol
- [x] `docs/manual-admin.md` — Administrador
- [x] `docs/manual-operador.md` — Operador
- [x] `docs/manual-cliente.md` — Cliente final

### 1.7 Pruebas y calidad
- [x] `npm run typecheck` — **limpio** (0 errores TypeScript)
- [x] `npm run build` — **exitoso** (25/25 páginas estáticas generadas)
- [x] 11 pruebas unitarias de lógica de negocio
- [x] 27 pasos E2E con Playwright (cobertura completa de flujos)

---

## 2. Qué está PENDIENTE ⏳

### 2.1 Despliegue real (requiere acción del cliente)
- [ ] **Crear proyecto en Supabase** y ejecutar `supabase/schema.sql`
- [ ] **Configurar VPS con EasyPanel** (Hostinger u otro proveedor)
- [ ] **Configurar dominio** `aducarga.com` (o el que el cliente defina) → DNS A/AAAA + Traefik HTTPS
- [ ] **Variables de entorno en producción** (ver sección 4)
- [ ] **Desplegar contenedor** con `docker-compose up -d --build`
- [ ] **Configurar cron externo** (EasyPanel cron job o servicio aparte) que llame a `POST /api/cron/dispatch` cada 2-5 min con `Authorization: Bearer $CRON_SECRET`
- [ ] **Verificar en sitio real**: registro, login, flujo principal, notificaciones

### 2.2 Configuración de notificaciones externas
- [ ] Configurar **n8n/Make** para recibir webhook y enviar correo/WhatsApp
- [ ] Definir plantillas de mensaje por estado
- [ ] Probar entrega real

### 2.3 Datos de marca y contenido (requiere validación del cliente)
- [ ] **Logotipo oficial** (SVG/PNG) → `public/brand/`
- [ ] **Colores RGB oficiales** → `src/lib/brand.ts`
- [ ] **Tipografía (Google Fonts)** → `src/lib/brand.ts`
- [ ] **Contenido comercial** (servicios, ventajas, FAQ) → `src/lib/content.ts`
- [ ] **Dirección del casillero internacional** → `src/lib/brand.ts`
- [ ] **Canales de contacto** (WhatsApp, email, teléfono, horario) → `src/lib/brand.ts`

### 2.4 Mejoras opcionales (fase B)
- [ ] Push notifications reales (Web Push / VAPID)
- [ ] Integración directa Resend / WhatsApp Cloud API (implementar `NotificationChannel`)
- [ ] Límite de intentos de login con Redis/Upstash (actual: en memoria)
- [ ] Sufijo aleatorio en números de tracking (anti-enumeración)
- [ ] Páginas `/privacidad` y `/terminos` con textos reales del cliente

---

## 3. Qué DEPENDE DEL CLIENTE 🤝

| Dato / Credencial | ¿Para qué? | Estado |
|---|---|---|
| **Dominio** (ej. `aducarga.com`) | `NEXT_PUBLIC_SITE_URL`, DNS, HTTPS, OAuth | ❌ Pendiente |
| **Proyecto Supabase** (URL, anon key, service role key) | Base de datos producción, Auth, Storage | ❌ Pendiente |
| **SESSION_SECRET** (32 bytes hex) | Firma de cookies de sesión | ❌ Pendiente |
| **CRON_SECRET** (string aleatorio) | Autenticación endpoint cron | ❌ Pendiente |
| **NOTIFY_WEBHOOK_URL** | Endpoint n8n/Make para notificaciones | ❌ Pendiente (opcional) |
| **NOTIFY_WEBHOOK_SECRET** | Firma HMAC del webhook | ❌ Pendiente (opcional) |
| **Manual de marca** (logo, colores, fuente) | Identidad visual en `src/lib/brand.ts` | ❌ Pendiente |
| **Dirección casillero internacional** | Mostrar en panel cliente | ❌ Pendiente |
| **Canales de contacto** (WhatsApp, email, teléfono, horario) | Footer, panel cliente, notificaciones | ❌ Pendiente |
| **Tarifas y tiempos de tránsito** | Contenido comercial (`src/lib/content.ts`) | ❌ Pendiente |
| **Credenciales de correo** (Resend/SendGrid/Mailgun) | Si no usa n8n/Make para email | ❌ Pendiente (opcional) |
| **WhatsApp Cloud API** (token, phone number ID, plantillas) | Si integra WhatsApp directo | ❌ Pendiente (opcional) |

---

## 4. Variables de entorno de producción (resumen)

```bash
# Obligatorias
NEXT_PUBLIC_SITE_URL=https://aducarga.com          # Sin barra final
CRON_SECRET=<generar: openssl rand -hex 32>
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SESSION_SECRET=<generar: openssl rand -hex 32>

# Opcionales (notificaciones externas)
NOTIFY_WEBHOOK_URL=https://n8n.dominio.com/webhook/aducarga
NOTIFY_WEBHOOK_SECRET=<generar: openssl rand -hex 32>
DATA_DIR=.data
```

---

## 5. Pruebas por hacer en producción

| Prueba | Criterio de éxito |
|---|---|
| Healthcheck | `GET /api/health` → 200 `{ "ok": true }` |
| Login cliente | Accede a `/cuenta`, ve solo sus paquetes |
| Login operador | Accede a `/rastreo`, ve solo paquetes asignados |
| Login admin | Accede a `/admin`, ve todo el sistema |
| Tracking público | `GET /api/v1/tracking/ADU-XXXX` → 200, datos correctos |
| Cron dispatch | `POST /api/cron/dispatch` con Bearer → 200, notificaciones encoladas |
| Notificación webhook | n8n/Make recibe payload firmado, procesa sin error |
| PWA instalable | Chrome/Edge muestra "Instalar", funciona offline |
| Redirecciones | Login/logout/callback usan `NEXT_PUBLIC_SITE_URL`, no `0.0.0.0:3000` |

---

## 6. Entregables incluidos en este paquete

```
aducarga/
├── src/                    # Código fuente completo
├── public/                 # Assets estáticos + PWA icons
├── supabase/schema.sql     # Migración BD completa
├── docs/
│   ├── manual-admin.md
│   ├── manual-operador.md
│   ├── manual-cliente.md
│   └── alcance.md          # Este documento
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.production.example
├── .env.example
├── next.config.mjs
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── README.md
└── MEMORY.md               # Índice de memoria del proyecto
```

---

## 7. Próximos pasos recomendados

1. **Cliente** provee credenciales/datos de la sección 3
2. **Equipo técnico** crea proyecto Supabase + ejecuta schema.sql
3. **Equipo técnico** configura VPS + EasyPanel + dominio + DNS
4. **Equipo técnico** despliega con docker-compose (ver README.md §4)
5. **Equipo técnico** configura cron externo (EasyPanel cron job)
6. **Equipo técnico + Cliente** validan marca/contenido en `src/lib/brand.ts` y `src/lib/content.ts`
7. **Equipo técnico** configura n8n/Make para notificaciones externas
8. **Verificación conjunta** en sitio real con la lista de la sección 5
9. **Entrega formal** y cierre de proyecto

---

*Documento generado automáticamente como parte de la entrega de código ADUCARGA PWA.*
*Metodología: creadora-apps-web-pwa (fase 7 - Documentación y entregables).*