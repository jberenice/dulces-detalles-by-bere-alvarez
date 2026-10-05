/**
 * Planes de Dulces Detalles.
 * ✏️ Aquí cambias precios, nombres y lo que incluye cada plan: la página principal,
 *    el panel de licencias y los candados del menú leen de este archivo.
 */
export type PlanId = "basico" | "profesional" | "premium";
/** "vitalicia" ya no se vende (precio null en todos los planes); se conserva para las licencias que ya existían */
export type Billing = "mensual" | "anual" | "vitalicia";

export const PLAN_RANK: Record<PlanId, number> = { basico: 1, profesional: 2, premium: 3 };
export const planAllows = (plan: PlanId | null | undefined, min: PlanId) => PLAN_RANK[plan ?? "basico"] >= PLAN_RANK[min];

export type PlanInfo = { plan: PlanId; billing: Billing | null; expires_at: string | null };

export const BILLING_LABEL: Record<Billing, string> = { mensual: "Mensual", anual: "Anual", vitalicia: "De por vida" };

export const PLANS: {
  id: PlanId;
  name: string;
  tagline: string;
  prices: Record<Billing, number | null>;
  highlight?: boolean;
  /** Lo que se agrega respecto al plan anterior */
  features: string[];
}[] = [
  {
    id: "basico",
    name: "Básico",
    tagline: "Para cotizar bien y dejar de perder dinero",
    prices: { mensual: 149, anual: 1490, vitalicia: null },
    features: [
      "Costeo exacto de recetas (gastos fijos, ingredientes, empaques, ganancia)",
      "Cotizaciones en PDF con folio, por WhatsApp y correo",
      "Pedidos con pagos parciales y anticipos",
      "Calendario de entregas",
      "Clientes",
      "Reportes de ventas y postres más vendidos",
      "Respaldo en Excel",
    ],
  },
  {
    id: "profesional",
    name: "Profesional",
    tagline: "Para vender en línea y organizar tu cocina",
    prices: { mensual: 299, anual: 2990, vitalicia: null },
    highlight: true,
    features: [
      "Todo lo del plan Básico",
      "Minitienda en línea personalizable con variantes, galería y zonas de entrega",
      "Cupo diario, días llenos y anticipación mínima",
      "Código QR de tu tienda para imprimir",
      "Seguimiento de cotizaciones sin respuesta",
      "Saldos: quién te debe y cuánto",
      "Agenda de producción e inventario automático",
      "Plantillas de WhatsApp y notificaciones en el celular",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Para crecer con tu marca y cuidar tu ganancia",
    prices: { mensual: 499, anual: 4990, vitalicia: null },
    features: [
      "Todo lo del plan Profesional",
      "Alerta de margen cuando suben tus ingredientes",
      "Correos con tu logo y colores",
      "Recordatorio automático de saldo por correo a tus clientes",
      "Resumen diario de entregas en tu correo",
      "Configuración asistida: cargamos tus recetas contigo",
      "Soporte prioritario por WhatsApp",
    ],
  },
];

export const planName = (id: PlanId | null | undefined) => PLANS.find((p) => p.id === id)?.name ?? "Básico";

/** Plan mínimo por sección del panel (el resto está en todos los planes) */
export const ROUTE_PLAN: { prefix: string; min: PlanId; feature: string }[] = [
  { prefix: "/dashboard/tienda", min: "profesional", feature: "Minitienda en línea" },
  { prefix: "/dashboard/produccion", min: "profesional", feature: "Agenda de producción" },
  { prefix: "/dashboard/seguimiento", min: "profesional", feature: "Seguimiento de cotizaciones" },
  { prefix: "/dashboard/saldos", min: "profesional", feature: "Saldos y cobranza" },
  { prefix: "/dashboard/mensajes", min: "profesional", feature: "Plantillas de mensajes" },
  { prefix: "/dashboard/margenes", min: "premium", feature: "Alerta de margen" },
];

export function routePlan(pathname: string) {
  return ROUTE_PLAN.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")) ?? null;
}
