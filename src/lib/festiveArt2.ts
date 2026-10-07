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

/* ---------------------------------------------------------------- Cupido: silueta rosita volando con su arco */
export const cupido = svg(
  "0 0 150 120",
  // ala de atrás
  `<path d='M64 50C56 26 34 12 14 14c8 4 12 8 12 12-8-1-14 1-16 6 8 0 12 3 12 6-6 1-10 5-10 10 8-3 14-2 18 1-4 3-5 8-3 12 12-8 28-6 37-11Z' fill='#f6c1cf'/>` +
    // ala del frente
    `<path d='M70 54C70 30 56 10 36 4c6 6 8 11 6 15-6-3-12-2-15 2 7 2 10 6 9 9-6-1-11 2-12 6 7 0 12 2 14 6-4 2-6 6-5 10 13-5 28-2 37 2Z' fill='#f4a6b8'/>` +
    `<path d='M40 12c6 8 12 16 16 26M30 24c8 4 16 10 22 18M26 38c8 2 16 6 22 10' stroke='#fbd3dd' stroke-width='1.6' fill='none' stroke-linecap='round'/>` +
    // cuerpo, cabeza y rizos (una sola silueta)
    `<path d='M84 22c-10 0-17 8-16 18 0 4 2 8 4 10-8 4-14 12-14 22 0 8 4 14 10 18-6 6-14 10-22 10 4 6 14 6 22 2 4-2 8-6 10-10 4 2 8 2 12 0 2 6 6 10 12 12 6 2 12 0 14-4-6 0-12-4-14-10 6-4 10-12 10-20 0-8-4-14-10-18 4-4 6-8 6-14 0-9-7-16-16-16Z' fill='#f08aa3'/>` +
    `<path d='M70 30c-2-8 4-14 10-14 2-4 8-6 12-2 6-2 12 4 10 10 4 2 4 8 0 10-4-6-10-4-12-8-4 4-10 2-12-2-2 4-6 6-8 6Z' fill='#e9718f'/>` +
    `<circle cx='90' cy='38' r='1.8' fill='#c24d6c'/><path d='M86 45q4 3 8 0' stroke='#c24d6c' stroke-width='1.6' fill='none' stroke-linecap='round'/>` +
    `<path d='M74 70c6 4 16 4 22 0' stroke='#fbd3dd' stroke-width='3' stroke-linecap='round'/>` +
    // brazo, arco y flecha
    `<path d='M96 58c8-2 14-2 18 0' stroke='#f08aa3' stroke-width='7' stroke-linecap='round'/>` +
    `<path d='M116 34c14 12 14 38 0 50' stroke='#e9718f' stroke-width='4' fill='none' stroke-linecap='round'/><path d='M116 34V84' stroke='#f6c1cf' stroke-width='1.2'/>` +
    `<path d='M98 59H146' stroke='#e9718f' stroke-width='2.6' stroke-linecap='round'/><path d='M148 59l-9-5v10Z' fill='#e9718f'/><path d='M101 59l-6-5M101 59l-6 5' stroke='#e9718f' stroke-width='2.6' stroke-linecap='round'/>`,
);

/* ---------------------------------------------------------------- Pastel en forma de corazón */
export const pastelCorazon = svg(
  "0 0 120 124",
  `<ellipse cx='60' cy='118' rx='46' ry='5' fill='#000' opacity='.12'/>` +
    // costado
    `<path d='M60 100C24 84 8 62 10 46v18c-2 16 14 38 50 54 36-16 52-38 50-54V46c2 16-14 38-50 54Z' fill='#c2185b' stroke='${INK}' stroke-width='2.4'/>` +
    `<path d='M12 60c4 14 20 30 48 42 28-12 44-28 48-42' stroke='#fff' stroke-width='3' stroke-dasharray='2 6' stroke-linecap='round' fill='none'/>` +
    // cubierta
    `<path d='M60 86C26 70 10 52 10 36 10 22 22 12 36 12c10 0 18 6 24 14 6-8 14-14 24-14 14 0 26 10 26 24 0 16-16 34-50 50Z' fill='#f06292' stroke='${INK}' stroke-width='2.6'/>` +
    `<path d='M60 78C32 64 18 50 18 37c0-10 8-17 18-17 9 0 16 6 24 16 8-10 15-16 24-16 10 0 18 7 18 17 0 13-14 27-42 41Z' fill='#f8bbd0'/>` +
    // betún de puntitos
    Array.from({ length: 22 }, (_, i) => {
      const t = i / 21;
      const a = Math.PI * 2 * t;
      const x = 60 + 46 * Math.sin(a) * (1 - 0.2 * Math.abs(Math.cos(a)));
      const y = 46 - 30 * Math.cos(a) + 10 * Math.abs(Math.sin(a));
      return `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='3' fill='#fff' stroke='#f48fb1'/>`;
    }).join("") +
    `<path d='M60 58c-8-5-8-11-4-12 2-.6 3 .6 4 2 1-1.4 2-2.6 4-2 4 1 4 7-4 12Z' fill='#e53950' stroke='${INK}' stroke-width='1.4'/>` +
    `<circle cx='44' cy='36' r='3' fill='#fff' opacity='.8'/><circle cx='78' cy='34' r='2.4' fill='#fff' opacity='.8'/>` +
    [[40, 48, "#ffd54f"], [80, 48, "#81d4fa"], [52, 30, "#fff"], [70, 30, "#ffd54f"]].map(([x, y, c]) => `<rect x='${x}' y='${y}' width='6' height='2.4' rx='1.2' fill='${c}' transform='rotate(${(x as number) * 3} ${x} ${y})'/>`).join(""),
);

/* ---------------------------------------------------------------- Rosca de reyes */
export const roscaDeluxe = svg(
  "0 0 140 100",
  `<ellipse cx='70' cy='86' rx='62' ry='10' fill='#000' opacity='.12'/>` +
    `<path d='M70 14C34 14 8 34 8 54s26 34 62 34 62-14 62-34-26-40-62-40Zm0 24c18 0 30 6 30 14s-12 12-30 12-30-4-30-12 12-14 30-14Z' fill='#e0974a' stroke='${INK}' stroke-width='3' fill-rule='evenodd'/>` +
    `<path d='M20 44c8-14 28-22 50-22s42 8 50 22' stroke='#f4c27a' stroke-width='6' fill='none' stroke-linecap='round' opacity='.7'/>` +
    [[24, 40, "#c62828", -40], [46, 26, "#2e7d32", -15], [76, 22, "#fbc02d", 5], [104, 30, "#c62828", 30], [118, 52, "#2e7d32", 70], [100, 74, "#fbc02d", 150], [66, 80, "#c62828", 180], [34, 72, "#2e7d32", 210]]
      .map(([x, y, c, r]) => `<rect x='${(x as number) - 9}' y='${(y as number) - 3.5}' width='18' height='7' rx='3.5' fill='${c}' stroke='${INK}' stroke-width='1.4' transform='rotate(${r} ${x} ${y})'/>`)
      .join("") +
    Array.from({ length: 30 }, (_, i) => `<circle cx='${(16 + ((i * 37) % 108)).toFixed(0)}' cy='${(30 + ((i * 23) % 50)).toFixed(0)}' r='1.3' fill='#fff8e8'/>`).join(""),
);

/* ---------------------------------------------------------------- Animales de los Reyes Magos */
const legs = (xs: number[], y: number, h: number, c: string) => xs.map((x) => `<rect x='${x}' y='${y}' width='9' height='${h}' rx='4' fill='${c}' stroke='${INK}' stroke-width='2'/>`).join("");
export const camello = svg(
  "0 0 140 120",
  legs([34, 48, 82, 96], 70, 40, "#c8935a") +
    `<path d='M28 74c-4-26 10-46 26-46 10 0 12 12 18 12s10-16 24-16 22 20 18 50c-4 8-82 8-86 0Z' fill='#d9a467' stroke='${INK}' stroke-width='2.6'/>` +
    `<path d='M110 60c8-6 10-22 12-34 2-8 12-10 16-4 2 4-2 6-6 8l-4 30c-2 6-10 8-18 0Z' fill='#d9a467' stroke='${INK}' stroke-width='2.6'/>` +
    `<circle cx='130' cy='24' r='1.8' fill='${INK}'/>` +
    `<path d='M40 54h62v18H40Z' fill='#7b2d8e' stroke='${INK}' stroke-width='2'/><path d='M40 72l6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6' stroke='#fbc02d' stroke-width='3' fill='none'/>` +
    `<circle cx='71' cy='63' r='4' fill='#fbc02d'/><path d='M24 74c-6 4-8 12-4 16' stroke='${INK}' stroke-width='2.4' fill='none'/>`,
);
export const elefante = svg(
  "0 0 140 120",
  legs([30, 46, 80, 96], 74, 36, "#9aa5b1") +
    `<path d='M22 74c0-28 18-46 50-46s46 18 46 40c0 10-6 14-12 14H32c-6 0-10-2-10-8Z' fill='#aeb8c2' stroke='${INK}' stroke-width='2.6'/>` +
    `<path d='M104 40c18-4 30 8 28 26-1 12-2 26 4 34 2 4-6 6-8 2-8-10-8-22-10-30' fill='#aeb8c2' stroke='${INK}' stroke-width='2.6'/>` +
    `<path d='M92 36c-10 0-18 10-16 22 2 10 12 14 22 10' fill='#c4ccd5' stroke='${INK}' stroke-width='2.4'/>` +
    `<circle cx='114' cy='46' r='2' fill='${INK}'/><path d='M120 60c4 0 6 2 6 4' stroke='#fff' stroke-width='3' stroke-linecap='round'/>` +
    `<path d='M44 40h44l-4 30H48Z' fill='#c62828' stroke='${INK}' stroke-width='2'/><path d='M48 70l4 6 4-6 4 6 4-6 4 6 4-6 4 6 4-6 4 6' stroke='#fbc02d' stroke-width='3' fill='none'/>` +
    `<path d='M100 30l6-8 6 8-6 6Z' fill='#fbc02d' stroke='${INK}' stroke-width='1.6'/><circle cx='66' cy='54' r='5' fill='#fbc02d'/>`,
);
export const caballo = svg(
  "0 0 140 120",
  legs([30, 44, 82, 96], 70, 40, "#e9e4dc") +
    `<path d='M24 72c-2-20 10-34 30-34h40c12 0 18 10 18 22 0 8-4 14-10 16H34c-6 0-10-2-10-4Z' fill='#f5f1ea' stroke='${INK}' stroke-width='2.6'/>` +
    `<path d='M94 44c4-14 10-26 22-30 8-2 16 4 18 12 2 6-2 10-8 10-6 0-10 4-12 10l-6 14Z' fill='#f5f1ea' stroke='${INK}' stroke-width='2.6'/>` +
    `<path d='M108 16c-8 2-14 12-18 26 4-2 8-2 10 2 2-8 6-14 10-18 2 4 4 6 8 6-2-6-4-12-10-16Z' fill='#8d5a2b' stroke='${INK}' stroke-width='1.6'/>` +
    `<circle cx='124' cy='24' r='2' fill='${INK}'/><path d='M18 70c-8 4-10 16-4 22 0-8 4-14 10-16' fill='#8d5a2b' stroke='${INK}' stroke-width='1.8'/>` +
    `<path d='M44 46h44v22H44Z' fill='#1565c0' stroke='${INK}' stroke-width='2'/><path d='M44 68l6 6 6-6 6 6 6-6 6 6 6-6 6 6' stroke='#fbc02d' stroke-width='3' fill='none'/>` +
    `<path d='M48 52h36' stroke='#fbc02d' stroke-width='2.4'/>`,
);

/* ---------------------------------------------------------------- Águila real mexicana (toda café, sobre el nopal) */
export const aguila = svg(
  "0 0 140 116",
  // alas abiertas con plumas largas
  `<path d='M68 52C56 34 38 22 20 18c-6-1-12 0-16 3 6 1 10 3 12 6-6 0-11 2-13 6 6 0 10 2 12 4-5 1-9 4-10 8 6-1 11 0 14 2-3 2-5 6-4 10 8-4 16-5 22-3-2 3-2 7 0 10 8-6 18-7 26-4Z' fill='#6b3f1d' stroke='#3b2010' stroke-width='2'/>` +
    `<path d='M72 52c12-18 30-30 48-34 6-1 12 0 16 3-6 1-10 3-12 6 6 0 11 2 13 6-6 0-10 2-12 4 5 1 9 4 10 8-6-1-11 0-14 2 3 2 5 6 4 10-8-4-16-5-22-3 2 3 2 7 0 10-8-6-18-7-26-4Z' fill='#6b3f1d' stroke='#3b2010' stroke-width='2'/>` +
    `<path d='M14 24c14 2 30 10 44 24M10 36c14 0 30 6 42 16M14 48c12-1 24 2 34 8M126 24c-14 2-30 10-44 24M130 36c-14 0-30 6-42 16M126 48c-12-1-24 2-34 8' stroke='#9a6233' stroke-width='2' fill='none'/>` +
    // cuerpo
    `<path d='M60 50c-2 18 2 34 10 44 8-10 12-26 10-44-6-6-14-6-20 0Z' fill='#7a4a22' stroke='#3b2010' stroke-width='2'/>` +
    `<path d='M63 62l7 5 7-5M63 72l7 5 7-5M64 82l6 4 6-4' stroke='#4e2c12' stroke-width='1.6' fill='none'/>` +
    // cabeza café con nuca dorada (águila real)
    `<path d='M60 46c-2-12 4-20 12-20 8 0 14 6 14 14 0 4-2 8-6 10l-12 2Z' fill='#5d3416' stroke='#3b2010' stroke-width='2'/>` +
    `<path d='M64 30c4-3 10-3 14 0 3 2 4 6 3 9-4-4-10-6-17-9Z' fill='#c08a3e'/>` +
    `<path d='M84 36l10 4-9 5Z' fill='#e0a020' stroke='#3b2010' stroke-width='1.4'/><circle cx='78' cy='36' r='1.8' fill='#f9d36b'/><circle cx='78' cy='36' r='.8' fill='#1a0d05'/>` +
    // serpiente en el pico
    `<path d='M92 42c8 4 10 10 4 14s-14 0-12 6 12 6 18 2' stroke='#2e7d32' stroke-width='4' fill='none' stroke-linecap='round'/><circle cx='103' cy='63' r='2.4' fill='#2e7d32'/>` +
    // garras y nopal con tunas
    `<path d='M64 92l-3 6M70 94v6M76 92l3 6' stroke='#e0a020' stroke-width='2.4' stroke-linecap='round'/>` +
    `<ellipse cx='70' cy='104' rx='16' ry='9' fill='#43a047' stroke='#1b5e20' stroke-width='2'/><ellipse cx='51' cy='98' rx='9' ry='6' fill='#66bb6a' stroke='#1b5e20' stroke-width='1.8'/><ellipse cx='89' cy='98' rx='9' ry='6' fill='#66bb6a' stroke='#1b5e20' stroke-width='1.8'/>` +
    `<circle cx='62' cy='100' r='2.2' fill='#e53935'/><circle cx='80' cy='98' r='2.2' fill='#e53935'/>`,
);

/* ======================================================================
   Composiciones por temporada
   ====================================================================== */

const DELUXE = { calaveraDeluxe, cempasuchilSolo, cempasuchilHojas, velaDeluxe, panDeluxe, cupido, pastelCorazon, roscaDeluxe, camello, elefante, caballo, aguila } as const;
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
export const bigRatio = (n: BigArt) =>
  ({ velaDeluxe: 140 / 80, panDeluxe: 100 / 140, calaveraDeluxe: 136 / 128, cempasuchilHojas: 132 / 136, cupido: 120 / 150, pastelCorazon: 124 / 120, roscaDeluxe: 100 / 140, camello: 120 / 140, elefante: 120 / 140, caballo: 120 / 140, aguila: 116 / 140 })[n as string] ?? 1;

/**
 * Ramillete: [relleno de atrás, estrella, alto (vela, árbol…), relleno chico, frente]
 * Se acomoda en una esquina como en los diseños de referencia (flores atrás, calaverita al centro, vela y pan al frente).
 */
export const BOUQUET: Record<FestiveId, [BigArt, BigArt, BigArt, BigArt, BigArt]> = {
  muertos: ["cempasuchilHojas", "calaveraDeluxe", "velaDeluxe", "cempasuchilSolo", "panDeluxe"],
  halloween: ["dulce", "calabaza", "fantasma", "murcielago", "dulce"],
  navidad: ["esfera", "arbol", "baston", "esfera", "regaloRojo"],
  anonuevo: ["estrellaPlata", "copa", "fuego", "estrellaOro", "estrellaOro"],
  reyes: ["estrellaOro", "roscaDeluxe", "camello", "corona", "elefante"],
  sanvalentin: ["rosaRoja", "pastelCorazon", "cupido", "corazonRojo", "carta"],
  primavera: ["tulipanAmarillo", "florAmarilla", "mariposa", "florAmarilla", "tulipanAmarillo"],
  nino: ["globoAzul", "globoRojo", "papalote", "rehileteNino", "paleta"],
  madres: ["rosaRosa", "tulipanRosa", "corazonRosa", "rosaRosa", "regaloRosa"],
  maestro: ["estrellaOro", "manzana", "lapiz", "estrellaOro", "libro"],
  padre: ["estrellaOro", "corbata", "taza", "estrellaOro", "bigote"],
  independencia: ["campana", "aguila", "chile", "rehileteMx", "campana"],
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
  independencia: { colors: ["#ffffff", "#7a4a22", "#c8102e", "#ffffff", "#7a4a22", "#c8102e"], motifs: ["estrella", "campana", "flor", "estrella", "campana", "rombo"] },
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

/* ======================================================================
   Fondos detrás del logo (como el arco de papel picado de Día de Muertos)
   ====================================================================== */
const bulbs = (pts: [number, number][], colors: string[], r = 5) =>
  pts.map(([x, y], i) => `<path d='M${x} ${y - r * 1.4}v${r * 0.6}' stroke='#3e2a12' stroke-width='2'/><ellipse cx='${x}' cy='${y}' rx='${r * 0.8}' ry='${r * 1.1}' fill='${colors[i % colors.length]}'/><ellipse cx='${x - r * 0.25}' cy='${y - r * 0.35}' rx='${r * 0.22}' ry='${r * 0.35}' fill='#fff' opacity='.7'/>`).join("");
const arcPts = (cx: number, cy: number, r: number, from: number, to: number, n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
    return [+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1)];
  });
const LIGHTS = ["#e53935", "#fbc02d", "#43a047", "#1e88e5", "#8e24aa", "#fb8c00"];

/** Fondo del logo: `mode` arch = arco arriba del remolino; full = figura detrás de todo el logo */
export function logoBackdrop(id: FestiveId): { uri: string; mode: "arch" | "full" } {
  if (id === "muertos") return { uri: logoArchUri(id), mode: "arch" };
  const full = (body: string, defs = "") => ({ uri: dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`), mode: "full" as const });
  const arch = (body: string) => ({ uri: dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 104'>${body}</svg>`), mode: "arch" as const });
  const rays = (n: number, c1: string, c2: string, r = 100) =>
    Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n;
      const b = (Math.PI * 2 * (i + 0.5)) / n;
      return `<path d='M100 100L${(100 + r * Math.cos(a)).toFixed(1)} ${(100 + r * Math.sin(a)).toFixed(1)}L${(100 + r * Math.cos(b)).toFixed(1)} ${(100 + r * Math.sin(b)).toFixed(1)}Z' fill='${i % 2 ? c1 : c2}'/>`;
    }).join("");
  switch (id) {
    case "navidad": {
      const pine = arcPts(100, 100, 88, 185, 355, 34)
        .map(([x, y], i) => `<path d='M${x} ${y}l${i % 2 ? -9 : 9} -7M${x} ${y}l${i % 2 ? 7 : -7} 8M${x} ${y}l0 -10' stroke='${i % 3 ? "#2e7d32" : "#1b5e20"}' stroke-width='5' stroke-linecap='round'/>`)
        .join("");
      return arch(
        `<path d='M12 100a88 88 0 0 1 176 0' stroke='#1b5e20' stroke-width='16' fill='none'/>${pine}` +
          bulbs(arcPts(100, 100, 88, 190, 350, 13), LIGHTS, 5) +
          `<path d='M100 10c-10-10-26-8-24 2 2 8 16 8 24 0 8 8 22 8 24 0 2-10-14-12-24-2Z' fill='#d32f2f' stroke='#7f0d0d' stroke-width='2'/><path d='M100 12l-10 22M100 12l10 22' stroke='#d32f2f' stroke-width='6' stroke-linecap='round'/><circle cx='100' cy='11' r='5' fill='#b71c1c'/>`,
      );
    }
    case "anonuevo":
    case "reyes": {
      const gold = id === "anonuevo";
      return full(
        `<circle cx='100' cy='100' r='98' fill='url(#g)'/>${rays(36, "#f3d27a", "#fff3c4", 98).replace(/<path/g, "<path opacity='.35'")}` +
          (gold
            ? `<g transform='translate(150 40)'><circle r='22' fill='#fffaf0' stroke='#c9a646' stroke-width='4'/><path d='M0 0V-14M0 0L10 4' stroke='#3a2c14' stroke-width='3' stroke-linecap='round'/>${Array.from({ length: 12 }, (_, i) => `<circle cx='${(17 * Math.cos((i * Math.PI) / 6)).toFixed(1)}' cy='${(17 * Math.sin((i * Math.PI) / 6)).toFixed(1)}' r='1.4' fill='#3a2c14'/>`).join("")}</g>`
            : `<path d='M58 46l-6-30 22 16 26-28 26 28 22-16-6 30Z' fill='#f3c742' stroke='#a87b10' stroke-width='3'/><circle cx='100' cy='30' r='5' fill='#c62828'/><circle cx='74' cy='36' r='4' fill='#1565c0'/><circle cx='126' cy='36' r='4' fill='#2e7d32'/>`),
        `<radialGradient id='g'><stop offset='0' stop-color='#fff8e1'/><stop offset='.6' stop-color='#f3d27a' stop-opacity='.55'/><stop offset='1' stop-color='#f3d27a' stop-opacity='0'/></radialGradient>`,
      );
    }
    case "halloween":
      return full(
        `<circle cx='100' cy='96' r='86' fill='url(#m)'/><circle cx='70' cy='70' r='12' fill='#e8dcae' opacity='.6'/><circle cx='130' cy='120' r='16' fill='#e8dcae' opacity='.5'/><circle cx='120' cy='58' r='7' fill='#e8dcae' opacity='.6'/>` +
          [[30, 30, 1], [170, 40, 0.8], [160, 170, 0.7]].map(([x, y, k]) => `<path transform='translate(${x} ${y}) scale(${k})' d='M0 0c-4-6-14-8-22-2 4 0 6 4 6 8 4-4 8-4 10 0 2-2 4-4 6-4 2 0 4 2 6 4 2-4 6-4 10 0 0-4 2-8 6-8-8-6-18-4-22 2Z' fill='#1a0d26'/>`).join(""),
        `<radialGradient id='m'><stop offset='0' stop-color='#fffbe0'/><stop offset='.75' stop-color='#fdf1b8'/><stop offset='1' stop-color='#fdf1b8' stop-opacity='0'/></radialGradient>`,
      );
    case "sanvalentin":
    case "madres": {
      const c = id === "madres" ? "#f8bbd0" : "#ffc1d1";
      const d = id === "madres" ? "#ec407a" : "#e8456b";
      const flowers = id === "madres" ? arcPts(100, 104, 92, 200, 340, 8).map(([x, y], i) => flower(x, y, 9, i % 2 ? "#fff" : "#f48fb1", "#ffd54f", "#ad1457")).join("") : "";
      return full(
        `<path d='M100 186C34 140 6 104 10 66 14 34 40 16 66 18c16 1 28 10 34 24 6-14 18-23 34-24 26-2 52 16 56 48 4 38-24 74-90 120Z' fill='${c}' stroke='${d}' stroke-width='4' stroke-dasharray='1 7' stroke-linecap='round'/>` +
          `<path d='M100 174C42 132 18 100 22 68 26 42 46 28 68 30c14 1 24 9 32 22 8-13 18-21 32-22 22-2 42 12 46 38 4 32-20 64-78 106Z' fill='#fff' opacity='.75'/>` +
          flowers,
      );
    }
    case "primavera":
      return full(`<circle cx='100' cy='100' r='96' fill='url(#s)'/>${rays(24, "#ffe066", "#fff3b0", 96).replace(/<path/g, "<path opacity='.45'")}`, `<radialGradient id='s'><stop offset='0' stop-color='#fffef0'/><stop offset='.65' stop-color='#ffe066' stop-opacity='.6'/><stop offset='1' stop-color='#ffe066' stop-opacity='0'/></radialGradient>`);
    case "nino":
      return arch(
        arcPts(100, 104, 86, 190, 350, 9)
          .map(([x, y], i) => `<path d='M${x} ${y + 12}q4 10-2 20' stroke='#555' stroke-width='1' fill='none'/><ellipse cx='${x}' cy='${y}' rx='12' ry='14' fill='${["#e53935", "#fbc02d", "#43a047", "#1e88e5", "#8e24aa", "#fb8c00"][i % 6]}'/><ellipse cx='${x - 4}' cy='${y - 5}' rx='3' ry='4' fill='#fff' opacity='.6'/>`)
          .join(""),
      );
    case "maestro":
      return full(`<rect x='18' y='26' width='164' height='120' rx='8' fill='#2f5a3f' stroke='#a1683a' stroke-width='8' opacity='.85'/><text x='34' y='60' font-size='18' fill='#fff' fill-opacity='.4' font-family='serif'>a b c  1 2 3</text><circle cx='160' cy='150' r='16' fill='#e53935'/><path d='M160 134q2-8 8-10' stroke='#5d4037' stroke-width='3'/>`);
    case "padre":
      return full(`<circle cx='100' cy='100' r='96' fill='url(#n)'/>${rays(28, "#e0b15c", "#fff", 96).replace(/<path/g, "<path opacity='.18'")}`, `<radialGradient id='n'><stop offset='0' stop-color='#ffffff'/><stop offset='.6' stop-color='#cfe0f2' stop-opacity='.7'/><stop offset='1' stop-color='#cfe0f2' stop-opacity='0'/></radialGradient>`);
    case "independencia":
      return arch(
        `<path d='M100 100C76 64 40 50 4 58c14 6 18 12 16 18 12-4 18 0 18 6 12-4 18 0 18 6 12 0 22 2 30 10Z' fill='#7a4a22' stroke='#3b2412' stroke-width='3'/>` +
          `<path d='M100 100c24-36 60-50 96-42-14 6-18 12-16 18-12-4-18 0-18 6-12-4-18 0-18 6-12 0-22 2-30 10Z' fill='#7a4a22' stroke='#3b2412' stroke-width='3'/>` +
          `<path d='M18 62c16 0 34 6 52 20M182 62c-16 0-34 6-52 20M30 74c14 0 26 6 40 16M170 74c-14 0-26 6-40 16' stroke='#a8743f' stroke-width='3' fill='none'/>`,
      );
    default:
      return full(`<circle cx='100' cy='100' r='96' fill='#fff' opacity='.6'/>`);
  }
}

/** Marco de focos de colores (para border-image de tarjetas navideñas) */
export function lightsBorderUri(frame = "#8d5a2b") {
  const b = (x: number, y: number, c: string, rot = 0) => `<g transform='translate(${x} ${y}) rotate(${rot})'><rect x='-2' y='-9' width='4' height='4' fill='#4a3215'/><ellipse cx='0' cy='0' rx='4' ry='5.5' fill='${c}'/><ellipse cx='-1.2' cy='-1.8' rx='1.1' ry='1.7' fill='#fff' opacity='.7'/></g>`;
  const L = LIGHTS;
  const body =
    `<rect width='84' height='84' fill='${frame}'/><rect x='5' y='5' width='74' height='74' fill='none' stroke='#c48a4a' stroke-width='2'/>` +
    `<path d='M0 8q7 4 14 0t14 0 14 0 14 0 14 0 14 0M0 76q7 4 14 0t14 0 14 0 14 0 14 0 14 0M8 0q4 7 0 14t0 14 0 14 0 14 0 14 0 14M76 0q4 7 0 14t0 14 0 14 0 14 0 14 0 14' stroke='#2e2410' stroke-width='1.2' fill='none'/>` +
    [21, 42, 63].map((x, i) => b(x, 10, L[i]) + b(x, 74, L[i + 3], 180) + b(10, x, L[(i + 1) % 6], -90) + b(74, x, L[(i + 4) % 6], 90)).join("") +
    b(9, 9, L[5], -45) + b(75, 9, L[2], 45) + b(9, 75, L[1], -135) + b(75, 75, L[4], 135);
  return dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84'>${body}</svg>`);
}

/** Tirita decorativa de la temporada (focos, corazones, estrellas, papel picado…) para la orilla de tarjetas */
export function stripUri(id: FestiveId): { uri: string; w: number; h: number } {
  const wrapS = (w: number, h: number, body: string) => ({ uri: dataUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${body}</svg>`), w, h });
  switch (id) {
    case "navidad":
      return wrapS(96, 16, `<path d='M0 3Q12 9 24 3T48 3T72 3T96 3' stroke='#2e2410' stroke-width='1.1' fill='none'/>` + LIGHTS.slice(0, 4).map((c, i) => `<rect x='${11 + i * 24}' y='4' width='3' height='3' fill='#4a3215'/><ellipse cx='${12.5 + i * 24}' cy='10.5' rx='3.4' ry='4.6' fill='${c}'/><ellipse cx='${11.6 + i * 24}' cy='9' rx='.9' ry='1.4' fill='#fff' opacity='.7'/>`).join(""));
    case "sanvalentin":
    case "madres":
      return wrapS(60, 16, `<path d='M0 3Q15 8 30 3T60 3' stroke='#f48fb1' stroke-width='1' fill='none'/>` + [[10, "#e53950"], [30, "#f48fb1"], [50, "#d81b60"]].map(([x, c]) => `<path d='M${x} 15c-7-4-7-9-3.5-9.5 1.6-.3 2.8.6 3.5 1.8.7-1.2 1.9-2.1 3.5-1.8 3.5.5 3.5 5.5-3.5 9.5Z' fill='${c}'/>`).join(""));
    case "anonuevo":
    case "reyes":
    case "padre":
      return wrapS(48, 14, [[8, 7, 5, "#d4af37"], [24, 6, 3, "#f3d27a"], [40, 7, 4.5, "#c9a646"]].map(([x, y, r, c]) => `<path d='M${x} ${(y as number) - (r as number)}L${(x as number) + (r as number) * 0.3} ${(y as number) - (r as number) * 0.3} ${(x as number) + (r as number)} ${y} ${(x as number) + (r as number) * 0.3} ${(y as number) + (r as number) * 0.3} ${x} ${(y as number) + (r as number)} ${(x as number) - (r as number) * 0.3} ${(y as number) + (r as number) * 0.3} ${(x as number) - (r as number)} ${y} ${(x as number) - (r as number) * 0.3} ${(y as number) - (r as number) * 0.3}Z' fill='${c}'/>`).join(""));
    case "halloween":
      return wrapS(64, 16, `<path d='M0 3Q16 9 32 3T64 3' stroke='#4a148c' stroke-width='1' fill='none'/><ellipse cx='16' cy='11' rx='5.5' ry='4.5' fill='#ef6c00'/><path d='M16 6.5v-2' stroke='#2e7d32' stroke-width='1.6'/><path d='M48 9c-1-2-4-3-7-1 1.5 0 2 1.5 2 3 1-1 2.5-1 3 0 .5-.6 1-1 2-1s1.5.4 2 1c.5-1 2-1 3 0 0-1.5.5-3 2-3-3-2-6-1-7 1Z' fill='#1a0d26'/>`);
    case "primavera":
      return wrapS(40, 14, [10, 30].map((x, i) => [0, 72, 144, 216, 288].map((a) => `<ellipse cx='${x}' cy='3.5' rx='2.2' ry='3.6' fill='${i ? "#ffd54f" : "#fbc02d"}' transform='rotate(${a} ${x} 7)'/>`).join("") + `<circle cx='${x}' cy='7' r='1.8' fill='#f57f17'/>`).join(""));
    case "nino":
      return wrapS(54, 18, ["#e53935", "#1e88e5", "#fbc02d"].map((c, i) => `<ellipse cx='${9 + i * 18}' cy='7' rx='5' ry='6' fill='${c}'/><path d='M${9 + i * 18} 13q2 3 0 5' stroke='#666' stroke-width='.7' fill='none'/>`).join(""));
    case "maestro":
      return wrapS(48, 14, `<rect x='4' y='4' width='18' height='6' rx='1' fill='#fbc02d'/><path d='M22 4l5 3-5 3Z' fill='#f5d6a8'/><circle cx='38' cy='8' r='5' fill='#e53935'/><path d='M38 3q1-2 3-2' stroke='#5d4037' stroke-width='1.2'/>`);
    default: {
      const t = picadoTile(id);
      return { uri: t.image, w: Math.round(t.width * 0.5), h: Math.round(t.height * 0.5) };
    }
  }
}
