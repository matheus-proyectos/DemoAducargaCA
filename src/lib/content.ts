/**
 * CONTENIDO COMERCIAL DEL SITIO — PROPUESTA PARA VALIDAR CON ADUCARGA.
 * Los servicios, ventajas y respuestas frecuentes describen el modelo de
 * casillero internacional → Venezuela solicitado en el brief. Antes de publicar,
 * ADUCARGA debe confirmar tarifas, tiempos y condiciones reales. Editar solo aquí.
 */
export const HERO = {
  title: "Tu compra está más cerca de lo que imaginas.",
  subtitle:
    "Rastrea tu paquete desde nuestro casillero internacional hasta la puerta de tu casa en Venezuela. Con ADUCARGA tienes el control de cada movimiento.",
};

export const STEPS = [
  { icon: "UserPlus", title: "Regístrate", text: "Crea tu cuenta y obtén tu código de casillero internacional." },
  { icon: "ShoppingBag", title: "Compra y notifica", text: "Compra en tu tienda favorita y prealerta tu paquete desde tu panel." },
  { icon: "Plane", title: "Lo enviamos", text: "Recibimos, verificamos y despachamos tu mercancía hacia Venezuela." },
  { icon: "PackageCheck", title: "Lo recibes", text: "Sigue cada movimiento hasta que llega a tus manos." },
] as const;

export const ADVANTAGES = [
  { icon: "Radar", title: "Rastreo en cada etapa", text: "Catorce hitos logísticos, del casillero a tu puerta, con fecha, hora y ubicación." },
  { icon: "ShieldCheck", title: "Mercancía verificada", text: "Cada paquete se identifica, pesa, mide y fotografía al llegar al almacén." },
  { icon: "BellRing", title: "Avisos automáticos", text: "Te notificamos cuando tu paquete llega, sale, arriba al país y se entrega." },
  { icon: "Boxes", title: "Consolidación de envíos", text: "Agrupamos tus compras para optimizar el transporte." },
  { icon: "Smartphone", title: "Todo desde tu teléfono", text: "Consulta tus envíos en cualquier momento, desde cualquier dispositivo." },
  { icon: "Headset", title: "Atención cercana", text: "Un equipo que responde tus dudas en cada paso del proceso." },
] as const;

export const SERVICES = [
  { icon: "Warehouse", title: "Casillero internacional", text: "Una dirección para tus compras en línea, con recepción y verificación de mercancía." },
  { icon: "Plane", title: "Envío aéreo", text: "La opción más rápida para tus compras y envíos urgentes hacia Venezuela." },
  { icon: "Ship", title: "Envío marítimo", text: "Ideal para cargas voluminosas o pesadas con un costo más eficiente." },
  { icon: "Truck", title: "Entrega nacional", text: "Distribución desde nuestro centro logístico hasta tu ciudad en Venezuela." },
] as const;

export const FAQ = [
  { q: "¿Cómo obtengo mi casillero?", a: "Regístrate en la plataforma. Al crear tu cuenta recibes un código de casillero que debes incluir junto a tu nombre en cada compra." },
  { q: "¿Dónde encuentro mi número de tracking?", a: "Cada paquete recibe un número de guía único con formato ADU-AAAA-000000. Lo verás en tu panel y en las notificaciones." },
  { q: "¿Qué significa “Casillero notificado”?", a: "Que registraste tu compra (prealerta) y estamos esperando que el transportista la entregue en nuestro almacén." },
  { q: "¿Todos los paquetes pasan por aduana?", a: "No necesariamente. Las etapas de aduana se muestran solo cuando aplican a tu envío." },
  { q: "¿Cuánto tarda mi envío?", a: "Depende de la modalidad (aérea o marítima) y del destino. La fecha estimada aparece en tu tracking cuando está disponible." },
  { q: "¿Qué hago si mi paquete no aparece?", a: "Verifica el número de guía. Si el problema continúa, escríbenos desde la sección de contacto indicando tu tracking." },
] as const;
