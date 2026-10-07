/**
 * Ilustraciones de temporada (calaveritas, cempasúchil, velas, calabazas, esferas, coronas…).
 * Todas son SVG pequeños dibujados en código (sin descargar imágenes) y algunas traen su propia animación
 * (la flama de la vela parpadea, el murciélago aletea, las burbujas suben, el rehilete gira…).
 */
import type { FestiveId } from "./festive";

const INK = "#3b2412";
// El contenido va en un grupo .a para poder animarlo completo (latido, giro, balanceo…)
const wrap = (body: string, style = "") =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>${
    style ? `<style>${style.replace(/svg\{/g, ".a{").replace(/transform-origin:center/g, "transform-origin:32px 32px")}</style>` : ""
  }<g class='a'>${body}</g></svg>`;
const ring = (cx: number, cy: number, r: number, n: number, pr: number, fill: string, rot = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n + rot;
    return `<circle cx='${(cx + r * Math.cos(a)).toFixed(1)}' cy='${(cy + r * Math.sin(a)).toFixed(1)}' r='${pr}' fill='${fill}'/>`;
  }).join("");
const petals = (cx: number, cy: number, n: number, len: number, w: number, fill: string, rot = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (360 * i) / n + rot;
    return `<ellipse cx='${cx}' cy='${cy - len / 2}' rx='${w}' ry='${len / 2}' fill='${fill}' transform='rotate(${a} ${cx} ${cy})'/>`;
  }).join("");

/* ------------------------------------------------------------------ Día de Muertos */
const calavera = wrap(
  `<path d='M32 5C17 5 7 15 7 29c0 8 4 14 10 17v7a5 5 0 0 0 5 5h20a5 5 0 0 0 5-5v-7c6-3 10-9 10-17C57 15 47 5 32 5Z' fill='#fffaf2' stroke='${INK}' stroke-width='2.2'/>` +
    // flor en la frente
    petals(32, 15, 6, 8, 2.6, "#e91e63") +
    `<circle cx='32' cy='15' r='2.4' fill='#ffb300'/>` +
    // ojos con flores
    `<circle cx='21.5' cy='30' r='8' fill='#ff9800'/><circle cx='42.5' cy='30' r='8' fill='#8e24aa'/>` +
    petals(21.5, 30, 8, 9, 2.2, "#ffd54f") +
    petals(42.5, 30, 8, 9, 2.2, "#4dd0e1") +
    `<circle cx='21.5' cy='30' r='4.2' fill='#2b1630'/><circle cx='42.5' cy='30' r='4.2' fill='#2b1630'/>` +
    `<circle cx='20' cy='28.5' r='1.3' fill='#fff'/><circle cx='41' cy='28.5' r='1.3' fill='#fff'/>` +
    // nariz de corazón
    `<path d='M32 43c-4-3-4-6-2-6.5 1-.3 1.8.4 2 1.2.2-.8 1-1.5 2-1.2 2 .5 2 3.5-2 6.5Z' fill='#e91e63'/>` +
    // mejillas y dientes
    ring(14, 40, 0, 1, 1.6, "#26a69a") +
    ring(50, 40, 0, 1, 1.6, "#26a69a") +
    `<path d='M22 50h20' stroke='${INK}' stroke-width='1.6'/><path d='M26 47.5v5M30 47.5v5M34 47.5v5M38 47.5v5' stroke='${INK}' stroke-width='1.3'/>`,
);
const marigold = wrap(
  ring(32, 32, 22, 14, 8, "#f57c00") +
    ring(32, 32, 16, 12, 7.5, "#fb8c00", 0.25) +
    ring(32, 32, 10, 10, 6.5, "#ffa000", 0.1) +
    ring(32, 32, 4.5, 6, 5, "#ffb300") +
    `<circle cx='32' cy='32' r='4' fill='#e65100'/>` +
    ring(32, 32, 19, 14, 1.2, "#bf360c", 0.2),
);
const vela = wrap(
  `<ellipse cx='32' cy='17' rx='9' ry='12' fill='#ffcc80' opacity='.35' class='g'/>` +
    `<path class='f' d='M32 5c4 6 5 9 5 12a5 5 0 0 1-10 0c0-3 1-6 5-12Z' fill='#ffb300' stroke='#e65100' stroke-width='1.2'/>` +
    `<path class='f' d='M32 11c2 3 2.6 5 2.6 6.5a2.6 2.6 0 0 1-5.2 0c0-1.5.6-3.5 2.6-6.5Z' fill='#fff59d'/>` +
    `<path d='M32 22v3' stroke='${INK}' stroke-width='1.6'/>` +
    `<rect x='22' y='25' width='20' height='33' rx='3' fill='#fff3d6' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M22 30c3 0 3 5 6 5s2-5 5-5 3 7 6 7 3-7 3-7' fill='none' stroke='#f5d9a6' stroke-width='2.4'/>` +
    `<rect x='22' y='44' width='20' height='5' fill='#e91e63' opacity='.85'/>`,
  `.f{transform-origin:32px 22px;animation:fl 1.2s ease-in-out infinite alternate}.g{animation:gl 1.2s ease-in-out infinite alternate}@keyframes fl{0%{transform:scale(1,1) rotate(-3deg)}100%{transform:scale(.9,1.12) rotate(3deg)}}@keyframes gl{0%{opacity:.2}100%{opacity:.5}}`,
);
const pan = wrap(
  `<path d='M7 44c0-14 11-24 25-24s25 10 25 24c0 4-3 7-7 7H14c-4 0-7-3-7-7Z' fill='#d98a3d' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M14 40c4-6 9-9 18-9s14 3 18 9' fill='none' stroke='#b9672a' stroke-width='5' stroke-linecap='round'/>` +
    `<path d='M24 24c3 5 4 10 4 18M40 24c-3 5-4 10-4 18' stroke='#b9672a' stroke-width='5' stroke-linecap='round'/>` +
    `<circle cx='32' cy='20' r='5' fill='#c47331' stroke='${INK}' stroke-width='1.6'/>` +
    ring(32, 36, 15, 16, 0.9, "#fff6e0"),
);

/* ------------------------------------------------------------------ Halloween */
const calabaza = wrap(
  `<path d='M32 14c2-5 5-7 9-7' stroke='#3d6b2f' stroke-width='3' fill='none' stroke-linecap='round'/>` +
    `<ellipse cx='20' cy='37' rx='13' ry='19' fill='#f57c00' stroke='${INK}' stroke-width='2'/><ellipse cx='44' cy='37' rx='13' ry='19' fill='#f57c00' stroke='${INK}' stroke-width='2'/><ellipse cx='32' cy='37' rx='12' ry='20' fill='#fb8c00' stroke='${INK}' stroke-width='2'/>` +
    `<path class='e' d='M20 32l6-6 4 6ZM34 32l6-6 4 6ZM20 42c4 6 20 6 24 0l-4 2-3-3-3 4-3-4-3 3-4-2Z' fill='#ffeb3b' stroke='#5d2c00' stroke-width='1.2'/>`,
  `.e{animation:gw 1.6s ease-in-out infinite alternate}@keyframes gw{0%{fill:#ffd54f}100%{fill:#fff59d}}`,
);
const murcielago = wrap(
  `<g class='w'><path d='M32 34C24 22 12 20 3 26c5 1 7 4 7 8 3-3 7-3 9 0 2-3 6-3 8 1Z' fill='#3a2b52'/><path d='M32 34c8-12 20-14 29-8-5 1-7 4-7 8-3-3-7-3-9 0-2-3-6-3-8 1Z' fill='#3a2b52'/></g>` +
    `<ellipse cx='32' cy='34' rx='6' ry='8' fill='#2a1d3d'/><path d='M27 27l2-5 2 4M37 27l-2-5-2 4' fill='#2a1d3d'/>` +
    `<circle cx='29.5' cy='32' r='1.6' fill='#ffeb3b'/><circle cx='34.5' cy='32' r='1.6' fill='#ffeb3b'/>`,
  `.w{transform-origin:32px 32px;animation:fp .35s ease-in-out infinite alternate}@keyframes fp{0%{transform:scaleY(1)}100%{transform:scaleY(.55)}}`,
);
const fantasma = wrap(
  `<path d='M14 54V28C14 16 22 8 32 8s18 8 18 20v26l-5-4-4 5-4-5-5 5-4-5-4 5-4-5Z' fill='#fff' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/>` +
    `<ellipse cx='26' cy='28' rx='2.6' ry='3.6' fill='${INK}'/><ellipse cx='38' cy='28' rx='2.6' ry='3.6' fill='${INK}'/><ellipse cx='32' cy='37' rx='3' ry='4' fill='${INK}'/>` +
    `<circle cx='22' cy='33' r='2' fill='#f8bbd0'/><circle cx='42' cy='33' r='2' fill='#f8bbd0'/>`,
);
const dulce = wrap(
  `<path d='M18 32 6 22v20Z M46 32l12-10v20Z' fill='#ab47bc' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/>` +
    `<circle cx='32' cy='32' r='14' fill='#ff9800' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M22 24c6 4 14 12 18 18M26 20c6 4 12 10 16 18' stroke='#fff3e0' stroke-width='3' fill='none'/>`,
);

/* ------------------------------------------------------------------ Navidad, Año Nuevo y Reyes */
const arbol = wrap(
  `<path d='M32 6 14 30h8L10 46h12L6 58h52L42 46h12L42 30h8Z' fill='#2e7d32' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/>` +
    `<rect x='28' y='57' width='8' height='6' fill='#8d5524'/>` +
    `<path class='s' d='M32 1l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5-3.7-3.4 5-.6Z' fill='#ffd54f' stroke='#c79100'/>` +
    `<circle class='b1' cx='24' cy='38' r='2.6' fill='#e53935'/><circle class='b2' cx='38' cy='30' r='2.6' fill='#fbc02d'/><circle class='b1' cx='40' cy='50' r='2.6' fill='#1e88e5'/><circle class='b2' cx='22' cy='52' r='2.6' fill='#fbc02d'/><circle class='b1' cx='32' cy='22' r='2.2' fill='#e53935'/>`,
  `.b1{animation:tw 1s steps(2) infinite}.b2{animation:tw 1s steps(2) .5s infinite}.s{transform-origin:32px 8px;animation:sp 3s ease-in-out infinite}@keyframes tw{50%{opacity:.35}}@keyframes sp{50%{transform:scale(1.15)}}`,
);
const esfera = wrap(
  `<path d='M32 4v8' stroke='#9e9e9e' stroke-width='2'/><rect x='26' y='10' width='12' height='7' rx='2' fill='#fbc02d' stroke='${INK}' stroke-width='1.6'/>` +
    `<circle cx='32' cy='38' r='22' fill='#e53935' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M11 34c7 4 14 4 21 0s14-4 21 0' stroke='#fff' stroke-width='3' fill='none' opacity='.85'/><path d='M12 44c7 4 13 4 20 0s14-4 20 0' stroke='#fbc02d' stroke-width='3' fill='none'/>` +
    `<ellipse cx='23' cy='27' rx='5' ry='3' fill='#fff' opacity='.55' transform='rotate(-30 23 27)'/>`,
);
const baston = wrap(
  `<defs><clipPath id='c'><path d='M40 60V22a10 10 0 1 0-20 0v4' fill='none' stroke='#000' stroke-width='9' stroke-linecap='round'/></clipPath></defs>` +
    `<path d='M40 60V22a10 10 0 1 0-20 0v4' fill='none' stroke='${INK}' stroke-width='12' stroke-linecap='round'/>` +
    `<path d='M40 60V22a10 10 0 1 0-20 0v4' fill='none' stroke='#fff' stroke-width='9' stroke-linecap='round'/>` +
    `<path d='M40 60V22a10 10 0 1 0-20 0v4' fill='none' stroke='#e53935' stroke-width='9' stroke-linecap='butt' stroke-dasharray='5 5'/>`,
);
const regalo = (box: string, ribbon: string) =>
  wrap(
    `<rect x='10' y='26' width='44' height='32' rx='3' fill='${box}' stroke='${INK}' stroke-width='2'/><rect x='7' y='18' width='50' height='10' rx='3' fill='${box}' stroke='${INK}' stroke-width='2'/>` +
      `<rect x='28' y='18' width='8' height='40' fill='${ribbon}'/>` +
      `<path d='M32 18c-6-10-16-10-14-3 1 4 8 3 14 3Zm0 0c6-10 16-10 14-3-1 4-8 3-14 3Z' fill='${ribbon}' stroke='${INK}' stroke-width='1.6'/>`,
  );
const copa = wrap(
  `<circle class='u' cx='28' cy='30' r='1.6' fill='#fff8e1'/><circle class='u u2' cx='34' cy='34' r='1.2' fill='#fff8e1'/><circle class='u u3' cx='31' cy='38' r='1.4' fill='#fff8e1'/>` +
    `<path d='M20 8h24l-3 22a9 9 0 0 1-18 0Z' fill='#ffe082' fill-opacity='.85' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M21 14h22' stroke='#fff' stroke-width='2' opacity='.7'/><path d='M32 39v15M23 56h18' stroke='${INK}' stroke-width='2.6' stroke-linecap='round'/>`,
  `.u{animation:up 2s linear infinite}.u2{animation-delay:.6s}.u3{animation-delay:1.2s}@keyframes up{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-24px);opacity:0}}`,
);
const fuego = wrap(
  Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 12;
    const c = ["#ffd54f", "#e91e63", "#4fc3f7", "#ab47bc"][i % 4];
    return `<path d='M${32 + 8 * Math.cos(a)} ${32 + 8 * Math.sin(a)} L${32 + 26 * Math.cos(a)} ${32 + 26 * Math.sin(a)}' stroke='${c}' stroke-width='3' stroke-linecap='round'/><circle cx='${32 + 28 * Math.cos(a)}' cy='${32 + 28 * Math.sin(a)}' r='2' fill='${c}'/>`;
  }).join("") + `<circle cx='32' cy='32' r='4' fill='#fff59d'/>`,
  `svg{transform-origin:center;animation:bo 1.8s ease-out infinite}@keyframes bo{0%{transform:scale(.4);opacity:0}30%{opacity:1}100%{transform:scale(1);opacity:0}}`,
);
const corona = wrap(
  `<path d='M8 50 6 18l14 14 12-20 12 20 14-14-2 32Z' fill='#fbc02d' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/>` +
    `<rect x='8' y='48' width='48' height='9' rx='2' fill='#f9a825' stroke='${INK}' stroke-width='2'/>` +
    `<circle cx='32' cy='38' r='4' fill='#e53935'/><circle cx='18' cy='41' r='3' fill='#1e88e5'/><circle cx='46' cy='41' r='3' fill='#43a047'/>` +
    `<circle cx='6' cy='18' r='3' fill='#fbc02d' stroke='${INK}' stroke-width='1.4'/><circle cx='32' cy='12' r='3' fill='#fbc02d' stroke='${INK}' stroke-width='1.4'/><circle cx='58' cy='18' r='3' fill='#fbc02d' stroke='${INK}' stroke-width='1.4'/>`,
);
const rosca = wrap(
  `<ellipse cx='32' cy='34' rx='27' ry='20' fill='#e0a15a' stroke='${INK}' stroke-width='2'/><ellipse cx='32' cy='34' rx='12' ry='7' fill='#fff8ee' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M10 28c5-4 9-6 14-5M40 18c6 0 10 2 14 6M44 50c-5 1-9 1-13 0M9 40c2 4 5 7 9 8' stroke='#fff3e0' stroke-width='3' stroke-linecap='round'/>` +
    `<rect x='20' y='17' width='9' height='5' rx='2' fill='#e53935' transform='rotate(-15 24 19)'/><rect x='44' y='36' width='9' height='5' rx='2' fill='#43a047' transform='rotate(20 48 38)'/><rect x='14' y='38' width='8' height='5' rx='2' fill='#fbc02d'/><rect x='34' y='47' width='8' height='4' rx='2' fill='#e53935'/>`,
);
const estrella = (fill: string) =>
  wrap(
    `<path d='M32 4l7.6 17.3 18.9 1.8-14.3 12.5 4.2 18.5L32 44.4 15.6 54.1l4.2-18.5L5.5 23.1l18.9-1.8Z' fill='${fill}' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/><path d='M25 22l3 6' stroke='#fff' stroke-width='2.4' stroke-linecap='round' opacity='.7'/>`,
    `svg{transform-origin:center;animation:tw 2.4s ease-in-out infinite}@keyframes tw{50%{transform:scale(.88) rotate(8deg)}}`,
  );

/* ------------------------------------------------------------------ 14 de febrero, Madres, Primavera */
const corazon = (fill: string) =>
  wrap(
    `<path d='M32 56C10 42 4 30 8 20c4-10 18-12 24-2 6-10 20-8 24 2 4 10-2 22-24 36Z' fill='${fill}' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/><ellipse cx='20' cy='22' rx='5' ry='3' fill='#fff' opacity='.5' transform='rotate(-30 20 22)'/>`,
    `svg{transform-origin:center;animation:hb 1.2s ease-in-out infinite}@keyframes hb{15%{transform:scale(1.08)}30%{transform:scale(1)}45%{transform:scale(1.06)}}`,
  );
const carta = wrap(
  `<rect x='6' y='16' width='52' height='36' rx='3' fill='#fff' stroke='${INK}' stroke-width='2'/><path d='M6 18l26 20 26-20' fill='none' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M32 46c-6-4-8-7-6-10 1.5-2 4.5-1.5 6 .5 1.5-2 4.5-2.5 6-.5 2 3 0 6-6 10Z' fill='#e53950'/>`,
);
const rosa = (fill: string) =>
  wrap(
    `<path d='M32 36v24' stroke='#388e3c' stroke-width='3'/><path d='M32 48c-6-6-14-4-14-4s4 8 14 4ZM32 52c6-6 14-4 14-4s-4 8-14 4Z' fill='#66bb6a'/>` +
      `<circle cx='32' cy='22' r='16' fill='${fill}' stroke='${INK}' stroke-width='2'/>` +
      `<path d='M32 12c-6 0-9 5-7 10s9 6 12 2 1-9-3-9c-3 0-5 3-3 5' fill='none' stroke='${INK}' stroke-width='1.6' opacity='.6'/>`,
  );
const tulipan = (fill: string) =>
  wrap(
    `<path d='M32 34v26' stroke='#388e3c' stroke-width='3'/><path d='M32 52c-8-2-12-10-10-16 6 2 10 8 10 16Z' fill='#66bb6a'/>` +
      `<path d='M18 14c0 14 6 22 14 22s14-8 14-22l-7 6-7-10-7 10Z' fill='${fill}' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/>`,
    `svg{transform-origin:32px 60px;animation:sw 3s ease-in-out infinite}@keyframes sw{50%{transform:rotate(6deg)}}`,
  );
const florAmarilla = wrap(
  petals(32, 32, 12, 26, 6, "#fbc02d") + petals(32, 32, 12, 18, 4.5, "#ffeb3b", 15) + `<circle cx='32' cy='32' r='8' fill='#8d5524' stroke='${INK}' stroke-width='1.6'/>` + ring(32, 32, 4, 6, 1.1, "#5d3a1a"),
  `svg{transform-origin:center;animation:rt 12s linear infinite}@keyframes rt{to{transform:rotate(360deg)}}`,
);
const mariposa = wrap(
  `<g class='l'><path d='M31 32C24 16 8 14 8 24s10 10 23 8Z' fill='#fbc02d' stroke='${INK}' stroke-width='1.8'/><path d='M31 34C22 36 12 44 18 50s12-6 13-16Z' fill='#ffb300' stroke='${INK}' stroke-width='1.8'/></g>` +
    `<g class='r'><path d='M33 32c7-16 23-18 23-8s-10 10-23 8Z' fill='#fbc02d' stroke='${INK}' stroke-width='1.8'/><path d='M33 34c9 2 19 10 13 16s-12-6-13-16Z' fill='#ffb300' stroke='${INK}' stroke-width='1.8'/></g>` +
    `<rect x='30' y='22' width='4' height='24' rx='2' fill='${INK}'/><path d='M31 22c-2-5-5-7-7-7M33 22c2-5 5-7 7-7' stroke='${INK}' stroke-width='1.4' fill='none'/>`,
  `.l{transform-origin:32px 32px;animation:fl .5s ease-in-out infinite alternate}.r{transform-origin:32px 32px;animation:fr .5s ease-in-out infinite alternate}@keyframes fl{to{transform:scaleX(.6)}}@keyframes fr{to{transform:scaleX(.6)}}`,
);

/* ------------------------------------------------------------------ Niño, Maestro, Padre */
const globo = (fill: string) =>
  wrap(
    `<path d='M32 46c-2 6 3 9 0 16' stroke='${INK}' stroke-width='1.4' fill='none'/>` +
      `<ellipse cx='32' cy='24' rx='16' ry='20' fill='${fill}' stroke='${INK}' stroke-width='2'/><path d='M29 44h6l-3 4Z' fill='${fill}' stroke='${INK}' stroke-width='1.4'/>` +
      `<ellipse cx='25' cy='16' rx='3.5' ry='6' fill='#fff' opacity='.5' transform='rotate(20 25 16)'/>`,
  );
const papalote = wrap(
  `<path d='M32 4 54 26 32 44 10 26Z' fill='#ffeb3b' stroke='${INK}' stroke-width='2'/><path d='M32 4v40M10 26h44' stroke='${INK}' stroke-width='1.4'/><path d='M32 4 54 26H32ZM32 44 10 26h22Z' fill='#e53935'/>` +
    `<path d='M32 44c-4 4 4 6 0 10s4 6 0 9' stroke='${INK}' stroke-width='1.4' fill='none'/><path d='M28 50l4 2-4 2ZM36 57l-4 1 4 2Z' fill='#1e88e5'/>`,
  `svg{transform-origin:32px 44px;animation:sw 2.5s ease-in-out infinite}@keyframes sw{50%{transform:rotate(-8deg)}}`,
);
const paleta = wrap(
  `<path d='M32 40v22' stroke='#d7b98e' stroke-width='4' stroke-linecap='round'/><circle cx='32' cy='24' r='18' fill='#f06292' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M32 24m0 0a4 4 0 1 1 4 4 8 8 0 1 1-8-8 12 12 0 1 1 12 12' fill='none' stroke='#fff' stroke-width='3'/>`,
);
const rehilete = (a: string, b: string, c: string, d: string) =>
  wrap(
    `<path d='M32 34v28' stroke='${INK}' stroke-width='2.4'/>` +
      `<g class='p'><path d='M32 32 32 6 48 22Z' fill='${a}' stroke='${INK}' stroke-width='1.6'/><path d='M32 32 58 32 42 48Z' fill='${b}' stroke='${INK}' stroke-width='1.6'/><path d='M32 32 32 58 16 42Z' fill='${c}' stroke='${INK}' stroke-width='1.6'/><path d='M32 32 6 32 22 16Z' fill='${d}' stroke='${INK}' stroke-width='1.6'/><circle cx='32' cy='32' r='3' fill='#fbc02d' stroke='${INK}'/></g>`,
    `.p{transform-origin:32px 32px;animation:sp 3s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`,
  );
const manzana = wrap(
  `<path d='M32 18c0-6 3-10 7-12' stroke='#6d4c41' stroke-width='3' fill='none' stroke-linecap='round'/><path d='M34 14c6-6 14-4 14-4s-2 8-12 8Z' fill='#66bb6a' stroke='${INK}' stroke-width='1.4'/>` +
    `<path d='M32 20c-6-4-20-4-22 10s8 28 16 28c3 0 4-2 6-2s3 2 6 2c8 0 18-14 16-28s-16-14-22-10Z' fill='#e53935' stroke='${INK}' stroke-width='2'/><ellipse cx='20' cy='30' rx='3.4' ry='6' fill='#fff' opacity='.45'/>`,
);
const lapiz = wrap(
  `<g transform='rotate(-40 32 32)'><rect x='26' y='6' width='12' height='38' fill='#fbc02d' stroke='${INK}' stroke-width='2'/><rect x='26' y='2' width='12' height='6' rx='2' fill='#f48fb1' stroke='${INK}' stroke-width='2'/><path d='M26 44h12l-6 14Z' fill='#ffe0b2' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/><path d='M30 53h4l-2 5Z' fill='${INK}'/><path d='M32 10v32' stroke='#f9a825' stroke-width='2'/></g>`,
);
const libro = wrap(
  `<path d='M8 14c8-3 16-3 24 2v40c-8-5-16-5-24-2Z' fill='#42a5f5' stroke='${INK}' stroke-width='2'/><path d='M56 14c-8-3-16-3-24 2v40c8-5 16-5 24-2Z' fill='#1e88e5' stroke='${INK}' stroke-width='2'/>` +
    `<path d='M13 24c5-1 10-1 14 1M13 31c5-1 10-1 14 1M37 25c4-2 9-2 14-1M37 32c4-2 9-2 14-1' stroke='#e3f2fd' stroke-width='1.8'/>`,
);
const corbata = wrap(
  `<path d='M24 6h16l-3 8h-10Z' fill='#1f4e79' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/><path d='M27 14h10l7 32-12 14-12-14Z' fill='#2f6fa8' stroke='${INK}' stroke-width='2' stroke-linejoin='round'/>` +
    `<path d='M24 30l16-6M22 40l20-8M24 50l16-6' stroke='#c08a3e' stroke-width='2.4'/>`,
);
const bigote = wrap(
  `<path d='M32 30c-4-6-12-8-18-4-5 3-6 10-12 10 4 6 12 6 18 2 5-3 8-6 12-8 4 2 7 5 12 8 6 4 14 4 18-2-6 0-7-7-12-10-6-4-14-2-18 4Z' fill='#4e342e' stroke='${INK}' stroke-width='1.6'/>`,
);
const taza = wrap(
  `<path class='v' d='M24 16c-3-4 3-6 0-10M32 16c-3-4 3-6 0-10M40 16c-3-4 3-6 0-10' stroke='#bcaaa4' stroke-width='2' fill='none' stroke-linecap='round'/>` +
    `<path d='M12 22h36v16a14 14 0 0 1-14 14h-8a14 14 0 0 1-14-14Z' fill='#fff' stroke='${INK}' stroke-width='2'/><path d='M48 26h4a6 6 0 0 1 0 12h-5' fill='none' stroke='${INK}' stroke-width='2.4'/>` +
    `<path d='M24 34c-3-2-3-5-1-6 1-.5 2 0 2 1 0-1 1-1.5 2-1 2 1 2 4-3 6Z' fill='#e53935'/><rect x='10' y='54' width='40' height='4' rx='2' fill='#d7ccc8'/>`,
  `.v{animation:st 2s ease-in-out infinite}@keyframes st{0%{opacity:0;transform:translateY(4px)}50%{opacity:1}100%{opacity:0;transform:translateY(-4px)}}`,
);

/* ------------------------------------------------------------------ Fiestas patrias */
const bandera = wrap(
  `<path d='M10 6v54' stroke='${INK}' stroke-width='3' stroke-linecap='round'/>` +
    `<g class='w'><path d='M12 10h14v30H12Z' fill='#006847'/><path d='M26 10h14v30H26Z' fill='#fff'/><path d='M40 10h14v30H40Z' fill='#ce1126'/><path d='M12 10h42v30H12Z' fill='none' stroke='${INK}' stroke-width='2'/><circle cx='33' cy='25' r='4' fill='#8d6e3f'/><path d='M29 28c3 2 5 2 8 0' stroke='#43a047' stroke-width='1.4' fill='none'/></g>`,
  `.w{transform-origin:12px 25px;animation:wv 1.6s ease-in-out infinite alternate}@keyframes wv{to{transform:skewY(-4deg) scaleX(.96)}}`,
);
const campana = wrap(
  `<g class='b'><path d='M32 6a4 4 0 0 1 4 4c10 2 14 12 14 22 0 8 4 12 6 14H8c2-2 6-6 6-14 0-10 4-20 14-22a4 4 0 0 1 4-4Z' fill='#fbc02d' stroke='${INK}' stroke-width='2'/><circle cx='32' cy='52' r='5' fill='#f9a825' stroke='${INK}' stroke-width='2'/><path d='M20 26c2-6 6-9 10-10' stroke='#fff' stroke-width='2.4' opacity='.6' fill='none'/></g>`,
  `.b{transform-origin:32px 8px;animation:dg 1.8s ease-in-out infinite}@keyframes dg{25%{transform:rotate(12deg)}75%{transform:rotate(-12deg)}}`,
);
const chile = wrap(
  `<path d='M44 12c4-4 8-4 10-2' stroke='#2e7d32' stroke-width='3' fill='none' stroke-linecap='round'/><path d='M40 14c6 0 8 4 6 10-4 14-16 28-34 30 10-6 18-18 20-30 1-7 3-10 8-10Z' fill='#43a047' stroke='${INK}' stroke-width='2'/><path d='M38 20c-2 10-8 20-16 26' stroke='#a5d6a7' stroke-width='2' fill='none' opacity='.8'/>`,
);

export const ART = {
  calavera, marigold, vela, pan, calabaza, murcielago, fantasma, dulce, arbol, esfera, baston,
  regaloRojo: regalo("#e53935", "#fbc02d"), regaloMorado: regalo("#7b2d8e", "#fbc02d"), regaloRosa: regalo("#f06292", "#fff"),
  copa, fuego, corona, rosca, estrellaOro: estrella("#fbc02d"), estrellaPlata: estrella("#cfd8dc"),
  corazonRojo: corazon("#e53950"), corazonRosa: corazon("#f48fb1"), carta, rosaRoja: rosa("#e53950"), rosaRosa: rosa("#f48fb1"),
  tulipanRosa: tulipan("#ec407a"), tulipanAmarillo: tulipan("#fbc02d"), florAmarilla, mariposa,
  globoRojo: globo("#e53935"), globoAzul: globo("#1e88e5"), globoAmarillo: globo("#fbc02d"), papalote, paleta,
  rehileteNino: rehilete("#e53935", "#fbc02d", "#1e88e5", "#43a047"), manzana, lapiz, libro, corbata, bigote, taza,
  bandera, campana, chile, rehileteMx: rehilete("#006847", "#fff", "#ce1126", "#fff"),
};
export type ArtName = keyof typeof ART;

/** Ilustraciones de cada temporada (la primera es la "estrella" del tema) */
export const THEME_ART: Record<FestiveId, ArtName[]> = {
  muertos: ["calavera", "marigold", "vela", "pan"],
  halloween: ["calabaza", "murcielago", "fantasma", "dulce"],
  navidad: ["arbol", "esfera", "baston", "regaloRojo"],
  anonuevo: ["copa", "fuego", "estrellaOro", "estrellaPlata"],
  reyes: ["corona", "rosca", "estrellaOro", "regaloMorado"],
  sanvalentin: ["corazonRojo", "carta", "rosaRoja", "corazonRosa"],
  primavera: ["florAmarilla", "mariposa", "tulipanAmarillo", "florAmarilla"],
  nino: ["globoRojo", "papalote", "paleta", "rehileteNino"],
  madres: ["tulipanRosa", "corazonRosa", "rosaRosa", "regaloRosa"],
  maestro: ["manzana", "lapiz", "libro", "estrellaOro"],
  padre: ["corbata", "bigote", "taza", "estrellaOro"],
  independencia: ["bandera", "campana", "rehileteMx", "chile"],
};

export const artUri = (name: ArtName) => `data:image/svg+xml,${encodeURIComponent(ART[name])}`;
export const artCss = (name: ArtName) => `url("${artUri(name)}")`;
