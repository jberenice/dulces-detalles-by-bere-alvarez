"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
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
  const g = useMemo(() => theme.garland(), [theme]);
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
          {p.ch}
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
    const vars = festiveVars(theme);
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
