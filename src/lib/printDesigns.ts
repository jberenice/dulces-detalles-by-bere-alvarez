/**
 * Diseñador de impresos: tarjetas de presentación, etiquetas, stickers (cuadrados o redondos) y QR.
 * Todo se dibuja con HTML + CSS en centímetros, así la vista previa y la impresión salen iguales.
 */

export type PrintKind = "tarjeta" | "etiqueta" | "sticker" | "qr";
export type Shape = "rectangulo" | "cuadrado" | "redondo";
export type Layout = "clasico" | "invertido" | "centrado" | "banda" | "minimal" | "marco";
export type Pattern = "liso" | "chispas" | "puntos" | "rayas" | "ondas";
export type Border = "ninguno" | "linea" | "punteado" | "doble";
export type Font = "elegante" | "romantica" | "moderna";

export type PrintDesign = {
  size: string;
  shape: Shape;
  layout: Layout;
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
  line1: string;
  line2: string;
  showUrl: boolean;
  showLines: boolean;
};

export type SizeOption = { id: string; label: string; w: number; h: number; shapes: Shape[] };

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
    ],
  },
  sticker: {
    label: "Stickers",
    hint: "Cuadrados o redondos, para sellar tus empaques",
    sizes: [
      { id: "4", label: "4 cm", w: 4, h: 4, shapes: ["cuadrado", "redondo"] },
      { id: "5", label: "5 cm", w: 5, h: 5, shapes: ["cuadrado", "redondo"] },
      { id: "6", label: "6 cm", w: 6, h: 6, shapes: ["cuadrado", "redondo"] },
      { id: "7.5", label: "7.5 cm", w: 7.5, h: 7.5, shapes: ["cuadrado", "redondo"] },
    ],
  },
  qr: {
    label: "QR para mostrador",
    hint: "Tu código grande para pegar en la vitrina o la caja",
    sizes: [
      { id: "7", label: "7 × 7 cm", w: 7, h: 7, shapes: ["cuadrado", "redondo"] },
      { id: "10", label: "10 × 10 cm", w: 10, h: 10, shapes: ["cuadrado", "redondo"] },
      { id: "10x14", label: "10 × 14 cm (cartel)", w: 10, h: 14, shapes: ["rectangulo"] },
      { id: "14x20", label: "14 × 20 cm (media carta)", w: 14, h: 20, shapes: ["rectangulo"] },
    ],
  },
};

export const LAYOUTS: { id: Layout; label: string; hint: string }[] = [
  { id: "clasico", label: "Clásico", hint: "QR a la izquierda, datos a la derecha" },
  { id: "invertido", label: "Invertido", hint: "Datos a la izquierda, QR a la derecha" },
  { id: "centrado", label: "Centrado", hint: "Logo arriba, todo al centro" },
  { id: "banda", label: "Con banda", hint: "Franja de color con tu nombre" },
  { id: "marco", label: "Marco", hint: "Borde grueso de color, elegante" },
  { id: "minimal", label: "Minimal", hint: "Solo QR grande y tu nombre" },
];

export const PALETTES: { name: string; bg: string; primary: string; text: string; qr: string }[] = [
  { name: "Rosa dulce", bg: "#fffaef", primary: "#eb5473", text: "#3f250d", qr: "#3f250d" },
  { name: "Menta", bg: "#f2faf6", primary: "#3f8f6e", text: "#1f3a2e", qr: "#1f3a2e" },
  { name: "Chocolate", bg: "#3f250d", primary: "#f2a7b8", text: "#fbefe3", qr: "#3f250d" },
  { name: "Vainilla", bg: "#fffdf6", primary: "#b07d2b", text: "#3b2a12", qr: "#3b2a12" },
  { name: "Lavanda", bg: "#f8f5fc", primary: "#7b5ea7", text: "#2e2340", qr: "#2e2340" },
  { name: "Frambuesa", bg: "#c2185b", primary: "#ffd6e3", text: "#ffffff", qr: "#3a1020" },
  { name: "Blanco y negro", bg: "#ffffff", primary: "#111111", text: "#111111", qr: "#111111" },
  { name: "Durazno", bg: "#fff1e6", primary: "#f08a5d", text: "#4a2c1a", qr: "#4a2c1a" },
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
    line1: "",
    line2: "",
    showUrl: kind === "tarjeta",
    showLines: kind !== "sticker",
  };
}

const HEX = /^#[0-9a-f]{6}$/i;
const pick = <T extends string>(v: unknown, ok: readonly T[], d: T) => (ok.includes(v as T) ? (v as T) : d);
const str = (v: unknown, max: number, d = "") => (typeof v === "string" ? v.slice(0, max) : d);

/** Valida un diseño guardado (puede venir incompleto o de una versión anterior) */
export function normalizeDesign(kind: PrintKind, raw: unknown, base?: { bg?: string; primary?: string; text?: string }): PrintDesign {
  const d = defaultDesign(kind, base);
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;
  const size = KINDS[kind].sizes.find((s) => s.id === r.size) ?? KINDS[kind].sizes[0];
  return {
    size: size.id,
    shape: pick(r.shape, size.shapes, size.shapes[0]),
    layout: pick(r.layout, LAYOUTS.map((l) => l.id), d.layout),
    bg: HEX.test(String(r.bg)) ? String(r.bg) : d.bg,
    primary: HEX.test(String(r.primary)) ? String(r.primary) : d.primary,
    text: HEX.test(String(r.text)) ? String(r.text) : d.text,
    qrColor: HEX.test(String(r.qrColor)) ? String(r.qrColor) : d.qrColor,
    font: pick(r.font, ["elegante", "romantica", "moderna"] as const, d.font),
    border: pick(r.border, ["ninguno", "linea", "punteado", "doble"] as const, d.border),
    pattern: pick(r.pattern, ["liso", "chispas", "puntos", "rayas", "ondas"] as const, d.pattern),
    radius: Math.min(1.5, Math.max(0, Number(r.radius) || 0)),
    showLogo: r.showLogo !== false,
    showQr: r.showQr !== false,
    title: str(r.title, 60),
    subtitle: str(r.subtitle, 80, d.subtitle),
    line1: str(r.line1, 60),
    line2: str(r.line2, 60),
    showUrl: typeof r.showUrl === "boolean" ? r.showUrl : d.showUrl,
    showLines: typeof r.showLines === "boolean" ? r.showLines : d.showLines,
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
  whatsapp: string;
  instagram: string;
  fonts: Record<Font, string>;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

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
    default:
      return "";
  }
}

/** Renglones aproximados que ocupa un texto con cierto tamaño de letra y ancho disponible (cm) */
const linesOf = (text: string, size: number, width: number, factor = 0.56) =>
  text ? Math.max(1, Math.ceil((text.length * size * factor) / Math.max(width, 0.5))) : 0;

/** HTML de una sola pieza (tarjeta, etiqueta, sticker o QR). Todo se escala para que siempre quepa. */
export function renderItem(kind: PrintKind, d: PrintDesign, data: PrintData) {
  const s = sizeOf(kind, d);
  const w = s.w;
  const h = s.h;
  const round = d.shape === "redondo";
  const base = Math.min(w, h);
  const title = d.title.trim() || data.business;
  const lines = d.showLines ? [d.line1 || data.whatsapp, d.line2 || data.instagram].map((l) => l.trim()).filter(Boolean) : [];
  const urlText = d.showUrl ? data.url.replace(/^https?:\/\//, "") : "";
  const font = data.fonts[d.font];
  const sans = data.fonts.moderna;
  const hasLogo = d.showLogo && !!data.logo;
  const borderCss =
    d.border === "linea" ? `border:0.04cm solid ${d.primary};` : d.border === "punteado" ? `border:0.05cm dashed ${d.primary};` : d.border === "doble" ? `border:0.12cm double ${d.primary};` : "";
  const radius = round ? "50%" : `${d.radius}cm`;
  const horizontal = w / h > 1.25 && !round;
  let layout = d.layout;
  if (round && layout !== "minimal") layout = "centrado";
  if (!horizontal && (layout === "clasico" || layout === "invertido")) layout = "centrado";

  const pad = round ? base * 0.16 : base * 0.08;
  // En piezas redondas se usa el cuadrado inscrito para que nada toque la orilla
  const innerW = round ? base * 0.7 : w - 2 * pad;
  const innerH = round ? base * 0.74 : h - 2 * pad;

  // Tamaños de partida (luego se reducen con k si no caben)
  let t = Math.max(0.24, Math.min(base * (horizontal ? 0.12 : 0.105), 1.1));
  let sub = t * 0.55;
  let ln = t * 0.47;
  let logoS = horizontal ? h * 0.28 : base * 0.2;
  let qrS = d.showQr ? (layout === "minimal" ? base * 0.6 : horizontal && (layout === "clasico" || layout === "invertido") ? Math.min(h - 2 * pad, w * 0.42) : base * 0.42) : 0;

  /** Alto que ocupa el bloque de textos con el ancho dado (cm) */
  const textHeight = (width: number, withLogo: boolean, k = 1) => {
    const gap = t * k * 0.2;
    let hh = 0;
    if (withLogo) hh += logoS * k + gap;
    hh += linesOf(title, t * k, width) * t * k * 1.08;
    if (d.subtitle) hh += gap + linesOf(d.subtitle, sub * k, width, 0.6) * sub * k * 1.2;
    for (const l of lines) hh += gap * 0.6 + linesOf(l, ln * k, width, 0.55) * ln * k * 1.25;
    if (urlText) hh += gap * 0.6 + linesOf(urlText, ln * k * 0.85, width, 0.6) * ln * k * 0.85 * 1.2;
    return hh;
  };
  const fitK = (needed: number, avail: number) => (needed > avail ? avail / needed : 1);

  const qrImg = (size: number) =>
    d.showQr && size > 0
      ? `<img src="${data.qr}" alt="" style="width:${size}cm;height:${size}cm;display:block;flex:none;background:#fff;padding:${size * 0.04}cm;border-radius:${size * 0.06}cm;box-sizing:border-box" />`
      : "";
  const logoImg = (size: number) =>
    hasLogo
      ? `<img src="${esc(data.logo!)}" alt="" style="width:${size}cm;height:${size}cm;object-fit:contain;display:block;flex:none;border-radius:50%;background:#fff;padding:${size * 0.06}cm;box-sizing:border-box" />`
      : "";
  const texts = (align: "left" | "center", withLogo: boolean, color = d.text) => `
    <div style="display:flex;flex-direction:column;gap:${t * 0.2}cm;min-width:0;max-width:100%;text-align:${align};align-items:${align === "center" ? "center" : "flex-start"}">
      ${withLogo ? logoImg(logoS) : ""}
      <div style="font-family:${font};font-weight:700;font-size:${t}cm;line-height:1.08;color:${color};overflow-wrap:anywhere">${esc(title)}</div>
      ${d.subtitle ? `<div style="font-family:${sans};font-weight:700;font-size:${sub}cm;color:${d.primary};line-height:1.2;overflow-wrap:anywhere">${esc(d.subtitle)}</div>` : ""}
      ${lines.map((l) => `<div style="font-family:${sans};font-size:${ln}cm;color:${color};opacity:.88;line-height:1.25;overflow-wrap:anywhere">${esc(l)}</div>`).join("")}
      ${urlText ? `<div style="font-family:${sans};font-size:${ln * 0.85}cm;color:${color};opacity:.72;line-height:1.2;overflow-wrap:anywhere">${esc(urlText)}</div>` : ""}
    </div>`;
  const scaleAll = (k: number) => {
    t *= k;
    sub *= k;
    ln *= k;
    logoS *= k;
    qrS *= k;
  };

  let inner = "";
  let padding = `${pad}cm`;
  if (layout === "clasico" || layout === "invertido") {
    const textW = innerW - qrS - pad;
    const k = fitK(textHeight(textW, hasLogo), innerH);
    t *= k; sub *= k; ln *= k; logoS *= k;
    const parts = [qrImg(qrS), `<div style="flex:1;min-width:0;display:flex;align-items:center">${texts("left", hasLogo)}</div>`];
    if (layout === "invertido") parts.reverse();
    inner = `<div style="display:flex;align-items:center;gap:${pad}cm;width:100%;height:100%">${parts.join("")}</div>`;
  } else if (layout === "banda") {
    const bandH = round ? base * 0.3 : horizontal ? h * 0.32 : base * 0.26;
    const bt = Math.min(t, bandH * 0.32, (w - 2 * pad - (hasLogo ? bandH * 0.7 : 0)) / Math.max(4, title.length * 0.5));
    const bodyH = h - bandH - 2 * pad * 0.8;
    padding = "0";
    if (horizontal) {
      qrS = d.showQr ? Math.min(bodyH, w * 0.38) : 0;
      const k = fitK(textHeight(w - 3 * pad - qrS, false), bodyH);
      t *= k; sub *= k; ln *= k;
    } else {
      const need = textHeight(innerW, false) - linesOf(title, t, innerW) * t * 1.08 + (d.showQr ? qrS + pad * 0.5 : 0);
      const k = fitK(need, bodyH);
      scaleAll(k);
    }
    const restTexts = `
      <div style="display:flex;flex-direction:column;gap:${t * 0.15}cm;min-width:0;text-align:${horizontal ? "left" : "center"};align-items:${horizontal ? "flex-start" : "center"}">
        ${d.subtitle ? `<div style="font-family:${sans};font-weight:700;font-size:${sub}cm;color:${d.primary};line-height:1.2">${esc(d.subtitle)}</div>` : ""}
        ${lines.map((l) => `<div style="font-family:${sans};font-size:${ln}cm;color:${d.text};opacity:.88;line-height:1.25">${esc(l)}</div>`).join("")}
        ${urlText ? `<div style="font-family:${sans};font-size:${ln * 0.85}cm;color:${d.text};opacity:.72;overflow-wrap:anywhere;line-height:1.2">${esc(urlText)}</div>` : ""}
      </div>`;
    inner = `
      <div style="position:absolute;left:0;right:0;top:0;height:${bandH}cm;background:${d.primary};display:flex;align-items:center;justify-content:center;gap:${pad * 0.5}cm;padding:0 ${pad}cm;box-sizing:border-box">
        ${hasLogo ? logoImg(bandH * 0.68) : ""}
        <div style="font-family:${font};font-weight:700;font-size:${bt}cm;color:${d.bg};line-height:1.05;text-align:center;overflow-wrap:anywhere;min-width:0">${esc(title)}</div>
      </div>
      <div style="position:absolute;left:${pad}cm;right:${pad}cm;top:${bandH + pad * 0.5}cm;bottom:${pad * (round ? 1.6 : 0.8)}cm;display:flex;align-items:center;justify-content:center;gap:${pad * 0.7}cm;flex-direction:${horizontal ? "row" : "column"}">
        ${qrImg(qrS)}${restTexts}
      </div>`;
  } else if (layout === "minimal") {
    const need = qrS + pad * 0.4 + linesOf(title, t * 0.9, innerW) * t * 0.9 * 1.08 + (d.subtitle ? sub * 1.3 : 0);
    scaleAll(fitK(need, innerH));
    inner = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${pad * 0.4}cm;width:100%;height:100%;text-align:center">
      ${qrImg(qrS)}
      <div style="font-family:${font};font-weight:700;font-size:${t * 0.9}cm;color:${d.text};line-height:1.08;overflow-wrap:anywhere">${esc(title)}</div>
      ${d.subtitle ? `<div style="font-family:${sans};font-weight:700;font-size:${sub}cm;color:${d.primary}">${esc(d.subtitle)}</div>` : ""}
    </div>`;
  } else {
    // centrado y marco
    const framePad = layout === "marco" ? base * 0.06 : 0;
    const availH = innerH - framePad * 2;
    const availW = innerW - framePad * 2;
    if (horizontal && d.showQr) {
      // En piezas horizontales el QR va a un lado para que todo quepa
      qrS = Math.min(availH, w * 0.36);
      const k = fitK(textHeight(availW - qrS - pad, hasLogo), availH);
      t *= k; sub *= k; ln *= k; logoS *= k;
      inner = `<div style="display:flex;align-items:center;justify-content:center;gap:${pad}cm;width:100%;height:100%;padding:${framePad}cm;box-sizing:border-box">
        <div style="flex:1;min-width:0;display:flex;justify-content:center">${texts("center", hasLogo)}</div>${qrImg(qrS)}
      </div>`;
    } else {
      const need = textHeight(availW, hasLogo) + (d.showQr ? qrS + pad * 0.45 : 0);
      scaleAll(fitK(need, availH));
      inner = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${pad * 0.45}cm;width:100%;height:100%;padding:${framePad}cm;box-sizing:border-box">
        ${texts("center", hasLogo)}${qrImg(qrS)}
      </div>`;
    }
  }

  const frame = layout === "marco" ? `box-shadow:inset 0 0 0 ${base * 0.05}cm ${d.primary}, inset 0 0 0 ${base * 0.07}cm ${d.bg}, inset 0 0 0 ${base * 0.075}cm ${d.primary};` : "";
  return `<div class="dd-piece" style="position:relative;box-sizing:border-box;width:${w}cm;height:${h}cm;border-radius:${radius};overflow:hidden;background-color:${d.bg};${patternCss(d.pattern, d.primary)}${borderCss}${frame}padding:${round && layout !== "banda" ? (base - innerW) / 2 + "cm" : padding};color:${d.text};-webkit-print-color-adjust:exact;print-color-adjust:exact">${inner}</div>`;
}

/** Documento completo para imprimir una hoja llena */
export function buildSheetHtml(kind: PrintKind, d: PrintDesign, data: PrintData, paperId: string, styleLinks: string[]) {
  const s = sizeOf(kind, d);
  const fit = fitOnPaper(s.w, s.h, paperId);
  const piece = renderItem(kind, d, data);
  const usedW = fit.cols * s.w + (fit.cols - 1) * GAP;
  const usedH = fit.rows * s.h + (fit.rows - 1) * GAP;
  const offX = (fit.pageW - usedW) / 2;
  const offY = (fit.pageH - usedH) / 2;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(KINDS[kind].label)} · ${esc(data.business)}</title>
${styleLinks.map((h) => `<link rel="stylesheet" href="${esc(h)}">`).join("")}
<style>
  @page { size: ${fit.pageW}cm ${fit.pageH}cm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .page { position: relative; width: ${fit.pageW}cm; height: ${fit.pageH}cm; overflow: hidden; }
  .grid { position: absolute; left: ${offX}cm; top: ${offY}cm; display: grid; grid-template-columns: repeat(${fit.cols}, ${s.w}cm); grid-auto-rows: ${s.h}cm; gap: ${GAP}cm; }
  .cut { outline: 0.01cm dashed #d0d0d0; outline-offset: ${GAP / 2}cm; border-radius: ${d.shape === "redondo" ? "50%" : "0"}; }
  .tip { font: 12px system-ui, sans-serif; color: #777; text-align: center; padding: 8px; }
  @media print { .tip { display: none; } }
</style></head><body>
<p class="tip">Imprime al 100 % (escala real, sin "ajustar a la página") en hoja ${esc(fit.paper.label)}${fit.landscape ? ", horizontal" : ""}. Caben ${fit.total} piezas.</p>
<div class="page"><div class="grid">${Array.from({ length: fit.total }, () => `<div class="cut">${piece}</div>`).join("")}</div></div>
<script>window.onload=function(){setTimeout(function(){window.print()},600)};<\/script>
</body></html>`;
}
