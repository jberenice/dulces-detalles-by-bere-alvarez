"use client";
import { cn } from "@/lib/cn";
import { BOUQUET } from "@/lib/festiveArt2";
import { FestiveColors, FestiveParticles, useFestive, useFestiveDecor } from "./Festive";
import { BigArtImg, FestiveBouquet, FestiveConfetti, FestiveEdgeArt, FestiveSidePanels, FestiveSwag, FestiveSwags, LogoFrame, MiniBouquet } from "./Decor";

/** Adornos de temporada de la portada (según la fecha; ?tema=… para verlos antes) */
export function LandingFestiveDecor() {
  const fest = useFestive("auto");
  // Tirita de papel picado en las tarjetas marcadas con .fest-mini
  useFestiveDecor(fest);
  if (!fest) return null;
  return (
    <>
      <FestiveColors theme={fest} />
      <FestiveConfetti theme={fest} opacity={0.55} />
      <FestiveSwags theme={fest} big width={0.46} />
      <FestiveParticles theme={fest} count={18} contained />
      <FestiveSidePanels theme={fest} opacity={0.16} />
      <FestiveBouquet theme={fest} corner="bl" size={230} offset={20} />
      <FestiveBouquet theme={fest} corner="br" size={230} offset={20} />
    </>
  );
}

/** Etiqueta de temporada arriba del título, con ramilletes a los lados */
export function LandingFestiveBadge() {
  const fest = useFestive("auto");
  if (!fest) return null;
  return (
    <div className="relative mb-4 inline-flex max-w-full items-center gap-1">
      <MiniBouquet theme={fest} size={50} className="max-[380px]:hidden" />
      <p className="rounded-full bg-white/95 px-4 py-1.5 text-sm font-bold shadow-soft ring-2" style={{ color: fest.ui.primary, ["--tw-ring-color" as string]: `color-mix(in srgb, ${fest.ui.primary} 25%, transparent)` }}>
        {fest.hero}
      </p>
      <MiniBouquet theme={fest} size={50} flip className="max-[380px]:hidden" />
    </div>
  );
}

/** (compatibilidad) El botón principal ya trae su diseño de temporada desde globals.css (.btn-primary.btn-lg) */
export function FestiveCTA({ children }: { children: React.ReactNode; className?: string }) {
  return <>{children}</>;
}

/** Papel picado colgando de las esquinas + ramilletes en las orillas de la pantalla + fondo de temporada */
export function LandingFestiveSection({
  seed = 1,
  garland = true,
  corners = true,
  confetti = true,
  panels = true,
  edgeArt = 0,
  dark = false,
  top = 0,
}: {
  seed?: number;
  /** (compatibilidad) ya no se usa */
  count?: number;
  garland?: boolean;
  corners?: boolean;
  confetti?: boolean;
  /** banderotas tenues en los costados */
  panels?: boolean;
  /** filas de flores y calaveritas en las orillas (se asoman sobre tarjetas, nunca sobre letras) */
  edgeArt?: number;
  dark?: boolean;
  top?: number;
  className?: string;
}) {
  const fest = useFestive("auto");
  if (!fest) return null;
  return (
    <>
      {confetti && <FestiveConfetti theme={fest} opacity={dark ? 0.7 : 0.45} dark={dark} />}
      {panels && !dark && <FestiveSidePanels theme={fest} />}
      {garland && <FestiveSwags theme={fest} top={top} />}
      {edgeArt > 0 && <FestiveEdgeArt theme={fest} rows={edgeArt} seed={seed} />}
      {corners && (
        <>
          <FestiveBouquet theme={fest} corner="bl" size={seed % 2 ? 210 : 170} offset={18} edge />
          <FestiveBouquet theme={fest} corner="br" size={seed % 2 ? 170 : 210} offset={18} edge />
        </>
      )}
    </>
  );
}

/** Adornos alrededor del logo grande de la portada (no modifica el logo) */
export function LandingLogoFrame() {
  const fest = useFestive("auto");
  return fest ? <LogoFrame theme={fest} /> : null;
}

/** Ilustraciones pequeñas junto al logo del encabezado */
export function LandingHeaderArt({ className }: { className?: string }) {
  const fest = useFestive("auto");
  if (!fest) return null;
  const [back, hero, tall] = BOUQUET[fest.id];
  return (
    <span aria-hidden className={cn("flex items-end gap-1", className)}>
      <BigArtImg name={back} w={30} part={false} className="fest-bob" />
      <BigArtImg name={hero} w={34} part={false} className="fest-bob [animation-delay:-1.5s]" />
      <BigArtImg name={tall} w={tall === "velaDeluxe" ? 18 : 28} part={false} className="fest-bob [animation-delay:-3s]" />
    </span>
  );
}

/** Pie de página: papel picado arriba, ramilletes en las esquinas y confeti (va directo dentro del <footer>, que es relative) */
export function FestiveFooterDecor() {
  const fest = useFestive("auto");
  if (!fest) return null;
  return (
    <>
      <FestiveConfetti theme={fest} opacity={0.35} />
      <FestiveSwag theme={fest} side="center" />
      <FestiveBouquet theme={fest} corner="bl" size={200} offset={10} />
      <FestiveBouquet theme={fest} corner="br" size={200} offset={10} />
    </>
  );
}

/** Fila de velas, flores y pan al centro del pie de página */
export function FestiveFooterArt() {
  const fest = useFestive("auto");
  if (!fest) return null;
  const [back, hero, tall, filler, front] = BOUQUET[fest.id];
  const row = [tall, filler, front, hero, front, filler, tall];
  return (
    <>
      <div aria-hidden data-fest className="pointer-events-none relative mx-auto mt-8 flex items-end justify-center gap-1 sm:gap-3">
        {row.map((n, i) => (
          <BigArtImg
            key={i}
            name={n === back ? filler : n}
            w={n === "velaDeluxe" ? 26 : i === 3 ? 64 : n === "panDeluxe" ? 58 : 40}
            part={false}
            className={cn("fest-bob", (i === 0 || i === 6) && "max-sm:hidden")}
            style={{ animationDelay: `${-i * 0.7}s` }}
          />
        ))}
      </div>
    </>
  );
}

/** Adornos alrededor del logo del pie de página */
export function FooterLogoFrame() {
  const fest = useFestive("auto");
  return fest ? <LogoFrame theme={fest} compact /> : null;
}
