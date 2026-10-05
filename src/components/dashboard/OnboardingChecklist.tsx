"use client";
import Link from "next/link";
import { Check, ChevronRight, PartyPopper, Rocket, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { markOnboarding } from "@/lib/onboarding";
import { planAllows } from "@/lib/plans";
import { cn } from "@/lib/cn";

type Step = { key: string; title: string; text: string; href: string; done: boolean };

/** Guía de primeros pasos con barra de progreso (se oculta al completarla o descartarla) */
export function OnboardingChecklist() {
  const { profile, setProfile, plan } = useBusiness();
  const sb = createClient();
  const hidden = !!profile.onboarding?.dismissed || !!profile.is_demo;
  const store = planAllows(plan.plan, "profesional");

  const { data } = useAsync(async () => {
    if (hidden) return null;
    const [dessert, quote, order] = await Promise.all([
      sb.from("desserts").select("id", { count: "exact", head: true }).not("image_url", "is", null).not("sale_price", "is", null),
      sb.from("quotes").select("id", { count: "exact", head: true }).neq("status", "borrador"),
      sb.from("orders").select("id", { count: "exact", head: true }),
    ]);
    return { dessert: (dessert.count ?? 0) > 0, quote: (quote.count ?? 0) > 0, order: (order.count ?? 0) > 0 };
  }, [hidden]);

  if (hidden || !data) return null;

  const steps: Step[] = [
    { key: "logo", title: "Sube tu logo", text: "Aparece en tus PDF, tu tienda y tus correos", href: "/dashboard/ajustes", done: !!profile.logo_url },
    { key: "datos", title: "Completa tus datos", text: "Tu nombre y WhatsApp para que tus clientes te escriban", href: "/dashboard/ajustes", done: !!profile.whatsapp && !!profile.owner_name },
    { key: "postre", title: "Ponle foto y precio a un postre", text: "Revisa la receta y usa el precio sugerido", href: "/dashboard/postres", done: data.dessert },
    { key: "cotizacion", title: "Envía tu primera cotización", text: "En PDF por WhatsApp o correo", href: "/dashboard/cotizaciones/nueva", done: data.quote },
    ...(store
      ? [
          { key: "tienda", title: "Publica tu tienda", text: "Elige colores y los postres que quieres mostrar", href: "/dashboard/tienda", done: profile.store_enabled },
          { key: "compartir", title: "Comparte tu tienda", text: "Copia el enlace o imprime tu QR", href: "/dashboard/tienda", done: !!profile.onboarding?.shared },
        ]
      : [{ key: "pedido", title: "Registra tu primer pedido", text: "Con fecha de entrega y anticipo", href: "/dashboard/pedidos/nuevo", done: data.order }]),
  ];
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  const complete = done === steps.length;
  const dismiss = () => markOnboarding(profile, "dismissed", setProfile);
  const next = steps.find((s) => !s.done);

  return (
    <section className="card relative mb-6 overflow-hidden animate-fade-up">
      <button onClick={dismiss} className="absolute top-3 right-3 z-10 rounded-xl p-2 text-cocoa-300 hover:bg-cocoa-800/5 hover:text-cocoa-500" aria-label="Ocultar guía">
        <X className="h-4 w-4" />
      </button>
      <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
        <div className="sprinkles flex flex-col justify-center bg-cream-200/70 p-5 sm:p-6">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-rose-500 shadow-soft">
            {complete ? <PartyPopper className="h-5 w-5" /> : <Rocket className="h-5 w-5" />}
          </span>
          <h2 className="mt-3 text-xl font-semibold">{complete ? "¡Todo listo! 🎉" : "Primeros pasos"}</h2>
          <p className="mt-1 text-sm text-cocoa-500">
            {complete ? "Tu repostería ya está configurada. Puedes ocultar esta guía." : `${done} de ${steps.length} completados${next ? ` · Sigue: ${next.title.toLowerCase()}` : ""}`}
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700" style={{ width: `${Math.max(pct, 4)}%` }} />
          </div>
          <p className="mt-1.5 text-right text-xs font-bold text-rose-500 tabular-nums">{pct}%</p>
          {complete && (
            <button onClick={dismiss} className="mt-3 self-start rounded-xl bg-cocoa-800 px-4 py-2 text-sm font-bold text-cream-100 hover:bg-cocoa-900">
              Ocultar guía
            </button>
          )}
        </div>
        <ol className="grid gap-1 p-3 sm:grid-cols-2 sm:p-4">
          {steps.map((s, i) => (
            <li key={s.key}>
              <Link
                href={s.href}
                className={cn("group flex items-center gap-3 rounded-2xl p-3 transition", s.done ? "opacity-70" : "hover:bg-cream-100", next?.key === s.key && "bg-rose-50/70 ring-1 ring-rose-200")}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition",
                    s.done ? "bg-mint-500 text-white" : "bg-cream-200 text-cocoa-500 group-hover:bg-rose-100 group-hover:text-rose-600",
                  )}
                >
                  {s.done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm font-semibold", s.done ? "text-cocoa-400 line-through decoration-mint-400" : "text-cocoa-700")}>{s.title}</span>
                  <span className="block truncate text-xs text-cocoa-400">{s.text}</span>
                </span>
                {!s.done && <ChevronRight className="h-4 w-4 shrink-0 text-cocoa-300 transition group-hover:translate-x-0.5 group-hover:text-rose-500" />}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
