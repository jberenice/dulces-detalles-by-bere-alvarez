"use client";
/**
 * Adornos de temporada estilo "papel picado + ramilletes" (como los diseños de referencia).
 * Regla de oro: NUNCA tapan texto. Cada adorno se registra y, si choca con letras, botones, imágenes o tarjetas,
 * se hace más chico y, si aun así choca, se oculta. Se vuelve a revisar al cambiar el tamaño de la pantalla.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { cleanLogo } from "@/lib/cleanLogo";
import type { FestiveTheme } from "@/lib/festive";
import { SKINS, skinCss } from "@/lib/festiveSkin";
import { BOUQUET, bigRatio, bigUri, confettiUri, darkPatternUri, logoBackdrop, picadoTile, POSTER_GRADIENT, posterSparkUri, ribbonUri, sidePanelUri, swagSvg, type BigArt } from "@/lib/festiveArt2";

/* ------------------------------------------------------------------ Revisión de choques con el texto */
type Deco = { el: HTMLElement; scales: number[]; textOnly?: boolean };
const decos = new Set<Deco>();
let timer = 0;
let watching = false;
const SKIP = "[data-fest], .sticky, .fixed, [role=dialog], [aria-hidden=true]";
const SOLID = "img, svg, button, input, select, textarea, iframe, video, .card, .fest-card";

function schedule() {
  window.clearTimeout(timer);
  timer = window.setTimeout(check, 120);
}
function watch() {
  if (watching) return;
  watching = true;
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  document.addEventListener("toggle", schedule, true);
  document.fonts?.ready.then(schedule).catch(() => {});
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(schedule).observe(document.body);
}

function obstacles() {
  const out: DOMRect[] = [];
  const solid: DOMRect[] = [];
  const cache = new Map<Element, boolean>();
  const skip = (el: Element | null) => {
    if (!el) return true;
    let v = cache.get(el);
    if (v === undefined) cache.set(el, (v = !!el.closest(SKIP)));
    return v;
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue?.trim() || skip(n.parentElement)) continue;
    const tag = n.parentElement!.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") continue;
    range.selectNodeContents(n);
    for (const r of Array.from(range.getClientRects())) if (r.width > 0 && r.height > 0) out.push(r);
  }
  document.querySelectorAll(SOLID).forEach((el) => {
    if (el.closest("[data-fest], .sticky, .fixed, [role=dialog]")) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) solid.push(r);
  });
  return { text: out, all: out.concat(solid) };
}

const M = 6;
function collides(el: HTMLElement, obs: DOMRect[]) {
  const parts = el.querySelectorAll<HTMLElement>("[data-fest-part]");
  const rects = parts.length ? Array.from(parts, (p) => p.getBoundingClientRect()) : [el.getBoundingClientRect()];
  return rects.some((r) => r.width > 0 && obs.some((o) => r.left < o.right + M && r.right > o.left - M && r.top < o.bottom + M && r.bottom > o.top - M));
}

function check() {
  if (!decos.size) return;
  decos.forEach((d) => {
    d.el.style.scale = "";
    d.el.style.visibility = "";
  });
  const o = obstacles();
  decos.forEach((d) => {
    if (!d.el.isConnected) return;
    const obs = d.textOnly ? o.text : o.all;
    for (const s of d.scales) {
      d.el.style.scale = s === 1 ? "" : String(s);
      if (!collides(d.el, obs)) return;
    }
    d.el.style.scale = "";
    d.el.style.visibility = "hidden";
  });
}

/** Registra un adorno para que se encoja u oculte si tapa texto */
export function useAvoidText(ref: React.RefObject<HTMLElement | null>, scales = [1, 0.8, 0.62], deps: unknown[] = [], textOnly = false) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const d: Deco = { el, scales, textOnly };
    decos.add(d);
    watch();
    schedule();
    return () => {
      decos.delete(d);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Ancho del contenedor (para dibujar el papel picado a la medida) */
function useParentWidth(ref: React.RefObject<HTMLElement | null>) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const p = ref.current?.parentElement;
    if (!p) return;
    const read = () => setW(Math.round(p.clientWidth / 10) * 10);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(p);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ------------------------------------------------------------------ Papel picado colgando de las esquinas */
export function FestiveSwag({
  theme,
  side,
  width = 0.44,
  className,
  top = 0,
  big = false,
}: {
  theme: FestiveTheme;
  side: "left" | "right" | "center";
  /** fracción del ancho del contenedor */
  width?: number;
  className?: string;
  top?: number;
  big?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pw = useParentWidth(ref);
  const small = pw < 640;
  const w = side === "center" ? pw : Math.max(150, Math.round((pw * (small ? Math.max(width, 0.5) : width)) / 10) * 10);
  const flag = small ? 26 : big ? 44 : 36;
  const sag = small ? 18 : big ? 46 : 34;
  const art = useMemo(() => (pw ? swagSvg(theme.id, w, side, flag, sag) : null), [theme.id, w, side, flag, sag, pw]);
  const uri = useMemo(() => (art ? `data:image/svg+xml,${encodeURIComponent(art.svg)}` : ""), [art]);
  useAvoidText(ref, [1, 0.8, 0.62], [uri]);
  return (
    <div
      ref={ref}
      data-fest
      aria-hidden
      className={cn("pointer-events-none absolute z-[2] select-none", className)}
      style={{ top, [side === "right" ? "right" : "left"]: 0, width: art ? w : 0, height: art?.h ?? 0, transformOrigin: side === "right" ? "top right" : side === "left" ? "top left" : "top center" }}
    >
      {art && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={uri} alt="" width={w} height={art.h} draggable={false} className="block max-w-none" />
          {art.boxes.map((b, i) => (
            <span key={i} data-fest-part className="absolute" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />
          ))}
        </>
      )}
    </div>
  );
}

/** Par de guirnaldas (izquierda y derecha) para la parte de arriba de una sección */
export function FestiveSwags({ theme, top = 0, big, width }: { theme: FestiveTheme; top?: number; big?: boolean; width?: number }) {
  return (
    <>
      <FestiveSwag theme={theme} side="left" top={top} big={big} width={width} />
      <FestiveSwag theme={theme} side="right" top={top} big={big} width={width} />
    </>
  );
}

/* ------------------------------------------------------------------ Ramillete (flores, calaverita, vela, pan…) */
export function BigArtImg({ name, w, className, style, part = true }: { name: BigArt; w: number; className?: string; style?: React.CSSProperties; part?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={bigUri(name)}
      alt=""
      aria-hidden
      draggable={false}
      width={w}
      height={Math.round(w * bigRatio(name))}
      data-fest-part={part ? "" : undefined}
      className={cn("fest-sticker pointer-events-none max-w-none select-none", className)}
      style={style}
    />
  );
}

/**
 * Ramillete para una esquina: flores atrás, la ilustración principal al centro, vela/árbol a un lado y algo al frente.
 * `corner` indica la esquina del contenedor (que debe tener position: relative).
 */
export function FestiveBouquet({
  theme,
  corner = "bl",
  size = 180,
  className,
  offset = 0,
  edge = false,
  overCards = false,
}: {
  theme: FestiveTheme;
  corner?: "tl" | "tr" | "bl" | "br";
  size?: number;
  className?: string;
  /** cuánto se sale de la orilla (px) */
  offset?: number;
  /** pegado a la orilla de la pantalla aunque el contenedor sea angosto */
  edge?: boolean;
  /** puede encimarse en tarjetas (nunca en letras) */
  overCards?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useAvoidText(ref, [1, 0.78, 0.6, 0.45], [], overCards);
  const [back, hero, tall, filler, front] = BOUQUET[theme.id];
  const right = corner === "tr" || corner === "br";
  const top = corner === "tl" || corner === "tr";
  const S = size;
  const H = Math.round(S * 0.8);
  const side = right ? "right" : "left";
  const it = (x: number, b: number) => ({ [side]: Math.round(x * S), bottom: Math.round(b * S) }) as React.CSSProperties;
  return (
    <div
      ref={ref}
      data-fest
      aria-hidden
      className={cn("pointer-events-none absolute z-[1]", className)}
      style={{
        width: S,
        height: H,
        [side]: edge ? `calc((100% - 100vw) / 2 - ${offset}px)` : -offset,
        [top ? "top" : "bottom"]: 0,
        transformOrigin: `${top ? "top" : "bottom"} ${side}`,
      }}
    >
      <span className="fest-sway absolute" style={{ ...it(0.3, 0.26), animationDelay: "-1s" }}>
        <BigArtImg name={back} w={Math.round(S * 0.48)} />
      </span>
      <span className="fest-bob absolute" style={{ ...it(0.0, 0.16), animationDelay: "-2.2s" }}>
        <BigArtImg name={tall} w={Math.round(S * (tall === "velaDeluxe" ? 0.2 : 0.3))} />
      </span>
      <span className="fest-sway absolute" style={{ ...it(0.13, 0.08), "--r": right ? "4deg" : "-4deg" } as React.CSSProperties}>
        <BigArtImg name={hero} w={Math.round(S * 0.44)} />
      </span>
      <span className="fest-bob absolute" style={{ ...it(0.56, 0.02), animationDelay: "-.6s" }}>
        <BigArtImg name={filler} w={Math.round(S * 0.27)} />
      </span>
      <span className="fest-bob absolute" style={{ ...it(-0.02, -0.02), animationDelay: "-3s" }}>
        <BigArtImg name={front} w={Math.round(S * (front === "panDeluxe" ? 0.36 : 0.24))} />
      </span>
    </div>
  );
}

/** Ramillete chiquito en línea (para los lados de una etiqueta o título) */
export function MiniBouquet({ theme, flip, size = 52, className }: { theme: FestiveTheme; flip?: boolean; size?: number; className?: string }) {
  const [back, hero, , filler] = BOUQUET[theme.id];
  return (
    <span aria-hidden data-fest className={cn("pointer-events-none relative inline-block shrink-0", className)} style={{ width: size, height: size * 0.86 }}>
      <span className="fest-sway absolute" style={{ [flip ? "left" : "right"]: 0, top: 0 }}>
        <BigArtImg name={back} w={Math.round(size * 0.62)} part={false} />
      </span>
      <span className="fest-bob absolute" style={{ [flip ? "right" : "left"]: 0, bottom: 0, animationDelay: "-1.4s" }}>
        <BigArtImg name={hero} w={Math.round(size * 0.6)} part={false} />
      </span>
      <span className="fest-bob absolute" style={{ [flip ? "left" : "right"]: Math.round(size * 0.02), bottom: 0, animationDelay: "-2.6s" }}>
        <BigArtImg name={filler} w={Math.round(size * 0.34)} part={false} />
      </span>
    </span>
  );
}

/** Fondo tenue de confeti y pétalos (queda detrás del contenido) */
export function FestiveConfetti({ theme, opacity = 0.5, dark = false }: { theme: FestiveTheme; opacity?: number; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // el contenedor crea su propia capa para que el confeti quede detrás del texto
    const p = ref.current?.parentElement;
    if (!p) return;
    const had = p.style.isolation;
    p.style.isolation = "isolate";
    return () => {
      p.style.isolation = had;
    };
  }, []);
  const bg = useMemo(() => (dark ? `${darkPatternUri(theme.id)}, ${confettiUri(theme.id)}` : confettiUri(theme.id)), [theme.id, dark]);
  return <div ref={ref} aria-hidden data-fest className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: bg, backgroundSize: dark ? "260px 260px, 220px 220px" : "220px 220px", opacity }} />;
}

/** Banderotas de papel picado muy tenues en los costados de la pantalla (detrás de todo) */
export function FestiveSidePanels({ theme, opacity = 0.22 }: { theme: FestiveTheme; opacity?: number }) {
  const bg = useMemo(() => sidePanelUri(theme.id), [theme.id]);
  const fade = "linear-gradient(transparent, #000 80px, #000 calc(100% - 80px), transparent)";
  const base: React.CSSProperties = { backgroundImage: bg, backgroundSize: "140px 560px", backgroundRepeat: "repeat-y", opacity, width: 140, maskImage: fade, WebkitMaskImage: fade };
  return (
    <>
      <div aria-hidden data-fest className="pointer-events-none absolute inset-y-0 -z-10 max-md:hidden" style={{ ...base, left: "calc((100% - 100vw) / 2 - 30px)" }} />
      <div aria-hidden data-fest className="pointer-events-none absolute inset-y-0 -z-10 max-md:hidden" style={{ ...base, right: "calc((100% - 100vw) / 2 - 30px)", backgroundPosition: "0 280px", transform: "scaleX(-1)" }} />
    </>
  );
}

/** Flores y calaveritas en las orillas, a distintas alturas: pueden asomarse sobre las tarjetas pero nunca sobre letras */
export function FestiveEdgeArt({ theme, rows = 4, seed = 0 }: { theme: FestiveTheme; rows?: number; seed?: number }) {
  const [back, hero, , filler] = BOUQUET[theme.id];
  const list = SKINS[theme.id].edge ?? [back, hero, filler, back];
  const items = Array.from({ length: rows * 2 }, (_, i) => ({
    name: list[(i + seed) % list.length] as BigArt,
    right: i % 2 === 1,
    top: 6 + Math.floor(i / 2) * (88 / Math.max(rows - 1, 1)) + (i % 2) * 6,
    w: [70, 64, 44, 58][(i + seed) % 4],
  }));
  return (
    <>
      {items.map((it, i) => (
        <EdgeItem key={i} {...it} delay={-i * 0.8} />
      ))}
    </>
  );
}
function EdgeItem({ name, right, top, w, delay }: { name: BigArt; right: boolean; top: number; w: number; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useAvoidText(ref, [1, 0.75, 0.55], [], true);
  return (
    <span ref={ref} data-fest aria-hidden className="pointer-events-none absolute z-[3]" style={{ top: `${top}%`, [right ? "right" : "left"]: -w * 0.42, transformOrigin: right ? "right center" : "left center" }}>
      <span className="fest-sway block" style={{ animationDelay: `${delay}s` }}>
        <BigArtImg name={name} w={w} />
      </span>
    </span>
  );
}

/**
 * Adornos alrededor del logo (sin tocar el logo): arco de papel picado detrás del remolino,
 * calaveritas junto a "Detalles", flores, puntas de listón y encaje en la franja de abajo.
 * Va dentro del contenedor del logo (position: relative), ANTES de la imagen del logo.
 */
export function LogoFrame({ theme, compact = false }: { theme: FestiveTheme; compact?: boolean }) {
  const [back, hero, tall, filler, front] = BOUQUET[theme.id];
  const backdrop = useMemo(() => logoBackdrop(theme.id), [theme.id]);
  const ribbon = useMemo(() => ribbonUri(theme.id), [theme.id]);
  const sparks = useMemo(() => posterSparkUri(theme.id), [theme.id]);
  const confetti = useMemo(() => confettiUri(theme.id), [theme.id]);
  const picado = useMemo(() => picadoTile(theme.id), [theme.id]);
  const pct = (n: number) => `${n}%`;
  const at = (l: number, t: number, w: number): React.CSSProperties => ({ position: "absolute", left: pct(l), top: pct(t), width: pct(w) });
  const S = compact ? 0.8 : 1;
  return (
    <>
      {/* detrás del logo: degradado de la temporada, confeti y resplandor claro al centro para que se lean las letras */}
      <div aria-hidden data-fest className="pointer-events-none absolute" style={{ inset: compact ? "-10%" : "-14%" }}>
        <span className="absolute inset-0 block rounded-[28%]" style={{ background: `${confetti} center / 160px 160px, ${POSTER_GRADIENT[theme.id]}`, boxShadow: "0 24px 60px -24px rgb(0 0 0 / .55)" }} />
        <span className="absolute inset-0 block rounded-[28%]" style={{ background: "radial-gradient(ellipse at 50% 48%, rgb(255 250 242 / .98) 0 30%, rgb(255 246 236 / .75) 44%, rgb(255 240 222 / 0) 66%)" }} />
        <span className="fest-breathe absolute inset-0 block" style={{ background: `${sparks} center / contain no-repeat`, opacity: 0.95 }} />
        {/* papel picado colgando abajo del logo */}
        <span className="fest-flutter absolute right-[6%] bottom-0 left-[6%] block" style={{ height: `${9 * S}%`, backgroundImage: picado.image, backgroundSize: `auto 100%`, backgroundRepeat: "repeat-x", backgroundPosition: "center top" }} />
      </div>
      {/* adornos detrás del logo (arco o figura de la temporada) */}
      <div aria-hidden data-fest className="pointer-events-none absolute inset-0">
        {backdrop.mode === "arch" ? (
          <span className="fest-flutter block" style={{ ...at(17, 1, 70), aspectRatio: "200 / 104", background: `${backdrop.uri} center / contain no-repeat`, opacity: 0.95 }} />
        ) : (
          <span className="fest-breathe block" style={{ ...at(2, -2, 96), aspectRatio: "1", background: `${backdrop.uri} center / contain no-repeat`, opacity: 0.9 }} />
        )}
        {/* listón calado sobre la franja del logo */}
        <span style={{ ...at(-7, 77.5, 114), aspectRatio: "400 / 70", background: `${ribbon} center / contain no-repeat`, filter: "drop-shadow(0 4px 6px rgb(0 0 0 / .25))" }} />
      </div>
      {/* ilustraciones al frente, en las orillas (nunca sobre las letras del logo) */}
      <div aria-hidden data-fest className="pointer-events-none absolute inset-0 z-[1]">
        <span className="fest-sway" style={{ ...at(-20, 56, 24 * S), ["--r" as string]: "-8deg" }}><BigArtImg name={hero} w={90} part={false} className="!h-auto !w-full" /></span>
        <span className="fest-sway" style={{ ...at(96 - 24 * S + 24, 50, 24 * S), animationDelay: "-1.5s", ["--r" as string]: "8deg" }}><BigArtImg name={hero} w={90} part={false} className="!h-auto !w-full" /></span>
        <span className="fest-bob" style={{ ...at(-14, 20, 16 * S), animationDelay: "-1s" }}><BigArtImg name={back} w={56} part={false} className="!h-auto !w-full" /></span>
        <span className="fest-bob" style={{ ...at(98 - 16 * S + 16, 16, 16 * S), animationDelay: "-2.4s" }}><BigArtImg name={filler} w={56} part={false} className="!h-auto !w-full" /></span>
        {!compact && (
          <>
            <span className="fest-bob" style={{ ...at(-16, 30, 14), animationDelay: "-3s" }}><BigArtImg name={tall} w={60} part={false} className="!h-auto !w-full" /></span>
            <span className="fest-bob" style={{ ...at(100, 84, 14), animationDelay: "-.6s" }}><BigArtImg name={front} w={60} part={false} className="!h-auto !w-full" /></span>
            <span className="fest-bob" style={{ ...at(44, -16, 12), animationDelay: "-2s" }}><BigArtImg name={filler} w={48} part={false} className="!h-auto !w-full" /></span>
          </>
        )}
      </div>
    </>
  );
}

/** Inyecta la "piel" de la temporada (fondos de secciones, tarjetas, colores de texto) mientras está montado */
export function FestiveSkin({ theme }: { theme: FestiveTheme }) {
  const css = useMemo(() => skinCss(theme.id), [theme.id]);
  return <style data-fest-skin={theme.id} dangerouslySetInnerHTML={{ __html: css }} />;
}


/**
 * Logo con el diseño de la temporada: sin cuadro (las orillas se difuminan en un resplandor blanco)
 * y con los adornos de la temporada alrededor. Sin temporada se muestra en su círculo de siempre.
 */
export function SeasonLogo({ theme, src, alt, className, compact = true, plainClassName }: { theme: FestiveTheme | null; src: string; alt: string; className?: string; compact?: boolean; plainClassName?: string }) {
  if (!theme)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn("rounded-full bg-white object-cover", plainClassName ?? className)} />
    );
  return <SeasonLogoInner theme={theme} src={src} alt={alt} className={className} compact={compact} />;
}

function SeasonLogoInner({ theme, src, alt, className, compact }: { theme: FestiveTheme; src: string; alt: string; className?: string; compact: boolean }) {
  // logo sin su fondo liso (si tiene), para que se funda con el diseño sin verse el cuadro
  const [clean, setClean] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setClean(null);
    cleanLogo(src).then((u) => alive && setClean(u));
    return () => {
      alive = false;
    };
  }, [src]);
  return (
    <span className={cn("relative block shrink-0", className)}>
      <LogoFrame theme={theme} compact={compact} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={clean ?? src} alt={alt} className={cn("relative h-full w-full object-contain", !clean && "season-logo")} />
    </span>
  );
}
