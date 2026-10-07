"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { THEME_ART, artCss, artUri, type ArtName } from "@/lib/festiveArt";
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

/* ======================================================================
   Ilustraciones de temporada (calaveritas, cempasúchil, velas, esferas…)
   ====================================================================== */

/** Una ilustración suelta (con su animación propia: flama, aleteo, giro…) */
export function FestiveArt({ name, size = 48, className, style }: { name: ArtName; size?: number; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={artUri(name)} alt="" aria-hidden width={size} height={size} draggable={false} className={cn("fest-sticker pointer-events-none select-none", className)} style={style} />;
}

const rnd = (seed: number, n: number) => ((Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;

/**
 * Ilustraciones repartidas en las orillas de una sección (izquierda y derecha), flotando suavemente.
 * Va dentro de un contenedor con `position: relative`.
 */
export function FestiveScatter({ theme, count = 6, seed = 1, className }: { theme: FestiveTheme; count?: number; seed?: number; className?: string }) {
  const art = THEME_ART[theme.id];
  const items = Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0;
    return {
      name: art[(i + seed) % art.length],
      left,
      top: 6 + ((i / Math.max(count - 1, 1)) * 82 + rnd(seed, i) * 8),
      size: 40 + Math.round(rnd(seed, i + 9) * 34),
      off: -26 + Math.round(rnd(seed, i + 3) * 26),
      rot: Math.round((rnd(seed, i + 5) - 0.5) * 40),
      delay: -rnd(seed, i + 7) * 6,
    };
  });
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-[1]", className)}>
      {items.map((it, i) => (
        <span
          key={i}
          className={cn("fest-float absolute", i > 3 && "max-sm:hidden")}
          style={{ top: `${it.top}%`, [it.left ? "left" : "right"]: it.off, animationDelay: `${it.delay}s`, "--r": `${it.rot}deg` } as React.CSSProperties}
        >
          <FestiveArt name={it.name} size={it.size} className="max-sm:!h-9 max-sm:!w-9" />
        </span>
      ))}
    </div>
  );
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
 * Activa las ilustraciones en las esquinas de las tarjetas (.card y .fest-card) dentro de `target`
 * (por defecto toda la página). Usa variables CSS para no tocar el contenido de cada tarjeta.
 */
export function useFestiveDecor(theme: FestiveTheme | null, target?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = target?.current ?? document.documentElement;
    if (!theme || !el) return;
    const art = THEME_ART[theme.id];
    const vars: Record<string, string> = {};
    art.forEach((a, i) => (vars[`--fest-st-${i + 1}`] = artCss(a)));
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    el.dataset.festDecor = theme.id;
    return () => {
      Object.keys(vars).forEach((k) => el.style.removeProperty(k));
      delete el.dataset.festDecor;
    };
  }, [theme, target]);
}

/** Ramillete de ilustraciones (p. ej. calaverita con cempasúchil) para las esquinas de una sección */
export function FestiveCluster({ theme, corner = "tl", className }: { theme: FestiveTheme; corner?: "tl" | "tr" | "bl" | "br"; className?: string }) {
  const [a, b, c] = THEME_ART[theme.id];
  const pos = { tl: "top-10 left-0", tr: "top-10 right-0", bl: "bottom-0 left-0", br: "bottom-0 right-0" }[corner];
  const flip = corner === "tr" || corner === "br";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute z-[1] h-28 w-32 max-sm:scale-[.65]", pos, flip ? "origin-right" : "origin-left", className)}>
      <span className={cn("fest-float absolute bottom-1", flip ? "right-12" : "left-12")} style={{ animationDelay: "-1s", "--r": flip ? "10deg" : "-10deg" } as React.CSSProperties}>
        <FestiveArt name={b} size={56} />
      </span>
      <span className={cn("fest-float absolute bottom-6", flip ? "right-0" : "left-0")} style={{ "--r": flip ? "-8deg" : "8deg" } as React.CSSProperties}>
        <FestiveArt name={a} size={70} />
      </span>
      <span className={cn("fest-float absolute top-0", flip ? "right-16" : "left-16")} style={{ animationDelay: "-3s" } as React.CSSProperties}>
        <FestiveArt name={c} size={38} />
      </span>
    </div>
  );
}
