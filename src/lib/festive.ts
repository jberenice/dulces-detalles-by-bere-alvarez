/**
 * Temas de fechas especiales (México): adornos, partículas y colores para la página principal, el panel y las tiendas.
 * Todo se dibuja con SVG ligero (sin imágenes) y se activa solo según la fecha, o fijo si la repostería lo elige.
 */

export type FestiveId =
  | "navidad"
  | "anonuevo"
  | "reyes"
  | "sanvalentin"
  | "primavera"
  | "nino"
  | "madres"
  | "maestro"
  | "padre"
  | "independencia"
  | "halloween"
  | "muertos";

export type FestiveTheme = {
  id: FestiveId;
  name: string;
  emoji: string;
  /** Rango de fechas: [mes, día] inclusive (el del padre se calcula: tercer domingo de junio) */
  from: [number, number];
  to: [number, number];
  /** Paleta de la temporada (para quien elija usar los colores de la temporada) */
  colors: { primary: string; accent: string; background: string; surface: string; text: string };
  /** Colores para botones e íconos del panel y la página principal (con buen contraste para texto blanco) */
  ui: { primary: string; accent: string };
  /** Lo que cae de arriba */
  particles: string[];
  /** Guirnalda */
  garland: () => { image: string; width: number; height: number };
  /** Mensajes */
  hero: string;
  store: string;
  dashboard: string;
};

const svg = (w: number, h: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;

const string = (w: number, sag = 6) => `<path d='M0 3 Q${w / 2} ${3 + sag} ${w} 3' fill='none' stroke='#6b4a2b' stroke-opacity='.55' stroke-width='1.4'/>`;

/** Banderines triangulares */
function pennants(colors: string[]) {
  const fw = 34;
  const w = fw * colors.length;
  const flags = colors
    .map((c, i) => {
      const x = i * fw + 3;
      const y = 3 + Math.sin(((i + 0.5) / colors.length) * Math.PI) * 6;
      return `<path d='M${x} ${y} L${x + fw - 6} ${y} L${x + (fw - 6) / 2} ${y + 30} Z' fill='${c}'/><path d='M${x} ${y} L${x + fw - 6} ${y}' stroke='#000' stroke-opacity='.08' stroke-width='3'/>`;
    })
    .join("");
  return { image: svg(w, 46, string(w) + flags), width: w, height: 46 };
}

/** Papel picado: banderitas rectangulares con picos abajo y figuras recortadas */
function papelPicado(colors: string[]) {
  const fw = 46;
  const w = fw * colors.length;
  const flags = colors
    .map((c, i) => {
      const x = i * fw + 3;
      const y = 3 + Math.sin(((i + 0.5) / colors.length) * Math.PI) * 5;
      const fwi = fw - 6;
      // borde de abajo en picos
      let edge = "";
      for (let k = 0; k <= 8; k++) edge += ` L${x + fwi - (k * fwi) / 8} ${y + (k % 2 ? 40 : 44)}`;
      const cx = x + fwi / 2;
      // recortes: flor, rombos y puntos (se ven como huecos con fill-rule evenodd)
      const holes =
        `M${cx} ${y + 12} m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0` +
        ` M${cx} ${y + 22} l5 6 l-5 6 l-5 -6 Z` +
        ` M${x + 6} ${y + 7} h4 v4 h-4 Z M${x + fwi - 10} ${y + 7} h4 v4 h-4 Z` +
        ` M${x + 7} ${y + 30} m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M${x + fwi - 7} ${y + 30} m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0`;
      return `<path fill-rule='evenodd' fill='${c}' fill-opacity='.95' d='M${x} ${y} L${x + fwi} ${y} L${x + fwi} ${y + 44}${edge} Z ${holes}'/>`;
    })
    .join("");
  return { image: svg(w, 52, string(w, 5) + flags), width: w, height: 52 };
}

/** Focos navideños */
function bulbs(colors: string[]) {
  const step = 30;
  const w = step * colors.length;
  const items = colors
    .map((c, i) => {
      const x = i * step + step / 2;
      const y = 4 + Math.sin(((i + 0.5) / colors.length) * Math.PI) * 7;
      return `<rect x='${x - 3}' y='${y}' width='6' height='5' rx='1' fill='#5b6b5a'/><ellipse cx='${x}' cy='${y + 13}' rx='6' ry='9' fill='${c}'/><ellipse cx='${x - 2}' cy='${y + 10}' rx='1.8' ry='3' fill='#fff' fill-opacity='.55'/>`;
    })
    .join("");
  return { image: svg(w, 34, string(w, 7) + items), width: w, height: 34 };
}

/** Figuras colgando de un hilo (corazones, flores, manzanas…) */
function hanging(colors: string[], shape: (x: number, y: number, c: string) => string, step = 32, h = 40) {
  const w = step * colors.length;
  const items = colors
    .map((c, i) => {
      const x = i * step + step / 2;
      const y = 3 + Math.sin(((i + 0.5) / colors.length) * Math.PI) * 6;
      const len = 8 + (i % 2) * 6;
      return `<path d='M${x} ${y} V${y + len}' stroke='#6b4a2b' stroke-opacity='.45' stroke-width='1'/>${shape(x, y + len, c)}`;
    })
    .join("");
  return { image: svg(w, h, string(w) + items), width: w, height: h };
}
const heart = (x: number, y: number, c: string) =>
  `<path d='M${x} ${y + 14} C${x - 12} ${y + 6} ${x - 8} ${y - 3} ${x} ${y + 3} C${x + 8} ${y - 3} ${x + 12} ${y + 6} ${x} ${y + 14} Z' fill='${c}'/>`;
const flower = (center: string) => (x: number, y: number, c: string) =>
  [0, 72, 144, 216, 288]
    .map((a) => `<ellipse cx='${x}' cy='${y + 2}' rx='3.6' ry='6' fill='${c}' transform='rotate(${a} ${x} ${y + 7})'/>`)
    .join("") + `<circle cx='${x}' cy='${y + 7}' r='3' fill='${center}'/>`;
const apple = (x: number, y: number, c: string) =>
  `<circle cx='${x - 3}' cy='${y + 8}' r='6' fill='${c}'/><circle cx='${x + 3}' cy='${y + 8}' r='6' fill='${c}'/><path d='M${x} ${y + 1} q4 -4 7 -2' stroke='#3f7d3a' stroke-width='2' fill='none'/>`;
const pumpkin = (x: number, y: number, c: string) =>
  `<ellipse cx='${x - 4}' cy='${y + 8}' rx='5' ry='6' fill='${c}'/><ellipse cx='${x + 4}' cy='${y + 8}' rx='5' ry='6' fill='${c}'/><ellipse cx='${x}' cy='${y + 8}' rx='5' ry='6.5' fill='${c}'/><rect x='${x - 1}' y='${y}' width='2' height='3' fill='#3d6b2f'/>`;
const star = (x: number, y: number, c: string) => {
  const pts = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? 3.2 : 8;
    const a = (Math.PI / 5) * k - Math.PI / 2;
    return `${(x + r * Math.cos(a)).toFixed(1)},${(y + 8 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return `<polygon points='${pts}' fill='${c}'/>`;
};
const crown = (x: number, y: number, c: string) =>
  `<path d='M${x - 8} ${y + 14} L${x - 8} ${y + 4} L${x - 4} ${y + 9} L${x} ${y + 2} L${x + 4} ${y + 9} L${x + 8} ${y + 4} L${x + 8} ${y + 14} Z' fill='${c}'/><circle cx='${x}' cy='${y + 2}' r='1.6' fill='#fff' fill-opacity='.8'/>`;
const balloon = (x: number, y: number, c: string) =>
  `<ellipse cx='${x}' cy='${y + 8}' rx='6.5' ry='8' fill='${c}'/><path d='M${x - 1.5} ${y + 16} h3 l-1.5 2 Z' fill='${c}'/><ellipse cx='${x - 2}' cy='${y + 5}' rx='1.6' ry='2.6' fill='#fff' fill-opacity='.5'/>`;

const T: FestiveTheme[] = [
  {
    id: "navidad",
    ui: { primary: "#c0392b", accent: "#2e7d4f" },
    name: "Navidad",
    emoji: "🎄",
    from: [12, 1],
    to: [12, 25],
    colors: { primary: "#c0392b", accent: "#2e7d4f", background: "#fff8f2", surface: "#ffffff", text: "#3a1b10" },
    particles: ["❄", "❅", "❆", "✦"],
    garland: () => bulbs(["#e53935", "#fbc02d", "#43a047", "#1e88e5", "#e53935", "#fbc02d", "#43a047", "#ab47bc"]),
    hero: "¡Feliz Navidad! Organiza tus pedidos navideños",
    store: "🎄 ¡Feliz Navidad! Pide tus postres navideños con anticipación",
    dashboard: "Temporada navideña: arma tu caja de galletas, roscas y postres de cena",
  },
  {
    id: "anonuevo",
    ui: { primary: "#8a6508", accent: "#2b2b3a" },
    name: "Año Nuevo",
    emoji: "🥂",
    from: [12, 26],
    to: [12, 31],
    colors: { primary: "#b8860b", accent: "#2b2b3a", background: "#fffbf2", surface: "#ffffff", text: "#24201a" },
    particles: ["✨", "✦", "★", "•"],
    garland: () => hanging(["#d4af37", "#c0c0c0", "#2b2b3a", "#d4af37", "#e5c97a", "#2b2b3a"], star, 30, 38),
    hero: "¡Feliz Año Nuevo! Postres para recibir el año",
    store: "🥂 ¡Feliz Año Nuevo! Pide tus postres para la cena de fin de año",
    dashboard: "Fin de año: postres para la cena, mesas de dulces y pedidos para el 31",
  },
  {
    id: "reyes",
    ui: { primary: "#7b2d8e", accent: "#a87b10" },
    name: "Día de Reyes",
    emoji: "👑",
    from: [1, 1],
    to: [1, 6],
    colors: { primary: "#7b2d8e", accent: "#d4a017", background: "#fdf8f2", surface: "#ffffff", text: "#2e1a33" },
    particles: ["★", "✦", "👑"],
    garland: () => hanging(["#d4a017", "#7b2d8e", "#c0392b", "#d4a017", "#2e7d4f", "#7b2d8e"], crown, 30, 38),
    hero: "6 de enero: roscas de Reyes y postres para partir",
    store: "👑 Día de Reyes: aparta tu rosca",
    dashboard: "Día de Reyes: abre pedidos de rosca con anticipación y define tamaños",
  },
  {
    id: "sanvalentin",
    ui: { primary: "#d81b60", accent: "#b83b6b" },
    name: "14 de febrero",
    emoji: "💘",
    from: [2, 1],
    to: [2, 29], // todo febrero (en años no bisiestos termina el 28)
    colors: { primary: "#d81b60", accent: "#f48fb1", background: "#fff5f8", surface: "#ffffff", text: "#4a1028" },
    particles: ["❤", "♥", "💗", "✿"],
    garland: () => hanging(["#e53950", "#f48fb1", "#d81b60", "#ff8a80", "#e53950", "#f8bbd0"], heart),
    hero: "Día del amor y la amistad: cajas y detalles para regalar",
    store: "💘 Día del amor y la amistad: regala algo dulce",
    dashboard: "Se acerca el 14 de febrero: crea tu caja del amor y un cupón para parejas",
  },
  {
    id: "primavera",
    ui: { primary: "#a16c00", accent: "#4f8a3a" },
    name: "Primavera (flores amarillas)",
    emoji: "🌼",
    from: [3, 14],
    to: [3, 21],
    colors: { primary: "#e0a100", accent: "#6aa84f", background: "#fffdf0", surface: "#ffffff", text: "#3d3410" },
    particles: ["✿", "❀", "🌼", "💛"],
    garland: () => hanging(["#fbc02d", "#ffd54f", "#f9a825", "#ffe082", "#fbc02d", "#ffca28"], flower("#e67e22"), 30, 38),
    hero: "21 de marzo: llegó la primavera y las flores amarillas 🌼",
    store: "🌼 Primavera: regala flores amarillas… ¡y algo dulce!",
    dashboard: "21 de marzo: arma un detalle con flores amarillas comestibles o cupcakes amarillos",
  },
  {
    id: "nino",
    ui: { primary: "#1e6fd0", accent: "#d17a00" },
    name: "Día del Niño",
    emoji: "🎈",
    from: [4, 20],
    to: [4, 30],
    colors: { primary: "#1e88e5", accent: "#fbc02d", background: "#f5fbff", surface: "#ffffff", text: "#13314d" },
    particles: ["★", "●", "▲", "■"],
    garland: () => hanging(["#e53935", "#fbc02d", "#43a047", "#1e88e5", "#8e24aa", "#fb8c00"], balloon, 30, 44),
    hero: "30 de abril: dulces para celebrar a los peques",
    store: "🎈 Día del Niño: postres divertidos para los peques",
    dashboard: "Día del Niño: paletas, cupcakes de colores y bolos para fiestas escolares",
  },
  {
    id: "madres",
    ui: { primary: "#8a3ba6", accent: "#2f7d5b" },
    name: "Día de las Madres",
    emoji: "💐",
    from: [5, 1],
    to: [5, 10],
    colors: { primary: "#8a3ba6", accent: "#2f7d5b", background: "#fbf6fe", surface: "#ffffff", text: "#341a44" },
    particles: ["✿", "❀", "❁", "✾"],
    garland: () => hanging(["#b57edc", "#ce93d8", "#8e44ad", "#f3c6e0", "#b39ddb", "#9c27b0"], flower("#fff59d"), 30, 38),
    hero: "10 de mayo: el detalle más dulce para mamá",
    store: "💐 10 de mayo: consiente a mamá con algo dulce",
    dashboard: "Se acerca el 10 de mayo: tu temporada más fuerte. Abre pedidos con anticipación",
  },
  {
    id: "maestro",
    ui: { primary: "#c62828", accent: "#2e7d32" },
    name: "Día del Maestro",
    emoji: "🍎",
    from: [5, 11],
    to: [5, 15],
    colors: { primary: "#c62828", accent: "#2e7d32", background: "#fffaf3", surface: "#ffffff", text: "#3a2210" },
    particles: ["✎", "★", "🍎", "✓"],
    garland: () => hanging(["#e53935", "#43a047", "#e53935", "#fbc02d", "#e53935", "#43a047"], apple, 30, 36),
    hero: "15 de mayo: agradece a los maestros con un detalle dulce",
    store: "🍎 Día del Maestro: detalles para agradecer",
    dashboard: "15 de mayo: ofrece cajitas individuales para regalar a maestros",
  },
  {
    id: "padre",
    ui: { primary: "#1f4e79", accent: "#a8742f" },
    name: "Día del Padre",
    emoji: "👔",
    from: [6, 1],
    to: [6, 21], // se ajusta al tercer domingo de junio
    colors: { primary: "#1f4e79", accent: "#c08a3e", background: "#f6f8fb", surface: "#ffffff", text: "#162435" },
    particles: ["★", "◆", "✦", "◇"],
    garland: () => pennants(["#1f4e79", "#4f8ac9", "#c08a3e", "#2d6a4f", "#1f4e79", "#8fb3d9"]),
    hero: "Día del Padre: postres para consentir a papá",
    store: "👔 Día del Padre: consiente a papá",
    dashboard: "Día del Padre: pastel de chocolate, cheesecake y cajas de brownies",
  },
  {
    id: "independencia",
    ui: { primary: "#0b6b46", accent: "#c8102e" },
    name: "Fiestas patrias",
    emoji: "🇲🇽",
    from: [9, 1],
    to: [9, 30],
    colors: { primary: "#0b6b46", accent: "#c8102e", background: "#fdfbf6", surface: "#ffffff", text: "#1d2b22" },
    particles: ["✦", "★", "●"],
    garland: () => papelPicado(["#0b6b46", "#ffffff", "#c8102e", "#0b6b46", "#ffffff", "#c8102e"]),
    hero: "¡Viva México! Postres para tus fiestas patrias",
    store: "🇲🇽 ¡Viva México! Pide tus postres para el 15 de septiembre",
    dashboard: "Fiestas patrias: cupcakes tricolor, gelatinas y postres mexicanos",
  },
  {
    id: "halloween",
    ui: { primary: "#d0560f", accent: "#6a1b9a" },
    name: "Halloween",
    emoji: "🎃",
    from: [10, 1],
    to: [10, 31],
    colors: { primary: "#e8671a", accent: "#6a1b9a", background: "#fff7ef", surface: "#ffffff", text: "#2a1609" },
    particles: ["🦇", "✦", "🎃"],
    garland: () => hanging(["#ef6c00", "#4a148c", "#ef6c00", "#212121", "#ef6c00", "#6a1b9a"], pumpkin, 30, 38),
    hero: "Halloween: dulces que dan miedo… de lo ricos 🎃",
    store: "🎃 Halloween: dulces terroríficamente ricos",
    dashboard: "Halloween: cupcakes de calabaza, galletas de fantasma y mesas de dulces",
  },
  {
    id: "muertos",
    ui: { primary: "#d9480f", accent: "#7b2d8e" },
    name: "Día de Muertos",
    emoji: "💀",
    from: [11, 1],
    to: [11, 30],
    colors: { primary: "#d9480f", accent: "#7b2d8e", background: "#fbf1e4", surface: "#ffffff", text: "#3a1d0e" },
    particles: ["✿", "❀", "✦"],
    garland: () => papelPicado(["#e91e63", "#ff9800", "#8e24aa", "#43a047", "#fbc02d", "#00acc1"]),
    hero: "Día de Muertos: pan de muerto y postres para tu ofrenda",
    store: "🌼 Día de Muertos: pan de muerto y dulces para tu ofrenda",
    dashboard: "Día de Muertos: pan de muerto, calaveritas y postres para la ofrenda",
  },
];

export const FESTIVE_THEMES = T;
export const festiveById = (id: string | null | undefined) => T.find((t) => t.id === id) ?? null;

/** Tercer domingo de junio (Día del Padre en México) */
function fathersDay(year: number) {
  const d = new Date(year, 5, 1);
  const firstSunday = 1 + ((7 - d.getDay()) % 7);
  return firstSunday + 14;
}

/** Tema de la fecha (si hay) */
export function festiveFor(date = new Date()): FestiveTheme | null {
  const m = date.getMonth() + 1;
  const day = date.getDate();
  const key = m * 100 + day;
  for (const t of T) {
    const to: [number, number] = t.id === "padre" ? [6, fathersDay(date.getFullYear())] : t.to;
    const a = t.from[0] * 100 + t.from[1];
    const b = to[0] * 100 + to[1];
    if (a <= b ? key >= a && key <= b : key >= a || key <= b) return t;
  }
  return null;
}

export type FestiveSetting = "auto" | "off" | FestiveId;
export const FESTIVE_IDS = T.map((t) => t.id);

/** Tema que toca según el ajuste: automático por fecha, apagado o uno fijo */
export function resolveFestive(setting: FestiveSetting | null | undefined, date = new Date()): FestiveTheme | null {
  if (setting === "off") return null;
  if (setting && setting !== "auto") return festiveById(setting);
  return festiveFor(date);
}

/**
 * Variables CSS para pintar botones, íconos y acentos del panel / página principal con los colores de la temporada.
 * Reemplaza las escalas "rose" (color principal) y "mint" (acento) de la app.
 */
/** Mezcla un poco del color de la temporada en una escala existente (cremas y chocolates) */
function tint(name: string, base: Record<number, string>, c: string, pct: Record<number, number>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) out[`--color-${name}-${k}`] = `color-mix(in srgb, ${c} ${pct[Number(k)]}%, ${v})`;
  return out;
}

export function festiveVars(t: FestiveTheme): Record<string, string> {
  const scale = (name: string, c: string) => ({
    [`--color-${name}-50`]: `color-mix(in srgb, ${c} 8%, white)`,
    [`--color-${name}-100`]: `color-mix(in srgb, ${c} 16%, white)`,
    [`--color-${name}-200`]: `color-mix(in srgb, ${c} 30%, white)`,
    [`--color-${name}-300`]: `color-mix(in srgb, ${c} 50%, white)`,
    [`--color-${name}-400`]: `color-mix(in srgb, ${c} 78%, white)`,
    [`--color-${name}-500`]: c,
    [`--color-${name}-600`]: `color-mix(in srgb, ${c} 85%, black)`,
    [`--color-${name}-700`]: `color-mix(in srgb, ${c} 68%, black)`,
  });
  return {
    // tonos con buen contraste para texto blanco en botones
    ...scale("rose", t.ui.primary),
    ...scale("mint", t.ui.accent),
    // fondos crema y textos chocolate con un toque de la temporada (todo lo demás de la app)
    ...tint("cream", { 50: "#fffdf8", 100: "#fffaef", 200: "#fbf1dc", 300: "#f4e4c2" }, t.ui.primary, { 50: 4, 100: 6, 200: 10, 300: 14 }),
    ...tint(
      "cocoa",
      { 100: "#f3e8dc", 200: "#e3cdb8", 300: "#9a7350", 400: "#84583a", 500: "#8a5a2e", 600: "#6f4318", 700: "#5a3512", 800: "#3f250d", 900: "#2a1909" },
      t.ui.primary,
      { 100: 12, 200: 16, 300: 22, 400: 26, 500: 26, 600: 24, 700: 22, 800: 20, 900: 16 },
    ),
    // fondo de la bienvenida del panel
    "--shadow-rose": `0 10px 24px -10px color-mix(in srgb, ${t.ui.primary} 55%, transparent)`,
    "--festive-hero": `color-mix(in srgb, ${t.ui.primary} 30%, #1c1210)`,
  };
}
