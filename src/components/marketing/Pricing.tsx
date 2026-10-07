"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cake, CakeSlice, Check, Cookie, Crown, Globe, MessageCircle } from "lucide-react";
import { CUSTOM_DOMAIN_ADDON, IVA_PCT, PLANS, domainSetupIncluded, withIva, type PlanId } from "@/lib/plans";
import { salesLink } from "@/lib/legal";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useFestive } from "@/components/festive/Festive";
import { BigArtImg } from "@/components/festive/Decor";
import { BOUQUET, picadoTile } from "@/lib/festiveArt2";
import type { FestiveTheme } from "@/lib/festive";

/** Cada plan es un postre con su propio glaseado que se derrite */
// Variables CSS de la app: en fechas especiales toman los colores de la temporada
const DESSERT: Record<PlanId, { icon: typeof Cake; glaze: string; shine: string; ink: string; label: string }> = {
  basico: { icon: Cookie, glaze: "var(--color-mint-300)", shine: "var(--color-mint-100)", ink: "var(--color-mint-600)", label: "Galleta de menta" },
  profesional: { icon: CakeSlice, glaze: "var(--color-rose-500)", shine: "var(--color-rose-200)", ink: "var(--color-rose-500)", label: "Rebanada de fresa" },
  premium: { icon: Cake, glaze: "var(--color-cocoa-600)", shine: "var(--color-cocoa-300)", ink: "var(--color-cocoa-600)", label: "Pastel de chocolate" },
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

// En temporada cada plan toma un glaseado de la temporada (morado, chocolate, naranja…)
const FEST_GLAZE: Record<PlanId, { glaze: string; shine: string }> = {
  basico: { glaze: "var(--color-mint-500)", shine: "var(--color-mint-200)" },
  profesional: { glaze: "var(--color-cocoa-400)", shine: "var(--color-cocoa-200)" },
  premium: { glaze: "var(--color-rose-500)", shine: "var(--color-rose-200)" },
};

function MeltingGlaze({ plan, shown, fest }: { plan: PlanId; shown: boolean; fest?: FestiveTheme | null }) {
  const d = fest ? { ...DESSERT[plan], ...FEST_GLAZE[plan] } : DESSERT[plan];
  const drips = DRIPS[plan];
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 origin-top"
      style={{ height: H, transform: shown ? undefined : "scaleY(0)", animation: shown ? "pour 1s cubic-bezier(.2,.8,.2,1) both" : undefined }}
      aria-hidden
    >
      <svg viewBox={`0 0 400 ${VB}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        {/* capa base con orilla ondulada */}
        <path style={{ fill: d.glaze }} d={`M0 0H400V${BAND} C370 ${BAND + 8} 340 ${BAND - 4} 300 ${BAND + 4} S220 ${BAND - 2} 180 ${BAND + 6} S90 ${BAND - 4} 50 ${BAND + 4} S10 ${BAND} 0 ${BAND + 2}Z`} />
        {/* brillo */}
        <path style={{ fill: d.shine, stroke: d.shine }} opacity={0.55} d="M24 12 C80 7 140 16 196 11 S300 7 372 13" strokeWidth={3} strokeLinecap="round" />
        {/* gotas que se estiran lentamente */}
        {drips.map((g, i) => (
          <path
            key={i}
            d={`M${g.x - g.w / 2} ${BAND - 4} C${g.x - g.w / 2} ${BAND + g.len} ${g.x + g.w / 2} ${BAND + g.len} ${g.x + g.w / 2} ${BAND - 4}Z`}
            style={{ fill: d.glaze, transformBox: "fill-box", transformOrigin: "top", animation: shown ? `melt ${g.dur}s ease-in-out ${g.delay + 1}s infinite` : undefined }}
          />
        ))}
      </svg>
      {/* tira de papel picado debajo del glaseado */}
      {fest && <FestPicadoStrip theme={fest} />}
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
  { dx: "-34px", dy: "-26px", rot: "140deg", c: "var(--color-rose-500)" },
  { dx: "30px", dy: "-30px", rot: "-120deg", c: "var(--color-mint-400)" },
  { dx: "-40px", dy: "8px", rot: "200deg", c: "var(--color-cream-300)" },
  { dx: "38px", dy: "10px", rot: "-160deg", c: "var(--color-rose-500)" },
  { dx: "-12px", dy: "-40px", rot: "90deg", c: "var(--color-mint-500)" },
  { dx: "14px", dy: "34px", rot: "-80deg", c: "var(--color-rose-200)" },
];

function FestPicadoStrip({ theme }: { theme: FestiveTheme }) {
  const t = picadoTile(theme.id);
  return <span className="fest-flutter absolute inset-x-0 block" style={{ top: 58, height: 36, backgroundImage: t.image, backgroundSize: `${t.width * 0.75}px ${t.height * 0.75}px`, backgroundRepeat: "repeat-x" }} />;
}

function DessertBadge({ plan, dark, fest }: { plan: PlanId; dark?: boolean; fest?: FestiveTheme | null }) {
  const d = DESSERT[plan];
  if (fest) {
    const [, hero, tall, , front] = BOUQUET[fest.id];
    const art = plan === "basico" ? hero : plan === "profesional" ? front : tall;
    return (
      <div className="absolute top-4 right-4 z-10" title={fest.name}>
        <span className={cn("grid h-[72px] w-[72px] place-items-center rounded-full shadow-lift ring-4", dark ? "bg-cocoa-900 ring-rose-400" : "bg-white ring-white")} style={{ animation: "bob 4s ease-in-out infinite" }}>
          <BigArtImg name={art} w={art === "velaDeluxe" ? 30 : 50} part={false} />
        </span>
      </div>
    );
  }
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
          <Icon className="h-8 w-8" style={{ color: d.ink }} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

/** Tabla de precios mensual / anual (con IVA) y opción de dominio propio */
export function Pricing() {
  const [billing, setBilling] = useState<"mensual" | "anual">("anual");
  const [shown, setShown] = useState(false);
  const fest = useFestive("auto");
  const [domain, setDomain] = useState<Partial<Record<PlanId, { on: boolean; years: number }>>>({});
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
          const monthly = withIva(p.prices.mensual!);
          const yearly = withIva(p.prices.anual!);
          const monthlyYear = Math.round(monthly * 12 * 100) / 100;
          const save = Math.round((monthlyYear - yearly) * 100) / 100;
          const planPrice = billing === "anual" ? yearly : monthly;
          const dark = !!p.highlight;
          const canDomain = p.id !== "basico";
          const dom = domain[p.id] ?? { on: false, years: 3 };
          const domOpt = CUSTOM_DOMAIN_ADDON.years.find((y) => y.years === dom.years) ?? CUSTOM_DOMAIN_ADDON.years[0];
          const setupIncluded = domainSetupIncluded(p.id, billing);
          const setup = dom.on && canDomain && !setupIncluded ? CUSTOM_DOMAIN_ADDON.setup : 0;
          const domainCost = dom.on && canDomain ? domOpt.price : 0;
          const total = Math.round((planPrice + domainCost + setup) * 100) / 100;
          const text =
            `¡Hola! Quiero el plan ${p.name} ${billing} de Dulces Detalles 🧁\n` +
            `• Plan: ${money(planPrice)} (IVA incluido)` +
            (dom.on && canDomain
              ? `\n• Dominio propio por ${dom.years} año${dom.years > 1 ? "s" : ""}: ${money(domainCost)}\n• Instalación: ${setup ? money(setup) : "incluida"}`
              : "") +
            `\nTotal: ${money(total)}`;
          const muted = dark ? "text-cream-200/70" : "text-cocoa-400";
          return (
            <div
              key={p.id}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-[28px] px-6 pt-32 pb-6 transition duration-500 hover:-translate-y-1.5 sm:px-7 sm:pb-7",
                dark ? "bg-cocoa-800 text-cream-100 shadow-lift ring-2 ring-rose-400 lg:-my-3 lg:pb-10" : "card hover:shadow-lift",
              )}
              style={{ opacity: shown ? undefined : 0, animation: shown ? `fade-up .7s cubic-bezier(.22,1,.36,1) ${idx * 0.12}s backwards` : undefined }}
            >
              <MeltingGlaze plan={p.id} shown={shown} fest={fest} />
              <DessertBadge plan={p.id} dark={dark} fest={fest} />
              {dark && (
                <span className="absolute top-5 left-5 z-10 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold whitespace-nowrap text-rose-600 shadow-soft">
                  <Crown className="h-3.5 w-3.5" /> El favorito
                </span>
              )}
              <h3 className={cn("text-2xl font-semibold", dark && "!text-white")}>{p.name}</h3>
              <p className={cn("mt-1 text-sm", muted)}>{p.tagline}</p>

              {/* Precio */}
              <div className="mt-6 flex flex-wrap items-end gap-x-1.5">
                <span key={billing} className={cn("animate-fade-up font-display text-[2.6rem] leading-none font-semibold tabular-nums", dark ? "text-white" : "text-cocoa-800")}>
                  {money(planPrice)}
                </span>
                <span className={cn("pb-1 text-sm", muted)}>/ {billing === "anual" ? "año" : "mes"}</span>
              </div>
              <p className={cn("mt-2 text-xs leading-relaxed", dark ? "text-mint-300" : "text-mint-600")}>
                {billing === "anual" ? (
                  <>
                    Equivale a {money(yearly / 12)} al mes · <b>ahorras {money(save)}</b>
                  </>
                ) : (
                  <>
                    Sin plazo forzoso · mes a mes, al año son {money(monthlyYear)}
                    <span className={cn("block", muted)}>Anual: {money(yearly)} (ahorras {money(save)})</span>
                  </>
                )}
              </p>
              <p className={cn("mt-1 text-[11px]", muted)}>IVA ({IVA_PCT}%) incluido</p>

              {/* Dominio propio */}
              {canDomain && (
                <div className={cn("mt-5 rounded-2xl p-3.5", dark ? "bg-white/8 ring-1 ring-white/10" : "bg-cream-100 ring-1 ring-cocoa-800/5")}>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={dom.on}
                      onChange={(e) => setDomain((x) => ({ ...x, [p.id]: { ...dom, on: e.target.checked } }))}
                      className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-rose-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("flex flex-wrap items-center gap-x-2 text-sm font-bold", dark ? "text-white" : "text-cocoa-700")}>
                        <Globe className="h-4 w-4" /> Quiero mi propio dominio
                      </span>
                      <span className={cn("block text-xs", muted)}>
                        tutienda.com ·{" "}
                        {setupIncluded ? (
                          <b className={dark ? "text-mint-300" : "text-mint-600"}>instalación incluida</b>
                        ) : (
                          <>costo de instalación {money(CUSTOM_DOMAIN_ADDON.setup)}</>
                        )}
                      </span>
                    </span>
                  </label>
                  {dom.on && (
                    <div className="mt-3 animate-fade-up">
                      <div className="grid grid-cols-3 gap-1.5">
                        {CUSTOM_DOMAIN_ADDON.years.map((y) => (
                          <button
                            key={y.years}
                            type="button"
                            onClick={() => setDomain((x) => ({ ...x, [p.id]: { on: true, years: y.years } }))}
                            className={cn(
                              "rounded-xl px-1 py-2 text-center text-xs font-bold transition",
                              dom.years === y.years
                                ? "bg-rose-500 text-white shadow-rose"
                                : dark
                                  ? "bg-white/10 text-cream-100 hover:bg-white/15"
                                  : "bg-white text-cocoa-600 ring-1 ring-cocoa-800/10 hover:ring-rose-300",
                            )}
                          >
                            {y.years} año{y.years > 1 ? "s" : ""}
                            <span className="block text-[11px] font-semibold opacity-90">{money(y.price)}</span>
                          </button>
                        ))}
                      </div>
                      <p className={cn("mt-2 text-[11px] leading-snug", muted)}>
                        {domOpt.promo}. Después se renueva en {money(CUSTOM_DOMAIN_ADDON.renewal)} al año. {CUSTOM_DOMAIN_ADDON.note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Total cuando hay extras */}
              {dom.on && canDomain && (
                <div className={cn("mt-3 rounded-2xl p-3.5 text-sm animate-fade-up", dark ? "bg-black/20" : "bg-white ring-1 ring-cocoa-800/5")}>
                  <Row label={`Plan ${billing}`} value={money(planPrice)} muted={muted} />
                  <Row label={`Dominio ${dom.years} año${dom.years > 1 ? "s" : ""}`} value={money(domainCost)} muted={muted} />
                  <Row label="Instalación" value={setup ? money(setup) : "Incluida"} muted={muted} />
                  <div className={cn("mt-2 flex items-end justify-between border-t pt-2", dark ? "border-white/10" : "border-cocoa-800/8")}>
                    <span className="font-bold">Total</span>
                    <span key={total} className={cn("animate-fade-up font-display text-xl font-semibold tabular-nums", dark ? "text-white" : "text-cocoa-800")}>{money(total)}</span>
                  </div>
                </div>
              )}

              <a
                href={salesLink(text)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98]",
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

      <p className="mt-8 text-center text-sm text-cocoa-400">
        Precios en pesos mexicanos con IVA incluido. El dominio propio solo aplica a los planes con tienda en línea. ¿Aún con dudas?{" "}
        <Link href="/demo" className="font-bold text-rose-500 hover:underline">Prueba la demo gratis</Link>.
      </p>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted: string }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className={muted}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
