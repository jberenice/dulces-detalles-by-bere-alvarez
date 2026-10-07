"use client";
import { THEME_ART } from "@/lib/festiveArt";
import { cn } from "@/lib/cn";
import { FestiveArt, FestiveCluster, FestiveColors, FestiveGarland, FestiveParticles, FestiveScatter, FestiveSectionGarland, useFestive, useFestiveDecor } from "./Festive";

/** Adornos de temporada de la portada (según la fecha; ?tema=… para verlos antes) */
export function LandingFestiveDecor() {
  const fest = useFestive("auto");
  // Ilustraciones en las esquinas de las tarjetas de toda la página
  useFestiveDecor(fest);
  if (!fest) return null;
  return (
    <>
      <FestiveGarland theme={fest} className="fest-flutter absolute inset-x-0 top-0 z-10" />
      <FestiveParticles theme={fest} count={18} contained />
      <FestiveScatter theme={fest} count={6} seed={2} />
      <FestiveCluster theme={fest} corner="br" className="bottom-6" />
      <FestiveColors theme={fest} />
    </>
  );
}

/** Etiqueta de temporada arriba del título, con ilustraciones a los lados */
export function LandingFestiveBadge() {
  const fest = useFestive("auto");
  if (!fest) return null;
  const [a, b] = THEME_ART[fest.id];
  return (
    <div className="relative mb-4 inline-flex items-center gap-2">
      <FestiveArt name={a} size={40} className="fest-float -mr-1 shrink-0" />
      <p className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold shadow-soft ring-1 ring-cocoa-800/5" style={{ color: fest.ui.primary }}>
        {fest.hero}
      </p>
      <FestiveArt name={b} size={40} className="fest-float -ml-1 shrink-0" style={{ animationDelay: "-2s" }} />
    </div>
  );
}

/** Guirnalda que se mece + ilustraciones flotando en las orillas de una sección */
export function LandingFestiveSection({ seed = 1, count = 6, garland = true, corners = true, className }: { seed?: number; count?: number; garland?: boolean; corners?: boolean; className?: string }) {
  const fest = useFestive("auto");
  if (!fest) return null;
  return (
    <>
      {garland && <FestiveSectionGarland theme={fest} scale={0.85} className={className} />}
      <FestiveScatter theme={fest} count={count} seed={seed} />
      {corners && (
        <>
          <FestiveCluster theme={fest} corner={seed % 2 ? "tl" : "tr"} />
          <FestiveCluster theme={fest} corner={seed % 2 ? "br" : "bl"} />
        </>
      )}
    </>
  );
}

/** Ilustraciones pequeñas junto al logo del encabezado */
export function LandingHeaderArt({ className }: { className?: string }) {
  const fest = useFestive("auto");
  if (!fest) return null;
  const art = THEME_ART[fest.id];
  return (
    <span aria-hidden className={cn("flex items-center gap-1", className)}>
      {art.slice(0, 3).map((n, i) => (
        <FestiveArt key={i} name={n} size={30} className="fest-float" style={{ animationDelay: `${-i * 1.4}s` }} />
      ))}
    </span>
  );
}

/** Fila de ilustraciones al pie de página (velas, pan de muerto, esferas…) */
export function FestiveFooterArt() {
  const fest = useFestive("auto");
  if (!fest) return null;
  const art = THEME_ART[fest.id];
  const row = [art[2], art[1], art[0], art[3], art[0], art[1], art[2]];
  return (
    <div aria-hidden className="pointer-events-none relative -mb-2 flex items-end justify-center gap-1 sm:gap-3">
      {row.map((n, i) => (
        <FestiveArt key={i} name={n} size={i === 3 ? 64 : i % 2 ? 44 : 52} className={cn("fest-float", (i === 0 || i === 6) && "max-sm:hidden")} style={{ animationDelay: `${-i * 0.9}s` }} />
      ))}
    </div>
  );
}
