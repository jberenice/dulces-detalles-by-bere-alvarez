/** Personalización de la minitienda: colores, tipografía, acomodo y orden de secciones. */

export type SectionId = "anuncio" | "destacados" | "catalogo" | "pastel" | "resenas" | "nosotros" | "horario" | "contacto";
export type StoreTheme = {
  preset: string;
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  font: "elegante" | "romantica" | "moderna";
  hero: "centrado" | "portada" | "minimal";
  layout: "cuadricula" | "lista" | "galeria";
  columns: 2 | 3;
  radius: "redondo" | "suave" | "recto";
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
];

export const DEFAULT_THEME: StoreTheme = {
  preset: "rosa",
  ...PRESETS[0].colors,
  font: "elegante",
  hero: "centrado",
  layout: "cuadricula",
  columns: 3,
  radius: "redondo",
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
    font: pick(t.font, ["elegante", "romantica", "moderna"] as const, "elegante"),
    hero: pick(t.hero, ["centrado", "portada", "minimal"] as const, "centrado"),
    layout: pick(t.layout, ["cuadricula", "lista", "galeria"] as const, "cuadricula"),
    columns: t.columns === 2 ? 2 : 3,
    radius: pick(t.radius, ["redondo", "suave", "recto"] as const, "redondo"),
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
  const fonts = { elegante: "var(--font-display-serif), Georgia, serif", romantica: "var(--font-dancing), cursive", moderna: "var(--font-body), system-ui, sans-serif" };
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
