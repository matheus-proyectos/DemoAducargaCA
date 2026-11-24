/**
 * ════════════════════════════════════════════════════════════════
 *  SISTEMA DE MARCA ADUCARGA — fuente única de verdad
 * ════════════════════════════════════════════════════════════════
 *  ESTADO: PROVISIONAL.
 *  El perfil de Instagram @aducarga no permite acceso automatizado, por lo
 *  que los colores, la tipografía y el logotipo oficiales NO se pudieron
 *  verificar. No se ha inventado una identidad: estos valores son neutros
 *  (azul institucional + acento ámbar, convención del sector logístico) y
 *  deben sustituirse por el manual de marca de ADUCARGA:
 *
 *   1. Logotipo  → copiar a /public/brand/ y fijar `logo.src` (p. ej. "/brand/logo.svg").
 *   2. Colores   → reemplazar los canales RGB de `colors` ("R G B").
 *   3. Tipografía→ reemplazar `font.family` y `font.googleHref`.
 *   4. Poner `provisional: false`.
 *
 *  Todo el sitio (Tailwind, componentes, correos futuros) lee de aquí.
 */
export const brand = {
  name: "ADUCARGA",
  provisional: true,
  tagline: "Casillero internacional con entrega en Venezuela",
  colors: {
    brand: "12 44 82", //      #0C2C52 — azul institucional (provisional)
    brandDark: "7 27 52", //   #071B34
    brandSoft: "232 239 247", // #E8EFF7
    accent: "242 159 5", //    #F29F05 — ámbar (provisional)
    accentDark: "201 127 0", // #C97F00
  },
  font: {
    family: "Plus Jakarta Sans",
    googleHref:
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },
  logo: { src: null as string | null, alt: "ADUCARGA" },
  /** Canales de contacto. Los vacíos no se muestran. PENDIENTE de confirmar con ADUCARGA. */
  contact: {
    instagram: "aducarga",
    whatsapp: "", // formato internacional sin "+", p. ej. "584121234567"
    email: "",
    phone: "",
    hours: "",
  },
  /** Dirección del casillero internacional que se entrega al cliente. PENDIENTE. */
  locker: {
    confirmed: false,
    line1: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  },
};
