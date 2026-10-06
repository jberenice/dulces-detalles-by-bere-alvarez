/**
 * Decoración repostera de la tienda: bordes chorreados, bolitas de helado, galleta, chispas y capacillo.
 * Se dibujan como mosaicos SVG (data URI) que se repiten a lo ancho, así no se deforman en ninguna pantalla.
 * Los colores ya vienen validados como #rrggbb por normalizeTheme.
 */
import type { StoreTheme } from "./storeTheme";

export type Decor = StoreTheme["decor"];

export const DECOR_OPTIONS: { id: Decor; label: string; hint: string }[] = [
  { id: "ninguna", label: "Sin decoración", hint: "Limpia y sencilla" },
  { id: "chorreado", label: "Chorreado", hint: "Glaseado escurriendo por los bordes" },
  { id: "helado", label: "Helado", hint: "Bolitas de nieve y ondas suaves" },
  { id: "galleta", label: "Galleta", hint: "Borde de galleta con chispas de chocolate" },
  { id: "chispas", label: "Chispas", hint: "Sprinkles de colores por toda la tienda" },
  { id: "capacillo", label: "Capacillo", hint: "Pliegues de capacillo de cupcake" },
];

const svg = (w: number, h: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;

/** Gota de glaseado: hombros curvos donde se une al borde y punta redonda */
const drip = (x: number, w: number, len: number, c: string) =>
  `<path d='M${x - 7} 13 C${x - 1} 13 ${x} 16 ${x} 22 L${x} ${len} C${x} ${len + w * 0.75} ${x + w} ${len + w * 0.75} ${x + w} ${len} L${x + w} 22 C${x + w} 16 ${x + w + 1} 13 ${x + w + 7} 13 Z' fill='${c}'/>`;

const SPRINKLE_COLORS = ["#f7b2c4", "#ffd36e", "#8fd3c1", "#a9c7ff", "#c9a7f2"];

function sprinkles(colors: string[], w: number, h: number, opacity = 1) {
  // posiciones fijas (se ve aleatorio pero siempre igual)
  const pts = [
    [8, 6, 30], [34, 18, 110], [58, 8, 70], [82, 22, 150], [104, 10, 20], [20, 26, 160], [70, 30, 45], [112, 30, 95],
    [46, 34, 10], [94, 4, 135],
  ];
  return pts
    .map(([x, y, r], i) => `<rect x='${(x * w) / 120}' y='${(y * h) / 40}' width='9' height='3' rx='1.5' fill='${colors[i % colors.length]}' fill-opacity='${opacity}' transform='rotate(${r} ${(x * w) / 120 + 4.5} ${(y * h) / 40 + 1.5})'/>`)
    .join("");
}

export type DecorTiles = {
  /** Borde superior (cuelga hacia abajo) */
  edge: { image: string; width: number; height: number } | null;
  /** Patrón de fondo de toda la tienda */
  pattern: { image: string; width: number; height: number } | null;
};

export function decorTiles(t: Pick<StoreTheme, "decor" | "primary" | "accent" | "background" | "surface" | "text">): DecorTiles {
  const { primary: p, accent: a } = t;
  switch (t.decor) {
    case "chorreado":
      return {
        edge: {
          image: svg(
            160,
            52,
            `<rect width='160' height='14' fill='${p}'/>` + drip(14, 12, 34, p) + drip(44, 9, 22, p) + drip(70, 14, 44, p) + drip(104, 8, 18, p) + drip(128, 12, 30, p),
          ),
          width: 160,
          height: 52,
        },
        pattern: null,
      };
    case "helado":
      return {
        edge: {
          image: svg(
            96,
            42,
            `<g fill='${a}' fill-opacity='.45'><rect width='96' height='14'/><circle cx='0' cy='12' r='22'/><circle cx='48' cy='12' r='22'/><circle cx='96' cy='12' r='22'/></g>` +
              `<g fill='${p}'><rect width='96' height='8'/><circle cx='24' cy='4' r='20'/><circle cx='72' cy='4' r='20'/></g>` +
              `<g fill='#fff' fill-opacity='.35'><ellipse cx='17' cy='8' rx='6' ry='3'/><ellipse cx='65' cy='8' rx='6' ry='3'/></g>`,
          ),
          width: 96,
          height: 42,
        },
        pattern: { image: svg(140, 140, `<g fill='${p}' fill-opacity='.05'><circle cx='30' cy='30' r='14'/><circle cx='100' cy='95' r='10'/></g>`), width: 140, height: 140 },
      };
    case "galleta": {
      const cookie = "#d9a366";
      const choc = "#5b3518";
      return {
        edge: {
          image: svg(
            56,
            34,
            `<g fill='${cookie}'><rect width='56' height='16'/><circle cx='28' cy='16' r='14'/><circle cx='0' cy='16' r='14'/><circle cx='56' cy='16' r='14'/></g>` +
              `<g fill='#b9824a' fill-opacity='.5'><circle cx='10' cy='6' r='1.6'/><circle cx='40' cy='9' r='1.3'/><circle cx='22' cy='22' r='1.4'/></g>` +
              `<g fill='${choc}'><ellipse cx='18' cy='10' rx='3.2' ry='2.6'/><ellipse cx='34' cy='22' rx='2.8' ry='2.4'/><ellipse cx='48' cy='6' rx='2.6' ry='2.2'/><ellipse cx='4' cy='24' rx='2.4' ry='2'/></g>`,
          ),
          width: 56,
          height: 34,
        },
        pattern: { image: svg(90, 90, `<g fill='${choc}' fill-opacity='.06'><ellipse cx='20' cy='24' rx='5' ry='4'/><ellipse cx='66' cy='60' rx='4' ry='3.4'/><ellipse cx='70' cy='14' rx='3' ry='2.6'/></g>`), width: 90, height: 90 },
      };
    }
    case "chispas":
      return {
        edge: { image: svg(120, 40, sprinkles([p, a, ...SPRINKLE_COLORS], 120, 40)), width: 120, height: 40 },
        pattern: { image: svg(160, 160, sprinkles([p, a, ...SPRINKLE_COLORS], 160, 160, 0.22)), width: 160, height: 160 },
      };
    case "capacillo":
      return {
        edge: {
          image: svg(
            36,
            28,
            `<path d='M0 0H36V17Q27 27 18 17Q9 27 0 17Z' fill='${p}'/>` +
              `<path d='M9 0V20.5M27 0V20.5' stroke='#fff' stroke-opacity='.3' stroke-width='5'/>` +
              `<path d='M0 17Q9 27 18 17Q27 27 36 17' fill='none' stroke='#000' stroke-opacity='.1' stroke-width='1.5'/>`,
          ),
          width: 36,
          height: 28,
        },
        pattern: null,
      };
    default:
      return { edge: null, pattern: null };
  }
}
