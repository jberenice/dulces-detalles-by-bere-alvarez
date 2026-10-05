"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Crown, Infinity as InfinityIcon, MessageCircle } from "lucide-react";
import { PLANS, type Billing } from "@/lib/plans";
import { salesLink } from "@/lib/legal";
import { money0 } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Tabla de precios con cambio mensual / anual y opción de por vida */
export function Pricing() {
  const [billing, setBilling] = useState<Exclude<Billing, "vitalicia">>("anual");
  const lifetime = PLANS.filter((p) => p.prices.vitalicia);

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

      <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
        {PLANS.map((p) => {
          const price = p.prices[billing]!;
          const perMonth = billing === "anual" ? price / 12 : price;
          const save = billing === "anual" ? p.prices.mensual! * 12 - price : 0;
          const text = `¡Hola! Quiero el plan ${p.name} ${billing} de Dulces Detalles (${money0(price)}) 🧁`;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-[28px] p-6 sm:p-7",
                p.highlight ? "bg-cocoa-800 text-cream-100 shadow-lift ring-2 ring-rose-400 lg:-my-3 lg:py-10" : "card",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-rose-500 px-3.5 py-1 text-xs font-bold whitespace-nowrap text-white shadow-rose">
                  <Crown className="h-3.5 w-3.5" /> El favorito
                </span>
              )}
              <h3 className={cn("text-2xl font-semibold", p.highlight && "!text-white")}>{p.name}</h3>
              <p className={cn("mt-1 text-sm", p.highlight ? "text-cream-200/75" : "text-cocoa-400")}>{p.tagline}</p>
              <div className="mt-6 flex items-end gap-1.5">
                <span className={cn("font-display text-5xl font-semibold tabular-nums", p.highlight ? "text-white" : "text-cocoa-800")}>{money0(perMonth)}</span>
                <span className={cn("pb-2 text-sm", p.highlight ? "text-cream-200/70" : "text-cocoa-400")}>/ mes</span>
              </div>
              <p className={cn("mt-1 h-5 text-xs", p.highlight ? "text-mint-300" : "text-mint-600")}>
                {billing === "anual" ? `${money0(price)} al año · ahorras ${money0(save)}` : "Sin plazo forzoso"}
              </p>
              <a
                href={salesLink(text)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl font-bold transition",
                  p.highlight ? "bg-rose-500 text-white shadow-rose hover:bg-rose-600" : "bg-cream-200 text-cocoa-700 hover:bg-cream-300",
                )}
              >
                <MessageCircle className="h-4 w-4" /> Quiero el {p.name}
              </a>
              <ul className="mt-7 space-y-3">
                {p.features.map((f, i) => (
                  <li key={f} className={cn("flex gap-2.5 text-[14.5px] leading-snug", p.highlight ? "text-cream-100/90" : "text-cocoa-600", i === 0 && p.id !== "basico" && "font-bold")}>
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", p.highlight ? "text-mint-300" : "text-mint-500")} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {lifetime.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-[28px] border border-dashed border-rose-300 bg-rose-50/60 p-6 text-center sm:flex-row sm:text-left">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-rose-500 shadow-soft">
            <InfinityIcon className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-semibold">Licencia de por vida para fundadoras</p>
            <p className="text-sm text-cocoa-500">
              Un solo pago, sin mensualidades: {lifetime.map((p) => `${p.name} ${money0(p.prices.vitalicia)}`).join(" · ")}. Cupo limitado.
            </p>
          </div>
          <a
            href={salesLink("¡Hola! Me interesa la licencia de por vida de Dulces Detalles 🧁")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-rose-500 px-5 font-bold text-white shadow-rose hover:bg-rose-600"
          >
            Apartar mi lugar
          </a>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-cocoa-400">
        Precios en pesos mexicanos. ¿Aún con dudas? <Link href="/demo" className="font-bold text-rose-500 hover:underline">Prueba la demo gratis</Link>.
      </p>
    </div>
  );
}
