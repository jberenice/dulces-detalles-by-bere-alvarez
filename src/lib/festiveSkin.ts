/**
 * "Piel" de temporada para la portada: fondos de cada sección, estilo de las tarjetas, colores de texto
 * (claros sobre fondos oscuros) y glaseado de los planes. Se convierte en una hoja de estilos que solo se
 * inyecta mientras la temporada está activa (ver <FestiveSkin>).
 *
 * Las secciones se marcan con data-fs="header|hero|features|video|how|pricing|faq|social|footer".
 */
import type { FestiveId } from "./festive";
import { THEME_ART } from "./festiveArt";
import { BOUQUET, bigUri, lightsBorderUri, stripUri, type BigArt } from "./festiveArt2";

export type CardSkin = "mx" | "plaid" | "lilac" | "gold" | "wood" | "woodCream" | "parchment" | "lace" | "white" | "glass" | "cream" | "board" | "lights" | "lightsCream" | "redline" | "cupid";
type Tone = {
  /** fondo (CSS background) */
  bg: string;
  /** texto claro (fondo oscuro) */
  dark: boolean;
  card?: CardSkin;
  /** color de la palabra resaltada del título y de los subtítulos manuscritos */
  accent?: string;
};
export type Skin = {
  header: Tone;
  hero: Tone;
  features: Tone;
  video: Tone;
  how: Tone;
  pricing: Tone;
  faq: Tone;
  social: Tone;
  footer: Tone;
  /** glaseado de cada plan: básico, profesional, premium */
  glaze: [string, string, string];
  /** adorno sobre el glaseado */
  topping: "snow" | "gold" | "hearts" | "slime" | "picado" | "sprinkles" | "flowers" | "reyes" | "mexico" | "ties";
  /** aro alrededor del logo */
  ring: string;
  /** color de las tarjetas del panel de bienvenida (texto claro u oscuro) */
  ink: { dark: string; muted: string };
  /** ilustraciones que se asoman en las orillas (cupidos, roscas, águila…) */
  edge?: BigArt[];
  /** fondo del menú lateral del panel (por defecto el del pie de página) */
  side?: string;
  /** el contenido del pie de página va sobre una placa clara */
  plaque?: boolean;
  /** fondo de cada plan (básico, profesional, premium) y si su texto va claro */
  plans?: { bg: [string, string, string]; dark: [boolean, boolean, boolean] };
};

const enc = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

/* ------------------------------------------------------------------ Patrones de fondo */
const star = (x: number, y: number, r: number, c: string, o = 1) =>
  `<path d='M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28} ${x + r} ${y} ${x + r * 0.28} ${y + r * 0.28} ${x} ${y + r} ${x - r * 0.28} ${y + r * 0.28} ${x - r} ${y} ${x - r * 0.28} ${y - r * 0.28}Z' fill='${c}' opacity='${o}'/>`;
const flake = (x: number, y: number, r: number, o = 0.7) =>
  `<g stroke='#fff' stroke-width='1.4' stroke-linecap='round' opacity='${o}'>${[0, 60, 120]
    .map((a) => `<path d='M${x} ${y - r}V${y + r}M${x - r * 0.3} ${y - r * 0.7}L${x} ${y - r * 0.45} ${x + r * 0.3} ${y - r * 0.7}M${x - r * 0.3} ${y + r * 0.7}L${x} ${y + r * 0.45} ${x + r * 0.3} ${y + r * 0.7}' transform='rotate(${a} ${x} ${y})'/>`)
    .join("")}</g>`;
const heart = (x: number, y: number, s: number, c: string, o = 1) =>
  `<path d='M${x} ${y + s * 0.9}C${x - s * 1.4} ${y} ${x - s} ${y - s} ${x} ${y - s * 0.35}C${x + s} ${y - s} ${x + s * 1.4} ${y} ${x} ${y + s * 0.9}Z' fill='${c}' opacity='${o}'/>`;
const bat = (x: number, y: number, s: number, c = "#120818", o = 0.75) =>
  `<path d='M${x} ${y}c${-s * 0.3} ${-s * 0.5} ${-s * 1.3} ${-s * 0.6} ${-s * 2} ${-s * 0.1} ${s * 0.4} 0 ${s * 0.6} ${s * 0.3} ${s * 0.6} ${s * 0.6} ${s * 0.3} ${-s * 0.3} ${s * 0.7} ${-s * 0.2} ${s} ${s * 0.1} ${s * 0.1} ${-s * 0.3} ${s * 0.3} ${-s * 0.4} ${s * 0.4} ${-s * 0.6} ${s * 0.1} ${s * 0.2} ${s * 0.3} ${s * 0.2} ${s * 0.4} 0 ${s * 0.1} ${s * 0.2} ${s * 0.3} ${s * 0.3} ${s * 0.4} ${s * 0.6} ${s * 0.3} ${-s * 0.3} ${s * 0.7} ${-s * 0.4} ${s} ${-s * 0.1} 0 ${-s * 0.3} ${s * 0.2} ${-s * 0.6} ${s * 0.6} ${-s * 0.6} ${-s * 0.7} ${-s * 0.5} ${-s * 1.7} ${-s * 0.4} ${-s * 2} ${s * 0.1}Z' fill='${c}' opacity='${o}'/>`;
const dot = (x: number, y: number, r: number, c: string, o = 1) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${c}' opacity='${o}'/>`;
const conf = (x: number, y: number, c: string, rot: number, o = 0.8) => `<rect x='${x}' y='${y}' width='8' height='3.4' rx='1.4' fill='${c}' opacity='${o}' transform='rotate(${rot} ${x} ${y})'/>`;
const tile = (body: string, size = 180) => enc(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>${body}</svg>`);

const P = {
  goldStars: tile(star(30, 40, 7, "#f3d27a", 0.9) + star(130, 25, 4, "#fff3c4", 0.8) + star(95, 110, 9, "#e9c46a", 0.85) + star(20, 150, 4, "#fff", 0.7) + star(160, 140, 5, "#f3d27a", 0.8) + dot(70, 70, 1.6, "#fff", 0.8) + dot(150, 80, 1.3, "#f3d27a") + dot(50, 120, 1.2, "#fff") + conf(110, 160, "#e9c46a", 30) + conf(60, 20, "#c0c0c0", -40)),
  snow: tile(flake(30, 35, 9, 0.55) + flake(120, 60, 6, 0.45) + flake(80, 130, 11, 0.4) + flake(160, 160, 5, 0.5) + dot(60, 80, 2, "#fff", 0.6) + dot(150, 20, 1.6, "#fff", 0.6) + dot(20, 110, 1.8, "#fff", 0.5) + dot(110, 100, 1.4, "#fff", 0.6)),
  snowSoft: tile(flake(30, 35, 9, 0.9) + flake(120, 60, 6, 0.8) + flake(80, 130, 11, 0.7) + dot(60, 80, 2.4, "#fff", 0.9) + dot(150, 20, 2, "#fff", 0.9) + dot(20, 110, 2, "#fff", 0.8)),
  bats: tile(bat(40, 40, 9) + bat(130, 90, 6) + bat(70, 150, 7, "#120818", 0.6) + star(150, 30, 3, "#fff3c4", 0.7) + dot(20, 100, 1.2, "#fff", 0.6) + dot(110, 20, 1.4, "#fff", 0.5) + dot(160, 160, 1.2, "#fff", 0.5)),
  hearts: tile(heart(30, 40, 8, "#ff4f7b", 0.55) + heart(130, 30, 5, "#fff", 0.7) + heart(100, 120, 10, "#e8456b", 0.45) + heart(20, 150, 5, "#ff8fab", 0.6) + heart(160, 150, 6, "#fff", 0.6) + dot(70, 80, 2, "#fff", 0.7) + dot(150, 90, 1.6, "#ffd6e0")),
  heartsLight: tile(heart(30, 40, 7, "#f48fb1", 0.35) + heart(130, 30, 5, "#e91e63", 0.2) + heart(100, 120, 9, "#f06292", 0.25) + heart(20, 150, 5, "#f8bbd0", 0.5) + dot(70, 80, 2, "#f48fb1", 0.4)),
  confetti: tile(["#ffca28", "#26c6da", "#ec407a", "#ab47bc", "#66bb6a", "#ff7043"].map((c, i) => conf((i * 61) % 170 + 5, (i * 47) % 170 + 5, c, i * 37, 0.75)).join("") + star(140, 40, 5, "#fff", 0.8) + star(40, 130, 4, "#fff3c4", 0.8) + dot(100, 90, 2, "#fff", 0.7)),
  confettiLight: tile(["#ffca28", "#26c6da", "#ec407a", "#ab47bc", "#66bb6a", "#ff7043"].map((c, i) => conf((i * 61) % 170 + 5, (i * 47) % 170 + 5, c, i * 37, 0.45)).join("") + dot(100, 90, 2, "#ffca28", 0.4)),
  flowers: tile([[30, 40], [130, 70], [80, 140], [160, 160]].map(([x, y], i) => [0, 72, 144, 216, 288].map((a) => `<ellipse cx='${x}' cy='${y - 6}' rx='3.4' ry='6' fill='${i % 2 ? "#ffd54f" : "#fff8c4"}' opacity='.75' transform='rotate(${a} ${x} ${y})'/>`).join("") + dot(x, y, 2.6, "#f9a825", 0.9)).join("")),
  lilac: tile([[30, 40], [130, 70], [80, 140], [160, 160], [20, 110]].map(([x, y], i) => [0, 72, 144, 216, 288].map((a) => `<ellipse cx='${x}' cy='${y - 6}' rx='3.6' ry='6.4' fill='${["#f3d7ff", "#ffffff", "#f8bbd0"][i % 3]}' opacity='.5' transform='rotate(${a} ${x} ${y})'/>`).join("") + dot(x, y, 2.4, "#fff59d", 0.8)).join("") + `<path d='M110 120c-4-8-14-8-14-2s8 6 14 2Zm0 0c4-8 14-8 14-2s-8 6-14 2Z' fill='#fff' opacity='.35'/>`),
  lilacLight: tile([[30, 40], [130, 70], [80, 140], [160, 160]].map(([x, y], i) => [0, 72, 144, 216, 288].map((a) => `<ellipse cx='${x}' cy='${y - 5}' rx='3' ry='5.4' fill='${i % 2 ? "#ce93d8" : "#f48fb1"}' opacity='.28' transform='rotate(${a} ${x} ${y})'/>`).join("") + dot(x, y, 2, "#fbc02d", 0.4)).join("")),
  ties: tile(`<g opacity='.16' fill='#fff'><path d='M30 30h10l-2 4 5 14-8 4-8-4 5-14Z'/><path d='M110 60c4-6 10-6 14 0 4-6 10-6 14 0-4 5-10 5-14 0-4 5-10 5-14 0Z'/><path d='M70 130h10l-2 4 5 14-8 4-8-4 5-14Z'/><path d='M140 150c4-6 10-6 14 0 4-6 10-6 14 0-4 5-10 5-14 0-4 5-10 5-14 0Z'/></g>` + star(160, 30, 4, "#f1c27d", 0.5) + star(30, 160, 3, "#f1c27d", 0.5)),
  tiesLight: tile(`<g opacity='.12' fill='#1f4e79'><path d='M30 30h10l-2 4 5 14-8 4-8-4 5-14Z'/><path d='M110 60c4-6 10-6 14 0 4-6 10-6 14 0-4 5-10 5-14 0-4 5-10 5-14 0Z' fill='#5b3b22'/><path d='M70 130h10l-2 4 5 14-8 4-8-4 5-14Z'/><path d='M140 150c4-6 10-6 14 0 4-6 10-6 14 0-4 5-10 5-14 0-4 5-10 5-14 0Z' fill='#5b3b22'/></g>`),
  chalk: tile(star(30, 40, 6, "#fff", 0.25) + `<path d='M110 30h30M115 40h20' stroke='#fff' stroke-opacity='.18' stroke-width='2' stroke-linecap='round'/><text x='60' y='120' font-size='22' font-family='serif' fill='#fff' fill-opacity='.16'>a+b</text><text x='120' y='160' font-size='18' font-family='serif' fill='#fff' fill-opacity='.14'>ABC</text>` + dot(150, 100, 2, "#fff", 0.2)),
  navy: tile(star(30, 40, 5, "#e0b15c", 0.6) + star(130, 120, 4, "#fff", 0.5) + dot(80, 80, 1.6, "#fff", 0.5) + dot(160, 30, 1.4, "#e0b15c", 0.6) + `<path d='M20 150q10-10 20 0t20 0' stroke='#e0b15c' stroke-opacity='.3' fill='none' stroke-width='2'/>`),
  flag: tile(conf(30, 30, "#ffffff", 20, 0.6) + conf(120, 50, "#e53950", -30, 0.8) + conf(70, 120, "#ffffff", 60, 0.5) + conf(150, 150, "#d7a46a", 10, 0.7) + star(100, 20, 4, "#fff", 0.6) + star(30, 150, 5, "#ffd8a8", 0.6) + dot(160, 90, 2, "#fff", 0.6)),
  flagLight: tile(conf(30, 30, "#c8102e", 20, 0.35) + conf(120, 50, "#7a4a22", -30, 0.35) + conf(70, 120, "#c8102e", 60, 0.3) + conf(150, 150, "#7a4a22", 10, 0.3) + star(100, 20, 4, "#c8102e", 0.3) + star(30, 150, 5, "#7a4a22", 0.3)),
  marigold: tile(["#ff9800", "#e91e63", "#8e24aa", "#ffca28"].map((c, i) => `<ellipse cx='${(i * 53) % 160 + 10}' cy='${(i * 71) % 160 + 10}' rx='4' ry='7' fill='${c}' opacity='.55' transform='rotate(${i * 50} ${(i * 53) % 160 + 10} ${(i * 71) % 160 + 10})'/>`).join("") + star(140, 40, 5, "#fff", 0.8) + star(40, 140, 4, "#ffe082", 0.8) + dot(100, 100, 2, "#fff", 0.6)),
};

/** Ráfagas de fuegos artificiales (para el fondo del año nuevo) */
const fireworks = enc(
  `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='520'>${[
    [140, 120, 90, "#f3d27a"],
    [760, 110, 110, "#e9c46a"],
    [470, 60, 60, "#fff3c4"],
    [620, 300, 70, "#c0c0c0"],
  ]
    .map(([x, y, r, c]) =>
      Array.from({ length: 24 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 24;
        const r1 = (r as number) * 0.25;
        return `<path d='M${(x as number) + r1 * Math.cos(a)} ${(y as number) + r1 * Math.sin(a)}L${(x as number) + (r as number) * Math.cos(a)} ${(y as number) + (r as number) * Math.sin(a)}' stroke='${c}' stroke-width='${i % 2 ? 1.2 : 2}' stroke-linecap='round' opacity='.55'/>`;
      }).join("") + `<circle cx='${x}' cy='${y}' r='3' fill='${c}'/>`,
    )
    .join("")}</svg>`,
);


/** Tela escocesa (Día del Padre) */
const TARTAN =
  "repeating-linear-gradient(0deg, rgb(255 255 255 / .05) 0 8px, transparent 8px 32px), repeating-linear-gradient(90deg, rgb(255 255 255 / .05) 0 8px, transparent 8px 32px), repeating-linear-gradient(0deg, rgb(201 154 75 / .28) 0 2px, transparent 2px 64px), repeating-linear-gradient(90deg, rgb(201 154 75 / .28) 0 2px, transparent 2px 64px), repeating-linear-gradient(0deg, rgb(0 0 0 / .14) 16px 24px, transparent 24px 64px), repeating-linear-gradient(90deg, rgb(0 0 0 / .14) 16px 24px, transparent 24px 64px)";

/** Silueta del águila (para fondos de Fiestas Patrias) */
const eagle = (fill: string, op: number) =>
  enc(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 110'><g fill='${fill}' opacity='${op}'>` +
      `<path d='M68 52C56 34 38 22 20 18c-6-1-12 0-16 3 6 1 10 3 12 6-6 0-11 2-13 6 6 0 10 2 12 4-5 1-9 4-10 8 6-1 11 0 14 2-3 2-5 6-4 10 8-4 16-5 22-3-2 3-2 7 0 10 8-6 18-7 26-4Z'/>` +
      `<path d='M72 52c12-18 30-30 48-34 6-1 12 0 16 3-6 1-10 3-12 6 6 0 11 2 13 6-6 0-10 2-12 4 5 1 9 4 10 8-6-1-11 0-14 2 3 2 5 6 4 10-8-4-16-5-22-3 2 3 2 7 0 10-8-6-18-7-26-4Z'/>` +
      `<path d='M60 50c-2 18 2 34 10 44 8-10 12-26 10-44-6-6-14-6-20 0Z'/><path d='M60 46c-2-12 4-20 12-20 8 0 14 6 14 14 0 4-2 8-6 10l-12 2Z'/><path d='M84 36l10 4-9 5Z'/>` +
      `<ellipse cx='70' cy='104' rx='18' ry='6'/></g></svg>`,
  );
const MX = {
  eagleLight: eagle("#fff4dc", 0.16),
  eagleBrown: eagle("#7a4a22", 0.13),
  light: "linear-gradient(90deg, #dcefe5 0%, #f4faf6 22%, #fffdf9 38%, #fffdf9 62%, #fdf1f2 78%, #f9dfe2 100%)",
  dark: "linear-gradient(105deg, #06523a 0%, #0b6b46 30%, #5b3a22 50%, #a8101f 70%, #7d0c16 100%)",
  /** bandera: verde a la izquierda, blanco al centro (con el águila café) y rojo a la derecha */
  flag: "linear-gradient(90deg, #0b6b46 0%, #0b6b46 2.5%, #cfe6da 10%, #fffdf9 20%, #fffdf9 80%, #f8d9de 90%, #c8102e 97.5%, #c8102e 100%)",
  eagleBig: eagle("#7a4a22", 0.16),
  footer: "linear-gradient(90deg, #0b6b46 0%, #0b6b46 10%, #fffdf9 30%, #fffdf9 70%, #c8102e 90%, #c8102e 100%)",
};

/* ------------------------------------------------------------------ Pieles por temporada */
const cream = (c = "#fff8ec") => c;
export const SKINS: Record<FestiveId, Skin> = {
  anonuevo: {
    header: { bg: "#0b0a08", dark: true },
    hero: { bg: `${fireworks} center top / 900px auto repeat-x, ${P.goldStars}, radial-gradient(ellipse at 65% 35%, #3a2c14 0%, #120e08 55%, #050403 100%)`, dark: true, accent: "#f3d27a" },
    features: { bg: `${P.goldStars.replace("%23f3d27a", "%23d4af37")}, #fbf4e6`, dark: false, card: "gold", accent: "#8a6508" },
    video: { bg: `${fireworks} center / 900px auto, ${P.goldStars}, #0b0a08`, dark: true, accent: "#f3d27a" },
    how: { bg: `${P.goldStars}, linear-gradient(#141210, #0b0a08)`, dark: true, card: "glass", accent: "#f3d27a" },
    pricing: { bg: `${P.goldStars}, linear-gradient(#111a38, #0a1026 60%, #070b1a)`, dark: true, card: "cream", accent: "#f3d27a" },
    faq: { bg: `${fireworks} center / 900px auto, ${P.goldStars}, #0b0a08`, dark: true, card: "glass", accent: "#f3d27a" },
    social: { bg: `${P.goldStars}, #0b0a08`, dark: true, card: "gold", accent: "#f3d27a" },
    footer: { bg: `${P.goldStars}, #050403`, dark: true, accent: "#f3d27a" },
    glaze: ["#5d3a1a", "#7a4a22", "#4a2c12"],
    topping: "gold",
    ring: "#d4af37",
    ink: { dark: "#fff6df", muted: "#e6d4a8" },
    plans: { bg: ["#16130e", "#fbf3df", "#12204a"], dark: [true, false, true] },
  },
  navidad: {
    header: { bg: `${P.snowSoft}, #fdf3e7`, dark: false },
    hero: { bg: `${P.snow}, radial-gradient(ellipse at 60% 40%, #d32f2f 0%, #b71c1c 45%, #7f0d0d 100%)`, dark: true, accent: "#ffd166" },
    features: { bg: `${P.snowSoft}, #fdf3e7`, dark: false, card: "lights", accent: "#b71c1c" },
    video: { bg: `${P.snow}, radial-gradient(ellipse at 50% 30%, #c62828, #8e1111)`, dark: true, accent: "#ffd166" },
    how: { bg: `${P.snow}, linear-gradient(#1b5e3b, #0f3d25)`, dark: true, card: "glass", accent: "#ffd166" },
    pricing: { bg: `${P.snow}, linear-gradient(#123067, #0b1f45 60%, #081631)`, dark: true, card: "lightsCream", accent: "#ffd166" },
    faq: { bg: `${P.snow}, linear-gradient(#0b1f45, #081631)`, dark: true, card: "glass", accent: "#ff6b6b" },
    social: { bg: `${P.snowSoft}, #fdf3e7`, dark: false, card: "lightsCream", accent: "#b71c1c" },
    footer: { bg: `${P.snow}, linear-gradient(#a31515, #6d0b0b)`, dark: true, accent: "#ffd166" },
    glaze: ["#6d3a1f", "#7b4424", "#5a2e17"],
    topping: "snow",
    ring: "#1f6b3f",
    ink: { dark: "#fff8ee", muted: "#f4dcd2" },
    plans: { bg: ["#1b5e3b", "#a31515", "#fff8ee"], dark: [true, true, false] },
    edge: ["regaloRojo", "esfera", "baston", "arbol"],
  },
  reyes: {
    header: { bg: "#fbf3ff", dark: false },
    hero: { bg: `${P.goldStars}, radial-gradient(ellipse at 60% 40%, #6a2a8e 0%, #3b1257 60%, #22092f 100%)`, dark: true, accent: "#f3d27a" },
    features: { bg: `${P.goldStars}, #fbf5ea`, dark: false, card: "gold", accent: "#7b2d8e" },
    video: { bg: `${P.goldStars}, #2a0c3c`, dark: true, accent: "#f3d27a" },
    how: { bg: `${P.goldStars}, linear-gradient(#3b1257, #22092f)`, dark: true, card: "glass", accent: "#f3d27a" },
    pricing: { bg: `${P.goldStars}, linear-gradient(#3b1257, #22092f)`, dark: true, card: "cream", accent: "#f3d27a" },
    faq: { bg: `${P.goldStars}, #22092f`, dark: true, card: "glass", accent: "#f3d27a" },
    social: { bg: "#fbf5ea", dark: false, card: "lace", accent: "#7b2d8e" },
    footer: { bg: `${P.goldStars}, #1a0724`, dark: true, accent: "#f3d27a" },
    glaze: ["#d4a017", "#7b2d8e", "#c0392b"],
    topping: "reyes",
    ring: "#d4a017",
    ink: { dark: "#fff8ec", muted: "#e7d3ef" },
    plans: { bg: ["#4a1466", "#fbf1d8", "#7d1425"], dark: [true, false, true] },
    edge: ["roscaDeluxe", "camello", "elefante", "caballo"],
  },
  sanvalentin: {
    header: { bg: `${P.heartsLight}, #fff3f5`, dark: false },
    hero: { bg: `${P.hearts}, radial-gradient(ellipse at 65% 40%, #ff8fab 0%, #e8456b 45%, #b0123f 100%)`, dark: true, accent: "#fff0b3" },
    features: { bg: `${P.heartsLight}, #fff5f7`, dark: false, card: "cupid", accent: "#c2185b" },
    video: { bg: `${P.heartsLight}, #ffe4ec`, dark: false, accent: "#c2185b" },
    how: { bg: `${P.hearts}, linear-gradient(#8e0f35, #5e0a24)`, dark: true, card: "glass", accent: "#ffb3c6" },
    pricing: { bg: `${P.heartsLight}, #fff0f4`, dark: false, accent: "#c2185b" },
    faq: { bg: `${P.hearts}, linear-gradient(#8e0f35, #5e0a24)`, dark: true, card: "glass", accent: "#ffb3c6" },
    social: { bg: `${P.heartsLight}, #fff5f7`, dark: false, card: "lace", accent: "#c2185b" },
    footer: { bg: `${P.hearts}, #5e0a24`, dark: true, accent: "#ffb3c6" },
    glaze: ["#e8456b", "#b0123f", "#d81b60"],
    topping: "hearts",
    ring: "#e8456b",
    ink: { dark: "#fff5f7", muted: "#ffd6e0" },
    plans: { bg: ["#ffe4ec", "#b0123f", "#fffafb"], dark: [false, true, false] },
    edge: ["cupido", "pastelCorazon", "corazonRojo", "cupido"],
  },
  primavera: {
    header: { bg: "#fffbe6", dark: false },
    hero: { bg: `${P.flowers}, radial-gradient(ellipse at 60% 40%, #fff3b0 0%, #ffe066 45%, #fbc531 100%)`, dark: false, accent: "#a16c00" },
    features: { bg: `${P.flowers}, #fffbe8`, dark: false, card: "white", accent: "#a16c00" },
    video: { bg: `${P.flowers}, #fff6cc`, dark: false, accent: "#a16c00" },
    how: { bg: `${P.flowers}, linear-gradient(#3c6e24, #284d17)`, dark: true, card: "glass", accent: "#ffe066" },
    pricing: { bg: `${P.flowers}, #fffbe8`, dark: false, accent: "#a16c00" },
    faq: { bg: `${P.flowers}, linear-gradient(#3c6e24, #284d17)`, dark: true, card: "glass", accent: "#ffe066" },
    social: { bg: "#fffbe8", dark: false, card: "white", accent: "#a16c00" },
    footer: { bg: `${P.flowers}, #284d17`, dark: true, accent: "#ffe066" },
    glaze: ["#fbc02d", "#7cb342", "#f9a825"],
    topping: "flowers",
    ring: "#fbc02d",
    ink: { dark: "#fffdf0", muted: "#e8f0d0" },
    plans: { bg: ["#fff6c4", "#3c6e24", "#fffdf0"], dark: [false, true, false] },
  },
  nino: {
    header: { bg: "#f2fbff", dark: false },
    hero: { bg: `${P.confetti}, radial-gradient(ellipse at 60% 40%, #81d4fa 0%, #29b6f6 50%, #0277bd 100%)`, dark: true, accent: "#ffeb3b" },
    features: { bg: `${P.confettiLight}, #f4fbff`, dark: false, card: "white", accent: "#1e6fd0" },
    video: { bg: `${P.confettiLight}, #e3f4ff`, dark: false, accent: "#1e6fd0" },
    how: { bg: `${P.confetti}, linear-gradient(#0d3b66, #082847)`, dark: true, card: "glass", accent: "#ffeb3b" },
    pricing: { bg: `${P.confettiLight}, #f4fbff`, dark: false, accent: "#1e6fd0" },
    faq: { bg: `${P.confetti}, #0d3b66`, dark: true, card: "glass", accent: "#ffeb3b" },
    social: { bg: "#f4fbff", dark: false, card: "white", accent: "#1e6fd0" },
    footer: { bg: `${P.confetti}, #082847`, dark: true, accent: "#ffeb3b" },
    glaze: ["#e53935", "#1e88e5", "#43a047"],
    topping: "sprinkles",
    ring: "#1e88e5",
    ink: { dark: "#ffffff", muted: "#d6ecff" },
    plans: { bg: ["#e3f4ff", "#1e6fd0", "#fff3d6"], dark: [false, true, false] },
  },
  madres: {
    header: { bg: `${P.lilacLight}, #fbf6fe`, dark: false },
    hero: { bg: `${P.lilac}, radial-gradient(ellipse at 65% 40%, #e9c9f5 0%, #b57edc 40%, #7b3f9e 75%, #4f2370 100%)`, dark: true, accent: "#fff3a6" },
    features: { bg: `${P.lilacLight}, linear-gradient(160deg, #fbf6fe, #f5ecfb)`, dark: false, card: "lilac", accent: "#8a3ba6" },
    video: { bg: `${P.lilacLight}, #f5ecfb`, dark: false, accent: "#8a3ba6" },
    how: { bg: `${P.lilac}, linear-gradient(#5a2a7c, #3d1a57)`, dark: true, card: "glass", accent: "#f3d7ff" },
    pricing: { bg: `${P.lilacLight}, linear-gradient(160deg, #fbf6fe, #efe3f8)`, dark: false, card: "lilac", accent: "#8a3ba6" },
    faq: { bg: `${P.lilac}, linear-gradient(#5a2a7c, #3d1a57)`, dark: true, card: "glass", accent: "#f3d7ff" },
    social: { bg: `${P.lilacLight}, #fbf6fe`, dark: false, card: "lilac", accent: "#8a3ba6" },
    footer: { bg: `${P.lilac}, linear-gradient(115deg, #3d1a57, #7b3f9e)`, dark: true, accent: "#fff3a6" },
    glaze: ["#b57edc", "#f8bbd0", "#8a3ba6"],
    topping: "flowers",
    ring: "#b57edc",
    ink: { dark: "#fdf7ff", muted: "#ead7f5" },
    plans: { bg: ["#f3e6fb", "#7b3f9e", "#fdeef4"], dark: [false, true, false] },
    edge: ["tulipanRosa", "mariposa", "rosaRosa", "tulipanRosa"],
  },
  maestro: {
    header: { bg: "#fbf8ef", dark: false },
    hero: { bg: `${P.chalk}, radial-gradient(ellipse at 50% 40%, #2f5a3f 0%, #1f3d2b 60%, #142a1d 100%)`, dark: true, accent: "#ffe082" },
    features: { bg: "#fdf8ec", dark: false, card: "board", accent: "#c62828" },
    video: { bg: `${P.chalk}, #1f3d2b`, dark: true, accent: "#ffe082" },
    how: { bg: `${P.chalk}, #1f3d2b`, dark: true, card: "glass", accent: "#ffe082" },
    pricing: { bg: "#fdf8ec", dark: false, accent: "#c62828" },
    faq: { bg: `${P.chalk}, #1f3d2b`, dark: true, card: "glass", accent: "#ffe082" },
    social: { bg: "#fdf8ec", dark: false, card: "white", accent: "#c62828" },
    footer: { bg: `${P.chalk}, #142a1d`, dark: true, accent: "#ffe082" },
    glaze: ["#c62828", "#2e7d32", "#f9a825"],
    topping: "sprinkles",
    ring: "#c62828",
    ink: { dark: "#f7f5ec", muted: "#d7e3d0" },
    plans: { bg: ["#fff7e0", "#1f3d2b", "#fde8e8"], dark: [false, true, false] },
  },
  padre: {
    header: { bg: `${P.tiesLight}, #f6f3ec`, dark: false },
    hero: { bg: `${P.ties}, ${TARTAN}, linear-gradient(135deg, #10263f, #1f4e79 55%, #0c1d31)`, dark: true, accent: "#f1c27d" },
    features: { bg: `${P.tiesLight}, linear-gradient(160deg, #f8f4ec, #eef2f7)`, dark: false, card: "plaid", accent: "#1f4e79" },
    video: { bg: `${TARTAN}, linear-gradient(135deg, #10263f, #1f4e79)`, dark: true, accent: "#f1c27d" },
    how: { bg: `${P.ties}, ${TARTAN}, linear-gradient(#5b3b22, #3a2414)`, dark: true, card: "glass", accent: "#f1c27d" },
    pricing: { bg: `${P.ties}, ${TARTAN}, linear-gradient(#173a5e, #0f2742)`, dark: true, card: "plaid", accent: "#f1c27d" },
    faq: { bg: `${P.ties}, linear-gradient(#5b3b22, #3a2414)`, dark: true, card: "glass", accent: "#f1c27d" },
    social: { bg: `${P.tiesLight}, #f8f4ec`, dark: false, card: "plaid", accent: "#1f4e79" },
    footer: { bg: `${TARTAN}, linear-gradient(115deg, #0c1d31, #1f4e79 60%, #5b3b22)`, dark: true, accent: "#f1c27d" },
    glaze: ["#5b3b22", "#1f4e79", "#c99a4b"],
    topping: "ties",
    ring: "#c99a4b",
    ink: { dark: "#f7f3ea", muted: "#d6dfe9" },
    plans: { bg: ["#e9eef5", "#1f4e79", "#f3e7d4"], dark: [false, true, false] },
    edge: ["corbata", "bigote", "taza", "corbata"],
    side: `${TARTAN}, linear-gradient(180deg, #0c1d31, #1f4e79 60%, #5b3a22)`,
  },
  independencia: {
    header: { bg: `${MX.light}`, dark: false },
    hero: { bg: `${MX.eagleBig} 72% 55% / min(560px, 70%) auto no-repeat, ${P.flagLight}, ${MX.flag}`, dark: false, accent: "#0b6b46" },
    features: { bg: `${MX.eagleBrown} center / 420px auto no-repeat, ${P.flagLight}, ${MX.light}`, dark: false, card: "mx", accent: "#0b6b46" },
    video: { bg: `${MX.eagleBig} center / min(480px, 80%) auto no-repeat, ${P.flagLight}, ${MX.flag}`, dark: false, accent: "#c8102e" },
    how: { bg: `${MX.eagleBig} center / min(460px, 80%) auto no-repeat, ${P.flagLight}, ${MX.flag}`, dark: false, card: "mx", accent: "#0b6b46" },
    pricing: { bg: `${MX.eagleBrown} center 60% / 520px auto no-repeat, ${P.flagLight}, ${MX.light}`, dark: false, card: "mx", accent: "#0b6b46" },
    faq: { bg: `${MX.eagleBig} center / min(460px, 80%) auto no-repeat, ${P.flagLight}, ${MX.flag}`, dark: false, card: "mx", accent: "#c8102e" },
    social: { bg: `${MX.eagleBrown} center / 300px auto no-repeat, ${P.flagLight}, ${MX.light}`, dark: false, card: "mx", accent: "#0b6b46" },
    footer: { bg: `${MX.eagleBig} center 40% / 320px auto no-repeat, ${P.flagLight}, ${MX.flag}`, dark: false, accent: "#0b6b46" },
    glaze: ["#fffdf9", "#0b6b46", "#fffdf9"],
    topping: "mexico",
    ring: "#0b6b46",
    ink: { dark: "#fffdf9", muted: "#f1ece2" },
    edge: ["aguila", "campana", "chile", "rehileteMx"],
    side: "linear-gradient(180deg, #07583b 0%, #0b6b46 45%, #a8101f 55%, #7d0c16 100%)",
    plans: { bg: ["#0b6b46", `${MX.eagleBig} center 62% / 78% auto no-repeat, #fffdf9`, "#c8102e"], dark: [true, false, true] },
  },
  halloween: {
    header: { bg: `${P.bats}, #1e0f2e`, dark: true },
    hero: { bg: `${P.bats}, linear-gradient(180deg, #2b1145 0%, #4a1f6e 55%, #2b1145 100%)`, dark: true, accent: "#ff8c1a" },
    features: { bg: `${P.bats}, linear-gradient(#3a1a57, #2b1145)`, dark: true, card: "parchment", accent: "#ff8c1a" },
    video: { bg: "#f5e6c8", dark: false, accent: "#d0560f" },
    how: { bg: `${P.bats}, #1a0d26`, dark: true, card: "glass", accent: "#ff8c1a" },
    pricing: { bg: `${P.bats}, linear-gradient(#2b1145, #1a0d26)`, dark: true, card: "cream", accent: "#ff8c1a" },
    faq: { bg: `${P.bats}, linear-gradient(#2b1145, #1a0d26)`, dark: true, card: "glass", accent: "#ff8c1a" },
    social: { bg: `${P.bats}, #2b1145`, dark: true, card: "parchment", accent: "#ff8c1a" },
    footer: { bg: `${P.bats}, #140a1f`, dark: true, accent: "#ff8c1a" },
    glaze: ["#7cb342", "#4a2c12", "#ef6c00"],
    topping: "slime",
    ring: "#6a1b9a",
    ink: { dark: "#fff4e0", muted: "#e2cdf0" },
    plans: { bg: ["#3a1a57", "#b9480b", "#1c1424"], dark: [true, true, true] },
  },
  muertos: {
    header: { bg: `${P.marigold}, #fdf1e3`, dark: false },
    hero: {
      bg: `${P.marigold}, linear-gradient(115deg, #5b1a8c 0%, #b0207a 38%, #e8541f 75%, #ff9a2e 100%)`,
      dark: true,
      accent: "#ffd54f",
    },
    features: { bg: `${P.marigold}, #fbf0e1`, dark: false, card: "lace", accent: "#d9480f" },
    video: { bg: `${P.marigold}, #fbf0e1`, dark: false, accent: "#d9480f" },
    how: { bg: `${P.marigold}, linear-gradient(#3d1a10, #2a1009)`, dark: true, card: "glass", accent: "#ffb74d" },
    pricing: { bg: `${P.marigold}, linear-gradient(115deg, #4a1466, #8e1a63 55%, #b8401a)`, dark: true, card: "cream", accent: "#ffd54f" },
    faq: { bg: `${P.marigold}, #fbf0e1`, dark: false, card: "lace", accent: "#d9480f" },
    social: { bg: `${P.marigold}, #fbf0e1`, dark: false, card: "lace", accent: "#d9480f" },
    footer: { bg: `${P.marigold}, linear-gradient(115deg, #5b1a8c, #b0207a 55%, #e8541f)`, dark: true, accent: "#ffd54f" },
    glaze: ["#7b2d8e", "#6d3a1f", "#e8541f"],
    topping: "picado",
    ring: "#e91e63",
    ink: { dark: "#fff8ee", muted: "#f6e3cf" },
    plans: { bg: ["#5b1a8c", "#fff3e0", "#a3164f"], dark: [true, false, true] },
  },
};

/* ------------------------------------------------------------------ Estilos de tarjeta */
const CARD: Record<CardSkin, { css: string; dark: boolean; extra?: string }> = {
  gold: {
    dark: true,
    css: "background:linear-gradient(160deg,#211c15,#0e0c09);border:2px solid #c9a646;box-shadow:0 0 0 1px #000,0 14px 30px -14px rgb(201 166 70 / .6),inset 0 0 24px rgb(201 166 70 / .12);",
  },
  wood: {
    dark: true,
    css: "background:linear-gradient(#1f6b3f,#14532f);border:6px solid #8d5a2b;box-shadow:inset 0 0 0 2px #c48a4a,0 12px 24px -12px rgb(0 0 0 / .45);",
    extra: "snow",
  },
  woodCream: {
    dark: false,
    css: "background:#fffaf1;border:5px solid #8d5a2b;box-shadow:inset 0 0 0 2px #c48a4a,0 12px 24px -12px rgb(0 0 0 / .3);",
    extra: "snow",
  },
  parchment: {
    dark: false,
    css: "background:radial-gradient(circle at 25% 20%,#fbecc6,#efd59d 60%,#d9b273);border:1px solid #a87b3e;border-radius:14px;box-shadow:inset 0 0 22px rgb(120 70 20 / .35),0 14px 26px -14px rgb(0 0 0 / .6);",
  },
  lace: { dark: false, css: "background:#fffdf9;border:2px dotted var(--color-rose-400);box-shadow:0 0 0 5px #fff,0 12px 26px -14px rgb(0 0 0 / .25);" },
  white: { dark: false, css: "background:#fff;border:2px solid var(--color-rose-200);" },
  cream: { dark: false, css: "background:#fffaf0;border:2px solid #e9c46a;box-shadow:0 18px 40px -18px rgb(0 0 0 / .6);" },
  glass: { dark: true, css: "background:rgb(255 255 255 / .07);border:1px solid rgb(255 255 255 / .16);box-shadow:none;backdrop-filter:blur(2px);" },
  mx: { dark: false, css: "background:linear-gradient(90deg,#0b6b46 0 33.3%,#fff 33.3% 66.6%,#c8102e 66.6%) top/100% 6px no-repeat,#fffefb;border:1.5px solid #e7dccb;box-shadow:0 14px 28px -16px rgb(11 107 70 / .45);" },
  plaid: { dark: false, css: "background:#fffdf8;border:2px solid #1f4e79;box-shadow:inset 0 0 0 4px #fffdf8,inset 0 0 0 6px #c99a4b,0 14px 28px -16px rgb(31 78 121 / .5);" },
  lilac: { dark: false, css: "background:radial-gradient(circle at 100% 0,#f3e6fb 0 22%,transparent 23%),#fffdfe;border:1.5px solid #c9a7e3;box-shadow:0 0 0 4px #fbf6fe,0 12px 26px -14px rgb(123 63 168 / .35);" },
  lights: { dark: true, css: "background:linear-gradient(#1f6b3f,#14532f) padding-box;border:16px solid transparent;border-image:LIGHTS 16 round;border-radius:6px;box-shadow:0 14px 26px -14px rgb(0 0 0 / .5);", extra: "snow" },
  lightsCream: { dark: false, css: "background:#fffaf1 padding-box;border:16px solid transparent;border-image:LIGHTS 16 round;border-radius:6px;box-shadow:0 18px 40px -18px rgb(0 0 0 / .6);", extra: "snow" },
  redline: { dark: false, css: "background:#fff;border:2px solid #b5121f;box-shadow:inset 0 5px 0 #6b4426,0 12px 26px -14px rgb(107 68 38 / .45);" },
  cupid: { dark: false, css: "background:#fff;border:2px solid #f48fb1;box-shadow:0 0 0 5px #fff0f4,0 12px 26px -14px rgb(216 27 96 / .35);", extra: "cupid" },
  board: { dark: true, css: "background:linear-gradient(#2f5a3f,#1f3d2b);border:6px solid #a1683a;box-shadow:inset 0 0 0 2px #c48a4a;" },
};
const snowCap = enc(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 26' preserveAspectRatio='none'><path d='M0 0H200V12c-8 6-14-2-22 4s-10 10-18 4-12-8-22-2-14 8-22 2-12-6-20 0-16 8-24 2-12-8-20-2-12 10-22 4S6 14 0 16Z' fill='#fff'/><path d='M0 0H200V6c-10 4-30-2-50 2S100 4 80 6 30 2 0 6Z' fill='#eaf4ff'/></svg>`,
);

/* ------------------------------------------------------------------ Generador de la hoja de estilos */
const DARK_TEXT = [".text-cocoa-900", ".text-cocoa-800", ".text-cocoa-700", ".text-cocoa-600"];
const MUTED_TEXT = [".text-cocoa-500", ".text-cocoa-400", ".text-cocoa-300"];
function ink(scope: string, c: string, muted: string) {
  return (
    `${scope}{color:${c}}` +
    `${scope} :is(h1,h2,h3,h4,summary,figcaption){color:${c}}` +
    `${scope} :is(${DARK_TEXT.join(",")}){color:${c}}` +
    `${scope} :is(${MUTED_TEXT.join(",")}){color:${muted}}` +
    `${scope} .border-cocoa-800\\/5,${scope} .border-cocoa-800\\/10{border-color:rgb(255 255 255 / .14)}`
  );
}
function restore(scope: string) {
  return (
    `${scope}{color:var(--color-cocoa-800)}` +
    `${scope} :is(h1,h2,h3,h4,summary,figcaption){color:var(--color-cocoa-700)}` +
    [...DARK_TEXT, ...MUTED_TEXT].map((k) => `${scope} ${k}{color:var(--color-${k === ".text-cocoa-300" ? "cocoa-400" : k.slice(6)})}`).join("")
  );
}

const SECTIONS = ["header", "hero", "features", "video", "how", "pricing", "faq", "social", "footer"] as const;

/** Ajustes del tema oscuro: las secciones claras se oscurecen y las tarjetas claras pasan a superficie oscura */
const DIM = "linear-gradient(rgb(16 11 8 / .86), rgb(16 11 8 / .86))";
function darkSkin(s: Skin) {
  const D = `:root[data-theme="dark"]`;
  let css = "";
  for (const name of SECTIONS) {
    const t = s[name];
    const sec = `${D} [data-fs="${name}"]`;
    if (!t.dark) {
      css += `${sec}::before{background:${DIM},${t.bg}}`;
      css += `${sec} :is(.text-white,[class*="text-cream-"]):not(a,button,[class*="bg-rose-"],[class*="bg-mint-"]){color:#f7ede1!important}${sec} .text-mint-300{color:var(--color-mint-300)!important}`;
      if (t.accent) css += `${sec} :is(h1,h2) .text-rose-500,${sec} .font-script{color:color-mix(in srgb, ${t.accent} 55%, white)}`;
    }
    if (t.card) {
      const c = CARD[t.card];
      if (!c.dark) {
        const card = `${sec} :is(.card,.fest-card)`;
        css += t.card === "mx" ? `${card}{background:linear-gradient(90deg,#0b6b46 0 33.3%,#fff 33.3% 66.6%,#c8102e 66.6%) top/100% 6px no-repeat,#231a14!important}` : t.card.startsWith("lights") ? `${card}{background:#231a14 padding-box!important}` : `${card}{background:#231a14!important}`;
        // textos de la tarjeta con los colores del tema oscuro
        css += `${card} :is(h1,h2,h3,h4,summary,figcaption){color:var(--color-cocoa-700)}`;
        for (const k of [...DARK_TEXT, ...MUTED_TEXT]) css += `${card} ${k}{color:var(--color-${k.slice(6)})}`;
      }
    }
  }
  // pasos de "Así de fácil" con tarjeta clara: en oscuro pasan a superficie oscura
  if (s.how.card && !CARD[s.how.card].dark) css += `${D} [data-fs="how"] li{background:${s.how.card === "mx" ? "linear-gradient(90deg,#0b6b46 0 33.3%,#fff 33.3% 66.6%,#c8102e 66.6%) top/100% 6px no-repeat," : ""}#231a14!important}`;
  if (s.plaque) css += `${D} [data-fs="footer"]>div:not([aria-hidden]):not([data-fest]){background:rgb(28 20 15 / .92)}`;
  return css;
}

export function skinCss(id: FestiveId) {
  const s = SKINS[id];
  let css = "";
  for (const name of SECTIONS) {
    const t = s[name];
    const sec = `[data-fs="${name}"]`;
    // fondo de orilla a orilla (aunque la sección sea angosta), detrás del confeti y del contenido
    css += `${sec}{position:relative;isolation:isolate;background:transparent!important}`;
    css += `${sec}::before{content:"";position:absolute;inset:0 calc(50% - 50vw);z-index:-20;background:${t.bg};pointer-events:none}`;
    if (t.dark) css += ink(sec, s.ink.dark, s.ink.muted);
    else css += `${sec} :is(.text-white,[class*="text-cream-"]):not(:is(a,button,[class*="bg-rose-"],[class*="bg-mint-"]) *):not(a,button,[class*="bg-rose-"],[class*="bg-mint-"]){color:#2e1d10}${sec} [class*="text-cream-200"]:not(a *){color:#5d4634}${sec} .text-mint-300{color:#0b6b46}`;
    if (t.accent) css += `${sec} :is(h1,h2) .text-rose-500,${sec} .font-script{color:${t.accent}}`;
    // enlaces de color sobre fondo oscuro (fuera de tarjetas claras)
    if (t.dark && t.accent) css += `${sec} :is(.text-rose-500,.text-rose-600):not(${sec} :is(.card,.bg-white,.bg-cream-100,.bg-cream-200) *):not(:is(h1,h2) *):not(.bg-white){color:${t.accent}}`;
    // tarjetas
    if (t.card) {
      const c = CARD[t.card];
      const card = `${sec} :is(.card,.fest-card)`;
      css += `${card}{${c.css.replace("LIGHTS", lightsBorderUri(undefined, 0))}}`;
      if (c.dark && !t.dark) css += ink(card, s.ink.dark, s.ink.muted);
      if (!c.dark && t.dark) css += restore(card);
      if (c.extra === "cupid")
        css += `${card}::before{content:"";position:absolute;left:-18px;bottom:-14px;width:46px;height:40px;background:url("${bigUri("cupido")}") center/contain no-repeat;pointer-events:none;z-index:2;transform:scaleX(-1)}`;
      if (c.extra === "snow")
        css += `${card}{overflow:visible}${card}::before{content:"";position:absolute;left:-8px;right:-8px;top:-12px;height:22px;background:${snowCap} top/100% 100% no-repeat;pointer-events:none;z-index:2}`;
      // íconos de las tarjetas de funciones sobre tarjeta oscura
      if (c.dark) css += `${sec} .fest-mini>span:first-child{background:rgb(255 255 255 / .1)!important}`;
    } else if (t.dark) {
      // tarjetas normales dentro de una sección oscura: se quedan claras y con su texto oscuro
      css += restore(`${sec} :is(.card,.fest-card)`);
    }
    // "islas" claras dentro de una sección oscura (selector mensual/anual, etc.)
    if (t.dark) css += restore(`${sec} :is(.bg-white,.bg-cream-100,.bg-cream-200)`);
  }
  // encabezado: el logo y los enlaces sobre fondo oscuro
  if (s.header.dark) css += `[data-fs="header"] .font-script{color:${s.ink.dark}}`;
  // pie de página: enlaces
  if (s.footer.dark) css += `[data-fs="footer"] a:not(.grid){color:${s.ink.muted}}[data-fs="footer"] a:not(.grid):hover{color:${s.ink.dark}}`;
  if (s.plaque) css += `[data-fs="footer"]>div:not([aria-hidden]):not([data-fest]){background:rgb(255 253 249 / .93);border-radius:32px;margin-block:28px;max-width:min(72rem,calc(100% - 24px));box-shadow:0 20px 50px -24px rgb(0 0 0 / .45)}`;
  // sección "Así de fácil": los pasos usan la tarjeta de la sección
  if (s.how.card) css += `[data-fs="how"] li{${CARD[s.how.card].css.replace("LIGHTS", lightsBorderUri(undefined, 0))}}`;
  // focos que prenden y apagan: en las tarjetas con marco de focos y en los 3 planes de Navidad
  if (id === "navidad") {
    const on = lightsBorderUri(undefined, 1);
    const lit = `[data-fs="features"] :is(.card,.fest-card),[data-fs="social"] :is(.card,.fest-card),[data-fs="pricing"] .plan-card`;
    css += `[data-fs="pricing"] .plan-card{border:16px solid transparent!important;border-image:${lightsBorderUri(undefined, 0)} 16 round!important;border-radius:6px!important;overflow:visible!important}`;
    css += `:is(${lit})::after{content:"";position:absolute;inset:-16px;width:auto;height:auto;background:none;transform:none;border:16px solid transparent;border-image:${on} 16 round;pointer-events:none;z-index:4;animation:fest-blink 1.4s steps(1,end) infinite}`;
  }
  // título del inicio sobre fondo oscuro: sombra suave para que se lea sobre cualquier color
  if (s.hero.dark) css += `[data-fs="hero"] p svg{color:${s.hero.accent ?? s.ink.dark}}`;
  if (s.hero.dark) css += `[data-fs="hero"] :is(h1,p){text-shadow:0 2px 14px rgb(0 0 0 / .28)}[data-fs="hero"] .card :is(h1,p){text-shadow:none}`;
  // íconos de las tarjetas de funciones: ilustración de la temporada
  const art = Array.from(new Set<BigArt>([...BOUQUET[id], ...THEME_ART[id]]));
  css += `[data-fs="features"] .fest-mini>span:first-child svg{opacity:0}`;
  art.forEach((a, i) => {
    css += `[data-fs="features"] .fest-mini:nth-child(${art.length}n+${i + 1})>span:first-child{background-image:url("${bigUri(a)}")!important;background-position:center;background-size:74% auto;background-repeat:no-repeat}`;
  });
  // cada plan con su propio fondo (y letras claras u oscuras según el fondo)
  if (s.plans) {
    s.plans.bg.forEach((bg, i) => {
      const card = `:root [data-fs="pricing"] .plan-card.plan-card:nth-child(${i + 1})`;
      const dark = s.plans!.dark[i];
      const c = dark ? s.ink.dark : "#2e1d10";
      const m = dark ? s.ink.muted : "#6b5340";
      css += `${card}{background:${bg}!important;box-shadow:0 22px 44px -22px rgb(0 0 0 / .55)!important}`;
      const txt = `${card} :is(h3,p,span,li,label,b,svg):not(:is(a,button,.rounded-2xl,.bg-white,.rounded-full) *):not(a,button,.rounded-full)`;
      css += `${txt}{color:${c}!important}${card} :is(p,span).text-xs,${card} p[class*="text-["]{color:${m}!important}`;
      css += `${card} li svg{color:${dark ? s.ink.dark : "#0b6b46"}!important}`;
      // recuadros (dominio, totales) siempre claros y con letra oscura
      css += `${card} div.rounded-2xl{background:rgb(255 255 255 / .92)!important}${card} div.rounded-2xl :is(p,span,b,label):not(button *){color:#2e1d10!important}`;
    });
  }
  css += darkSkin(s);
  return css;
}

/* ======================================================================
   Panel (dashboard y módulos) y tienda en línea
   ====================================================================== */
/** Primer tono claro de la piel (para fondos donde hay mucha información y debe leerse fácil) */
const lightTone = (s: Skin) => [s.features, s.social, s.pricing, s.video, s.faq].find((t) => !t.dark) ?? { bg: "#fffaf2", dark: false };
/** Borde de las tarjetas del panel y de la tienda por temporada */
const CARD_BORDER: Partial<Record<FestiveId, string>> = {
  navidad: "#2e7d32",
  anonuevo: "#d4af37",
  reyes: "#d4a017",
  sanvalentin: "#f48fb1",
  madres: "#f48fb1",
  halloween: "#ef6c00",
  muertos: "#e91e63",
  independencia: "#b5121f",
  primavera: "#fbc02d",
  nino: "#29b6f6",
  maestro: "#c62828",
  padre: "#1f4e79",
};

export function panelSkinCss(id: FestiveId) {
  const s = SKINS[id];
  const light = lightTone(s);
  const raw = stripUri(id);
  const k = Math.min(1, 13 / raw.h);
  const strip = { uri: raw.uri, w: Math.round(raw.w * k), h: Math.round(raw.h * k) };
  const border = CARD_BORDER[id] ?? "var(--color-rose-300)";
  let css = "";
  // fondo de todo el panel (fijo, detrás del contenido)
  const blobs = `radial-gradient(900px 650px at 0% 0%, color-mix(in srgb, var(--color-rose-500) 24%, transparent), transparent 62%), radial-gradient(800px 600px at 100% 15%, color-mix(in srgb, var(--color-mint-500) 20%, transparent), transparent 62%), radial-gradient(900px 600px at 55% 115%, color-mix(in srgb, var(--color-rose-400) 18%, transparent), transparent 60%)`;
  css += `[data-fs="panel"]::before{content:"";position:fixed;inset:0;z-index:-1;background:${blobs},${light.bg};pointer-events:none}`;
  css += `:root[data-theme="dark"] [data-fs="panel"]::before{background:${blobs},${DIM},${light.bg}}`;
  css += `:root[data-theme="dark"] [data-fs="panel"] main .font-script{color:color-mix(in srgb, ${light.accent ?? "var(--color-rose-500)"} 55%, white)}`;
  // la bienvenida: si el fondo de la temporada es claro, los textos van oscuros
  if (!s.hero.dark) css += `[data-fs="phero"] :is(h1,h2,p,span,b,strong):not(button *):not(a *){color:#3a2412!important;text-shadow:0 1px 0 rgb(255 255 255 / .5)}`;
  css += `[data-fs="panel"] main .font-script{color:${light.accent ?? "var(--color-rose-500)"}}`;
  // menú lateral con el fondo oscuro de la temporada
  const side = `[data-fs="sidebar"]`;
  // sin patrones encima del texto del menú: solo el degradado de la temporada
  const sideBg = s.side ?? (s.footer.dark ? s.footer.bg : s.hero.bg).replace(/url\("[^"]*"\)[^,]*,\s*/g, "");
  css += `${side}{background:linear-gradient(rgb(0 0 0 / .14),rgb(0 0 0 / .14)),${sideBg}!important;border-color:rgb(255 255 255 / .08)!important}`;
  css += `${side} :is(p,span,a){text-shadow:0 1px 2px rgb(0 0 0 / .35)}${side} .bg-mint-500 *,${side} .bg-rose-500 *{text-shadow:none}`;
  css += ink(side, s.ink.dark, s.ink.muted);
  css += `${side} a:not(.bg-rose-500):not(.bg-mint-500):hover,${side} button:hover{background:rgb(255 255 255 / .1)!important;color:${s.ink.dark}!important}`;
  css += `${side} .text-cocoa-300{color:${s.ink.muted}!important;opacity:.85}`;
  css += `${side} .border-t{border-color:rgb(255 255 255 / .12)}`;
  css += restore(`${side} :is(.bg-cream-200,.bg-white)`);
  // barra superior y navegación inferior del celular
  css += `[data-fs="pheader"]{background:${s.header.bg}!important}`;
  if (s.header.dark) css += ink(`[data-fs="pheader"]`, s.ink.dark, s.ink.muted);
  // bienvenida del inicio
  css += `[data-fs="phero"]{background:${s.hero.bg}!important}`;
  css += `[data-fs="phero"] .font-script{color:${s.hero.accent ?? s.ink.dark}!important}`;
  // tarjetas: orilla de la temporada y tirita decorativa arriba
  const card = `[data-fs="panel"] main :is(.card,.fest-card):not([role=dialog] *):not([role=menu] *)`;
  css += `${card}{border:1.5px solid color-mix(in srgb, ${border} 55%, transparent)!important;box-shadow:0 1px 0 #fff inset,0 10px 26px -16px color-mix(in srgb, ${border} 60%, transparent)}`;
  css += `${card}::before{content:"";position:absolute;left:14px;right:14px;top:2px;height:${strip.h}px;background:${strip.uri} left top/${strip.w}px ${strip.h}px repeat-x;pointer-events:none;opacity:.95;z-index:1;border-radius:0}`;
  return css;
}

export function storeSkinCss(id: FestiveId) {
  const s = SKINS[id];
  const light = lightTone(s);
  const raw = stripUri(id);
  const k = Math.min(1, 13 / raw.h);
  const strip = { uri: raw.uri, w: Math.round(raw.w * k), h: Math.round(raw.h * k) };
  const border = CARD_BORDER[id] ?? "var(--st-primary)";
  let css = "";
  // fondo con el patrón de la temporada encima del color de la tienda
  css += `[data-fs="store"]{isolation:isolate}[data-fs="store"]::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(700px 500px at 0% 10%, color-mix(in srgb, var(--st-primary) 22%, transparent), transparent 62%), radial-gradient(700px 520px at 100% 40%, color-mix(in srgb, var(--st-accent) 20%, transparent), transparent 62%), radial-gradient(800px 500px at 40% 100%, color-mix(in srgb, var(--st-primary) 16%, transparent), transparent 60%), ${light.bg};opacity:.75;pointer-events:none}`;
  // portada sin foto: fondo de la temporada
  css += `[data-fs="sbanner"]{background:${s.hero.bg}!important}`;
  // tarjetas de productos y paquetes
  css += `[data-fs="store"] .fest-card{position:relative;border:1.5px solid color-mix(in srgb, ${border} 60%, transparent)}`;
  css += `[data-fs="store"] .fest-card::before{content:"";position:absolute;left:12px;right:12px;top:3px;height:${strip.h}px;background:${strip.uri} left top/${strip.w}px ${strip.h}px repeat-x;pointer-events:none;z-index:2}`;
  return css;
}

/** Visor público de la cotización: franja con el fondo de la temporada arriba y fondo difuminado */
export function viewerSkinCss(id: FestiveId) {
  const s = SKINS[id];
  const light = lightTone(s);
  const blobs = `radial-gradient(700px 500px at 0% 30%, color-mix(in srgb, var(--color-rose-500) 22%, transparent), transparent 62%), radial-gradient(700px 520px at 100% 60%, color-mix(in srgb, var(--color-mint-500) 20%, transparent), transparent 62%)`;
  let css = `[data-fs="viewer"]{position:relative;isolation:isolate;background:transparent!important}`;
  css += `[data-fs="viewer"]::before{content:"";position:fixed;inset:0;z-index:-2;background:${blobs},${light.bg};pointer-events:none}`;
  css += `[data-fs="viewer"]::after{content:"";position:absolute;left:0;right:0;top:0;height:360px;z-index:-1;background:${s.hero.bg};-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent);pointer-events:none}`;
  css += `:root[data-theme="dark"] [data-fs="viewer"]::before{background:${blobs},${DIM},${light.bg}}`;
  css += `[data-fs="viewer"] article{box-shadow:0 30px 70px -30px rgb(0 0 0 / .45),0 0 0 2px color-mix(in srgb, ${CARD_BORDER[id] ?? "var(--color-rose-300)"} 45%, transparent)}`;
  return css;
}
