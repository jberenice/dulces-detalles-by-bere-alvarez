"use client";
/** Pasos del tutorial guiado. Se marcan solos al visitar la sección (progreso guardado en este navegador). */
export type TutorialStep = { id: string; title: string; text: string; tip?: string; path: string; match: string };

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "postres",
    title: "Conoce el costo real de un postre",
    text: "Abre cualquier receta del recetario. Verás sus ingredientes por sección (pan, relleno, cobertura), las horas de trabajo y el resumen de costos con el precio sugerido y tu margen.",
    tip: "Cambia el % de ganancia y mira cómo se ajusta el precio al instante.",
    path: "/dashboard/postres",
    match: "/dashboard/postres/",
  },
  {
    id: "ingredientes",
    title: "Actualiza el precio de un ingrediente",
    text: "En Ingredientes edita el precio de algo que compraste (por ejemplo la harina). Todas las recetas que lo usan se recalculan solas.",
    tip: "Activa el control de inventario para llevar tus existencias.",
    path: "/dashboard/ingredientes",
    match: "/dashboard/ingredientes",
  },
  {
    id: "cotizacion",
    title: "Crea tu primera cotización",
    text: "Elige un cliente (o crea uno nuevo) y agrega postres: el precio y el costo se llenan solos. Guarda y descarga el PDF con tu logo o envíalo por WhatsApp.",
    tip: "Tu cliente puede aceptar la cotización desde el enlace que le mandas.",
    path: "/dashboard/cotizaciones/nueva",
    match: "/dashboard/cotizaciones/",
  },
  {
    id: "pedido",
    title: "Convierte una cotización en pedido",
    text: "Dentro de una cotización toca «Convertir en pedido». En el pedido registra anticipos y avanza su estado: confirmado → preparando → listo → entregado.",
    tip: "Usa los mensajes rápidos para avisarle a tu cliente que su pedido está listo.",
    path: "/dashboard/pedidos",
    match: "/dashboard/pedidos/",
  },
  {
    id: "calendario",
    title: "Revisa tu calendario de entregas",
    text: "Mira todas tus entregas del mes de un vistazo y toca un día para ver el detalle. La campana 🔔 te avisa de lo que se entrega hoy.",
    path: "/dashboard/calendario",
    match: "/dashboard/calendario",
  },
  {
    id: "produccion",
    title: "Genera tu lista de compras",
    text: "En Producción calculamos qué hornear cada día y exactamente qué ingredientes y empaques comprar para tus pedidos de la semana.",
    tip: "Envíate la lista por WhatsApp para llevarla al súper.",
    path: "/dashboard/produccion",
    match: "/dashboard/produccion",
  },
  {
    id: "tienda",
    title: "Diseña tu tienda en línea",
    text: "Elige colores, letra, portada y acomodo de productos con vista previa en vivo. Tus clientes arman su pedido y te llega por WhatsApp.",
    path: "/dashboard/tienda",
    match: "/dashboard/tienda",
  },
  {
    id: "reportes",
    title: "Mira tus reportes de ventas",
    text: "Ventas, utilidad, ticket promedio y los postres más vendidos por periodo. Puedes exportarlos a Excel.",
    path: "/dashboard/reportes",
    match: "/dashboard/reportes",
  },
  {
    id: "mensajes",
    title: "Personaliza tus mensajes",
    text: "Edita los mensajes de WhatsApp y correo con tu estilo. Las variables como {cliente} y {total} se llenan solas.",
    path: "/dashboard/mensajes",
    match: "/dashboard/mensajes",
  },
];

const key = (uid: string) => `dd-tutorial-${uid}`;

export function getProgress(uid: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key(uid)) ?? "[]");
  } catch {
    return [];
  }
}

export function setProgress(uid: string, done: string[]) {
  try {
    localStorage.setItem(key(uid), JSON.stringify([...new Set(done)]));
    window.dispatchEvent(new Event("dd-tutorial"));
  } catch {}
}

/** Marca el paso cuya sección se está visitando */
export function trackVisit(uid: string, pathname: string) {
  const step = TUTORIAL_STEPS.find((s) => pathname.startsWith(s.match) && pathname !== "/dashboard/cotizaciones/nueva");
  if (!step) return;
  const done = getProgress(uid);
  if (!done.includes(step.id)) setProgress(uid, [...done, step.id]);
}

export const welcomeSeenKey = (uid: string) => `dd-welcome-${uid}`;
