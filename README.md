# ADUCARGA — Plataforma de logística y rastreo de envíos

Plataforma web para gestionar envíos **desde el casillero internacional hasta la entrega en Venezuela**. Incluye un sitio público con rastreo, un panel privado para clientes, un panel administrativo, autenticación con roles, notificaciones y una API de tracking.

> **Estado de marca: PROVISIONAL.** El perfil @aducarga de Instagram no permite acceso automatizado, así que el logotipo, los colores y la tipografía oficiales **no se pudieron verificar**. Todo el sistema visual vive en `src/lib/brand.ts` y se sustituye en minutos cuando ADUCARGA entregue su manual de marca (ver [Marca](#marca)).

---

## 1. Inicio rápido (modo demostración)

Requisitos: **Node.js 18.18+** (probado con 22).

```bash
npm install
npm run dev            # http://localhost:3000
```

Sin variables de entorno, la app corre en **modo demostración**: crea `.data/db.json` con clientes, paquetes, embarques y notificaciones ficticios (marcados `is_demo`, con aviso visible en el sitio).

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente (Juan Pérez) | `cliente@aducarga.test` | `Demo2026!` |
| Cliente (María González) | `maria@aducarga.test` | `Demo2026!` |
| Administrador | `admin@aducarga.test` | `Admin2026!` |
| Operador | `operador@aducarga.test` | `Operador2026!` |

Guía del brief: **ADU-2026-000125** (Juan Pérez · Caracas · 4,5 kg · *En tránsito internacional*). Otras guías demo cubren todos los estados: `000118` entregado, `000119` en aduana, `000122` en ruta de entrega, `000123` en centro de distribución, `000124` inspeccionado, `000126` recibido en casillero, `000127` listo para despacho, `000128` casillero notificado.

Para reiniciar los datos demo: `npm run reset:demo`.

---

## 2. Arquitectura

```
Next.js 14 (App Router, Server Components, Server Actions) · TypeScript · Tailwind CSS
│
├─ Público      /  ·  /rastreo  ·  /login  ·  /registro  ·  /api/v1/tracking/:guia
├─ Cliente      /cuenta  (resumen, paquetes, prealerta, notificaciones, perfil/direcciones, soporte)
├─ Admin        /admin   (dashboard, paquetes, clientes, embarques, mensajes, notificaciones,
│                         estados*, auditoría*)          * solo rol administrador
│
├─ src/lib/services     Lógica de negocio única (paquetes, movimientos, embarques, notificaciones, auditoría)
├─ src/lib/db           Contrato de datos + 2 adaptadores:
│     json.ts           → MODO DEMO (archivo local, escritura atómica)
│     supabase.ts       → PRODUCCIÓN (PostgreSQL de Supabase)
├─ src/lib/storage.ts   Fotos: disco local (demo) o Supabase Storage (bucket privado)
└─ supabase/schema.sql  Tablas, relaciones, índices, RLS, bucket y estados por defecto
```

**Experiencia 3D** — mismo stack que matheusgroupp.com y matheustechnology.com:

- **three.js 0.187**: globo procedural con la ruta *casillero → Venezuela → ciudad* y postprocesado UnrealBloom.
- **GSAP 3.15** (ScrollTrigger, SplitText) y **Lenis 1.3** para el scroll suave y las animaciones del Home.

En el Home, un paquete recorre la ruta en bucle. En el rastreo, el globo muestra **la posición real del envío** según su etapa. three.js se descarga solo en las páginas que muestran el globo. En móvil no hay bloom y se usan menos partículas. La animación se pausa fuera de pantalla y respeta `prefers-reduced-motion`. Los paneles de trabajo no llevan 3D, para que sean rápidos.

### Modelo de datos

`customers 1─N packages 1─N movements` · `shipments 1─N packages` · `customers 1─N addresses / notifications` · `profiles (usuarios) N─1 customers` · `statuses` (configurables) · `audit_logs` · `messages`.

El **estado vigente** de un paquete es siempre el del movimiento con la fecha de evento más reciente. Así, cargar un movimiento atrasado no retrocede el tracking. Al eliminar un movimiento, el estado se recalcula.

### Seguridad

- Contraseñas: scrypt (demo) o Supabase Auth (producción). Sesión en cookie `httpOnly` firmada con HMAC-SHA256.
- **Doble barrera**: el middleware protege `/cuenta` y `/admin`, y además cada página y cada Server Action vuelve a verificar el rol contra la base de datos.
- Un cliente **solo** ve sus paquetes, movimientos, fotos y notificaciones; para los ajenos recibe 404. Está cubierto por pruebas.
- El tracking público y la API muestran el nombre **enmascarado** ("Juan P."). Las fotos son privadas: se sirven tras verificar permisos.
- RLS en PostgreSQL como defensa en profundidad. Hay protección contra redirecciones abiertas, un límite de intentos de login, un honeypot antispam y cabeceras de seguridad.
- Auditoría de cada alta, edición, movimiento, asignación y eliminación.

---

## 3. Producción con Supabase

1. Cree un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pegue y ejecute `supabase/schema.sql` (tablas, RLS, bucket `package-photos`, estados).
3. Copie `.env.example` a `.env.local` y complete:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...      # solo servidor, nunca en el navegador
   SESSION_SECRET=$(openssl rand -hex 32)
   ```
4. (Opcional) Cargar los datos demo: `npm run seed:supabase`.
5. **Primer administrador real**: regístrese en `/registro` y luego, en el SQL Editor:
   ```sql
   update public.profiles set role = 'admin', customer_id = null where email = 'su-correo@aducarga.com';
   ```

Con las tres variables de Supabase definidas, la app usa Supabase automáticamente.

## 4. Despliegue

**Vercel** (recomendado): importe el repositorio, defina las variables de entorno del paso 3 y despliegue. Requiere Supabase, porque el modo demo escribe en disco y Vercel no lo conserva entre ejecuciones.

**VPS / EasyPanel (Docker o Node)**:
```bash
npm ci && npm run build
SESSION_SECRET=... npm start          # puerto 3000; ponga un proxy HTTPS delante
```
En un VPS el modo demo funciona con persistencia si `DATA_DIR` apunta a un volumen persistente.

**Docker / EasyPanel** (recomendado para producción):
```bash
cp .env.production.example .env
# Editar .env con las variables reales (NEXT_PUBLIC_SITE_URL, CRON_SECRET, Supabase...)
docker-compose up -d --build
```
- El Dockerfile usa Node 20 multi-stage y `output: "standalone"` en `next.config.mjs`.
- El HEALTHCHECK verifica `/api/health` (endpoint público sin autenticación).
- El endpoint `/api/cron/dispatch` está protegido con `Authorization: Bearer $CRON_SECRET`.
- Para producción con Supabase, complete las variables en `.env` (ver `.env.example`).

## 5. Notificaciones (correo / WhatsApp)

Cada estado marcado como *notificable* (🔔, configurable en **Admin → Estados**) genera:

1. Una notificación **en el panel del cliente** (siempre activa).
2. Si `NOTIFY_WEBHOOK_URL` está definido, un **evento JSON firmado** (`X-Aducarga-Signature`, HMAC-SHA256 con `NOTIFY_WEBHOOK_SECRET`). Un flujo de **n8n o Make** puede convertirlo en correo electrónico o en un mensaje de WhatsApp (WhatsApp Cloud API) sin tocar el código.

```json
{ "event": "package.status_changed", "tracking": "ADU-2026-000125",
  "message": "Tu paquete salió hacia Venezuela.",
  "status": { "code": "DESPACHADO", "name": "Despachado internacionalmente" },
  "customer": { "name": "...", "email": "...", "phone": "...", "locker_code": "CAS-01025" }, ... }
```

Para integrar un proveedor directo (Resend, WhatsApp Cloud API), implemente la interfaz `NotificationChannel` en `src/lib/services/notifications.ts`. No se simula ningún envío: un canal sin configurar no se registra como enviado.

## 6. API pública

`GET /api/v1/tracking/ADU-2026-000125` devuelve el estado, la ubicación, el destino, el peso y los movimientos (sin datos sensibles). Sirve para chatbots, n8n o sitios aliados.

## 7. Pruebas

```bash
npm run typecheck
npm test                     # 11 pruebas de lógica de negocio
npm run build && SESSION_SECRET=$(openssl rand -hex 32) INSECURE_COOKIES=1 npm start
BASE_URL=http://localhost:3000 npm run test:e2e   # 27 pasos en navegador real (requiere Playwright)
```

Las pruebas E2E cubren el Home 3D, el tracking público y la API, el registro, el login, el dashboard del cliente en móvil, la prealerta, las direcciones, los permisos entre clientes, el alta de paquetes con foto, los movimientos, la edición con historial, los embarques con movimiento en bloque, los estados configurables, los mensajes, las notificaciones, la auditoría y las restricciones del operador.

## Marca

Edite **solo** `src/lib/brand.ts`:

- `logo.src` → archivo en `public/brand/` (SVG o PNG).
- `colors` → canales RGB oficiales (`"R G B"`).
- `font` → familia y URL de Google Fonts.
- `contact` → WhatsApp, correo, teléfono y horario (los vacíos no se muestran).
- `locker` → dirección del casillero internacional (aparece en el panel del cliente cuando `confirmed: true`).

El contenido comercial (servicios, ventajas, preguntas frecuentes) está en `src/lib/content.ts` y **debe validarse con ADUCARGA** antes de publicarse.

## Límites conocidos

- La dirección del casillero, los canales de contacto, las tarifas y los tiempos de tránsito están pendientes de que ADUCARGA los confirme.
- No hay integraciones con aerolíneas, aduanas ni transportistas: los movimientos los registra el personal (individualmente o por embarque).
- El límite de intentos de login es en memoria. Con varias instancias, use Redis/Upstash o los límites de Supabase Auth.
- Los números de tracking son secuenciales, como pide el brief. El tracking público solo expone datos no sensibles; si se quiere dificultar la enumeración, puede añadirse un sufijo aleatorio.
