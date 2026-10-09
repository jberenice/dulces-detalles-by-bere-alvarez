/** Personalización de la minitienda: colores, tipografía, acomodo y orden de secciones. */
import { FESTIVE_IDS, type FestiveSetting } from "./festive";

export type SectionId = "anuncio" | "destacados" | "catalogo" | "pastel" | "resenas" | "nosotros" | "horario" | "contacto";
export type StoreTheme = {
  preset: string;
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  font: "elegante" | "romantica" | "moderna" | "divertida" | "redondita" | "clasica" | "caligrafia" | "vintage";
  hero: "centrado" | "portada" | "minimal";
  layout: "cuadricula" | "lista" | "galeria";
  columns: 2 | 3;
  radius: "redondo" | "suave" | "recto";
  /** Decoración repostera: bordes chorreados, helado, galleta… */
  decor: "ninguna" | "chorreado" | "helado" | "galleta" | "chispas" | "capacillo";
  /** Fechas especiales: automático según la fecha, apagado o un tema fijo */
  festive: FestiveSetting;
  /** Usar los colores de la temporada mientras dura */
  festiveColors: boolean;
  sections: { id: SectionId; visible: boolean }[];
};

export const SECTION_LABELS: Record<SectionId, { label: string; hint: string }> = {
  anuncio: { label: "Barra de aviso", hint: "Mensaje corto arriba de todo (promos, días de anticipación)" },
  destacados: { label: "Destacados", hint: "Los postres que marques con ★" },
  catalogo: { label: "Catálogo", hint: "Todos tus postres por categoría" },
  pastel: { label: "Pastel personalizado", hint: "Botón para que te pidan cotización de un pastel a su gusto" },
  resenas: { label: "Reseñas", hint: "Lo que dicen tus clientas (las que tú apruebes)" },
  nosotros: { label: "Sobre nosotros", hint: "Tu historia y lo que te hace especial" },
  horario: { label: "Horario y entregas", hint: "Días, horarios y zonas de entrega" },
  contacto: { label: "Contacto y redes", hint: "WhatsApp, Instagram, Facebook, ubicación" },
};

const DEFAULT_SECTIONS: StoreTheme["sections"] = [
  { id: "anuncio", visible: true },
  { id: "destacados", visible: true },
  { id: "catalogo", visible: true },
  { id: "pastel", visible: true },
  { id: "resenas", visible: true },
  { id: "nosotros", visible: true },
  { id: "horario", visible: true },
  { id: "contacto", visible: true },
];

export const PRESETS: { id: string; name: string; colors: Pick<StoreTheme, "primary" | "accent" | "background" | "surface" | "text"> }[] = [
  { id: "rosa", name: "Rosa dulce", colors: { primary: "#eb5473", accent: "#6aa68a", background: "#fffaef", surface: "#ffffff", text: "#3f250d" } },
  { id: "menta", name: "Menta fresca", colors: { primary: "#3f8f6e", accent: "#eb5473", background: "#f2faf6", surface: "#ffffff", text: "#1f3a2e" } },
  { id: "chocolate", name: "Chocolate", colors: { primary: "#6f4318", accent: "#d9a35b", background: "#fbf5ee", surface: "#ffffff", text: "#2a1909" } },
  { id: "vainilla", name: "Vainilla", colors: { primary: "#b07d2b", accent: "#8a5a2e", background: "#fffdf6", surface: "#ffffff", text: "#3b2a12" } },
  { id: "lavanda", name: "Lavanda", colors: { primary: "#7b5ea7", accent: "#e58fb0", background: "#f8f5fc", surface: "#ffffff", text: "#2e2340" } },
  { id: "frambuesa", name: "Frambuesa", colors: { primary: "#c2185b", accent: "#f4a259", background: "#fff6f8", surface: "#ffffff", text: "#3a1020" } },
  { id: "noche", name: "Noche de cacao", colors: { primary: "#f2a7b8", accent: "#7fcaa6", background: "#24160b", surface: "#33210f", text: "#fbefe3" } },
  { id: "galleta", name: "Galleta", colors: { primary: "#a8642a", accent: "#5b3518", background: "#fdf4e7", surface: "#fffaf2", text: "#3a2410" } },
  { id: "fresa", name: "Helado de fresa", colors: { primary: "#f06b8a", accent: "#7cc9b1", background: "#fff5f7", surface: "#ffffff", text: "#4a2330" } },
  { id: "pistache", name: "Pistache", colors: { primary: "#6f9a3c", accent: "#d98fa5", background: "#f6faef", surface: "#ffffff", text: "#2c3a1c" } },
  { id: "moka", name: "Moka", colors: { primary: "#8a5a3c", accent: "#e3b98a", background: "#f4ece4", surface: "#fffaf5", text: "#2e1d12" } },
  { id: "mora", name: "Mora azul", colors: { primary: "#4b5fb3", accent: "#e889a8", background: "#f4f5fd", surface: "#ffffff", text: "#1f2547" } },
  { id: "durazno", name: "Durazno", colors: { primary: "#ec8150", accent: "#5aa79a", background: "#fff6ef", surface: "#ffffff", text: "#432617" } },
  { id: "algodon", name: "Algodón de azúcar", colors: { primary: "#e17bb6", accent: "#6bb7e3", background: "#fdf5ff", surface: "#ffffff", text: "#3c2042" } },
];

/** Diseños listos: combinan paleta, decoración, letra, portada y acomodo */
/** Letras disponibles para los títulos de la tienda */
export const STORE_FONTS: Record<StoreTheme["font"], string> = {
  elegante: "var(--font-display-serif), Georgia, serif",
  romantica: "var(--font-dancing), cursive",
  moderna: "var(--font-body), system-ui, sans-serif",
  // (los nombres internos se conservan para no perder lo ya guardado; las letras son todas fáciles de leer)
  divertida: "var(--ff-poppins), system-ui, sans-serif",
  redondita: "var(--font-fredoka), system-ui, sans-serif",
  clasica: "var(--ff-lora), Georgia, serif",
  caligrafia: "var(--ff-dmserif), Georgia, serif",
  vintage: "var(--ff-montserrat), system-ui, sans-serif",
};
export const STORE_FONT_LABELS: [StoreTheme["font"], string][] = [
  ["elegante", "Elegante (Playfair)"],
  ["romantica", "Romántica (script)"],
  ["moderna", "Moderna (Nunito)"],
  ["divertida", "Geométrica (Poppins)"],
  ["redondita", "Redondeada (Fredoka)"],
  ["clasica", "Clásica (Lora)"],
  ["caligrafia", "Editorial (DM Serif)"],
  ["vintage", "Sobria (Montserrat)"],
];

export const DESIGNS: { id: string; name: string; hint: string; theme: Pick<StoreTheme, "preset" | "decor" | "font" | "hero" | "layout" | "radius"> }[] = [
  { id: "chorreado-fresa", name: "Glaseado de fresa", hint: "Bordes chorreados y letra romántica", theme: { preset: "frambuesa", decor: "chorreado", font: "romantica", hero: "centrado", layout: "cuadricula", radius: "redondo" } },
  { id: "chocolateria", name: "Chocolatería", hint: "Chocolate escurriendo, elegante", theme: { preset: "chocolate", decor: "chorreado", font: "elegante", hero: "portada", layout: "lista", radius: "suave" } },
  { id: "heladeria", name: "Heladería", hint: "Bolitas de helado y fotos grandes", theme: { preset: "fresa", decor: "helado", font: "moderna", hero: "portada", layout: "galeria", radius: "redondo" } },
  { id: "pistache", name: "Nieve de pistache", hint: "Fresca y moderna", theme: { preset: "pistache", decor: "helado", font: "moderna", hero: "minimal", layout: "cuadricula", radius: "redondo" } },
  { id: "galleteria", name: "Galletería", hint: "Borde de galleta con chispas de chocolate", theme: { preset: "galleta", decor: "galleta", font: "elegante", hero: "centrado", layout: "cuadricula", radius: "suave" } },
  { id: "fiesta", name: "Fiesta de chispas", hint: "Sprinkles de colores, alegre", theme: { preset: "algodon", decor: "chispas", font: "romantica", hero: "centrado", layout: "cuadricula", radius: "redondo" } },
  { id: "cupcakeria", name: "Cupcakería", hint: "Pliegues de capacillo", theme: { preset: "rosa", decor: "capacillo", font: "elegante", hero: "centrado", layout: "cuadricula", radius: "redondo" } },
  { id: "cafeteria", name: "Café y postre", hint: "Tonos moka, menú en lista", theme: { preset: "moka", decor: "capacillo", font: "elegante", hero: "minimal", layout: "lista", radius: "suave" } },
  { id: "noche", name: "Noche de cacao", hint: "Fondo oscuro con chispas", theme: { preset: "noche", decor: "chispas", font: "elegante", hero: "portada", layout: "galeria", radius: "suave" } },
  { id: "mora", name: "Pay de mora", hint: "Azul con glaseado", theme: { preset: "mora", decor: "chorreado", font: "moderna", hero: "centrado", layout: "cuadricula", radius: "suave" } },
  { id: "durazno", name: "Durazno y crema", hint: "Cálida, con ondas de helado", theme: { preset: "durazno", decor: "helado", font: "romantica", hero: "centrado", layout: "lista", radius: "redondo" } },
  { id: "sencilla", name: "Sencilla", hint: "Sin decoración, directo al menú", theme: { preset: "vainilla", decor: "ninguna", font: "moderna", hero: "minimal", layout: "cuadricula", radius: "suave" } },
];

/** Aplica un diseño listo al tema (conserva secciones y columnas) */
export function applyDesign(t: StoreTheme, id: string): StoreTheme {
  const d = DESIGNS.find((x) => x.id === id);
  if (!d) return t;
  const colors = PRESETS.find((p) => p.id === d.theme.preset)?.colors ?? {};
  return { ...t, ...colors, ...d.theme };
}

export const DEFAULT_THEME: StoreTheme = {
  preset: "rosa",
  ...PRESETS[0].colors,
  font: "elegante",
  hero: "centrado",
  layout: "cuadricula",
  columns: 3,
  radius: "redondo",
  decor: "ninguna",
  festive: "auto",
  festiveColors: false,
  sections: DEFAULT_SECTIONS,
};

const HEX = /^#[0-9a-f]{6}$/i;
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

/** Valida y completa un tema guardado (evita valores inválidos o inyección de CSS) */
export function normalizeTheme(raw: unknown): StoreTheme {
  const t = (raw && typeof raw === "object" ? raw : {}) as Partial<StoreTheme>;
  const color = (k: "primary" | "accent" | "background" | "surface" | "text") => (typeof t[k] === "string" && HEX.test(t[k] as string) ? (t[k] as string) : DEFAULT_THEME[k]);
  const ids = Object.keys(SECTION_LABELS) as SectionId[];
  const seen = new Set<SectionId>();
  const sections: StoreTheme["sections"] = [];
  for (const s of Array.isArray(t.sections) ? t.sections : []) {
    if (s && ids.includes(s.id) && !seen.has(s.id)) {
      seen.add(s.id);
      sections.push({ id: s.id, visible: s.visible !== false });
    }
  }
  // Secciones nuevas (de versiones recientes): se acomodan después de la que les sigue por defecto
  DEFAULT_SECTIONS.forEach((d, i) => {
    if (seen.has(d.id)) return;
    const prev = DEFAULT_SECTIONS.slice(0, i).reverse().find((x) => sections.some((y) => y.id === x.id));
    const at = prev ? sections.findIndex((y) => y.id === prev.id) + 1 : 0;
    sections.splice(at, 0, d);
    seen.add(d.id);
  });
  return {
    preset: typeof t.preset === "string" ? t.preset.slice(0, 20) : "personalizado",
    primary: color("primary"),
    accent: color("accent"),
    background: color("background"),
    surface: color("surface"),
    text: color("text"),
    font: pick(t.font, ["elegante", "romantica", "moderna", "divertida", "redondita", "clasica", "caligrafia", "vintage"] as const, "elegante"),
    hero: pick(t.hero, ["centrado", "portada", "minimal"] as const, "centrado"),
    layout: pick(t.layout, ["cuadricula", "lista", "galeria"] as const, "cuadricula"),
    columns: t.columns === 2 ? 2 : 3,
    radius: pick(t.radius, ["redondo", "suave", "recto"] as const, "redondo"),
    decor: pick(t.decor, ["ninguna", "chorreado", "helado", "galleta", "chispas", "capacillo"] as const, "ninguna"),
    festive: pick(t.festive, ["auto", "off", ...FESTIVE_IDS] as FestiveSetting[], "auto"),
    festiveColors: t.festiveColors === true,
    sections,
  };
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Color de texto legible sobre un fondo dado */
export const readableOn = (hex: string) => (luminance(hex) > 0.45 ? "#2a1909" : "#ffffff");

/** Variables CSS que usa la tienda */
export function themeVars(t: StoreTheme): React.CSSProperties {
  const fonts = STORE_FONTS;
  const radius = { redondo: "1.75rem", suave: "1rem", recto: "0.375rem" };
  return {
    "--st-primary": t.primary,
    "--st-on-primary": readableOn(t.primary),
    "--st-accent": t.accent,
    "--st-on-accent": readableOn(t.accent),
    "--st-bg": t.background,
    "--st-surface": t.surface,
    "--st-text": t.text,
    "--st-muted": `color-mix(in srgb, ${t.text} 62%, ${t.background})`,
    "--st-line": `color-mix(in srgb, ${t.text} 10%, transparent)`,
    "--st-soft": `color-mix(in srgb, ${t.primary} 12%, ${t.surface})`,
    "--st-radius": radius[t.radius],
    "--st-heading": fonts[t.font],
  } as React.CSSProperties;
}
