"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { artUri, type ArtName } from "@/lib/festiveArt";
import { badgeUri, buttonCornerUri, flowerUri, miniPicadoUri, picadoTile } from "@/lib/festiveArt2";
import { FestiveBouquet } from "./Decor";
import { festiveById, festiveVars, resolveFestive, type FestiveSetting, type FestiveTheme } from "@/lib/festive";

/**
 * Tema de temporada del lado del navegador (usa la fecha de quien visita).
 * Para ver un tema antes de tiempo: agrega ?tema=navidad (o muertos, halloween, madres…) a la dirección.
 */
export function useFestive(setting: FestiveSetting | null | undefined = "auto") {
  const [theme, setTheme] = useState<FestiveTheme | null>(null);
  useEffect(() => {
    let forced: string | null = null;
    try {
      forced = new URLSearchParams(window.location.search).get("tema");
    } catch {}
    setTheme(forced ? (forced === "ninguno" ? null : festiveById(forced)) : resolveFestive(setting));
  }, [setting]);
  return theme;
}

/** Guirnalda de la temporada (focos, papel picado, corazones, flores…) */
export function FestiveGarland({ theme, className, scale = 1 }: { theme: FestiveTheme; className?: string; scale?: number }) {
  const g = useMemo(() => (theme.id === "muertos" || theme.id === "independencia" ? picadoTile(theme.id) : theme.garland()), [theme]);
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full", className)}
      style={{
        height: g.height * scale,
        backgroundImage: g.image,
        backgroundSize: `${g.width * scale}px ${g.height * scale}px`,
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center top",
        filter: "drop-shadow(0 2px 2px rgb(0 0 0 / .12))",
      }}
    />
  );
}

/**
 * Cosas que caen (copos, pétalos, corazones…). Ligero: pocas piezas, solo CSS.
 * Respeta "reducir movimiento" del celular. Con `seconds` se detiene sola.
 */
export function FestiveParticles({ theme, count = 14, seconds, contained = false }: { theme: FestiveTheme; count?: number; seconds?: number; contained?: boolean }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!seconds) return;
    const t = setTimeout(() => setOn(false), seconds * 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => ((Math.sin((i + 1) * 9301 + n * 49297) + 1) / 2) % 1; // pseudoaleatorio estable
        return {
          ch: theme.particles[i % theme.particles.length],
          left: r(1) * 100,
          size: 12 + r(2) * 14,
          dur: 9 + r(3) * 9,
          delay: -r(4) * 18,
          dx: (r(5) - 0.5) * 120,
          rot: (r(6) - 0.5) * 720,
          op: 0.45 + r(7) * 0.45,
        };
      }),
    [theme, count],
  );
  if (!on) return null;
  return (
    <div aria-hidden className={cn("festive-particles pointer-events-none inset-0 z-[5] overflow-hidden", contained ? "absolute" : "fixed")}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="festive-piece absolute top-0"
          style={
            {
              left: `${p.left}%`,
              fontSize: p.size,
              opacity: p.op,
              color: i % 2 ? theme.colors.primary : theme.colors.accent,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              "--dx": `${p.dx}px`,
              "--rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        >
          {i % 2 ? <i className="block" style={{ width: p.size * 0.45, height: p.size * 0.7, borderRadius: "60% 0 60% 0", background: "currentColor" }} /> : p.ch}
        </span>
      ))}
    </div>
  );
}

/** Aviso de temporada para el panel (se puede ocultar por temporada) */
export function FestiveRibbon({ theme, href, cta }: { theme: FestiveTheme; href?: string; cta?: string }) {
  const key = `dd-festivo-oculto-${theme.id}-${new Date().getFullYear()}`;
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(key) === "1");
    } catch {
      setHidden(false);
    }
  }, [key]);
  if (hidden) return null;
  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl text-white shadow-soft" style={{ background: `linear-gradient(120deg, ${theme.colors.primary}, ${theme.colors.accent})` }}>
      <FestiveGarland theme={theme} className="opacity-95" scale={0.8} />
      <div className="flex flex-wrap items-center gap-3 px-5 pt-1 pb-4">
        <span className="text-3xl">{theme.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold">{theme.name}</p>
          <p className="text-sm opacity-90">{theme.dashboard}</p>
        </div>
        {href && (
          <a href={href} className="shrink-0 rounded-xl bg-white/95 px-3.5 py-2 text-sm font-bold" style={{ color: theme.colors.primary }}>
            {cta ?? "Preparar temporada"}
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem(key, "1");
          } catch {}
        }}
        className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/15 text-white hover:bg-black/25"
        aria-label="Ocultar aviso de temporada"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

const PANEL_KEY = "dd-festivo-panel";
/** Ajuste del panel (por dispositivo): "auto", "off" o un tema fijo */
export function readPanelFestive(): FestiveSetting {
  try {
    return (localStorage.getItem(PANEL_KEY) as FestiveSetting | null) ?? "auto";
  } catch {
    return "auto";
  }
}
export function savePanelFestive(v: FestiveSetting) {
  try {
    localStorage.setItem(PANEL_KEY, v);
    window.dispatchEvent(new Event("dd-festivo"));
  } catch {}
}
/** Tema de temporada del panel (respeta el ajuste guardado en este dispositivo) */
export function usePanelFestive() {
  const [setting, setSetting] = useState<FestiveSetting | null>(null);
  useEffect(() => {
    const load = () => setSetting(readPanelFestive());
    load();
    window.addEventListener("dd-festivo", load);
    return () => window.removeEventListener("dd-festivo", load);
  }, []);
  const theme = useFestive(setting ?? "off");
  return setting === null ? null : theme;
}

const COLORS_KEY = "dd-festivo-colores";
export const readFestiveColors = () => {
  try {
    return localStorage.getItem(COLORS_KEY) !== "0";
  } catch {
    return true;
  }
};
export const saveFestiveColors = (v: boolean) => {
  try {
    localStorage.setItem(COLORS_KEY, v ? "1" : "0");
    window.dispatchEvent(new Event("dd-festivo"));
  } catch {}
};

/** Pinta botones, íconos y acentos con los colores de la temporada mientras el componente está montado */
export function FestiveColors({ theme }: { theme: FestiveTheme }) {
  useEffect(() => {
    const root = document.documentElement;
    const vars = {
      ...festiveVars(theme),
      // piezas para botones y tarjetas (ver globals.css)
      "--fest-btn-l": buttonCornerUri(theme.id, "left"),
      "--fest-btn-r": buttonCornerUri(theme.id, "right"),
      "--fest-flower": flowerUri(theme.id),
      "--fest-badge": badgeUri(theme.id),
      "--fest-mini": miniPicadoUri(theme.id),
    };
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.festive = theme.id;
    return () => {
      Object.keys(vars).forEach((k) => root.style.removeProperty(k));
      delete root.dataset.festive;
    };
  }, [theme]);
  return null;
}

/** Colores de temporada del panel (si están activados en Ajustes) */
export function PanelFestiveColors() {
  const fest = usePanelFestive();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const load = () => setOn(readFestiveColors());
    load();
    window.addEventListener("dd-festivo", load);
    return () => window.removeEventListener("dd-festivo", load);
  }, []);
  return fest && on ? <FestiveColors theme={fest} /> : null;
}

/* ======================================================================
   Ilustraciones de temporada (calaveritas, cempasúchil, velas, esferas…)
   ====================================================================== */

/** Una ilustración suelta (con su animación propia: flama, aleteo, giro…) */
export function FestiveArt({ name, size = 48, className, style }: { name: ArtName; size?: number; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={artUri(name)} alt="" aria-hidden width={size} height={size} draggable={false} className={cn("fest-sticker pointer-events-none select-none", className)} style={style} />;
}

/** Guirnalda que se mece (para la parte de arriba de una sección) */
export function FestiveSectionGarland({ theme, className, scale = 1 }: { theme: FestiveTheme; className?: string; scale?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 z-[2] overflow-hidden", className)}>
      <div className="fest-flutter">
        <FestiveGarland theme={theme} scale={scale} />
      </div>
    </div>
  );
}

/**
 * Activa la tirita de papel picado en la esquina de las tarjetas marcadas con `fest-mini` dentro de `target`
 * (por defecto toda la página). Solo se usa en tarjetas que tienen esa esquina libre.
 */
export function useFestiveDecor(theme: FestiveTheme | null, target?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = target?.current ?? document.documentElement;
    if (!theme || !el) return;
    el.style.setProperty("--fest-mini", miniPicadoUri(theme.id));
    el.dataset.festDecor = theme.id;
    return () => {
      el.style.removeProperty("--fest-mini");
      delete el.dataset.festDecor;
    };
  }, [theme, target]);
}

/** Ramillete de temporada para una esquina (nunca tapa texto: se achica o se oculta) */
export function FestiveCluster({ theme, corner = "bl", className, size }: { theme: FestiveTheme; corner?: "tl" | "tr" | "bl" | "br"; className?: string; size?: number }) {
  return <FestiveBouquet theme={theme} corner={corner} className={className} size={size} />;
}
