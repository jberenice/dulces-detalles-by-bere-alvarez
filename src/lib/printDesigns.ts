/**
 * Diseñador de impresos: tarjetas de presentación, etiquetas, stickers (cuadrados, redondos o de galleta) y QR.
 * Todo se dibuja con HTML + SVG en centímetros, así la vista previa y la impresión salen iguales.
 * Los textos se ajustan midiendo en el navegador (fitPieces), para que nunca se corten.
 */

export type PrintKind = "tarjeta" | "etiqueta" | "sticker" | "qr";
export type Shape = "rectangulo" | "cuadrado" | "redondo" | "galleta";
export type Layout = "clasico" | "invertido" | "centrado" | "banda" | "minimal" | "marco";
export type Decor = "ninguna" | "glaseado" | "helado" | "betun" | "encaje" | "capas" | "capacillo";
export type Pattern = "liso" | "chispas" | "puntos" | "rayas" | "ondas" | "waffle";
export type Border = "ninguno" | "linea" | "punteado" | "doble";
export type Font = "elegante" | "romantica" | "moderna" | "divertida" | "redondita";

export type PrintDesign = {
  size: string;
  shape: Shape;
  layout: Layout;
  decor: Decor;
  bg: string;
  primary: string;
  text: string;
  qrColor: string;
  font: Font;
  border: Border;
  pattern: Pattern;
  radius: number; // cm (solo rectángulos)
  showLogo: boolean;
  showQr: boolean;
  title: string;
  subtitle: string;
  contact: string;
  instagram: string;
  facebook: string;
  showContact: boolean;
  showInstagram: boolean;
  showFacebook: boolean;
  showUrl: boolean;
  /** Ficha del postre (etiquetas): postre elegido y qué datos mostrar */
  dessertId: string;
  showIngredients: boolean;
  showAllergens: boolean;
  showBestBefore: boolean;
  /** Fecha de elaboración (AAAA-MM-DD); vacía = renglón para llenar a mano */
  madeOn: string;
};

export type SizeOption = { id: string; label: string; w: number; h: number; shapes: Shape[] };

const ROUNDS: Shape[] = ["cuadrado", "redondo", "galleta"];

export const KINDS: Record<PrintKind, { label: string; hint: string; sizes: SizeOption[] }> = {
  tarjeta: {
    label: "Tarjetas de presentación",
    hint: "Para entregar con cada pedido o dejar en tu mostrador",
    sizes: [
      { id: "9x5", label: "Estándar 9 × 5 cm", w: 9, h: 5, shapes: ["rectangulo"] },
      { id: "8.5x5.5", label: "Americana 8.5 × 5.5 cm", w: 8.5, h: 5.5, shapes: ["rectangulo"] },
      { id: "5x9", label: "Vertical 5 × 9 cm", w: 5, h: 9, shapes: ["rectangulo"] },
    ],
  },
  etiqueta: {
    label: "Etiquetas",
    hint: "Para cajas, bolsas y frascos",
    sizes: [
      { id: "7x4", label: "7 × 4 cm", w: 7, h: 4, shapes: ["rectangulo"] },
      { id: "10x5", label: "10 × 5 cm", w: 10, h: 5, shapes: ["rectangulo"] },
      { id: "6x3", label: "6 × 3 cm", w: 6, h: 3, shapes: ["rectangulo"] },
      { id: "10x7", label: "Ficha 10 × 7 cm", w: 10, h: 7, shapes: ["rectangulo"] },
    ],
  },
  sticker: {
    label: "Stickers",
    hint: "Cuadrados, redondos o con orilla de galleta, para sellar tus empaques",
    sizes: [
      { id: "4", label: "4 cm", w: 4, h: 4, shapes: ROUNDS },
      { id: "5", label: "5 cm", w: 5, h: 5, shapes: ROUNDS },
      { id: "6", label: "6 cm", w: 6, h: 6, shapes: ROUNDS },
      { id: "7.5", label: "7.5 cm", w: 7.5, h: 7.5, shapes: ROUNDS },
    ],
  },
  qr: {
    label: "QR para mostrador",
    hint: "Tu código grande para pegar en la vitrina o la caja",
    sizes: [
      { id: "7", label: "7 × 7 cm", w: 7, h: 7, shapes: ROUNDS },
      { id: "10", label: "10 × 10 cm", w: 10, h: 10, shapes: ROUNDS },
      { id: "10x14", label: "10 × 14 cm (cartel)", w: 10, h: 14, shapes: ["rectangulo"] },
      { id: "14x20", label: "14 × 20 cm (media carta)", w: 14, h: 20, shapes: ["rectangulo"] },
    ],
  },
};

export const SHAPE_LABEL: Record<Shape, string> = { rectangulo: "Rectángulo", cuadrado: "Cuadrado", redondo: "Redondo", galleta: "Galleta" };

export const LAYOUTS: { id: Layout; label: string; hint: string }[] = [
  { id: "clasico", label: "Clásico", hint: "QR a un lado (arriba si es cuadrada)" },
  { id: "invertido", label: "Invertido", hint: "Datos primero, QR al otro lado" },
  { id: "centrado", label: "Centrado", hint: "Logo arriba, todo al centro" },
  { id: "banda", label: "Con banda", hint: "Franja de color con tu nombre" },
  { id: "marco", label: "Marco", hint: "Doble marco fino, elegante" },
  { id: "minimal", label: "Minimal", hint: "QR grande y tu nombre" },
];

export const DECORS: { id: Decor; label: string; hint: string }[] = [
  { id: "ninguna", label: "Sin decoración", hint: "Limpio y sencillo" },
  { id: "glaseado", label: "Glaseado chorreado", hint: "Betún que escurre desde arriba" },
  { id: "helado", label: "Bola de helado", hint: "Orilla de helado con chispas" },
  { id: "betun", label: "Betún de duya", hint: "Perlitas de betún alrededor" },
  { id: "encaje", label: "Encaje de pastel", hint: "Orilla de blonda calada" },
  { id: "capas", label: "Pastel de capas", hint: "Pan, relleno y betún abajo" },
  { id: "capacillo", label: "Capacillo", hint: "Base de cupcake con pliegues" },
];

export const FONTS: { id: Font; label: string }[] = [
  { id: "elegante", label: "Elegante" },
  { id: "romantica", label: "Romántica (manuscrita)" },
  { id: "divertida", label: "Divertida (de pastelería)" },
  { id: "redondita", label: "Redondita" },
  { id: "moderna", label: "Moderna" },
];

export const PALETTES: { name: string; bg: string; primary: string; text: string; qr: string }[] = [
  { name: "Rosa dulce", bg: "#fffaef", primary: "#eb5473", text: "#3f250d", qr: "#3f250d" },
  { name: "Fresa con crema", bg: "#fff5f7", primary: "#f28aa5", text: "#5a2236", qr: "#5a2236" },
  { name: "Chocolate", bg: "#3f250d", primary: "#f2a7b8", text: "#fbefe3", qr: "#3f250d" },
  { name: "Cajeta", bg: "#fff6e9", primary: "#a8642a", text: "#3d2410", qr: "#3d2410" },
  { name: "Menta", bg: "#f2faf6", primary: "#3f8f6e", text: "#1f3a2e", qr: "#1f3a2e" },
  { name: "Vainilla", bg: "#fffdf6", primary: "#b07d2b", text: "#3b2a12", qr: "#3b2a12" },
  { name: "Lavanda", bg: "#f8f5fc", primary: "#7b5ea7", text: "#2e2340", qr: "#2e2340" },
  { name: "Frambuesa", bg: "#c2185b", primary: "#ffd6e3", text: "#ffffff", qr: "#3a1020" },
  { name: "Mora azul", bg: "#f2f6ff", primary: "#4a6fb5", text: "#1d2a4a", qr: "#1d2a4a" },
  { name: "Durazno", bg: "#fff1e6", primary: "#f08a5d", text: "#4a2c1a", qr: "#4a2c1a" },
  { name: "Pistache", bg: "#f6faec", primary: "#8aa83f", text: "#2f3a14", qr: "#2f3a14" },
  { name: "Blanco y negro", bg: "#ffffff", primary: "#111111", text: "#111111", qr: "#111111" },
];

/** Diseños listos con temática de repostería (se aplican con un clic y luego se pueden ajustar) */
export const THEMES: { id: string; name: string; patch: Partial<PrintDesign> }[] = [
  { id: "fresa", name: "Glaseado de fresa", patch: { decor: "glaseado", layout: "centrado", font: "romantica", pattern: "chispas", border: "ninguno", bg: "#fffaef", primary: "#eb5473", text: "#3f250d", qrColor: "#3f250d" } },
  { id: "choco", name: "Chocolate derretido", patch: { decor: "glaseado", layout: "clasico", font: "elegante", pattern: "liso", border: "ninguno", bg: "#fbefe3", primary: "#5a3418", text: "#3f250d", qrColor: "#3f250d" } },
  { id: "helado", name: "Heladería", patch: { decor: "helado", layout: "centrado", font: "divertida", pattern: "puntos", border: "ninguno", bg: "#f2faf6", primary: "#f28aa5", text: "#3a2a1f", qrColor: "#3a2a1f" } },
  { id: "cono", name: "Cono de waffle", patch: { decor: "helado", layout: "invertido", font: "redondita", pattern: "waffle", border: "ninguno", bg: "#fff4e0", primary: "#8b5a2b", text: "#4a2c1a", qrColor: "#4a2c1a" } },
  { id: "betun", name: "Betún de vainilla", patch: { decor: "betun", layout: "centrado", font: "elegante", pattern: "liso", border: "ninguno", bg: "#fffdf6", primary: "#e3b46b", text: "#3b2a12", qrColor: "#3b2a12" } },
  { id: "boda", name: "Encaje de boda", patch: { decor: "encaje", layout: "marco", font: "romantica", pattern: "liso", border: "ninguno", bg: "#ffffff", primary: "#c9a27e", text: "#5a3d2b", qrColor: "#5a3d2b" } },
  { id: "capas", name: "Pastel de capas", patch: { decor: "capas", layout: "centrado", font: "divertida", pattern: "liso", border: "ninguno", bg: "#fff5f7", primary: "#c97b63", text: "#3f250d", qrColor: "#3f250d" } },
  { id: "cupcake", name: "Cupcake", patch: { decor: "capacillo", layout: "centrado", font: "redondita", pattern: "chispas", border: "ninguno", bg: "#fbf3ff", primary: "#a77bd0", text: "#3a2346", qrColor: "#3a2346" } },
  { id: "menta", name: "Menta con chocolate", patch: { decor: "glaseado", layout: "banda", font: "elegante", pattern: "liso", border: "ninguno", bg: "#eaf7f1", primary: "#3f250d", text: "#1f3a2e", qrColor: "#1f3a2e" } },
  { id: "frambuesa", name: "Frambuesa glaseada", patch: { decor: "glaseado", layout: "centrado", font: "romantica", pattern: "liso", border: "ninguno", bg: "#c2185b", primary: "#ffd6e3", text: "#ffffff", qrColor: "#3a1020" } },
  { id: "cajeta", name: "Pay de cajeta", patch: { decor: "encaje", layout: "clasico", font: "divertida", pattern: "rayas", border: "ninguno", bg: "#fff6e9", primary: "#a8642a", text: "#3d2410", qrColor: "#3d2410" } },
  { id: "fina", name: "Pastelería fina", patch: { decor: "ninguna", layout: "marco", font: "elegante", pattern: "liso", border: "ninguno", bg: "#ffffff", primary: "#b07d2b", text: "#2b2116", qrColor: "#2b2116" } },
];

export const PAPERS: { id: string; label: string; w: number; h: number }[] = [
  { id: "carta", label: "Carta (21.6 × 27.9 cm)", w: 21.59, h: 27.94 },
  { id: "oficio", label: "Oficio (21.6 × 34 cm)", w: 21.59, h: 34 },
  { id: "tabloide", label: "Tabloide (27.9 × 43.2 cm)", w: 27.94, h: 43.18 },
  { id: "a4", label: "A4 (21 × 29.7 cm)", w: 21, h: 29.7 },
];

export const MARGIN = 1; // cm
export const GAP = 0.3; // cm entre piezas (para recortar)

export function defaultDesign(kind: PrintKind, base: { bg?: string; primary?: string; text?: string } = {}): PrintDesign {
  const size = KINDS[kind].sizes[0];
  return {
    size: size.id,
    shape: size.shapes[0],
    layout: kind === "sticker" || kind === "qr" ? "centrado" : "clasico",
    decor: kind === "tarjeta" ? "glaseado" : "ninguna",
    bg: base.bg ?? PALETTES[0].bg,
    primary: base.primary ?? PALETTES[0].primary,
    text: base.text ?? PALETTES[0].text,
    qrColor: base.text ?? PALETTES[0].qr,
    font: "elegante",
    border: "ninguno",
    pattern: kind === "tarjeta" ? "chispas" : "liso",
    radius: 0.3,
    showLogo: true,
    showQr: true,
    title: "",
    subtitle: kind === "etiqueta" ? "Hecho con amor de hogar" : "Escanea y haz tu pedido",
    contact: "",
    instagram: "",
    facebook: "",
    showContact: kind !== "sticker",
    showInstagram: kind !== "sticker",
    showFacebook: kind === "tarjeta" || kind === "qr",
    showUrl: kind === "tarjeta",
    dessertId: "",
    showIngredients: true,
    showAllergens: true,
    showBestBefore: true,
    madeOn: "",
  };
}

const HEX = /^#[0-9a-f]{6}$/i;
const pick = <T extends string>(v: unknown, ok: readonly T[], d: T) => (ok.includes(v as T) ? (v as T) : d);
const str = (v: unknown, max: number, d = "") => (typeof v === "string" ? v.slice(0, max) : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

/** Valida un diseño guardado (puede venir incompleto o de una versión anterior) */
export function normalizeDesign(kind: PrintKind, raw: unknown, base?: { bg?: string; primary?: string; text?: string }): PrintDesign {
  const d = defaultDesign(kind, base);
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;
  const size = KINDS[kind].sizes.find((s) => s.id === r.size) ?? KINDS[kind].sizes[0];
  // Versión anterior: line1/line2/showLines
  const oldLines = typeof r.showLines === "boolean" ? r.showLines : undefined;
  return {
    size: size.id,
    shape: pick(r.shape, size.shapes, size.shapes[0]),
    layout: pick(r.layout, LAYOUTS.map((l) => l.id), d.layout),
    decor: pick(r.decor, DECORS.map((l) => l.id), "ninguna"),
    bg: HEX.test(String(r.bg)) ? String(r.bg) : d.bg,
    primary: HEX.test(String(r.primary)) ? String(r.primary) : d.primary,
    text: HEX.test(String(r.text)) ? String(r.text) : d.text,
    qrColor: HEX.test(String(r.qrColor)) ? String(r.qrColor) : d.qrColor,
    font: pick(r.font, FONTS.map((f) => f.id), d.font),
    border: pick(r.border, ["ninguno", "linea", "punteado", "doble"] as const, d.border),
    pattern: pick(r.pattern, ["liso", "chispas", "puntos", "rayas", "ondas", "waffle"] as const, d.pattern),
    radius: Math.min(1.5, Math.max(0, Number(r.radius) || 0)),
    showLogo: r.showLogo !== false,
    showQr: r.showQr !== false,
    title: str(r.title, 60),
    subtitle: str(r.subtitle, 80, d.subtitle),
    contact: str(r.contact ?? r.line1, 60),
    instagram: str(r.instagram ?? r.line2, 60),
    facebook: str(r.facebook, 80),
    showContact: bool(r.showContact, oldLines ?? d.showContact),
    showInstagram: bool(r.showInstagram, oldLines ?? d.showInstagram),
    showFacebook: bool(r.showFacebook, d.showFacebook),
    showUrl: bool(r.showUrl, d.showUrl),
    dessertId: typeof r.dessertId === "string" && /^[0-9a-f-]{36}$/i.test(r.dessertId) ? r.dessertId : "",
    showIngredients: bool(r.showIngredients, true),
    showAllergens: bool(r.showAllergens, true),
    showBestBefore: bool(r.showBestBefore, true),
    madeOn: typeof r.madeOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.madeOn) ? r.madeOn : "",
  };
}

export const sizeOf = (kind: PrintKind, d: PrintDesign) => KINDS[kind].sizes.find((s) => s.id === d.size) ?? KINDS[kind].sizes[0];

/** Cuántas piezas caben en una hoja (prueba vertical y horizontal y usa la que acomode más) */
export function fitOnPaper(w: number, h: number, paperId: string) {
  const paper = PAPERS.find((p) => p.id === paperId) ?? PAPERS[0];
  const count = (pw: number, ph: number) => {
    const cols = Math.floor((pw - 2 * MARGIN + GAP) / (w + GAP));
    const rows = Math.floor((ph - 2 * MARGIN + GAP) / (h + GAP));
    return { cols: Math.max(cols, 0), rows: Math.max(rows, 0) };
  };
  const portrait = count(paper.w, paper.h);
  const landscape = count(paper.h, paper.w);
  const useLandscape = landscape.cols * landscape.rows > portrait.cols * portrait.rows;
  const best = useLandscape ? landscape : portrait;
  return { ...best, total: best.cols * best.rows, landscape: useLandscape, paper, pageW: useLandscape ? paper.h : paper.w, pageH: useLandscape ? paper.w : paper.h };
}

export type PrintData = {
  business: string;
  logo: string | null;
  qr: string; // data URL
  url: string;
  whatsapp: string; // número tal cual
  instagram: string; // usuario
  facebook: string; // usuario o página
  fonts: Record<Font, string>;
  /** Ficha del postre elegido (solo etiquetas) */
  label?: { name: string; ingredients: string; contains: string; mayContain: string; bestBefore: string; storage: string } | null;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const n3 = (n: number) => String(Math.round(n * 1000) / 1000);
/** Número "aleatorio" fijo para que el diseño no cambie en cada vista */
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const SPRINKLES = ["#ffffff", "#ffd166", "#7fd1b9", "#8ec5ff", "#ff8fab", "#c39bf2"];

function patternCss(p: Pattern, color: string) {
  const c = color + "2e";
  switch (p) {
    case "chispas":
      return `background-image:radial-gradient(circle at 12% 20%, ${c} 0 0.06cm, transparent 0.07cm),radial-gradient(circle at 82% 14%, ${color}40 0 0.08cm, transparent 0.09cm),radial-gradient(circle at 90% 78%, ${c} 0 0.05cm, transparent 0.06cm),radial-gradient(circle at 26% 86%, ${color}33 0 0.07cm, transparent 0.08cm),radial-gradient(circle at 55% 45%, ${color}1f 0 0.04cm, transparent 0.05cm);background-size:2.6cm 2.6cm;`;
    case "puntos":
      return `background-image:radial-gradient(${c} 0.045cm, transparent 0.05cm);background-size:0.5cm 0.5cm;`;
    case "rayas":
      return `background-image:repeating-linear-gradient(135deg, ${color}1c 0 0.18cm, transparent 0.18cm 0.45cm);`;
    case "ondas":
      return `background-image:radial-gradient(circle at 50% 120%, ${color}26 0 40%, transparent 41%),radial-gradient(circle at 0% 120%, ${color}1a 0 30%, transparent 31%);`;
    case "waffle":
      return `background-image:repeating-linear-gradient(45deg, ${color}26 0 0.035cm, transparent 0.035cm 0.55cm),repeating-linear-gradient(-45deg, ${color}26 0 0.035cm, transparent 0.035cm 0.55cm);`;
    default:
      return "";
  }
}

/* ---------------------------------------------------------------- formas */

/** Puntos de la orilla de galleta (festón) en cm */
function cookiePoints(cx: number, cy: number, R: number, bumps = 16, steps = 192) {
  const pts: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = R * (0.9 + 0.1 * Math.abs(Math.cos((bumps * a) / 2)));
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
const cookieClip = (D: number) =>
  `polygon(${cookiePoints(D / 2, D / 2, D / 2)
    .map(([x, y]) => `${n3((x / D) * 100)}% ${n3((y / D) * 100)}%`)
    .join(",")})`;
const cookiePath = (cx: number, cy: number, R: number) =>
  "M" + cookiePoints(cx, cy, R).map(([x, y]) => `${n3(x)} ${n3(y)}`).join("L") + "Z";

/* ---------------------------------------------------------- decoraciones */

type Box = { w: number; h: number; base: number; round: boolean; color: string; bg: string; text: string };
type DecorOut = { svg: string; top: number; bottom: number; side: number };

/** Glaseado que escurre desde y0 hacia abajo */
function dripSvg(b: Box, y0: number, maxL: number, seed = 1) {
  const n = Math.max(4, Math.round(b.w / Math.max(b.h * 0.2, 0.55)));
  const step = b.w / n;
  const r = Math.min(step / 4.6, Math.max(0.07, b.base * 0.035));
  let d = `M0 0L0 ${n3(y0)}`;
  const extras: string[] = [];
  let lowest = y0;
  for (let i = 0; i < n; i++) {
    const cx = step * (i + 0.5) + (rnd(i + seed) - 0.5) * step * 0.3;
    const L = Math.max(r * 1.4, maxL * (0.3 + 0.7 * rnd(i * 3 + seed)));
    const a = cx - r * 2.1;
    const e = cx + r * 2.1;
    d += `L${n3(a)} ${n3(y0)}C${n3(a + r * 0.9)} ${n3(y0)} ${n3(cx - r)} ${n3(y0 + r * 0.2)} ${n3(cx - r)} ${n3(y0 + r)}`;
    d += `L${n3(cx - r)} ${n3(y0 + L)}A${n3(r)} ${n3(r)} 0 0 0 ${n3(cx + r)} ${n3(y0 + L)}`;
    d += `L${n3(cx + r)} ${n3(y0 + r)}C${n3(cx + r)} ${n3(y0 + r * 0.2)} ${n3(e - r * 0.9)} ${n3(y0)} ${n3(e)} ${n3(y0)}`;
    // Brillo en la punta de cada gota
    extras.push(`<ellipse cx="${n3(cx - r * 0.38)}" cy="${n3(y0 + L - r * 0.1)}" rx="${n3(r * 0.22)}" ry="${n3(r * 0.42)}" fill="#fff" opacity=".45"/>`);
    lowest = Math.max(lowest, y0 + L + r);
    if (rnd(i * 7 + seed) > 0.62) {
      extras.push(`<circle cx="${n3(cx)}" cy="${n3(y0 + L + r * 2)}" r="${n3(r * 0.72)}" fill="${b.color}"/>`);
      lowest = Math.max(lowest, y0 + L + r * 2.72);
    }
  }
  d += `L${n3(b.w)} ${n3(y0)}L${n3(b.w)} 0Z`;
  const gloss = `<path d="M${n3(b.w * 0.08)} ${n3(y0 * 0.42)}L${n3(b.w * 0.3)} ${n3(y0 * 0.42)}" stroke="#fff" stroke-opacity=".35" stroke-width="${n3(Math.max(r * 0.45, 0.04))}" stroke-linecap="round"/>`;
  return { svg: `<path d="${d}" fill="${b.color}"/>${extras.join("")}${gloss}`, bottom: lowest };
}

/** Orilla de bola de helado (ondas redondas) con chispas */
function scoopSvg(b: Box, y0: number) {
  const n = Math.max(3, Math.round(b.w / Math.max(b.h * 0.34, 0.9)));
  const R = b.w / n / 2;
  const ry = Math.min(R * 0.7, b.h * 0.08);
  let d = `M0 0L0 ${n3(y0)}`;
  for (let i = 0; i < n; i++) d += `A${n3(R)} ${n3(ry)} 0 0 0 ${n3((i + 1) * 2 * R)} ${n3(y0)}`;
  d += `L${n3(b.w)} 0Z`;
  const sprinkles: string[] = [];
  const count = Math.round(b.w * 2.4);
  const sl = Math.max(0.1, b.base * 0.035);
  for (let i = 0; i < count; i++) {
    const x = rnd(i * 5 + 2) * b.w;
    const y = (0.18 + rnd(i * 11 + 4) * 0.72) * y0;
    const ang = rnd(i * 13 + 1) * 180;
    const col = SPRINKLES[i % SPRINKLES.length];
    if (col.toLowerCase() === b.color.toLowerCase()) continue;
    sprinkles.push(`<line x1="${n3(x - sl / 2)}" y1="${n3(y)}" x2="${n3(x + sl / 2)}" y2="${n3(y)}" stroke="${col}" stroke-width="${n3(sl * 0.38)}" stroke-linecap="round" transform="rotate(${n3(ang)} ${n3(x)} ${n3(y)})"/>`);
  }
  const shade = `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="${n3(R * 0.1)}"/>`;
  return { svg: `<path d="${d}" fill="${b.color}"/>${shade}${sprinkles.join("")}`, bottom: y0 + ry };
}

function decorSvg(decor: Decor, b: Box, bandH?: number): DecorOut {
  const { w, h, base, color } = b;
  switch (decor) {
    case "glaseado": {
      const y0 = bandH ?? Math.max(h * 0.1, base * 0.1);
      const out = dripSvg(b, y0, bandH ? h * 0.09 : h * 0.12);
      return { svg: out.svg, top: out.bottom, bottom: 0, side: 0 };
    }
    case "helado": {
      const y0 = bandH ?? Math.max(h * 0.12, base * 0.13);
      const out = scoopSvg(b, y0);
      return { svg: out.svg, top: out.bottom + base * 0.02, bottom: 0, side: 0 };
    }
    case "betun": {
      const r = Math.max(0.08, base * 0.042);
      const m = r * 1.45;
      const dots: [number, number][] = [];
      if (b.round) {
        const R = base / 2 - m - base * 0.03;
        const k = Math.max(12, Math.floor((2 * Math.PI * R) / (r * 2.15)));
        for (let i = 0; i < k; i++) dots.push([w / 2 + R * Math.cos((i / k) * 2 * Math.PI), h / 2 + R * Math.sin((i / k) * 2 * Math.PI)]);
      } else {
        const iw = w - 2 * m;
        const ih = h - 2 * m;
        const per = 2 * (iw + ih);
        const k = Math.max(8, Math.floor(per / (r * 2.15)));
        for (let i = 0; i < k; i++) {
          let t = (i / k) * per;
          let x: number, y: number;
          if (t < iw) [x, y] = [m + t, m];
          else if ((t -= iw) < ih) [x, y] = [w - m, m + t];
          else if ((t -= ih) < iw) [x, y] = [w - m - t, h - m];
          else [x, y] = [m, h - m - (t - iw)];
          dots.push([x, y]);
        }
      }
      const svg = dots
        .map(
          ([x, y]) =>
            `<circle cx="${n3(x)}" cy="${n3(y)}" r="${n3(r)}" fill="${color}"/><path d="M${n3(x - r * 0.55)} ${n3(y)}A${n3(r * 0.55)} ${n3(r * 0.55)} 0 0 1 ${n3(x + r * 0.2)} ${n3(y - r * 0.52)}" stroke="#fff" stroke-opacity=".5" stroke-width="${n3(r * 0.22)}" fill="none" stroke-linecap="round"/>`,
        )
        .join("");
      const inset = m + r * 1.5;
      return { svg, top: inset, bottom: inset, side: inset };
    }
    case "encaje": {
      const r = Math.max(0.12, base * 0.06);
      const parts: string[] = [];
      const fill = `${color}55`;
      if (b.round) {
        const R = base / 2 - base * 0.035;
        const k = Math.max(14, Math.round((2 * Math.PI * R) / (r * 1.7)));
        for (let i = 0; i < k; i++) {
          const a = (i / k) * 2 * Math.PI;
          const x = w / 2 + R * Math.cos(a);
          const y = h / 2 + R * Math.sin(a);
          const hx = w / 2 + (R - r * 0.5) * Math.cos(a);
          const hy = h / 2 + (R - r * 0.5) * Math.sin(a);
          parts.push(`<circle cx="${n3(x)}" cy="${n3(y)}" r="${n3(r)}" fill="${fill}"/><circle cx="${n3(hx)}" cy="${n3(hy)}" r="${n3(r * 0.22)}" fill="${b.bg}"/>`);
        }
        parts.push(`<circle cx="${n3(w / 2)}" cy="${n3(h / 2)}" r="${n3(R - r * 1.45)}" fill="none" stroke="${color}" stroke-width="${n3(r * 0.1)}" stroke-dasharray="${n3(r * 0.25)} ${n3(r * 0.25)}"/>`);
      } else {
        const edge = (len: number, place: (t: number) => [number, number, number, number]) => {
          const k = Math.max(3, Math.round(len / (r * 1.7)));
          for (let i = 0; i <= k; i++) {
            const [x, y, hx, hy] = place((i / k) * len);
            parts.push(`<circle cx="${n3(x)}" cy="${n3(y)}" r="${n3(r)}" fill="${fill}"/><circle cx="${n3(hx)}" cy="${n3(hy)}" r="${n3(r * 0.22)}" fill="${b.bg}"/>`);
          }
        };
        const o = r * 0.5;
        edge(w, (t) => [t, 0, t, o]);
        edge(w, (t) => [t, h, t, h - o]);
        edge(h, (t) => [0, t, o, t]);
        edge(h, (t) => [w, t, w - o, t]);
        const q = r * 1.45;
        parts.push(`<rect x="${n3(q)}" y="${n3(q)}" width="${n3(w - 2 * q)}" height="${n3(h - 2 * q)}" fill="none" stroke="${color}" stroke-width="${n3(r * 0.1)}" stroke-dasharray="${n3(r * 0.25)} ${n3(r * 0.25)}" rx="${n3(r * 0.5)}"/>`);
      }
      const inset = r * 1.9;
      return { svg: parts.join(""), top: inset, bottom: inset, side: inset };
    }
    case "capas": {
      const H = Math.max(h * 0.2, base * 0.2);
      const y = h - H;
      const k = Math.max(3, Math.round(w / 1.4));
      const amp = H * 0.06;
      const wave = (yy: number, a: number) => {
        let p = `M0 ${n3(yy)}`;
        const steps = 48;
        for (let i = 1; i <= steps; i++) {
          const x = (i / steps) * w;
          p += `L${n3(x)} ${n3(yy + Math.sin((x / w) * Math.PI * 2 * k) * a)}`;
        }
        return `${p}L${n3(w)} ${n3(h)}L0 ${n3(h)}Z`;
      };
      const svg = [
        `<path d="${wave(y, amp)}" fill="${color}"/>`, // betún
        `<path d="${wave(y + H * 0.2, amp * 0.6)}" fill="${b.text}" fill-opacity=".18"/>`, // pan
        `<path d="${wave(y + H * 0.48, amp)}" fill="#fff" fill-opacity=".92"/>`, // relleno de crema
        `<path d="${wave(y + H * 0.62, amp * 0.6)}" fill="${color}" fill-opacity=".55"/>`, // pan de abajo
        `<path d="${wave(y + H * 0.62, amp * 0.6)}" fill="${b.text}" fill-opacity=".12"/>`,
      ];
      for (let i = 0; i < Math.round(w * 1.6); i++) {
        const x = rnd(i * 3 + 9) * w;
        const yy = y + H * (0.04 + rnd(i * 5 + 3) * 0.1);
        svg.push(`<circle cx="${n3(x)}" cy="${n3(yy)}" r="${n3(Math.max(0.035, base * 0.012))}" fill="${SPRINKLES[(i + 1) % SPRINKLES.length]}"/>`);
      }
      return { svg: svg.join(""), top: 0, bottom: H + amp * 2, side: 0 };
    }
    case "capacillo": {
      const H = Math.max(h * 0.24, base * 0.22);
      const y = h - H;
      const k = Math.max(6, Math.round(w / 0.45));
      const sw = w / k;
      const parts: string[] = [`<rect x="0" y="${n3(y)}" width="${n3(w)}" height="${n3(H)}" fill="${color}"/>`];
      for (let i = 0; i < k; i += 2) parts.push(`<rect x="${n3(i * sw)}" y="${n3(y)}" width="${n3(sw)}" height="${n3(H)}" fill="#fff" fill-opacity=".22"/>`);
      for (let i = 1; i < k; i++) parts.push(`<line x1="${n3(i * sw)}" y1="${n3(y)}" x2="${n3(i * sw)}" y2="${n3(h)}" stroke="#000" stroke-opacity=".08" stroke-width="${n3(sw * 0.06)}"/>`);
      // Betún que se desborda sobre el capacillo
      const R = Math.max(0.16, H * 0.2);
      const m = Math.max(3, Math.round(w / (R * 2)));
      const rr = w / m / 2;
      for (let i = 0; i < m; i++) parts.push(`<circle cx="${n3(rr + i * 2 * rr)}" cy="${n3(y)}" r="${n3(rr)}" fill="${b.bg}"/>`);
      return { svg: parts.join(""), top: 0, bottom: H + rr * 0.2, side: 0 };
    }
    default:
      return { svg: "", top: 0, bottom: 0, side: 0 };
  }
}

/** Miniatura de una decoración para los botones del diseñador */
export function decorPreview(decor: Decor, color: string, bg: string, text: string) {
  const w = 6;
  const h = 3.4;
  const out = decorSvg(decor, { w, h, base: h, round: false, color, bg, text });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block;background:${bg}">${out.svg}</svg>`;
}

/* ------------------------------------------------------------- iconos */
// Iconos genéricos de trazo, para que el contacto se lea de un vistazo
const ICONS = {
  contacto: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  instagram: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  facebook: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  web: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
};
const icon = (k: keyof typeof ICONS, color: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:1.05em;height:1.05em;flex:none;margin-top:.08em">${ICONS[k]}</svg>`;

/** Texto que se puede partir en puntos y guiones (para direcciones web largas) */
const breakable = (s: string) => esc(s).replace(/([./-])/g, "$1<wbr>");

/** Datos de contacto que se muestran (lo escrito en el diseño o, si está vacío, lo del negocio) */
export function contactLines(d: PrintDesign, data: Pick<PrintData, "whatsapp" | "instagram" | "facebook">) {
  const out: { icon: keyof typeof ICONS; text: string }[] = [];
  const wa = (d.contact || data.whatsapp).trim();
  if (d.showContact && wa) out.push({ icon: "contacto", text: /[a-z]/i.test(wa) ? wa : `WhatsApp ${wa}` });
  const ig = (d.instagram || data.instagram).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "");
  if (d.showInstagram && ig) out.push({ icon: "instagram", text: ig.includes(" ") ? ig : `@${ig.replace(/^@/, "")}` });
  const fb = (d.facebook || data.facebook).trim().replace(/^https?:\/\/(www\.|m\.)?facebook\.com\//i, "").replace(/^@/, "").replace(/\/$/, "");
  if (d.showFacebook && fb) out.push({ icon: "facebook", text: fb.includes(" ") ? fb : `fb.com/${fb}` });
  return out;
}

/* ---------------------------------------------------------- render */

/**
 * HTML de una sola pieza. Los textos van dentro de cajas .dd-fit cuyo tamaño de letra
 * ajusta fitPieces() midiendo en el navegador; el QR tiene tamaño fijo en cm.
 */
export function renderItem(kind: PrintKind, d: PrintDesign, data: PrintData) {
  const s = sizeOf(kind, d);
  const w = s.w;
  const h = s.h;
  const roundish = d.shape === "redondo" || d.shape === "galleta";
  const base = Math.min(w, h);
  const title = d.title.trim() || data.business;
  const info = contactLines(d, data);
  const urlText = d.showUrl ? data.url.replace(/^https?:\/\//, "") : "";
  const font = data.fonts[d.font];
  const sans = data.fonts.moderna;
  const titleScale = d.font === "romantica" ? 1.18 : d.font === "divertida" ? 0.92 : 1;
  const hasLogo = d.showLogo && !!data.logo;
  const horizontal = w / h > 1.25 && !roundish;
  let layout = d.layout;
  if (roundish && (layout === "clasico" || layout === "invertido")) layout = layout === "clasico" ? "minimal" : "centrado";
  const box: Box = { w, h, base, round: roundish, color: d.primary, bg: d.bg, text: d.text };
  const dripBand = d.decor === "glaseado" || d.decor === "helado";

  // Banda: alto de la franja con el nombre (con glaseado o helado, la franja es el propio betún)
  const bandH = layout === "banda" ? (horizontal ? h * 0.27 : base * 0.23) + (roundish ? base * 0.06 : 0) : undefined;
  const dec = decorSvg(d.decor, box, dripBand ? bandH : undefined);
  const topTaken = Math.max(dec.top, bandH ?? 0);

  // Área libre para el contenido
  const pad = Math.max(0.22, base * 0.07);
  const frame = layout === "marco" ? base * 0.075 : 0;
  let ax: number, ay: number, aw: number, ah: number;
  if (roundish) {
    const R = (base / 2) * (d.shape === "galleta" ? 0.84 : 0.92);
    const c = base / 2;
    const yT = Math.max(c - R * 0.8, topTaken + pad * 0.4, frame + pad * 0.5);
    const yB = Math.min(c + R * 0.8, h - dec.bottom - pad * 0.4, h - frame - pad * 0.5);
    const far = Math.max(c - yT, yB - c);
    const hw = Math.sqrt(Math.max(R * R - far * far, 0)) - Math.max(dec.side * 0.5, frame * 0.5);
    ax = c - hw;
    aw = 2 * hw;
    ay = yT;
    ah = yB - yT;
  } else {
    const side = Math.max(dec.side, frame) + pad;
    ax = side;
    aw = w - 2 * side;
    ay = Math.max(dec.top, frame, bandH ?? 0) + pad * (bandH ? 0.6 : 1);
    ah = h - ay - Math.max(dec.bottom, frame) - pad;
  }

  const maxK = Math.min(horizontal ? h * 0.1 : base * 0.095, 1.25);
  const want = horizontal ? h * 0.075 : base * 0.06;
  const fitBox = (inner: string, max: number, align: "left" | "center", extra = "") =>
    `<div class="dd-fit" data-max="${n3(max)}" data-want="${n3(Math.min(want, max))}" style="width:100%;flex:none;font-size:${n3(max)}cm;text-align:${align};display:flex;flex-direction:column;gap:.2em;align-items:${align === "center" ? "center" : "flex-start"};${extra}">${inner}</div>`;
  const qrImg = (size: number) =>
    d.showQr && size > 0
      ? `<img class="dd-qr" data-min="${n3(Math.min(size, Math.max(1.5, size * (kind === "qr" ? 0.88 : 0.6))))}" src="${data.qr}" alt="" style="width:${n3(size)}cm;height:${n3(size)}cm;display:block;flex:none;background:#fff;padding:${n3(size * 0.045)}cm;border-radius:${n3(size * 0.07)}cm;box-sizing:border-box;box-shadow:0 0 0 ${n3(size * 0.012)}cm ${d.primary}33" />`
      : "";
  const logoEm = (em: number) =>
    hasLogo
      ? `<img src="${esc(data.logo!)}" alt="" style="width:${em}em;height:${em}em;object-fit:contain;display:block;flex:none;border-radius:50%;background:#fff;padding:.1em;box-sizing:border-box;box-shadow:0 0 0 .04em ${d.primary}55" />`
      : "";
  const titleHtml = (color = d.text) =>
    `<div style="font-family:${font};font-weight:700;font-size:${titleScale}em;line-height:1.1;color:${color};overflow-wrap:anywhere;letter-spacing:${d.font === "elegante" ? ".01em" : "0"}">${esc(title)}</div>`;
  const subHtml = d.subtitle ? `<div style="font-family:${sans};font-weight:800;font-size:.54em;color:${d.primary};line-height:1.2;overflow-wrap:anywhere;letter-spacing:.02em">${esc(d.subtitle)}</div>` : "";
  const divider = () =>
    info.length || urlText
      ? `<div style="display:flex;align-items:center;gap:.18em;margin:.04em 0"><span style="width:.9em;height:.045em;background:${d.primary};opacity:.55;border-radius:1em"></span><span style="width:.16em;height:.16em;border-radius:50%;background:${d.primary}"></span><span style="width:.9em;height:.045em;background:${d.primary};opacity:.55;border-radius:1em"></span></div>`
      : "";
  const row = (align: "left" | "center", size: number, extra: string, ic: keyof typeof ICONS, text: string) =>
    `<div style="display:flex;gap:.3em;align-items:flex-start;justify-content:${align === "center" ? "center" : "flex-start"};font-family:${sans};font-size:${size}em;color:${d.text};line-height:1.25;max-width:100%;${extra}"><span style="display:flex">${icon(ic, d.primary)}</span><span style="overflow-wrap:anywhere;min-width:0;text-align:left">${text}</span></div>`;
  const infoHtml = (align: "left" | "center") =>
    info.map((l) => row(align, 0.46, "", l.icon, esc(l.text))).join("") + (urlText ? row(align, 0.42, "font-weight:700;opacity:.88", "web", breakable(urlText)) : "");
  // Ficha del postre: nombre, ingredientes, alérgenos, consumo preferente y conservación
  const lb = kind === "etiqueta" ? data.label : null;
  const fichaHtml = (align: "left" | "center") => {
    if (!lb) return "";
    const line = (label: string, text: string, extra = "") =>
      text ? `<div style="font-family:${sans};font-size:.36em;line-height:1.3;color:${d.text};text-align:${align};max-width:100%;overflow-wrap:anywhere;${extra}"><b style="color:${d.primary}">${label}</b> ${esc(text)}</div>` : "";
    return [
      `<div style="font-family:${font};font-weight:700;font-size:.62em;line-height:1.15;color:${d.text};margin-top:.1em">${esc(lb.name)}</div>`,
      d.showIngredients ? line("Ingredientes:", lb.ingredients) : "",
      d.showAllergens ? line("Contiene:", lb.contains, "font-weight:700") : "",
      d.showAllergens ? line("Puede contener:", lb.mayContain) : "",
      d.showBestBefore ? line("Consumir antes de:", lb.bestBefore) : "",
      line("", lb.storage, "font-style:italic;opacity:.85"),
    ].join("");
  };
  const textBlock = (align: "left" | "center", withLogo: boolean) => `${withLogo ? logoEm(1.9) : ""}${titleHtml()}${subHtml}${divider()}${infoHtml(align)}${fichaHtml(align)}`;
  /** Columna de texto: ocupa lo que sobra mientras se mide y luego se encoge a su contenido */
  const col = (inner: string, extra = "") =>
    `<div class="dd-col" style="flex:1 1 0;min-width:0;min-height:0;align-self:stretch;display:flex;flex-direction:column;justify-content:center;${extra}">${inner}</div>`;
  const stack = (inner: string) =>
    `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${n3(pad * 0.45)}cm;width:100%;height:100%">${inner}</div>`;
  const side = (inner: string) => `<div style="display:flex;align-items:center;justify-content:center;gap:${n3(pad * 0.65)}cm;width:100%;height:100%">${inner}</div>`;

  let content = "";
  let bandHtml = "";

  if (layout === "banda") {
    const inset = roundish ? base * 0.22 : pad;
    const top = roundish ? base * 0.1 : 0;
    bandHtml = `
      ${dripBand ? "" : `<div style="position:absolute;left:0;right:0;top:0;height:${n3(bandH!)}cm;background:${d.primary}"></div>`}
      <div data-band style="position:absolute;left:${n3(inset)}cm;right:${n3(inset)}cm;top:${n3(top)}cm;height:${n3(bandH! - top)}cm;display:flex;flex-direction:column;justify-content:center">
        ${fitBox(`${hasLogo ? logoEm(1.45) : ""}${titleHtml(d.bg)}`, Math.min(bandH! * 0.42, maxK * 1.7), "center", "flex-direction:row;justify-content:center;gap:.3em")}
      </div>`;
    const rest = `${subHtml}${divider()}${infoHtml(horizontal ? "left" : "center")}${fichaHtml(horizontal ? "left" : "center")}`;
    if (horizontal) {
      const q = d.showQr ? Math.min(ah, aw * 0.36) : 0;
      content = side(`${qrImg(q)}${rest ? col(fitBox(rest, maxK, "left")) : ""}`);
    } else {
      const q = d.showQr ? Math.min(aw * 0.8, ah * (kind === "qr" ? 0.66 : 0.52)) : 0;
      content = stack(`${qrImg(q)}${rest ? col(fitBox(rest, maxK, "center"), "width:100%") : ""}`);
    }
  } else if ((layout === "clasico" || layout === "invertido") && horizontal) {
    const q = d.showQr ? Math.min(ah, aw * 0.4) : 0;
    const parts = [qrImg(q), col(fitBox(textBlock("left", hasLogo), maxK, "left"))];
    if (layout === "invertido") parts.reverse();
    content = side(parts.join(""));
  } else if ((layout === "centrado" || layout === "marco") && horizontal) {
    const q = d.showQr ? Math.min(ah, aw * 0.36) : 0;
    content = side(`${col(fitBox(textBlock("center", hasLogo), maxK, "center"))}${qrImg(q)}`);
  } else if (layout === "minimal" || layout === "clasico") {
    // QR arriba y grande, textos abajo
    const q = d.showQr ? Math.min(aw * 0.86, ah * (layout === "minimal" ? 0.7 : 0.56)) : 0;
    const txt = layout === "minimal" ? `${titleHtml()}${subHtml}` : textBlock("center", false);
    content = stack(`${qrImg(q)}${col(fitBox(txt, maxK, "center"), "width:100%")}`);
  } else {
    // Centrado, marco e invertido en piezas cuadradas o verticales: textos arriba, QR abajo
    const q = d.showQr ? Math.min(aw * 0.8, ah * (kind === "qr" ? 0.6 : 0.46)) : 0;
    content = stack(`${col(fitBox(textBlock("center", hasLogo), maxK, "center"), "width:100%")}${qrImg(q)}`);
  }

  // Marco doble y bordes dibujados en SVG (así siguen la forma redonda o de galleta)
  const sw = base * 0.016;
  const overlay: string[] = [];
  const shapeStroke = (inset: number, width: number, dash = "") => {
    const extra = `fill="none" stroke="${d.primary}" stroke-width="${n3(width)}"${dash ? ` stroke-dasharray="${dash}"` : ""}`;
    if (d.shape === "galleta") return `<path d="${cookiePath(w / 2, h / 2, base / 2 - inset)}" ${extra}/>`;
    if (d.shape === "redondo") return `<circle cx="${n3(w / 2)}" cy="${n3(h / 2)}" r="${n3(base / 2 - inset)}" ${extra}/>`;
    return `<rect x="${n3(inset)}" y="${n3(inset)}" width="${n3(w - 2 * inset)}" height="${n3(h - 2 * inset)}" rx="${n3(Math.max(d.radius - inset, 0))}" ${extra}/>`;
  };
  if (layout === "marco") overlay.push(shapeStroke(base * 0.035, sw * 1.4), shapeStroke(base * 0.06, sw * 0.45));
  if (d.border === "linea") overlay.push(shapeStroke(sw, sw * 1.6));
  else if (d.border === "punteado") overlay.push(shapeStroke(sw * 1.2, sw * 1.6, `${n3(sw * 3)} ${n3(sw * 2.4)}`));
  else if (d.border === "doble") overlay.push(shapeStroke(sw, sw), shapeStroke(sw * 3, sw));

  const clip = d.shape === "galleta" ? `clip-path:${cookieClip(base)};` : `border-radius:${d.shape === "redondo" ? "50%" : `${d.radius}cm`};`;
  const svgLayer = (inner: string) =>
    inner ? `<svg viewBox="0 0 ${n3(w)} ${n3(h)}" style="position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>` : "";

  return `<div class="dd-piece" style="position:relative;box-sizing:border-box;width:${n3(w)}cm;height:${n3(h)}cm;${clip}overflow:hidden;background-color:${d.bg};${patternCss(d.pattern, d.primary)}color:${d.text};-webkit-print-color-adjust:exact;print-color-adjust:exact">${svgLayer(dec.svg)}${bandHtml}<div class="dd-area" style="position:absolute;left:${n3(ax)}cm;top:${n3(ay)}cm;width:${n3(Math.max(aw, 0.5))}cm;height:${n3(Math.max(ah, 0.5))}cm;display:flex">${content}</div>${svgLayer(overlay.join(""))}</div>`;
}

/**
 * Ajusta el tamaño de letra de cada .dd-fit para que quepa en su caja (búsqueda binaria midiendo).
 * Devuelve el tamaño base más chico que se usó (cm), para avisar si la letra queda muy chiquita.
 */
export function fitPieces(root: ParentNode): number {
  let smallest = 99;
  const els = root.querySelectorAll<HTMLElement>(".dd-fit");
  for (let i = 0; i < els.length; i++) {
    const f = els[i];
    const p = f.parentElement;
    if (!p) continue;
    const isCol = p.classList.contains("dd-col");
    const max = parseFloat(f.getAttribute("data-max") || "1");
    const want = parseFloat(f.getAttribute("data-want") || "0");
    const fits = (k: number) => {
      f.style.fontSize = k + "cm";
      return f.scrollWidth <= f.clientWidth + 1 && f.offsetHeight <= p.clientHeight + 1 && f.offsetWidth <= p.clientWidth + 1;
    };
    const fitOne = () => {
      if (isCol) p.style.flex = "1 1 0";
      let lo = 0.04;
      let hi = max;
      if (fits(hi)) lo = hi;
      else {
        for (let j = 0; j < 14; j++) {
          const m = (lo + hi) / 2;
          if (fits(m)) lo = m;
          else hi = m;
        }
      }
      f.style.fontSize = lo + "cm";
      return lo;
    };
    let k = fitOne();
    // Si la letra queda chica, se achica un poco el QR (sin bajar del mínimo legible) para darle espacio
    const area = f.closest(".dd-area");
    const qr = area ? area.querySelector<HTMLElement>(".dd-qr") : null;
    if (qr && k < want) {
      const qrMin = parseFloat(qr.getAttribute("data-min") || "0");
      let size = parseFloat(qr.style.width);
      while (k < want && size > qrMin + 0.001) {
        size = Math.max(qrMin, size * 0.92);
        qr.style.width = qr.style.height = size + "cm";
        k = fitOne();
      }
    }
    if (isCol) p.style.flex = "0 1 auto";
    if (!f.closest("[data-band]") && k < smallest) smallest = k;
  }
  return smallest;
}

/** Documento completo para imprimir una hoja llena (pieceHtml ya viene ajustada) */
export function buildSheetHtml(kind: PrintKind, d: PrintDesign, pieceHtml: string, business: string, paperId: string, styleLinks: string[]) {
  const s = sizeOf(kind, d);
  const fit = fitOnPaper(s.w, s.h, paperId);
  const usedW = fit.cols * s.w + (fit.cols - 1) * GAP;
  const usedH = fit.rows * s.h + (fit.rows - 1) * GAP;
  const offX = (fit.pageW - usedW) / 2;
  const offY = (fit.pageH - usedH) / 2;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(KINDS[kind].label)} · ${esc(business)}</title>
${styleLinks.map((h) => `<link rel="stylesheet" href="${esc(h)}">`).join("")}
<style>
  @page { size: ${n3(fit.pageW)}cm ${n3(fit.pageH)}cm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .page { position: relative; width: ${n3(fit.pageW)}cm; height: ${n3(fit.pageH)}cm; overflow: hidden; }
  .grid { position: absolute; left: ${n3(offX)}cm; top: ${n3(offY)}cm; display: grid; grid-template-columns: repeat(${fit.cols}, ${n3(s.w)}cm); grid-auto-rows: ${n3(s.h)}cm; gap: ${GAP}cm; }
  .cut { outline: 0.01cm dashed #d0d0d0; outline-offset: ${GAP / 2}cm; border-radius: ${d.shape === "redondo" || d.shape === "galleta" ? "50%" : "0"}; }
  .tip { font: 12px system-ui, sans-serif; color: #777; text-align: center; padding: 8px; }
  @media print { .tip { display: none; } }
</style></head><body>
<p class="tip">Imprime al 100 % (escala real, sin "ajustar a la página") en hoja ${esc(fit.paper.label)}${fit.landscape ? ", horizontal" : ""}. Caben ${fit.total} piezas.</p>
<div class="page"><div class="grid">${Array.from({ length: fit.total }, () => `<div class="cut">${pieceHtml}</div>`).join("")}</div></div>
<script>window.onload=function(){var go=function(){setTimeout(function(){window.print()},400)};if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go)}else{go()}};<\/script>
</body></html>`;
}
