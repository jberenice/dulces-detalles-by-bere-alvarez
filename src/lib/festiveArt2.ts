/**
 * Ilustraciones detalladas de temporada (versión 2): calaverita con corona de flores, cempasúchil con pétalos rizados,
 * vela encendida, pan de muerto y papel picado con figuras recortadas. Todo en SVG dibujado en código.
 */
import { ART, type ArtName } from "./festiveArt";
import type { FestiveId } from "./festive";

const INK = "#4a2a14";

const svg = (vb: string, body: string, style = "", defs = "") =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}'>${defs ? `<defs>${defs}</defs>` : ""}${style ? `<style>${style}</style>` : ""}${body}</svg>`;

const around = (cx: number, cy: number, n: number, r: number, f: (x: number, y: number, deg: number, i: number) => string, rot = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n + rot;
    return f(cx + r * Math.cos(a), cy + r * Math.sin(a), (a * 180) / Math.PI + 90, i);
  }).join("");

/** Florecita de cinco pétalos */
const flower = (x: number, y: number, s: number, petal: string, center: string, stroke = INK) =>
  around(x, y, 5, s * 0.55, (px, py, deg) => `<ellipse cx='${px.toFixed(1)}' cy='${py.toFixed(1)}' rx='${(s * 0.42).toFixed(1)}' ry='${(s * 0.55).toFixed(1)}' fill='${petal}' stroke='${stroke}' stroke-width='${(s * 0.08).toFixed(2)}' transform='rotate(${deg.toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})'/>`) +
  `<circle cx='${x}' cy='${y}' r='${(s * 0.32).toFixed(1)}' fill='${center}' stroke='${stroke}' stroke-width='${(s * 0.08).toFixed(2)}'/>`;
const leaf = (x: number, y: number, len: number, deg: number, fill = "#4caf50") =>
  `<path d='M${x} ${y} q${len * 0.45} ${-len * 0.35} ${len} 0 q${-len * 0.45} ${len * 0.35} ${-len} 0Z' fill='${fill}' stroke='${INK}' stroke-width='1.4' transform='rotate(${deg} ${x} ${y})'/>` +
  `<path d='M${x} ${y} h${len * 0.85}' stroke='#2e7d32' stroke-width='1' transform='rotate(${deg} ${x} ${y})'/>`;

/* ---------------------------------------------------------------- Calaverita de azúcar con corona de flores */
export const calaveraDeluxe = svg(
  "-4 -8 128 136",
  // corona de hojas y flores
  leaf(26, 26, 26, 205) + leaf(94, 26, 26, -25) + leaf(44, 12, 22, 240) + leaf(76, 12, 22, -60) +
    // cráneo
    `<path d='M60 14C32 14 14 34 14 58c0 17 9 29 21 35v13c0 6 5 11 11 11h28c6 0 11-5 11-11V93c12-6 21-18 21-35 0-24-18-44-46-44Z' fill='#fffdf8' stroke='${INK}' stroke-width='3.2'/>` +
    `<path d='M24 50c2-14 12-24 24-28' stroke='#f3e6d6' stroke-width='5' fill='none' stroke-linecap='round'/>` +
    flower(36, 22, 13, "#e91e63", "#ffca28") + flower(60, 14, 16, "#ff9800", "#fff176") + flower(84, 22, 13, "#8e24aa", "#ffca28") +
    // adorno de la frente
    `<path d='M60 40c-5-6-12-3-10 2 1 3 6 5 10 9 4-4 9-6 10-9 2-5-5-8-10-2Z' fill='#26c6da' stroke='${INK}' stroke-width='1.6'/>` +
    around(60, 46, 7, 14, (x, y) => `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='1.5' fill='#e91e63'/>`, Math.PI * 1.1) +
    // ojos con pétalos
    around(39, 62, 12, 15, (x, y, d) => `<ellipse cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' rx='3.4' ry='5' fill='#ff9800' stroke='${INK}' stroke-width='1.2' transform='rotate(${d.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})'/>`) +
    around(81, 62, 12, 15, (x, y, d) => `<ellipse cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' rx='3.4' ry='5' fill='#ec407a' stroke='${INK}' stroke-width='1.2' transform='rotate(${d.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})'/>`) +
    `<circle cx='39' cy='62' r='12' fill='#ffd54f' stroke='${INK}' stroke-width='1.6'/><circle cx='81' cy='62' r='12' fill='#4dd0e1' stroke='${INK}' stroke-width='1.6'/>` +
    `<circle cx='39' cy='62' r='8.5' fill='#2d1733'/><circle cx='81' cy='62' r='8.5' fill='#2d1733'/>` +
    `<circle cx='36' cy='59' r='2.6' fill='#fff'/><circle cx='78' cy='59' r='2.6' fill='#fff'/><circle cx='42' cy='65' r='1.2' fill='#fff'/><circle cx='84' cy='65' r='1.2' fill='#fff'/>` +
    // nariz de corazón
    `<path d='M60 84c-8-5-8-10-5-11 2-.7 4 .5 5 2 1-1.5 3-2.7 5-2 3 1 3 6-5 11Z' fill='#e91e63' stroke='${INK}' stroke-width='1.6'/>` +
    // mejillas
    `<path d='M20 74c3 4 8 5 11 2' stroke='#26a69a' stroke-width='2.4' fill='none' stroke-linecap='round'/><path d='M100 74c-3 4-8 5-11 2' stroke='#26a69a' stroke-width='2.4' fill='none' stroke-linecap='round'/>` +
    flower(25, 82, 5, "#ffca28", "#e91e63") + flower(95, 82, 5, "#ffca28", "#e91e63") +
    // sonrisa cosida
    `<path d='M40 100c12 6 28 6 40 0' stroke='${INK}' stroke-width='2.4' fill='none' stroke-linecap='round'/>` +
    [44, 50, 56, 62, 68, 74].map((x) => `<path d='M${x} ${x < 60 ? 99 + (60 - x) * 0.05 : 99 + (x - 60) * 0.05}v7' stroke='${INK}' stroke-width='1.8' stroke-linecap='round'/>`).join("") +
    around(60, 112, 5, 0.01, () => "") +
    `<circle cx='48' cy='114' r='1.6' fill='#26c6da'/><circle cx='60' cy='116' r='1.6' fill='#e91e63'/><circle cx='72' cy='114' r='1.6' fill='#ff9800'/>`,
);

/* ---------------------------------------------------------------- Cempasúchil (pétalos rizados en capas) */
function cempasuchil(withLeaves: boolean) {
  const layers = [
    { r: 40, n: 18, c: "#e65100", e: "#bf360c", w: 9.5 },
    { r: 33, n: 16, c: "#f57c00", e: "#d84315", w: 9 },
    { r: 26, n: 14, c: "#fb8c00", e: "#e65100", w: 8.2 },
    { r: 19, n: 12, c: "#ffa000", e: "#ef6c00", w: 7.4 },
    { r: 12, n: 10, c: "#ffb300", e: "#f57c00", w: 6.4 },
    { r: 6, n: 8, c: "#ffca28", e: "#fb8c00", w: 5 },
  ];
  const body = layers
    .map((L, li) =>
      around(60, 60, L.n, L.r * 0.72, (x, y, d) => {
        // pétalo con orilla rizada (tres ondas)
        const w = L.w;
        const h = L.r * 0.62 + 6;
        return `<path d='M${-w} ${h * 0.1} C${-w} ${-h * 0.6} ${-w * 0.5} ${-h} ${-w * 0.33} ${-h} Q${-w * 0.17} ${-h * 0.82} 0 ${-h} Q${w * 0.17} ${-h * 0.82} ${w * 0.33} ${-h} C${w * 0.5} ${-h} ${w} ${-h * 0.6} ${w} ${h * 0.1} Z' fill='${L.c}' stroke='${L.e}' stroke-width='1.1' transform='translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${d.toFixed(0)})'/>`;
      }, li * 0.21),
    )
    .join("") + around(60, 60, 7, 2.6, (x, y) => `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='1.6' fill='#8d4a00'/>`);
  const leaves = withLeaves ? leaf(40, 88, 44, 145) + leaf(80, 88, 44, 35) + leaf(60, 96, 30, 95, "#66bb6a") : "";
  return svg(withLeaves ? "-8 -4 136 132" : "0 0 120 120", leaves + body);
}
export const cempasuchilSolo = cempasuchil(false);
export const cempasuchilHojas = cempasuchil(true);

/* ---------------------------------------------------------------- Vela encendida */
export const velaDeluxe = svg(
  "0 0 80 140",
  `<ellipse class='g' cx='40' cy='30' rx='30' ry='30' fill='url(#gl)'/>` +
    `<g class='f'><path d='M40 6c8 12 11 18 11 25a11 11 0 0 1-22 0c0-7 3-13 11-25Z' fill='#ffa000' stroke='#e65100' stroke-width='1.6'/><path d='M40 18c4 6 5.5 10 5.5 13.5a5.5 5.5 0 0 1-11 0c0-3.5 1.5-7.5 5.5-13.5Z' fill='#fff59d'/></g>` +
    `<path d='M40 40v8' stroke='${INK}' stroke-width='2.4'/>` +
    `<rect x='18' y='46' width='44' height='86' rx='6' fill='#fff4dc' stroke='${INK}' stroke-width='3'/>` +
    `<path d='M18 54c4 0 4 10 9 10s3-10 8-10 4 16 9 16 3-16 8-16 4 8 10 8V52c0-3-3-6-6-6H24c-3 0-6 3-6 6Z' fill='#fffaf0' stroke='${INK}' stroke-width='2'/>` +
    `<rect x='18' y='96' width='44' height='12' fill='#e91e63' stroke='${INK}' stroke-width='2'/>` +
    flower(40, 102, 6, "#ffca28", "#8e24aa") + flower(26, 102, 4, "#fff", "#ff9800") + flower(54, 102, 4, "#fff", "#ff9800") +
    `<path d='M26 60v28' stroke='#fff' stroke-width='4' stroke-linecap='round' opacity='.7'/>`,
  `.f{transform-origin:40px 40px;animation:fl 1.1s ease-in-out infinite alternate}.g{animation:gl 1.1s ease-in-out infinite alternate}@keyframes fl{0%{transform:scale(1,1) rotate(-4deg)}100%{transform:scale(.88,1.14) rotate(4deg)}}@keyframes gl{0%{opacity:.45}100%{opacity:.9}}`,
  `<radialGradient id='gl'><stop offset='0' stop-color='#ffe082' stop-opacity='.9'/><stop offset='1' stop-color='#ffe082' stop-opacity='0'/></radialGradient>`,
);

/* ---------------------------------------------------------------- Pan de muerto */
export const panDeluxe = svg(
  "0 0 140 100",
  `<ellipse cx='70' cy='88' rx='62' ry='8' fill='#000' opacity='.12'/>` +
    `<path d='M10 74c0-34 26-58 60-58s60 24 60 58c0 8-6 12-14 12H24c-8 0-14-4-14-12Z' fill='url(#pg)' stroke='${INK}' stroke-width='3'/>` +
    // huesitos
    `<path d='M22 66c10-16 26-24 48-24s38 8 48 24' fill='none' stroke='${INK}' stroke-width='12' stroke-linecap='round'/><path d='M22 66c10-16 26-24 48-24s38 8 48 24' fill='none' stroke='#c46b28' stroke-width='9' stroke-linecap='round'/>` +
    around(70, 70, 1, 0, () => "") +
    [30, 46, 62, 78, 94, 110].map((x, i) => `<circle cx='${x}' cy='${[60, 51, 46, 46, 51, 60][i]}' r='5.5' fill='#c46b28' stroke='${INK}' stroke-width='1.6'/>`).join("") +
    `<path d='M52 28c8 12 10 26 10 46M88 28c-8 12-10 26-10 46' fill='none' stroke='${INK}' stroke-width='12' stroke-linecap='round'/><path d='M52 28c8 12 10 26 10 46M88 28c-8 12-10 26-10 46' fill='none' stroke='#c46b28' stroke-width='9' stroke-linecap='round'/>` +
    `<circle cx='70' cy='22' r='10' fill='#c46b28' stroke='${INK}' stroke-width='2.4'/><circle cx='67' cy='19' r='3' fill='#e9a35f'/>` +
    Array.from({ length: 34 }, (_, i) => {
      const x = 20 + ((i * 37) % 100);
      const y = 40 + ((i * 23) % 40);
      return `<rect x='${x}' y='${y}' width='2.6' height='1.4' rx='.7' fill='#fff8e8' transform='rotate(${(i * 47) % 180} ${x} ${y})'/>`;
    }).join(""),
  "",
  `<linearGradient id='pg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e8a25a'/><stop offset='1' stop-color='#c8762f'/></linearGradient>`,
);

/* ---------------------------------------------------------------- Papel picado */
export type Motif = "calavera" | "flor" | "corazon" | "estrella" | "pino" | "calabaza" | "campana" | "corona" | "mariposa" | "rombo";

/** Figura que se recorta en el centro del papel (en negro: lo que se quita) */
function motifPath(m: Motif, cx: number, cy: number): string {
  switch (m) {
    case "calavera":
      return `<path d='M${cx} ${cy - 14}c-9 0-15 6-15 13 0 5 3 8 6 10v5h18v-5c3-2 6-5 6-10 0-7-6-13-15-13Z'/>` +
        // ojos y nariz quedan de papel (blancos dentro de la máscara)
        `<circle cx='${cx - 5.5}' cy='${cy - 1}' r='3.6' fill='white'/><circle cx='${cx + 5.5}' cy='${cy - 1}' r='3.6' fill='white'/><path d='M${cx} ${cy + 3}l-2 4h4Z' fill='white'/><path d='M${cx - 6} ${cy + 10}h12M${cx - 3} ${cy + 8}v5M${cx} ${cy + 8}v5M${cx + 3} ${cy + 8}v5' stroke='white' stroke-width='1.2'/>`;
    case "flor":
      return around(cx, cy, 6, 7, (x, y, d) => `<ellipse cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' rx='4' ry='6.5' transform='rotate(${d.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})'/>`) + `<circle cx='${cx}' cy='${cy}' r='3' fill='white'/>`;
    case "corazon":
      return `<path d='M${cx} ${cy + 12}C${cx - 16} ${cy + 2} ${cx - 14} ${cy - 12} ${cx} ${cy - 5}C${cx + 14} ${cy - 12} ${cx + 16} ${cy + 2} ${cx} ${cy + 12}Z'/>`;
    case "estrella":
      return `<path d='M${cx} ${cy - 14}l4 9 10 1-7.5 6.5 2.5 10L${cx} ${cy + 7} ${cx - 9} ${cy + 12.5}l2.5-10L${cx - 14} ${cy - 4}l10-1Z'/>`;
    case "pino":
      return `<path d='M${cx} ${cy - 15}l-9 11h5l-8 10h6l-7 9h26l-7-9h6l-8-10h5Z'/><rect x='${cx - 2}' y='${cy + 15}' width='4' height='4'/>`;
    case "calabaza":
      return `<ellipse cx='${cx - 6}' cy='${cy + 2}' rx='8' ry='10'/><ellipse cx='${cx + 6}' cy='${cy + 2}' rx='8' ry='10'/><ellipse cx='${cx}' cy='${cy + 2}' rx='8' ry='11'/><rect x='${cx - 1.5}' y='${cy - 13}' width='3' height='5'/>` +
        `<path d='M${cx - 7} ${cy}l3-4 3 4ZM${cx + 1} ${cy}l3-4 3 4ZM${cx - 7} ${cy + 6}q7 5 14 0' fill='white' stroke='white'/>`;
    case "campana":
      return `<path d='M${cx} ${cy - 14}c-8 0-11 8-11 16 0 5-2 7-4 9h30c-2-2-4-4-4-9 0-8-3-16-11-16Z'/><circle cx='${cx}' cy='${cy + 14}' r='3'/>`;
    case "corona":
      return `<path d='M${cx - 14} ${cy + 8}l-1-16 7 7 8-11 8 11 7-7-1 16Z'/><rect x='${cx - 14}' y='${cy + 9}' width='28' height='4'/>`;
    case "mariposa":
      return `<path d='M${cx} ${cy}c-6-12-16-12-16-4s8 8 16 4Zm0 0c6-12 16-12 16-4s-8 8-16 4Zm0 2c-4 6-12 10-12 4s6-6 12-4Zm0 0c4 6 12 10 12 4s-6-6-12-4Z'/>`;
    default:
      return `<path d='M${cx} ${cy - 13}l11 13-11 13-11-13Z'/><path d='M${cx} ${cy - 6}l5 6-5 6-5-6Z' fill='white'/>`;
  }
}

/** Una banderita de papel picado (54 × 66) con orilla de picos y figuras recortadas */
export function papelPicadoFlag(color: string, motif: Motif, id: string) {
  const W = 54;
  const H = 62;
  let edge = "";
  for (let k = 0; k <= 9; k++) edge += ` L${W - (k * W) / 9} ${H + (k % 2 ? -5 : 0)}`;
  const holes =
    motifPath(motif, W / 2, 30) +
    // orilla de puntitos y rombitos
    Array.from({ length: 6 }, (_, i) => `<circle cx='${6 + i * 8.4}' cy='8' r='1.7'/>`).join("") +
    Array.from({ length: 5 }, (_, i) => `<path d='M${10 + i * 8.5} ${H - 12}l3 3-3 3-3-3Z'/>`).join("") +
    `<path d='M5 18l3 4-3 4-3-4Z'/><path d='M${W - 5} 18l3 4-3 4-3-4Z'/><circle cx='6' cy='40' r='2'/><circle cx='${W - 6}' cy='40' r='2'/>`;
  return (
    `<mask id='${id}'><path d='M0 0H${W}V${H}${edge}Z' fill='white'/><g fill='black'>${holes}</g></mask>` +
    `<g mask='url(#${id})'><path d='M0 0H${W}V${H}${edge}Z' fill='${color}'/><path d='M0 0H${W}V${H}${edge}Z' fill='url(#pp-shade)'/></g>`
  );
}

/* ======================================================================
   Composiciones por temporada
   ====================================================================== */

const DELUXE = { calaveraDeluxe, cempasuchilSolo, cempasuchilHojas, velaDeluxe, panDeluxe } as const;
export type BigArt = ArtName | keyof typeof DELUXE;
const uriCache = new Map<string, string>();
export const bigUri = (n: BigArt) => {
  let u = uriCache.get(n);
  if (!u) {
    u = `data:image/svg+xml,${encodeURIComponent((DELUXE as Record<string, string>)[n] ?? ART[n as ArtName])}`;
    uriCache.set(n, u);
  }
  return u;
};
/** Proporción alto/ancho de cada ilustración (las de 64×64 son cuadradas) */
export const bigRatio = (n: BigArt) => ({ velaDeluxe: 140 / 80, panDeluxe: 100 / 140, calaveraDeluxe: 136 / 128, cempasuchilHojas: 132 / 136 })[n as string] ?? 1;

/**
 * Ramillete: [relleno de atrás, estrella, alto (vela, árbol…), relleno chico, frente]
 * Se acomoda en una esquina como en los diseños de referencia (flores atrás, calaverita al centro, vela y pan al frente).
 */
export const BOUQUET: Record<FestiveId, [BigArt, BigArt, BigArt, BigArt, BigArt]> = {
  muertos: ["cempasuchilHojas", "calaveraDeluxe", "velaDeluxe", "cempasuchilSolo", "panDeluxe"],
  halloween: ["dulce", "calabaza", "fantasma", "murcielago", "dulce"],
  navidad: ["esfera", "arbol", "baston", "esfera", "regaloRojo"],
  anonuevo: ["estrellaPlata", "copa", "fuego", "estrellaOro", "estrellaOro"],
  reyes: ["estrellaOro", "corona", "rosca", "estrellaOro", "regaloMorado"],
  sanvalentin: ["rosaRoja", "corazonRojo", "carta", "corazonRosa", "rosaRosa"],
  primavera: ["tulipanAmarillo", "florAmarilla", "mariposa", "florAmarilla", "tulipanAmarillo"],
  nino: ["globoAzul", "globoRojo", "papalote", "rehileteNino", "paleta"],
  madres: ["rosaRosa", "tulipanRosa", "corazonRosa", "rosaRosa", "regaloRosa"],
  maestro: ["estrellaOro", "manzana", "lapiz", "estrellaOro", "libro"],
  padre: ["estrellaOro", "corbata", "taza", "estrellaOro", "bigote"],
  independencia: ["chile", "bandera", "campana", "rehileteMx", "chile"],
};

/** Colores y figuras del papel picado de cada temporada */
export const PICADO: Record<FestiveId, { colors: string[]; motifs: Motif[] }> = {
  muertos: { colors: ["#e91e63", "#ff9800", "#8e24aa", "#43a047", "#fbc02d", "#00acc1"], motifs: ["calavera", "flor", "calavera", "corazon", "calavera", "estrella"] },
  halloween: { colors: ["#ef6c00", "#6a1b9a", "#212121", "#ef6c00", "#7cb342", "#6a1b9a"], motifs: ["calabaza", "calavera", "estrella", "calabaza", "rombo", "calavera"] },
  navidad: { colors: ["#c62828", "#2e7d32", "#f9a825", "#c62828", "#1565c0", "#2e7d32"], motifs: ["pino", "estrella", "campana", "pino", "estrella", "campana"] },
  anonuevo: { colors: ["#d4af37", "#37474f", "#b0bec5", "#d4af37", "#6a1b9a", "#37474f"], motifs: ["estrella", "rombo", "estrella", "campana", "estrella", "rombo"] },
  reyes: { colors: ["#d4a017", "#7b2d8e", "#c0392b", "#2e7d4f", "#d4a017", "#7b2d8e"], motifs: ["corona", "estrella", "corona", "rombo", "corona", "estrella"] },
  sanvalentin: { colors: ["#e53950", "#f48fb1", "#d81b60", "#ff8a80", "#ad1457", "#f06292"], motifs: ["corazon", "flor", "corazon", "corazon", "rombo", "corazon"] },
  primavera: { colors: ["#fbc02d", "#ffd54f", "#f9a825", "#ffb300", "#aed581", "#ffca28"], motifs: ["flor", "mariposa", "flor", "flor", "mariposa", "flor"] },
  nino: { colors: ["#e53935", "#fbc02d", "#43a047", "#1e88e5", "#8e24aa", "#fb8c00"], motifs: ["estrella", "corazon", "mariposa", "estrella", "flor", "rombo"] },
  madres: { colors: ["#ec407a", "#f8bbd0", "#ab47bc", "#f06292", "#ce93d8", "#ec407a"], motifs: ["corazon", "flor", "mariposa", "corazon", "flor", "corazon"] },
  maestro: { colors: ["#e53935", "#1e88e5", "#fbc02d", "#43a047", "#e53935", "#1e88e5"], motifs: ["estrella", "rombo", "corazon", "estrella", "flor", "rombo"] },
  padre: { colors: ["#1f4e79", "#4f8ac9", "#c08a3e", "#2d6a4f", "#1f4e79", "#8fb3d9"], motifs: ["estrella", "rombo", "corona", "estrella", "rombo", "corona"] },
  independencia: { colors: ["#006847", "#ffffff", "#ce1126", "#006847", "#ffffff", "#ce1126"], motifs: ["campana", "estrella", "flor", "campana", "estrella", "calavera"] },
};

const SHADE = `<linearGradient id='pp-shade' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='.28'/><stop offset='1' stop-color='#000' stop-opacity='.1'/></linearGradient>`;

/**
 * Guirnalda de papel picado colgando de una esquina (side) hasta `w` px, con caída `sag`.
 * Devuelve el SVG ya armado (cada banderita se mece sola) y las cajas de cada banderita para revisar que no tapen texto.
 */
export function swagSvg(id: FestiveId, w: number, side: "left" | "right" | "center", flag = 40, sag = 46) {
  const { colors, motifs } = PICADO[id];
  const fh = (flag * 62) / 54;
  const h = Math.ceil(sag + fh + 10);
  const n = Math.max(3, Math.floor(w / (flag * 1.12)));
  // cuerda: de (x0,y0) a (x1,y1) con curva cuadrática
  const [x0, y0, x1, y1] = side === "left" ? [0, 2, w, 6] : side === "right" ? [0, 6, w, 2] : [0, 2, w, 2];
  const cx = (x0 + x1) / 2;
  const cy = Math.max(y0, y1) + sag * 2 - (y0 + y1) / 2;
  const at = (t: number) => {
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    return { x, y, deg: (Math.atan2(dy, dx) * 180) / Math.PI };
  };
  const s = flag / 54;
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  let defs = SHADE;
  let flags = "";
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const p = at(t);
    const k = (i + (side === "right" ? 3 : 0)) % colors.length;
    const fid = `f${k}`;
    if (!defs.includes(`id='${fid}'`)) defs += papelPicadoFlag(colors[k], motifs[k], fid).replace(/^(<mask[^]*?<\/mask>)[^]*$/, "$1");
    const rot = p.deg * 0.75;
    flags += `<g transform='translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rot.toFixed(1)})'><g class='w' style='animation-delay:${(-i * 0.37).toFixed(2)}s'><g transform='translate(${(-flag / 2).toFixed(1)} -1) scale(${s.toFixed(3)})'>${papelPicadoFlag(colors[k], motifs[k], fid).replace(/^<mask[^]*?<\/mask>/, "")}</g></g></g>`;
    boxes.push({ x: p.x - flag / 2 - 3, y: p.y - 2, w: flag + 6, h: fh + 6 });
  }
  // nudos en las puntas
  const knots = `<circle cx='${x0 + 3}' cy='${y0 + 1}' r='3' fill='#8d5a3b'/><circle cx='${x1 - 3}' cy='${y1 + 1}' r='3' fill='#8d5a3b'/>`;
  const rope = `<path d='M${x0} ${y0} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1} ${y1}' fill='none' stroke='#7a5236' stroke-width='1.6'/>`;
  const style = `.w{transform-box:fill-box;transform-origin:50% 0;animation:sw 3.6s ease-in-out infinite alternate}@keyframes sw{0%{transform:rotate(-5deg)}100%{transform:rotate(5deg)}}@media (prefers-reduced-motion:reduce){.w{animation:none}}`;
  const svgStr = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><defs>${defs}</defs><style>${style}</style>${rope}<g style='filter:drop-shadow(0 2px 1.5px rgb(0 0 0 / .18))'>${flags}</g>${knots}</svg>`;
  return { svg: svgStr, h, boxes };
}

/** Tirita de papel picado chiquita (para la esquina de una tarjeta) */
export function miniPicadoUri(id: FestiveId) {
  const { colors, motifs } = PICADO[id];
  const fw = 22;
  let defs = SHADE;
  let body = `<path d='M2 3 Q42 12 82 3' fill='none' stroke='#7a5236' stroke-width='1.2'/>`;
  for (let i = 0; i < 3; i++) {
    const fid = `m${i}`;
    defs += papelPicadoFlag(colors[(i * 2) % colors.length], motifs[i], fid).replace(/^(<mask[^]*?<\/mask>)[^]*$/, "$1");
    const x = 8 + i * 26;
    const y = 3 + Math.sin(((i + 0.5) / 3) * Math.PI) * 6;
    body += `<g transform='translate(${x} ${y}) scale(${(fw / 54).toFixed(3)})'>${papelPicadoFlag(colors[(i * 2) % colors.length], motifs[i], fid).replace(/^<mask[^]*?<\/mask>/, "")}</g>`;
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 84 40'><defs>${defs}</defs>${body}</svg>`)}")`;
}

/** Fondo tenue de confeti y pétalos con los colores de la temporada */
export function confettiUri(id: FestiveId) {
  const c = PICADO[id].colors;
  const pieces = Array.from({ length: 16 }, (_, i) => {
    const x = (i * 53) % 220;
    const y = (i * 97) % 220;
    const col = c[i % c.length] === "#ffffff" ? "#e0e0e0" : c[i % c.length];
    const r = (i * 67) % 180;
    return i % 3 === 0
      ? `<ellipse cx='${x}' cy='${y}' rx='3.4' ry='6' fill='${col}' transform='rotate(${r} ${x} ${y})'/>`
      : i % 3 === 1
        ? `<rect x='${x}' y='${y}' width='7' height='3' rx='1' fill='${col}' transform='rotate(${r} ${x} ${y})'/>`
        : `<circle cx='${x}' cy='${y}' r='2.2' fill='${col}'/>`;
  }).join("");
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>${pieces}</svg>`)}")`;
}

/** Tira de papel picado que se repite a lo ancho (para guirnaldas rectas) */
export function picadoTile(id: FestiveId) {
  const { colors, motifs } = PICADO[id];
  const fw = 40;
  const w = fw * colors.length;
  let defs = SHADE;
  let body = `<path d='M0 3 Q${w / 2} 9 ${w} 3' fill='none' stroke='#7a5236' stroke-width='1.4'/>`;
  colors.forEach((c, i) => {
    const fid = `t${i}`;
    defs += papelPicadoFlag(c, motifs[i], fid).replace(/^(<mask[^]*?<\/mask>)[^]*$/, "$1");
    const y = 2 + Math.sin(((i + 0.5) / colors.length) * Math.PI) * 5;
    body += `<g transform='translate(${i * fw + 3} ${y.toFixed(1)}) scale(${(34 / 54).toFixed(3)})'>${papelPicadoFlag(c, motifs[i], fid).replace(/^<mask[^]*?<\/mask>/, "")}</g>`;
  });
  const h = 48;
  return { image: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><defs>${defs}</defs>${body}</svg>`)}")`, width: w, height: h };
}

/* ======================================================================
   Piezas para botones, logo, fondos y tarjetas
   ====================================================================== */
/** Mete un SVG completo dentro de otro (en la posición y tamaño indicados) */
const nest = (s: string, x: number, y: number, w: number, h: number) =>
  s.replace(/^<svg xmlns='http:\/\/www.w3.org\/2000\/svg'/, `<svg x='${x}' y='${y}' width='${w}' height='${h}'`);
const dataUrl = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const raw = (n: BigArt) => (DELUXE as Record<string, string>)[n] ?? ART[n as ArtName];

/** Esquina decorada para los botones grandes: banderitas asomándose arriba y flores abajo */
export function buttonCornerUri(id: FestiveId, side: "left" | "right") {
  const { colors, motifs } = PICADO[id];
  const [back, , , filler] = BOUQUET[id];
  const f = (k: number, x: number, y: number, rot: number, fid: string) =>
    `<g transform='translate(${x} ${y}) rotate(${rot}) scale(.62)'>${papelPicadoFlag(colors[k % colors.length], motifs[k % motifs.length], fid)}</g>`;
  const body =
    `<defs>${SHADE}</defs>` +
    f(2, -6, -16, -14, "a") +
    f(4, 24, -22, 10, "b") +
    nest(raw(back), -14, 22, 46, 46) +
    nest(raw(filler), 22, 34, 28, 28);
  const g = side === "right" ? `<g transform='translate(84 0) scale(-1 1)'>${body}</g>` : body;
  return dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 84 56' preserveAspectRatio='xMinYMid slice'>${g}</svg>`);
}

/** Ramillete chiquito (flor atrás + estrella del tema) para esquinas de tarjetas */
export function badgeUri(id: FestiveId) {
  const [back, hero, , filler] = BOUQUET[id];
  return dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 72'>${nest(raw(back), 26, 0, 50, 50)}${nest(raw(hero), 4, 16, 50, 54)}${nest(raw(filler), 50, 40, 26, 26)}</svg>`);
}
/** Una flor sola (para adornar íconos y separadores) */
export const flowerUri = (id: FestiveId) => dataUrl(raw(BOUQUET[id][3]));

/** Banderotas de papel picado para los costados del fondo (muy tenues) */
export function sidePanelUri(id: FestiveId) {
  const { colors, motifs } = PICADO[id];
  const body = [0, 1, 2]
    .map((i) => `<g transform='translate(${i * 10} ${i * 190}) rotate(${i % 2 ? 8 : -8} 60 70) scale(2.2)'>${papelPicadoFlag(colors[(i * 2 + 2) % colors.length], motifs[(i + 1) % motifs.length], "s" + i)}</g>`)
    .join("");
  return dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='140' height='560' viewBox='0 0 140 560'><defs>${SHADE}</defs>${body}</svg>`);
}

/** Fondo de calaveritas y estrellitas para secciones oscuras */
export function darkPatternUri(id: FestiveId) {
  const c = PICADO[id].colors;
  const skull = (x: number, y: number, s: number) =>
    `<g transform='translate(${x} ${y}) scale(${s})' fill='#fff' fill-opacity='.06'><path d='M0 -14c-9 0-15 6-15 13 0 5 3 8 6 10v5h18v-5c3-2 6-5 6-10 0-7-6-13-15-13Z'/></g>`;
  const star = (x: number, y: number, col: string) => `<path d='M${x} ${y - 5}l1.4 3.6 3.6 1.4-3.6 1.4L${x} ${y + 5}l-1.4-3.6-3.6-1.4 3.6-1.4Z' fill='${col}' fill-opacity='.5'/>`;
  return dataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'>${skull(50, 60, 1.4)}${skull(190, 170, 1.1)}${skull(120, 240, 0.8)}` +
      `${star(150, 40, c[1])}${star(30, 170, c[4])}${star(230, 70, c[0])}${star(90, 140, c[2])}</svg>`,
  );
}

/** Arco de papel picado (va detrás del remolino del logo) */
export function logoArchUri(id: FestiveId) {
  const { colors } = PICADO[id];
  const outer = colors[2] === "#ffffff" ? colors[0] : colors[2];
  const inner = colors[1] === "#ffffff" ? colors[3] : colors[1];
  let scallop = "";
  for (let a = 180; a <= 360; a += 10) {
    const r = (a * Math.PI) / 180;
    scallop += `<circle cx='${(100 + 92 * Math.cos(r)).toFixed(1)}' cy='${(100 + 92 * Math.sin(r)).toFixed(1)}' r='7.5' fill='${outer}'/>`;
  }
  let lattice = "";
  for (let a = 190; a <= 350; a += 16) {
    const r = (a * Math.PI) / 180;
    lattice += `<path d='M${(100 + 40 * Math.cos(r)).toFixed(1)} ${(100 + 40 * Math.sin(r)).toFixed(1)} L${(100 + 78 * Math.cos(r)).toFixed(1)} ${(100 + 78 * Math.sin(r)).toFixed(1)}' stroke='${inner}' stroke-width='5' stroke-linecap='round'/>`;
  }
  const holes = Array.from({ length: 17 }, (_, i) => {
    const r = ((190 + i * 10) * Math.PI) / 180;
    return `<circle cx='${(100 + 87 * Math.cos(r)).toFixed(1)}' cy='${(100 + 87 * Math.sin(r)).toFixed(1)}' r='2' fill='#fff' fill-opacity='.8'/>`;
  }).join("");
  return dataUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 104'>${scallop}<path d='M8 100a92 92 0 0 1 184 0Z' fill='${outer}'/><path d='M22 100a78 78 0 0 1 156 0Z' fill='#fff' fill-opacity='.85'/>${lattice}<path d='M60 100a40 40 0 0 1 80 0Z' fill='#fff'/>${holes}</svg>`,
  );
}

/** Puntas de listón con encaje (para los lados de la franja del logo) */
export function ribbonEndUri(id: FestiveId, side: "left" | "right") {
  const col = PICADO[id].colors[0];
  const body = `<path d='M60 4H8l12 14-12 14h52Z' fill='${col}' stroke='#00000022'/><path d='M60 4v28' stroke='#0002'/>` + Array.from({ length: 4 }, (_, i) => `<circle cx='${26 + i * 9}' cy='18' r='2' fill='#fff' fill-opacity='.8'/>`).join("");
  const g = side === "right" ? `<g transform='translate(64 0) scale(-1 1)'>${body}</g>` : body;
  return dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 36'>${g}</svg>`);
}
/** Encaje de papel picado bajo la franja del logo */
export function laceUri(id: FestiveId) {
  const col = PICADO[id].colors[0];
  return dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='20' height='12'><path d='M0 0h20v2a10 10 0 0 1-20 0Z' fill='${col}'/><circle cx='10' cy='4' r='2' fill='#fff' fill-opacity='.85'/></svg>`);
}
