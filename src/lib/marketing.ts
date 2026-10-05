/**
 * Contenido editable de la página principal.
 *
 * ✏️ VIDEO: graba un recorrido de 60–90 s de la demo (en el celular: grabación de pantalla),
 *    súbelo a YouTube como "No listado" y pega aquí solo el ID (lo que va después de "v=" en el enlace).
 *    Ej. https://www.youtube.com/watch?v=AbC123xYz → "AbC123xYz". Vacío = no se muestra el video.
 *
 * ✏️ TESTIMONIOS: agrega solo opiniones REALES de tus clientas y con su permiso por escrito
 *    (un "sí, puedes publicarlo" por WhatsApp sirve). Mientras la lista esté vacía, la sección no aparece.
 */
export const DEMO_VIDEO_ID = "";

export type Testimonial = {
  name: string;
  business: string;
  city?: string;
  text: string;
  /** Foto opcional (URL https) */
  photo?: string;
};

export const TESTIMONIALS: Testimonial[] = [
  // { name: "Nombre", business: "Repostería…", city: "Chetumal", text: "Lo que te dijo, tal cual." },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Necesito instalar algo?",
    a: "No. Funciona desde el navegador de tu celular o computadora. Si quieres, la instalas como app en tu pantalla de inicio y recibes notificaciones de pedidos.",
  },
  {
    q: "¿La puedo usar en el celular y en la computadora?",
    a: "Sí. Tu licencia es personal y funciona en un dispositivo a la vez: si entras desde otro, la sesión anterior se cierra sola. Así nadie más usa tu cuenta.",
  },
  {
    q: "¿Puedo probarla antes de pagar?",
    a: "Claro. La demo es gratis, no pide tarjeta y trae datos de ejemplo para que veas cotizaciones, pedidos, reportes y la tienda funcionando.",
  },
  {
    q: "¿Cómo pago y cómo recibo mi acceso?",
    a: "Escríbenos por WhatsApp, elige tu plan y paga por transferencia o depósito. Te enviamos tu código de licencia para crear tu cuenta en minutos.",
  },
  {
    q: "¿Cobran comisión por mis ventas?",
    a: "No. Pagas solo tu plan. Lo que vendas en tu tienda o por WhatsApp es 100 % tuyo.",
  },
  {
    q: "¿Mis clientes necesitan crear una cuenta para pedir?",
    a: "No. Entran a tu tienda desde el enlace o el QR, eligen sus postres, la fecha y la zona, y el pedido te llega a WhatsApp y a tu panel.",
  },
  {
    q: "¿Puedo cambiar de plan después?",
    a: "Sí, cuando quieras. Subes de plan y las funciones nuevas se activan en tu misma cuenta, sin perder nada.",
  },
  {
    q: "¿Qué pasa si no renuevo a tiempo?",
    a: "Tu acceso se pausa, pero tu información se queda guardada. En cuanto renuevas, vuelves a entrar y todo sigue donde lo dejaste.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Cada cuenta está aislada de las demás, la conexión va cifrada y puedes descargar un respaldo en Excel de todo cuando quieras.",
  },
];
