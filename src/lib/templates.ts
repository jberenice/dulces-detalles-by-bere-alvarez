/** Plantillas de mensajes de WhatsApp / correo editables por cada usuaria. */
import type { Profile } from "./types";

export type TemplateKey =
  | "cotizacion_whatsapp"
  | "cotizacion_correo"
  | "pedido_confirmado"
  | "pedido_listo"
  | "recordatorio_pago"
  | "agradecimiento"
  | "seguimiento_cotizacion"
  | "pedir_resena"
  | "cumpleanos"
  | "sellos";

export const TEMPLATE_VARS: { key: string; label: string; example: string }[] = [
  { key: "cliente", label: "Nombre del cliente", example: "Laura" },
  { key: "folio", label: "Folio", example: "C-0012" },
  { key: "total", label: "Total", example: "$1,250.00" },
  { key: "fecha", label: "Fecha de entrega / evento", example: "sábado 18 de octubre" },
  { key: "hora", label: "Hora", example: "a las 14:00" },
  { key: "postres", label: "Lista de postres", example: "• 12 × Cupcakes red velvet\n• 1 × Pastel 3 leches" },
  { key: "anticipo", label: "Anticipo pagado", example: "$625.00" },
  { key: "saldo", label: "Saldo pendiente", example: "$625.00" },
  { key: "titulo", label: "Título de la cotización", example: " de \"XV años de Sofía\"" },
  { key: "vigencia", label: "Vigencia de la cotización", example: "31 de octubre" },
  { key: "enlace", label: "Enlace de la cotización", example: "https://…/c/…" },
  { key: "entrega", label: "Recoger / envío", example: "lista para recoger" },
  { key: "datos_pago", label: "Datos bancarios", example: "BBVA · CLABE 0123…" },
  { key: "negocio", label: "Nombre de tu negocio", example: "Dulces Detalles" },
  { key: "tu_nombre", label: "Tu nombre", example: "Bere" },
  { key: "enlace_resena", label: "Enlace para dejar reseña", example: "https://…/r/…" },
  { key: "tienda", label: "Enlace de tu tienda", example: "https://tutienda.dulcesdetallesbyberealvarez.com" },
  { key: "sellos", label: "Sellos (tarjeta)", example: "7 de 10" },
  { key: "premio", label: "Premio de la tarjeta de sellos", example: "1 caja de cupcakes gratis" },
];

export const TEMPLATE_META: Record<TemplateKey, { title: string; description: string; channel: "WhatsApp" | "Correo" }> = {
  cotizacion_whatsapp: { title: "Enviar cotización", description: "Al compartir una cotización por WhatsApp", channel: "WhatsApp" },
  cotizacion_correo: { title: "Cotización por correo", description: "Texto del correo con la cotización en PDF", channel: "Correo" },
  pedido_confirmado: { title: "Pedido confirmado", description: "Cuando confirmas fecha y detalles del pedido", channel: "WhatsApp" },
  pedido_listo: { title: "Pedido listo", description: "Cuando el pedido está listo o va en camino", channel: "WhatsApp" },
  recordatorio_pago: { title: "Recordatorio de pago", description: "Para cobrar el saldo pendiente con amabilidad", channel: "WhatsApp" },
  agradecimiento: { title: "Agradecimiento", description: "Después de entregar, para pedir su opinión", channel: "WhatsApp" },
  seguimiento_cotizacion: { title: "Seguimiento de cotización", description: "Cuando una cotización lleva días sin respuesta", channel: "WhatsApp" },
  pedir_resena: { title: "Pedir reseña", description: "Después de entregar, con el enlace para calificar y subir foto", channel: "WhatsApp" },
  cumpleanos: { title: "Felicitación de cumpleaños", description: "Para felicitar a tus clientas en su cumpleaños", channel: "WhatsApp" },
  sellos: { title: "Tarjeta de sellos", description: "Para contarle cuántos sellos lleva", channel: "WhatsApp" },
};

export const DEFAULT_TEMPLATES: Record<TemplateKey, string> = {
  cotizacion_whatsapp:
    "¡Hola {cliente}! 🧁 Te comparto la cotización {folio}{titulo} por un total de {total}.\n\nPuedes verla y aceptarla aquí: {enlace}\n\nCualquier duda estoy para ayudarte 💕\n{negocio}",
  cotizacion_correo:
    "Hola {cliente},\n\nMuchas gracias por tu interés. Te comparto la cotización {folio}{titulo} por un total de {total}.\nEsta cotización es válida hasta el {vigencia}.\n\nPuedes verla y aceptarla en línea aquí: {enlace}\n\nCon cariño,\n{tu_nombre}",
  pedido_confirmado:
    "¡Hola {cliente}! 💕 Tu pedido {folio} quedó confirmado para el {fecha} {hora}:\n{postres}\n\nTotal: {total}\nAnticipo: {anticipo}\nResta: {saldo}\n\n¡Gracias por tu preferencia! {negocio}",
  pedido_listo: "¡Hola {cliente}! 🧁 Tu pedido {folio} ya está {entrega}.\nSaldo pendiente: {saldo}\n¡Que lo disfrutes!",
  recordatorio_pago:
    "¡Hola {cliente}! Te recuerdo amablemente que el saldo de tu pedido {folio} es de {saldo}.\n\nDatos para transferencia:\n{datos_pago}\n\n¡Gracias! 💕",
  seguimiento_cotizacion:
    "¡Hola {cliente}! 😊 Solo paso a saludarte y saber si pudiste revisar la cotización {folio}{titulo} por {total}.\n\nSi quieres ajustar sabores, cantidades o la fecha, con gusto lo vemos. Te dejo el enlace: {enlace}\n\nRecuerda que es válida hasta el {vigencia} 💕\n{negocio}",
  agradecimiento: "¡Hola {cliente}! Muchas gracias por tu pedido 💕 Nos encantaría saber qué te pareció. ¡Te esperamos pronto! — {negocio}",
  pedir_resena:
    "¡Hola {cliente}! 💕 Gracias por tu pedido {folio}. ¿Nos regalas un minuto para contarnos qué te pareció? Puedes calificarnos y subir una foto aquí:\n{enlace_resena}\n\n¡Tu opinión nos ayuda muchísimo! — {negocio}",
  cumpleanos:
    "¡Feliz cumpleaños, {cliente}! 🎂🎉 En {negocio} te deseamos un día lleno de dulzura. Si quieres celebrarlo con un postre, aquí estamos 💕\n{tienda}",
  sellos: "¡Hola {cliente}! 🧁 Ya llevas {sellos} sellos en tu tarjeta de {negocio}. Al completarla te llevas {premio}. ¡Gracias por tu preferencia! 💕",
};

export function getTemplate(profile: Pick<Profile, "message_templates">, key: TemplateKey) {
  const custom = profile.message_templates?.[key];
  return typeof custom === "string" && custom.trim() ? custom : DEFAULT_TEMPLATES[key];
}

/** Variables que, si vienen vacías, eliminan todo su renglón (p. ej. sin anticipo o sin vigencia) */
const LINE_VARS = ["vigencia", "anticipo", "saldo", "enlace", "datos_pago", "tienda", "enlace_resena"];

/** Reemplaza {variables}; quita los renglones cuyas variables opcionales quedaron vacías */
export function renderTemplate(template: string, vars: Record<string, string | null | undefined>) {
  return template
    .split("\n")
    .filter((line) => !LINE_VARS.some((v) => line.includes(`{${v}}`) && !vars[v]))
    .join("\n")
    .replace(/\{([a-z_]+)\}/g, (m, k: string) => (k in vars ? (vars[k] ?? "") : m))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const exampleVars = () => Object.fromEntries(TEMPLATE_VARS.map((v) => [v.key, v.example]));
