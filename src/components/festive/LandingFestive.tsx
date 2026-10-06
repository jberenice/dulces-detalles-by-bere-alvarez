"use client";
import { FestiveColors, FestiveGarland, FestiveParticles, useFestive } from "./Festive";

/** Adornos de temporada de la página principal (según la fecha; ?tema=… para verlos antes) */
export function LandingFestiveDecor() {
  const fest = useFestive("auto");
  if (!fest) return null;
  return (
    <>
      <FestiveGarland theme={fest} className="absolute inset-x-0 top-0 z-10" />
      <FestiveParticles theme={fest} count={16} contained />
      <FestiveColors theme={fest} />
    </>
  );
}

export function LandingFestiveBadge() {
  const fest = useFestive("auto");
  if (!fest) return null;
  return (
    <p className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 text-sm font-bold shadow-soft ring-1 ring-cocoa-800/5 lg:mx-0" style={{ color: fest.colors.primary }}>
      <span className="text-base">{fest.emoji}</span> {fest.hero}
    </p>
  );
}
