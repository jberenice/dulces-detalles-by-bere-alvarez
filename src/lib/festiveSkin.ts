/**
 * "Piel" de temporada para la portada: fondos de cada sección, estilo de las tarjetas, colores de texto
 * (claros sobre fondos oscuros) y glaseado de los planes. Se convierte en una hoja de estilos que solo se
 * inyecta mientras la temporada está activa (ver <FestiveSkin>).
 *
 * Las secciones se marcan con data-fs="header|hero|features|video|how|pricing|faq|social|footer".
 */
import type { FestiveId } from "./festive";
import { THEME_ART } from "./festiveArt";
import { BOUQUET, bigUri, type BigArt } from "./festiveArt2";

export type CardSkin = "gold" | "wood" | "woodCream" | "parchment" | "lace" | "white" | "glass" | "cream" | "board";
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
  topping: "snow" | "gold" | "hearts" | "slime" | "picado" | "sprinkles" | "flowers";
  /** aro alrededor del logo */
  ring: string;
  /** color de las tarjetas del panel de bienvenida (texto claro u oscuro) */
  ink: { dark: string; muted: string };
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
  chalk: tile(star(30, 40, 6, "#fff", 0.25) + `<path d='M110 30h30M115 40h20' stroke='#fff' stroke-opacity='.18' stroke-width='2' stroke-linecap='round'/><text x='60' y='120' font-size='22' font-family='serif' fill='#fff' fill-opacity='.16'>a+b</text><text x='120' y='160' font-size='18' font-family='serif' fill='#fff' fill-opacity='.14'>ABC</text>` + dot(150, 100, 2, "#fff", 0.2)),
  navy: tile(star(30, 40, 5, "#e0b15c", 0.6) + star(130, 120, 4, "#fff", 0.5) + dot(80, 80, 1.6, "#fff", 0.5) + dot(160, 30, 1.4, "#e0b15c", 0.6) + `<path d='M20 150q10-10 20 0t20 0' stroke='#e0b15c' stroke-opacity='.3' fill='none' stroke-width='2'/>`),
  flag: tile(conf(30, 30, "#ffffff", 20, 0.6) + conf(120, 50, "#ce1126", -30, 0.7) + conf(70, 120, "#ffffff", 60, 0.5) + conf(150, 150, "#ffd166", 10, 0.6) + star(100, 20, 4, "#fff", 0.6) + star(30, 150, 5, "#ffd166", 0.6) + dot(160, 90, 2, "#fff", 0.6)),
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
  },
  navidad: {
    header: { bg: `${P.snowSoft}, #fdf3e7`, dark: false },
    hero: { bg: `${P.snow}, radial-gradient(ellipse at 60% 40%, #d32f2f 0%, #b71c1c 45%, #7f0d0d 100%)`, dark: true, accent: "#ffd166" },
    features: { bg: `${P.snowSoft}, #fdf3e7`, dark: false, card: "wood", accent: "#b71c1c" },
    video: { bg: `${P.snow}, radial-gradient(ellipse at 50% 30%, #c62828, #8e1111)`, dark: true, accent: "#ffd166" },
    how: { bg: `${P.snow}, linear-gradient(#1b5e3b, #0f3d25)`, dark: true, card: "glass", accent: "#ffd166" },
    pricing: { bg: `${P.snow}, linear-gradient(#123067, #0b1f45 60%, #081631)`, dark: true, card: "cream", accent: "#ffd166" },
    faq: { bg: `${P.snow}, linear-gradient(#0b1f45, #081631)`, dark: true, card: "glass", accent: "#ff6b6b" },
    social: { bg: `${P.snowSoft}, #fdf3e7`, dark: false, card: "woodCream", accent: "#b71c1c" },
    footer: { bg: `${P.snow}, linear-gradient(#a31515, #6d0b0b)`, dark: true, accent: "#ffd166" },
    glaze: ["#6d3a1f", "#7b4424", "#5a2e17"],
    topping: "snow",
    ring: "#1f6b3f",
    ink: { dark: "#fff8ee", muted: "#f4dcd2" },
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
    topping: "gold",
    ring: "#d4a017",
    ink: { dark: "#fff8ec", muted: "#e7d3ef" },
  },
  sanvalentin: {
    header: { bg: `${P.heartsLight}, #fff3f5`, dark: false },
    hero: { bg: `${P.hearts}, radial-gradient(ellipse at 65% 40%, #ff8fab 0%, #e8456b 45%, #b0123f 100%)`, dark: true, accent: "#fff0b3" },
    features: { bg: `${P.heartsLight}, #fff5f7`, dark: false, card: "lace", accent: "#c2185b" },
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
  },
  madres: {
    header: { bg: "#fff4f8", dark: false },
    hero: { bg: `${P.hearts}, radial-gradient(ellipse at 60% 40%, #f8bbd0 0%, #f06292 50%, #ad1457 100%)`, dark: true, accent: "#fff0b3" },
    features: { bg: `${P.heartsLight}, #fff6f9`, dark: false, card: "lace", accent: "#c2185b" },
    video: { bg: `${P.heartsLight}, #fde7ef`, dark: false, accent: "#c2185b" },
    how: { bg: `${P.hearts}, linear-gradient(#7b1745, #52102f)`, dark: true, card: "glass", accent: "#f8bbd0" },
    pricing: { bg: `${P.heartsLight}, #fff6f9`, dark: false, accent: "#c2185b" },
    faq: { bg: `${P.hearts}, #52102f`, dark: true, card: "glass", accent: "#f8bbd0" },
    social: { bg: "#fff6f9", dark: false, card: "lace", accent: "#c2185b" },
    footer: { bg: `${P.hearts}, #52102f`, dark: true, accent: "#f8bbd0" },
    glaze: ["#f06292", "#ab47bc", "#ec407a"],
    topping: "flowers",
    ring: "#f06292",
    ink: { dark: "#fff6f9", muted: "#f8d3e2" },
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
  },
  padre: {
    header: { bg: "#f4f7fb", dark: false },
    hero: { bg: `${P.navy}, radial-gradient(ellipse at 60% 40%, #2d6aa3 0%, #1f4e79 50%, #0f2742 100%)`, dark: true, accent: "#e0b15c" },
    features: { bg: "#f5f1ea", dark: false, card: "white", accent: "#1f4e79" },
    video: { bg: `${P.navy}, #0f2742`, dark: true, accent: "#e0b15c" },
    how: { bg: `${P.navy}, #0f2742`, dark: true, card: "glass", accent: "#e0b15c" },
    pricing: { bg: `${P.navy}, linear-gradient(#173a5e, #0f2742)`, dark: true, card: "cream", accent: "#e0b15c" },
    faq: { bg: `${P.navy}, #0f2742`, dark: true, card: "glass", accent: "#e0b15c" },
    social: { bg: "#f5f1ea", dark: false, card: "white", accent: "#1f4e79" },
    footer: { bg: `${P.navy}, #0a1c30`, dark: true, accent: "#e0b15c" },
    glaze: ["#6d4c2f", "#1f4e79", "#a8742f"],
    topping: "sprinkles",
    ring: "#1f4e79",
    ink: { dark: "#f4f7fb", muted: "#c9d8ea" },
  },
  independencia: {
    header: { bg: "#ffffff", dark: false },
    hero: { bg: `${P.flag}, radial-gradient(ellipse at 60% 40%, #0a8a5f 0%, #006847 50%, #003d29 100%)`, dark: true, accent: "#ffd166" },
    features: { bg: "#fbf7ef", dark: false, card: "white", accent: "#ce1126" },
    video: { bg: `${P.flag}, #8f0c1d`, dark: true, accent: "#ffd166" },
    how: { bg: `${P.flag}, linear-gradient(#a50f22, #6e0814)`, dark: true, card: "glass", accent: "#ffd166" },
    pricing: { bg: "#fbf7ef", dark: false, accent: "#006847" },
    faq: { bg: `${P.flag}, #003d29`, dark: true, card: "glass", accent: "#ffd166" },
    social: { bg: "#fbf7ef", dark: false, card: "white", accent: "#ce1126" },
    footer: { bg: `${P.flag}, #003d29`, dark: true, accent: "#ffd166" },
    glaze: ["#006847", "#ce1126", "#6d3a1f"],
    topping: "picado",
    ring: "#006847",
    ink: { dark: "#ffffff", muted: "#d7efe4" },
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
    [...DARK_TEXT, ...MUTED_TEXT].map((k) => `${scope} ${k}{color:var(--color-${k.slice(6)})}`).join("")
  );
}

const SECTIONS = ["header", "hero", "features", "video", "how", "pricing", "faq", "social", "footer"] as const;

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
    if (t.accent) css += `${sec} :is(h1,h2) .text-rose-500,${sec} .font-script{color:${t.accent}}`;
    // tarjetas
    if (t.card) {
      const c = CARD[t.card];
      const card = `${sec} :is(.card,.fest-card)`;
      css += `${card}{${c.css}}`;
      if (c.dark && !t.dark) css += ink(card, s.ink.dark, s.ink.muted);
      if (!c.dark && t.dark) css += restore(card);
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
  // sección "Así de fácil": los pasos usan la tarjeta de la sección
  if (s.how.card) css += `[data-fs="how"] li{${CARD[s.how.card].css}}`;
  // título del inicio sobre fondo oscuro: sombra suave para que se lea sobre cualquier color
  if (s.hero.dark) css += `[data-fs="hero"] p svg{color:${s.hero.accent ?? s.ink.dark}}`;
  if (s.hero.dark) css += `[data-fs="hero"] :is(h1,p){text-shadow:0 2px 14px rgb(0 0 0 / .28)}[data-fs="hero"] .card :is(h1,p){text-shadow:none}`;
  // íconos de las tarjetas de funciones: ilustración de la temporada
  const art = Array.from(new Set<BigArt>([...BOUQUET[id], ...THEME_ART[id]]));
  css += `[data-fs="features"] .fest-mini>span:first-child svg{opacity:0}`;
  art.forEach((a, i) => {
    css += `[data-fs="features"] .fest-mini:nth-child(${art.length}n+${i + 1})>span:first-child{background-image:url("${bigUri(a)}")!important;background-position:center;background-size:74% auto;background-repeat:no-repeat}`;
  });
  return css;
}
