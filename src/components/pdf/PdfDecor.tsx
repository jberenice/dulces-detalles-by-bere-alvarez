/* Adornos del PDF (se dibujan con figuras de @react-pdf: no usan imágenes ni emojis) */
import { Circle, Ellipse, G, Line, Path, Polygon, Rect, Svg, View } from "@react-pdf/renderer";
import type { FestiveId } from "@/lib/festive";

export type PdfPalette = {
  primary: string;
  accent: string;
  soft: string;
  soft2: string;
  ink: string;
  muted: string;
  colors: string[];
  kind: "drip" | "picado" | "lights" | "hearts" | "stars" | "balloons" | "flowers";
  message: string | null;
};

const DEFAULT: PdfPalette = {
  primary: "#eb5473",
  accent: "#6aa68a",
  soft: "#fffaef",
  soft2: "#fdf0f3",
  ink: "#5a3512",
  muted: "#a87b55",
  colors: ["#eb5473", "#7fcaa6", "#f6c344", "#8ec5ff", "#c792ea"],
  kind: "drip",
  message: null,
};

/** Paleta y adorno de cada temporada para el PDF */
const THEMES: Record<FestiveId, Omit<PdfPalette, "ink" | "muted">> = {
  navidad: { primary: "#c0392b", accent: "#2e7d4f", soft: "#fff7ee", soft2: "#eef7f0", colors: ["#e53935", "#fbc02d", "#43a047", "#1e88e5", "#8e24aa", "#fb8c00"], kind: "lights", message: "¡Feliz Navidad!" },
  anonuevo: { primary: "#8a6508", accent: "#2b2b3a", soft: "#fffaf0", soft2: "#f6f1e4", colors: ["#d4af37", "#c0c0c0", "#e9c46a", "#2b2b3a"], kind: "stars", message: "¡Feliz Año Nuevo!" },
  reyes: { primary: "#7b2d8e", accent: "#a87b10", soft: "#fdf8ff", soft2: "#fbf3e3", colors: ["#d4a017", "#7b2d8e", "#c0392b", "#2e7d4f"], kind: "stars", message: "¡Feliz Día de Reyes!" },
  sanvalentin: { primary: "#d81b60", accent: "#b83b6b", soft: "#fff5f8", soft2: "#ffe8ef", colors: ["#e53950", "#f48fb1", "#d81b60", "#ff8a80"], kind: "hearts", message: "Feliz día del amor y la amistad" },
  primavera: { primary: "#a16c00", accent: "#4f8a3a", soft: "#fffbea", soft2: "#f3f9ec", colors: ["#fbc02d", "#ffd54f", "#f9a825", "#aed581"], kind: "flowers", message: "¡Feliz primavera!" },
  nino: { primary: "#1e6fd0", accent: "#d17a00", soft: "#f3faff", soft2: "#fff6e8", colors: ["#e53935", "#fbc02d", "#43a047", "#1e88e5", "#8e24aa", "#fb8c00"], kind: "balloons", message: "¡Feliz Día del Niño!" },
  madres: { primary: "#8a3ba6", accent: "#2f7d5b", soft: "#fbf6fe", soft2: "#f1f8f3", colors: ["#b57edc", "#f48fb1", "#ce93d8", "#8e44ad"], kind: "flowers", message: "Feliz Día de las Madres" },
  maestro: { primary: "#c62828", accent: "#2e7d32", soft: "#fffaf0", soft2: "#eef6ee", colors: ["#e53935", "#1e88e5", "#fbc02d", "#43a047"], kind: "picado", message: "Feliz Día del Maestro" },
  padre: { primary: "#1f4e79", accent: "#a8742f", soft: "#f4f7fb", soft2: "#fbf4ea", colors: ["#1f4e79", "#c99a4b", "#5b3b22", "#4f8ac9"], kind: "stars", message: "Feliz Día del Padre" },
  independencia: { primary: "#0b6b46", accent: "#c8102e", soft: "#f6fbf8", soft2: "#fdf2f3", colors: ["#0b6b46", "#ffffff", "#c8102e"], kind: "picado", message: "¡Viva México!" },
  halloween: { primary: "#d0560f", accent: "#6a1b9a", soft: "#fff8f1", soft2: "#f6effa", colors: ["#ef6c00", "#6a1b9a", "#212121", "#7cb342"], kind: "picado", message: "¡Feliz Halloween!" },
  muertos: { primary: "#d9480f", accent: "#7b2d8e", soft: "#fff8f1", soft2: "#f9effa", colors: ["#e91e63", "#ff9800", "#8e24aa", "#43a047", "#fbc02d", "#00acc1"], kind: "picado", message: "Día de Muertos" },
};

export function pdfPalette(id?: FestiveId | null): PdfPalette {
  if (!id || !THEMES[id]) return DEFAULT;
  return { ...THEMES[id], ink: DEFAULT.ink, muted: DEFAULT.muted };
}

/* ------------------------------------------------------------------ Figuras */
const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.9}C${x - s * 1.4} ${y} ${x - s} ${y - s} ${x} ${y - s * 0.35}C${x + s} ${y - s} ${x + s * 1.4} ${y} ${x} ${y + s * 0.9}Z`;
const starPts = (x: number, y: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

/** Guirnalda de la temporada a lo ancho (alto 34) */
export function PdfGarland({ p, width = 612 }: { p: PdfPalette; width?: number }) {
  const H = 34;
  const items: React.ReactNode[] = [];
  const rope = <Path key="rope" d={`M0 4 Q${width / 4} 12 ${width / 2} 4 T${width} 4`} stroke="#7a5236" strokeWidth={0.8} fill="none" />;
  if (p.kind === "drip") {
    // glaseado que escurre con chispitas
    let d = `M0 0 H${width} V10`;
    const n = 14;
    for (let i = n; i > 0; i--) {
      const x1 = (width * i) / n;
      const x0 = (width * (i - 1)) / n;
      const len = 10 + ((i * 37) % 17);
      const mid = (x0 + x1) / 2;
      d += ` C${x1 - 4} 12 ${mid + 6} 10 ${mid + 5} ${10 + len} Q${mid} ${16 + len} ${mid - 5} ${10 + len} C${mid - 6} 10 ${x0 + 4} 12 ${x0} 10`;
    }
    d += " Z";
    items.push(<Path key="g" d={d} fill={p.primary} />);
    items.push(<Path key="sh" d={`M18 4 H${width - 18}`} stroke="#ffffff" opacity={0.45} strokeWidth={2} />);
    for (let i = 0; i < 26; i++) items.push(<Rect key={`s${i}`} x={12 + ((i * 97) % (width - 24))} y={2 + ((i * 13) % 6)} width={5} height={1.8} rx={0.9} fill={p.colors[(i + 1) % p.colors.length]} />);
  } else if (p.kind === "picado") {
    items.push(rope);
    const fw = 30;
    const n = Math.floor(width / (fw + 4));
    for (let i = 0; i < n; i++) {
      const x = 4 + i * (fw + 4);
      const y = 4 + Math.sin(((i + 0.5) / n) * Math.PI * 2) * 2 + 2;
      const c = p.colors[i % p.colors.length];
      let edge = "";
      for (let k = 0; k <= 6; k++) edge += ` L${x + fw - (k * fw) / 6} ${y + 24 + (k % 2 ? -3 : 0)}`;
      items.push(<Path key={`f${i}`} d={`M${x} ${y} H${x + fw} V${y + 24}${edge} Z`} fill={c} stroke={c === "#ffffff" ? "#d8c9b5" : c} strokeWidth={0.6} />);
      const cut = c === "#ffffff" ? "#e8dccb" : "#ffffff";
      items.push(<Circle key={`h${i}`} cx={x + fw / 2} cy={y + 11} r={4.5} fill={cut} />);
      items.push(<Circle key={`a${i}`} cx={x + 6} cy={y + 5} r={1.3} fill={cut} />);
      items.push(<Circle key={`b${i}`} cx={x + fw - 6} cy={y + 5} r={1.3} fill={cut} />);
      items.push(<Polygon key={`r${i}`} points={`${x + fw / 2},${y + 17} ${x + fw / 2 + 3},${y + 20} ${x + fw / 2},${y + 23} ${x + fw / 2 - 3},${y + 20}`} fill={cut} />);
    }
  } else if (p.kind === "lights") {
    items.push(<Path key="w" d={`M0 4 Q15 14 30 4 T60 4 ${Array.from({ length: Math.ceil(width / 60) }, (_, i) => `T${90 + i * 60} 4 T${120 + i * 60} 4`).join(" ")}`} stroke="#2e2410" strokeWidth={0.8} fill="none" />);
    for (let i = 0; i < Math.floor(width / 30); i++) {
      const x = 15 + i * 30;
      const c = p.colors[i % p.colors.length];
      items.push(<Rect key={`k${i}`} x={x - 2} y={8} width={4} height={4} fill="#4a3215" />);
      items.push(<Ellipse key={`l${i}`} cx={x} cy={18} rx={4.5} ry={6.5} fill={c} />);
      items.push(<Ellipse key={`e${i}`} cx={x - 1.3} cy={15.5} rx={1.2} ry={2} fill="#ffffff" opacity={0.7} />);
    }
  } else if (p.kind === "hearts") {
    items.push(rope);
    for (let i = 0; i < Math.floor(width / 26); i++) {
      const x = 13 + i * 26;
      items.push(<Line key={`t${i}`} x1={x} y1={6} x2={x} y2={i % 2 ? 12 : 16} stroke="#d9a3b3" strokeWidth={0.6} />);
      items.push(<Path key={`hh${i}`} d={heart(x, i % 2 ? 18 : 22, i % 3 ? 5 : 7)} fill={p.colors[i % p.colors.length]} />);
    }
  } else if (p.kind === "stars") {
    items.push(rope);
    for (let i = 0; i < Math.floor(width / 24); i++) {
      const x = 12 + i * 24;
      items.push(<Line key={`t${i}`} x1={x} y1={6} x2={x} y2={i % 2 ? 12 : 18} stroke="#b9a06a" strokeWidth={0.6} />);
      items.push(<Polygon key={`st${i}`} points={starPts(x, i % 2 ? 17 : 23, i % 3 ? 5 : 7)} fill={p.colors[i % p.colors.length]} />);
    }
  } else if (p.kind === "balloons") {
    for (let i = 0; i < Math.floor(width / 24); i++) {
      const x = 12 + i * 24;
      const y = i % 2 ? 11 : 15;
      items.push(<Ellipse key={`bb${i}`} cx={x} cy={y} rx={7} ry={8.5} fill={p.colors[i % p.colors.length]} />);
      items.push(<Ellipse key={`bs${i}`} cx={x - 2.5} cy={y - 3} rx={1.6} ry={2.4} fill="#ffffff" opacity={0.6} />);
      items.push(<Path key={`bl${i}`} d={`M${x} ${y + 8.5} Q${x + 3} ${y + 13} ${x} ${y + 18}`} stroke="#777777" strokeWidth={0.5} fill="none" />);
    }
  } else if (p.kind === "flowers") {
    items.push(rope);
    for (let i = 0; i < Math.floor(width / 28); i++) {
      const x = 14 + i * 28;
      const y = i % 2 ? 15 : 19;
      for (let k = 0; k < 5; k++) {
        const a = (Math.PI * 2 * k) / 5;
        items.push(<Circle key={`p${i}-${k}`} cx={x + 4.2 * Math.cos(a)} cy={y + 4.2 * Math.sin(a)} r={3.2} fill={p.colors[i % p.colors.length]} />);
      }
      items.push(<Circle key={`c${i}`} cx={x} cy={y} r={2.4} fill="#e67e22" />);
    }
  }
  return (
    <Svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
      <G>{items}</G>
    </Svg>
  );
}

/** Figura de la temporada (para marca de agua y adornos) */
function motif(p: PdfPalette, x: number, y: number, r: number, color: string, op: number, key: string | number) {
  const o = { fill: color, fillOpacity: op };
  switch (p.kind) {
    case "hearts":
    case "drip":
      return <Path key={key} d={heart(x, y, r * 0.8)} {...o} />;
    case "stars":
      return <Polygon key={key} points={starPts(x, y, r)} {...o} />;
    case "lights":
      return (
        <G key={key}>
          <Rect x={x - r * 0.18} y={y - r * 1.05} width={r * 0.36} height={r * 0.32} fill="#4a3215" fillOpacity={op} />
          <Ellipse cx={x} cy={y} rx={r * 0.55} ry={r * 0.78} {...o} />
        </G>
      );
    case "balloons":
      return <Ellipse key={key} cx={x} cy={y} rx={r * 0.7} ry={r * 0.85} {...o} />;
    case "flowers":
      return (
        <G key={key}>
          {Array.from({ length: 5 }, (_, k) => (
            <Circle key={k} cx={x + r * 0.55 * Math.cos((Math.PI * 2 * k) / 5)} cy={y + r * 0.55 * Math.sin((Math.PI * 2 * k) / 5)} r={r * 0.42} {...o} />
          ))}
          <Circle cx={x} cy={y} r={r * 0.3} fill="#e67e22" fillOpacity={op} />
        </G>
      );
    default: {
      // banderita de papel picado
      let edge = "";
      for (let k = 0; k <= 6; k++) edge += ` L${x + r - (k * 2 * r) / 6} ${y + r + (k % 2 ? -r * 0.18 : 0)}`;
      return <Path key={key} d={`M${x - r} ${y - r} H${x + r} V${y + r}${edge} Z`} {...o} />;
    }
  }
}

/** Marca de agua tenue de la temporada, repartida en la hoja (detrás del contenido) */
export function PdfWatermark({ p }: { p: PdfPalette }) {
  const spots = [
    [90, 330, 34],
    [520, 300, 26],
    [470, 520, 44],
    [140, 600, 26],
    [306, 430, 70],
    [560, 700, 30],
    [60, 470, 18],
  ];
  return (
    <View fixed style={{ position: "absolute", left: 0, top: 0, width: 612, height: 792 }}>
      <Svg width={612} height={792} viewBox="0 0 612 792">
        {spots.map(([x, y, r], i) => motif(p, x, y, r, p.colors[i % p.colors.length] === "#ffffff" ? p.primary : p.colors[i % p.colors.length], i === 4 ? 0.045 : 0.07, i))}
      </Svg>
    </View>
  );
}

/** Logo sin círculo: resplandor blanco que lo funde con el encabezado y adornos de la temporada alrededor */
export function PdfLogoGlow({ p, size = 132 }: { p: PdfPalette; size?: number }) {
  const c = size / 2;
  const rings = [
    [c, 0.25],
    [c * 0.9, 0.35],
    [c * 0.8, 0.55],
    [c * 0.72, 1],
  ];
  const n = 11;
  const orn = Array.from({ length: n }, (_, i) => {
    const a = Math.PI + (Math.PI * i) / (n - 1);
    return motif(p, c + (c - 7) * Math.cos(a), c + (c - 7) * Math.sin(a), 6, p.colors[i % p.colors.length] === "#ffffff" ? p.accent : p.colors[i % p.colors.length], 1, `o${i}`);
  });
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {rings.map(([r, o], i) => (
        <Circle key={i} cx={c} cy={c} r={r} fill="#ffffff" fillOpacity={o} />
      ))}
      {p.kind === "drip" ? null : orn}
    </Svg>
  );
}
