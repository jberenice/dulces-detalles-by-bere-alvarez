import type { OrderStatus, PaymentStatus, QuoteStatus } from "./types";

export const BRAND = {
  name: "Dulces Detalles",
  by: "by Bere Álvarez",
  tagline: "Hechos con amor de hogar",
};

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: "neutral" | "info" | "success" | "danger" | "warning" }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  enviada: { label: "Enviada", tone: "info" },
  aceptada: { label: "Aceptada", tone: "success" },
  rechazada: { label: "Rechazada", tone: "danger" },
  vencida: { label: "Vencida", tone: "warning" },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: "neutral" | "info" | "success" | "danger" | "warning" | "rose" }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  confirmado: { label: "Confirmado", tone: "info" },
  en_preparacion: { label: "En preparación", tone: "rose" },
  listo: { label: "Listo", tone: "success" },
  entregado: { label: "Entregado", tone: "neutral" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: "neutral" | "warning" | "success" }> = {
  pendiente: { label: "Sin pago", tone: "warning" },
  anticipo: { label: "Anticipo", tone: "neutral" },
  pagado: { label: "Pagado", tone: "success" },
};

export const UNITS = [
  { value: "g", label: "Gramos (g)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "pz", label: "Piezas (pz)" },
  { value: "cm", label: "Centímetros (cm)" },
];

export const CATEGORIES = ["Cupcakes", "Pasteles", "Pasteles en vaso", "Cheesecakes", "Postres", "Galletas", "Mesas de postres", "Otros"];
