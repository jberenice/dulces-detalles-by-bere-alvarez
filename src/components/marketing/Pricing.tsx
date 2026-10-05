"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cake, CakeSlice, Check, Cookie, Crown, Globe, MessageCircle } from "lucide-react";
import { CUSTOM_DOMAIN_ADDON, PLANS, type PlanId } from "@/lib/plans";
import { salesLink } from "@/lib/legal";
import { money0 } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Cada plan es un postre con su propio glaseado que se derrite */
const DESSERT: Record<PlanId, { icon: typeof Cake; glaze: string; shine: string; label: string }> = {
  basico: { icon: Cookie, glaze: "#9ad7b9", shine: "#dcf3e7", label: "Galleta de menta" },
  profesional: { icon: CakeSlice, glaze: "#eb5473", shine: "#f7bccb", label: "Rebanada de fresa" },
  premium: { icon: Cake, glaze: "#6f4318", shine: "#c9a585", label: "Pastel de chocolate" },
};

// Gotas del glaseado: posición (0–400), ancho, largo y ritmo — distintas por plan para que no se vean iguales
const DRIPS: Record<PlanId, { x: number; w: number; len: number; dur: number; delay: number }[]> = {
  basico: [
    { x: 40, w: 30, len: 35, dur: 5.5, delay: 0.2 },
    { x: 120, w: 22, len: 54, dur: 6.5, delay: 1.1 },
    { x: 205, w: 34, len: 29, dur: 5, delay: 0.6 },
    { x: 290, w: 24, len: 48, dur: 7, delay: 1.6 },
    { x: 360, w: 28, len: 32, dur: 6, delay: 0.9 },
  ],
  profesional: [
    { x: 30, w: 26, len: 48, dur: 6, delay: 0.4 },
    { x: 100, w: 34, len: 32, dur: 5.2, delay: 1.3 },
    { x: 175, w: 22, len: 64, dur: 7.2, delay: 0.1 },
    { x: 250, w: 30, len: 38, dur: 5.8, delay: 1.8 },
    { x: 330, w: 24, len: 58, dur: 6.6, delay: 0.7 },
    { x: 385, w: 20, len: 26, dur: 5, delay: 2.2 },
  ],
  premium: [
    { x: 55, w: 34, len: 42, dur: 6.4, delay: 0.9 },
    { x: 140, w: 24, len: 61, dur: 7.4, delay: 0.3 },
    { x: 225, w: 30, len: 35, dur: 5.6, delay: 1.5 },
    { x: 315, w: 26, len: 54, dur: 6.8, delay: 0.5 },
  ],
};

const BAND = 36; // alto del glaseado base dentro del viewBox (0–100)
const VB = 100;
const H = 96; // alto en px del SVG

function MeltingGlaze({ plan, shown }: { plan: PlanId; shown: boolean }) {
  const d = DESSERT[plan];
  const drips = DRIPS[plan];
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 origin-top"
      style={{ height: H, transform: shown ? undefined : "scaleY(0)", animation: shown ? "pour 1s cubic-bezier(.2,.8,.2,1) both" : undefined }}
      aria-hidden
    >
      <svg viewBox={`0 0 400 ${VB}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        {/* capa base con orilla ondulada */}
        <path fill={d.glaze} d={`M0 0H400V${BAND} C370 ${BAND + 8} 340 ${BAND - 4} 300 ${BAND + 4} S220 ${BAND - 2} 180 ${BAND + 6} S90 ${BAND - 4} 50 ${BAND + 4} S10 ${BAND} 0 ${BAND + 2}Z`} />
        {/* brillo */}
        <path fill={d.shine} opacity={0.55} d="M24 12 C80 7 140 16 196 11 S300 7 372 13" stroke={d.shine} strokeWidth={3} strokeLinecap="round" />
        {/* gotas que se estiran lentamente */}
        {drips.map((g, i) => (
          <path
            key={i}
            fill={d.glaze}
            d={`M${g.x - g.w / 2} ${BAND - 4} C${g.x - g.w / 2} ${BAND + g.len} ${g.x + g.w / 2} ${BAND + g.len} ${g.x + g.w / 2} ${BAND - 4}Z`}
            style={{ transformBox: "fill-box", transformOrigin: "top", animation: shown ? `melt ${g.dur}s ease-in-out ${g.delay + 1}s infinite` : undefined }}
          />
        ))}
      </svg>
      {/* gotitas que caen de la punta */}
      {drips
        .filter((_, i) => i % 2 === 0)
        .map((g, i) => (
          <span
            key={i}
            className="absolute block rounded-full"
            style={{
              left: `calc(${(g.x / 400) * 100}% - 4px)`,
              top: ((BAND + g.len * 0.75) / VB) * H,
              width: 8,
              height: 10,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              background: d.glaze,
              opacity: 0,
              animation: shown ? `drop-fall ${g.dur + 1.5}s ease-in ${g.delay + 2}s infinite` : undefined,
            }}
          />
        ))}
    </div>
  );
}

const SPRINKLES = [
  { dx: "-34px", dy: "-26px", rot: "140deg", c: "#eb5473" },
  { dx: "30px", dy: "-30px", rot: "-120deg", c: "#7fcaa6" },
  { dx: "-40px", dy: "8px", rot: "200deg", c: "#f4e4c2" },
  { dx: "38px", dy: "10px", rot: "-160deg", c: "#eb5473" },
  { dx: "-12px", dy: "-40px", rot: "90deg", c: "#6aa68a" },
  { dx: "14px", dy: "34px", rot: "-80deg", c: "#f7bccb" },
];

function DessertBadge({ plan, dark }: { plan: PlanId; dark?: boolean }) {
  const d = DESSERT[plan];
  const Icon = d.icon;
  return (
    <div className="absolute top-5 right-5 z-10" title={d.label}>
      <div className="relative" style={{ animation: "bob 4s ease-in-out infinite" }}>
        {SPRINKLES.map((s, i) => (
          <span
            key={i}
            className="absolute top-1/2 left-1/2 h-1 w-2.5 rounded-full opacity-0 group-hover:animate-[sprinkle_0.9s_ease-out_forwards]"
            style={{ background: s.c, "--dx": s.dx, "--dy": s.dy, "--rot": s.rot, animationDelay: `${i * 30}ms` } as React.CSSProperties}
          />
        ))}
        <span
          className={cn(
            "grid h-16 w-16 place-items-center rounded-full shadow-lift ring-4 transition group-hover:animate-[wiggle_0.6s_ease-in-out]",
            dark ? "bg-cocoa-900 ring-cocoa-800" : "bg-white ring-white",
          )}
        >
          <Icon className="h-8 w-8" style={{ color: d.glaze === "#9ad7b9" ? "#528a70" : d.glaze }} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

/** Tabla de precios mensual / anual con tarjetas en forma de postre */
export function Pricing() {
  const [billing, setBilling] = useState<"mensual" | "anual">("anual");
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // El glaseado "cae" cuando las tarjetas aparecen en pantalla
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setShown(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-white p-1 shadow-soft ring-1 ring-cocoa-800/5">
          {(["mensual", "anual"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn("rounded-full px-5 py-2 text-sm font-bold transition", billing === b ? "bg-cocoa-800 text-cream-100" : "text-cocoa-500 hover:text-cocoa-700")}
            >
              {b === "mensual" ? "Mensual" : "Anual"}
              {b === "anual" && <span className={cn("ml-1.5 rounded-full px-2 py-0.5 text-[10px]", billing === b ? "bg-mint-400 text-cocoa-900" : "bg-mint-100 text-mint-700")}>2 meses gratis</span>}
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
        {PLANS.map((p, idx) => {
          const price = p.prices[billing]!;
          const perMonth = billing === "anual" ? price / 12 : price;
          const save = billing === "anual" ? p.prices.mensual! * 12 - price : 0;
          const text = `¡Hola! Quiero el plan ${p.name} ${billing} de Dulces Detalles (${money0(price)}) 🧁`;
          const dark = !!p.highlight;
          return (
            <div
              key={p.id}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-[28px] px-6 pt-32 pb-6 transition duration-500 hover:-translate-y-1.5 sm:px-7 sm:pb-7",
                dark ? "bg-cocoa-800 text-cream-100 shadow-lift ring-2 ring-rose-400 lg:-my-3 lg:pb-10" : "card hover:shadow-lift",
              )}
              style={{ opacity: shown ? undefined : 0, animation: shown ? `fade-up .7s cubic-bezier(.22,1,.36,1) ${idx * 0.12}s backwards` : undefined }}
            >
              <MeltingGlaze plan={p.id} shown={shown} />
              <DessertBadge plan={p.id} dark={dark} />
              {dark && (
                <span className="absolute top-5 left-5 z-10 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold whitespace-nowrap text-rose-600 shadow-soft">
                  <Crown className="h-3.5 w-3.5" /> El favorito
                </span>
              )}
              <h3 className={cn("text-2xl font-semibold", dark && "!text-white")}>{p.name}</h3>
              <p className={cn("mt-1 text-sm", dark ? "text-cream-200/75" : "text-cocoa-400")}>{p.tagline}</p>
              <div className="mt-6 flex items-end gap-1.5">
                <span key={billing} className={cn("animate-fade-up font-display text-5xl font-semibold tabular-nums", dark ? "text-white" : "text-cocoa-800")}>
                  {money0(perMonth)}
                </span>
                <span className={cn("pb-2 text-sm", dark ? "text-cream-200/70" : "text-cocoa-400")}>/ mes</span>
              </div>
              <p className={cn("mt-1 h-5 text-xs", dark ? "text-mint-300" : "text-mint-600")}>
                {billing === "anual" ? `${money0(price)} al año · ahorras ${money0(save)}` : "Sin plazo forzoso"}
              </p>
              <a
                href={salesLink(text)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98]",
                  dark ? "bg-rose-500 text-white shadow-rose hover:bg-rose-600" : "bg-cream-200 text-cocoa-700 hover:bg-cream-300",
                )}
              >
                <MessageCircle className="h-4 w-4" /> Quiero el {p.name}
              </a>
              <ul className="mt-7 space-y-3">
                {p.features.map((f, i) => (
                  <li key={f} className={cn("flex gap-2.5 text-[14.5px] leading-snug [overflow-wrap:anywhere]", dark ? "text-cream-100/90" : "text-cocoa-600", i === 0 && p.id !== "basico" && "font-bold")}>
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", dark ? "text-mint-300" : "text-mint-500")} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4 rounded-[28px] border border-dashed border-mint-300 bg-white/70 p-5 text-center sm:flex-row sm:text-left">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint-50 text-mint-600">
          <Globe className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-cocoa-700">¿Quieres tu propio dominio? (tutienda.com)</p>
          <p className="text-sm text-cocoa-500">
            Servicio extra para Profesional: instalación única de {money0(CUSTOM_DOMAIN_ADDON.setup)}. En Premium anual va incluido. {CUSTOM_DOMAIN_ADDON.note}
          </p>
        </div>
        <a
          href={salesLink("¡Hola! Me interesa conectar mi propio dominio a mi tienda de Dulces Detalles 🌐")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-mint-500 px-5 font-bold text-white hover:bg-mint-600"
        >
          <MessageCircle className="h-4 w-4" /> Preguntar
        </a>
      </div>

      <p className="mt-8 text-center text-sm text-cocoa-400">
        Precios en pesos mexicanos. ¿Aún con dudas? <Link href="/demo" className="font-bold text-rose-500 hover:underline">Prueba la demo gratis</Link>.
      </p>
    </div>
  );
}
