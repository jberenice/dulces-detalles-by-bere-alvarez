"use client";
import Link from "next/link";
import { Check, Crown, Sparkles } from "lucide-react";
import { PLANS, planName, withIva, type PlanId } from "@/lib/plans";
import { salesLink } from "@/lib/legal";
import { money0 } from "@/lib/format";
import { useBusiness } from "./BusinessProvider";

/** Se muestra en lugar de una sección que no incluye el plan de la usuaria */
export function UpgradeCard({ min, feature }: { min: PlanId; feature: string }) {
  const { plan, profile } = useBusiness();
  const target = PLANS.find((p) => p.id === min)!;
  const text = `¡Hola! Soy ${profile.owner_name ?? profile.business_name} (${profile.email ?? ""}). Tengo el plan ${planName(plan.plan)} y quiero subir al plan ${target.name} para usar "${feature}" 🧁`;
  return (
    <div className="mx-auto max-w-2xl animate-fade-up py-6">
      <div className="card relative overflow-hidden p-6 sm:p-10">
        <div className="sprinkles pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
            <Crown className="h-3.5 w-3.5" /> Plan {target.name}
          </span>
          <h1 className="mt-4 text-[28px] leading-tight font-semibold sm:text-[34px]">{feature}</h1>
          <p className="mt-2 text-[15px] text-cocoa-400">
            Esta sección es parte del plan <b className="text-cocoa-600">{target.name}</b>. Tu plan actual es <b className="text-cocoa-600">{planName(plan.plan)}</b>.
          </p>
          <ul className="mt-6 space-y-2.5">
            {target.features.map((f) => (
              <li key={f} className="flex gap-2.5 text-[14.5px] text-cocoa-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-500" /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={salesLink(text)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-6 py-3.5 font-bold text-white shadow-rose transition hover:bg-rose-600"
            >
              <Sparkles className="h-4 w-4" /> Quiero el plan {target.name}
            </a>
            <p className="text-sm text-cocoa-400">
              Desde <b className="text-cocoa-600">{money0(withIva(target.prices.mensual ?? 0))}</b> al mes con IVA · <Link href="/#precios" className="font-semibold text-rose-500 hover:underline">Comparar planes</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
