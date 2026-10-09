"use client";
import { FestiveParticles, FestiveRibbon, usePanelFestive } from "@/components/festive/Festive";
import { FestiveBouquet, FestiveSwags } from "@/components/festive/Decor";
import type { FestiveTheme } from "@/lib/festive";
import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BellRing, Cake, CalendarClock, CakeSlice, FileText, Gift, HandCoins, MessageCircle, Plus, ShoppingBag, Sparkles, Star, Store, TrendingUp, Wallet, Wheat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { PackageMarginAlert } from "@/components/dashboard/PackageMargins";
import { Badge, Card, CardHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { BarList, SalesAreaChart, qtyFmt } from "@/components/dashboard/Charts";
import { fetchSales, summarize } from "@/lib/sales";
import { ORDER_STATUS, QUOTE_STATUS } from "@/lib/constants";
import { addDays, date, folio, money, money0, parseDate, toISODate } from "@/lib/format";
import type { Ingredient, Order, Quote } from "@/lib/types";
import { fmtQty } from "@/lib/production";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { planAllows } from "@/lib/plans";
import { birthdayWhen, nextBirthday } from "@/lib/birthdays";
import { getTemplate, renderTemplate } from "@/lib/templates";
import { storeUrl } from "@/lib/domains";
import { waLink } from "@/lib/format";
import type { Client } from "@/lib/types";

export default function DashboardHome() {
  const { profile, plan } = useBusiness();
  const sb = createClient();
  const now = new Date();
  const monthStart = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = toISODate(now);
  const from30 = toISODate(addDays(now, -29));

  const { data, loading } = useAsync(async () => {
    const [sales30, salesMonth, upcoming, quotes, counts] = await Promise.all([
      fetchSales(from30, today),
      fetchSales(monthStart, toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0))),
      sb
        .from("orders")
        .select("*, clients(id, name, phone, email, address), order_items(description, quantity)")
        .in("status", ["pendiente", "confirmado", "en_preparacion", "listo"])
        .lte("delivery_date", toISODate(addDays(now, 7)))
        .order("delivery_date")
        .limit(8),
      sb.from("quotes").select("*, clients(id, name, phone, email, address)").order("created_at", { ascending: false }).limit(5),
      sb.from("desserts").select("id", { count: "exact", head: true }),
    ]);
    const lowStock = profile.inventory_enabled
      ? ((must(await sb.from("ingredients").select("id, name, unit, stock, min_stock").gt("min_stock", 0)) as Ingredient[]).filter((i) => Number(i.stock) <= Number(i.min_stock)))
      : [];
    const active = must(await sb.from("orders").select("total, deposit, delivery_date").in("status", ["pendiente", "confirmado", "en_preparacion", "listo"])) as Pick<Order, "total" | "deposit" | "delivery_date">[];
    // Cotizaciones enviadas sin respuesta (para "Por seguir")
    const sent = must(await sb.from("quotes").select("sent_at, followed_up_at, created_at, valid_until").eq("status", "enviada")) as Pick<Quote, "sent_at" | "followed_up_at" | "created_at" | "valid_until">[];
    const limit = Date.now() - (profile.followup_days ?? 3) * 86_400_000;
    const followUps = sent.filter((q) => (!q.valid_until || q.valid_until >= today) && new Date(q.followed_up_at ?? q.sent_at ?? q.created_at).getTime() <= limit).length;
    // Crecimiento (si ya se ejecutó la migración 0014; si no, simplemente no se muestran)
    const [reqs, revs, bdays] = await Promise.all([
      sb.from("quotes").select("id", { count: "exact", head: true }).eq("source", "tienda").eq("status", "borrador").eq("total", 0),
      sb.from("reviews").select("id", { count: "exact", head: true }).not("submitted_at", "is", null).is("moderated_at", null),
      sb.from("clients").select("id, name, phone, birthday").not("birthday", "is", null),
    ]);
    const birthdays = ((bdays.data ?? []) as Pick<Client, "id" | "name" | "phone" | "birthday">[])
      .map((c) => ({ ...c, next: nextBirthday(c.birthday!, today) }))
      .filter((c) => c.next.days <= 14)
      .sort((a, b) => a.next.days - b.next.days)
      .slice(0, 6);
    const soonDue = active.filter((o) => Number(o.total) - Number(o.deposit) > 0.009 && o.delivery_date && o.delivery_date <= toISODate(addDays(now, 2))).length;
    return {
      sales30,
      salesMonth,
      upcoming: must(upcoming) as Order[],
      quotes: must(quotes) as Quote[],
      dessertCount: counts.count ?? 0,
      receivable: active.reduce((a, o) => a + Math.max(Number(o.total) - Number(o.deposit), 0), 0),
      activeCount: active.length,
      lowStock,
      followUps,
      soonDue,
      requests: reqs.error ? 0 : reqs.count ?? 0,
      newReviews: revs.error ? 0 : revs.count ?? 0,
      birthdays,
    };
  });

  const month = useMemo(() => (data ? summarize(data.salesMonth) : null), [data]);
  const series = useMemo(() => {
    if (!data) return [];
    const s = summarize(data.sales30);
    return Array.from({ length: 30 }, (_, i) => {
      const d = toISODate(addDays(now, -29 + i));
      return { day: d, total: s.byDay.get(d) ?? 0 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const hour = now.getHours();
  const fest = usePanelFestive();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const firstName = (profile.owner_name ?? "").split(" ")[0];

  return (
    <>
      {/* Bienvenida */}
      <section
        data-fs={fest ? "phero" : undefined}
        className="sprinkles relative mb-6 overflow-hidden rounded-[32px] bg-cocoa-800 px-6 py-7 text-cream-100 transition-colors sm:px-9 sm:py-9"
        style={fest ? { backgroundColor: "var(--festive-hero, var(--color-cocoa-800))", paddingTop: 64 } : undefined}
      >
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-rose-500/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-mint-400/20 blur-3xl" />
        {fest && <HeroFestiveArt theme={fest} />}
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="animate-fade-up">
            <p className="font-script text-2xl text-rose-300">{fest ? `${fest.emoji} ` : ""}{greeting}{firstName ? `, ${firstName}` : ""}</p>
            <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">¿Qué vamos a endulzar hoy?</h1>
            <p className="mt-2 max-w-lg text-[15px] text-cream-200/75">
              {data ? (
                <>
                  Tienes <b className="text-white">{data.upcoming.length} entregas</b> en los próximos 7 días y{" "}
                  <b className="text-white">{money(data.receivable)}</b> por cobrar.
                </>
              ) : (
                "Preparando tu resumen…"
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/dashboard/cotizaciones/nueva"><FileText className="h-4 w-4" /> Cotizar{fest ? ` ${fest.emoji}` : ""}</ButtonLink>
            <ButtonLink href="/dashboard/pedidos/nuevo" variant="secondary"><ShoppingBag className="h-4 w-4" /> Pedido</ButtonLink>
            <ButtonLink href="/dashboard/postres/nuevo" variant="secondary" className="max-sm:hidden"><CakeSlice className="h-4 w-4" /> Postre</ButtonLink>
          </div>
        </div>
      </section>

      <OnboardingChecklist />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {loading || !month || !data ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[116px]" />)
        ) : (
          <>
            <StatCard label="Ventas del mes" value={money0(month.revenue)} hint={`${month.count} pedido${month.count === 1 ? "" : "s"}`} icon={<TrendingUp className="h-5 w-5" />} tone="rose" />
            <StatCard label="Utilidad estimada" value={money0(month.profit)} hint={month.revenue ? `${Math.round((month.profit / month.revenue) * 100)}% de las ventas` : "—"} icon={<Sparkles className="h-5 w-5" />} tone="mint" />
            <StatCard label="Pedidos activos" value={data.activeCount} hint={`${month.pieces.toLocaleString("es-MX")} pieza${month.pieces === 1 ? "" : "s"} este mes`} icon={<ShoppingBag className="h-5 w-5" />} tone="cocoa" />
            <StatCard label="Por cobrar" value={money0(data.receivable)} hint="Saldo de pedidos activos" icon={<HandCoins className="h-5 w-5" />} tone="cream" />
          </>
        )}
      </div>

      {data && (data.followUps > 0 || data.soonDue > 0) && planAllows(plan.plan, "profesional") && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {data.followUps > 0 && (
            <Link href="/dashboard/seguimiento" className="flex items-center gap-3 rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200/70 transition hover:bg-rose-100/70">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-rose-500"><BellRing className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-700">{data.followUps} cotizaci{data.followUps === 1 ? "ón" : "ones"} por seguir</p>
                <p className="text-sm text-rose-700/80">Sin respuesta desde hace {profile.followup_days ?? 3}+ días</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-rose-500" />
            </Link>
          )}
          {data.soonDue > 0 && (
            <Link href="/dashboard/saldos" className="flex items-center gap-3 rounded-3xl bg-mint-50 p-4 ring-1 ring-mint-200 transition hover:bg-mint-100/70">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-mint-600"><Wallet className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-mint-700">{data.soonDue} saldo{data.soonDue === 1 ? "" : "s"} por cobrar pronto</p>
                <p className="text-sm text-mint-700/80">Entregas de hoy a pasado mañana</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-mint-600" />
            </Link>
          )}
        </div>
      )}

      <HomeFestive />

      {data && (data.requests > 0 || data.newReviews > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {data.requests > 0 && (
            <Link href="/dashboard/cotizaciones?tab=borrador" className="flex items-center gap-3 rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200/70 transition hover:bg-rose-100/70">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-rose-500"><Cake className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-700">{data.requests} pastel{data.requests === 1 ? "" : "es"} personalizado{data.requests === 1 ? "" : "s"} por cotizar</p>
                <p className="text-sm text-rose-700/80">Te los pidieron desde tu tienda: ponles precio y envíalos</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-rose-500" />
            </Link>
          )}
          {data.newReviews > 0 && (
            <Link href="/dashboard/resenas" className="flex items-center gap-3 rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200/70 transition hover:bg-amber-100/70">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-amber-500"><Star className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-800">{data.newReviews} reseña{data.newReviews === 1 ? "" : "s"} nueva{data.newReviews === 1 ? "" : "s"}</p>
                <p className="text-sm text-amber-800/80">Revísalas y elige cuáles mostrar en tu tienda</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" />
            </Link>
          )}
        </div>
      )}

      {data && data.birthdays.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <CardHeader title="Cumpleaños de tus clientas" subtitle="En los próximos 14 días. Felicítalas: un mensaje a tiempo trae pedidos." icon={<Gift className="h-5 w-5" />} />
          <ul className="divide-y divide-cocoa-800/5">
            {data.birthdays.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg ${c.next.days === 0 ? "bg-rose-100" : "bg-cream-100"}`}>🎂</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-cocoa-700">{c.name}{c.next.age ? <span className="font-normal text-cocoa-400"> · cumple {c.next.age}</span> : null}</p>
                  <p className={`text-xs ${c.next.days === 0 ? "font-bold text-rose-500" : "text-cocoa-400"}`}>{birthdayWhen(c.next.days)} · {date(c.next.date, { day: "numeric", month: "long" })}</p>
                </div>
                {c.phone && (
                  <a
                    href={waLink(c.phone, renderTemplate(getTemplate(profile, "cumpleanos"), { cliente: c.name.split(" ")[0], negocio: profile.business_name, tienda: profile.store_enabled && profile.store_slug ? storeUrl(profile.store_slug) : "" }))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-mint-50 px-3 py-2 text-sm font-bold text-mint-700 hover:bg-mint-100"
                  >
                    <MessageCircle className="h-4 w-4" /> Felicitar
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <PackageMarginAlert />

      {data && data.lowStock.length > 0 && (
        <Link href="/dashboard/ingredientes" className="mb-6 flex items-start gap-3 rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200/70 transition hover:bg-amber-100/70">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-600"><AlertTriangle className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-800">{data.lowStock.length} insumo{data.lowStock.length === 1 ? "" : "s"} con stock bajo</p>
            <p className="truncate text-sm text-amber-700">{data.lowStock.map((i) => `${i.name} (${fmtQty(Number(i.stock), i.unit)})`).join(" · ")}</p>
          </div>
          <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-amber-600" />
        </Link>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Ventas de los últimos 30 días" subtitle="Por fecha de entrega" action={<Link href="/dashboard/reportes" className="text-sm font-bold text-rose-500 hover:underline">Reportes</Link>} />
          <div className="px-3 pt-4 pb-4 sm:px-5">{loading ? <Skeleton className="h-[260px]" /> : <SalesAreaChart data={series} />}</div>
        </Card>

        <Card>
          <CardHeader title="Próximas entregas" subtitle="Siguientes 7 días" icon={<CalendarClock className="h-5 w-5" />} action={<Link href="/dashboard/pedidos" className="text-sm font-bold text-rose-500 hover:underline">Ver todo</Link>} />
          <div className="p-3 sm:p-4">
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : data!.upcoming.length === 0 ? (
              <p className="py-10 text-center text-sm text-cocoa-400">Sin entregas próximas. ¡Buen momento para hornear algo nuevo! 🧁</p>
            ) : (
              <ul className="space-y-1">
                {data!.upcoming.map((o) => {
                  const late = o.delivery_date && o.delivery_date < today;
                  return (
                    <li key={o.id}>
                      <Link href={`/dashboard/pedidos/${o.id}`} className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition hover:bg-cream-100">
                        <div className={`flex w-12 shrink-0 flex-col items-center rounded-xl py-1 ${late ? "bg-rose-50 text-rose-600" : o.delivery_date === today ? "bg-rose-500 text-white" : "bg-cream-200 text-cocoa-600"}`}>
                          <span className="text-[9px] font-bold uppercase">{o.delivery_date ? date(o.delivery_date, { weekday: "short" }) : "—"}</span>
                          <span className="font-display text-lg leading-none font-semibold">{o.delivery_date ? parseDate(o.delivery_date)!.getDate() : "?"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-cocoa-700">{o.clients?.name ?? o.customer_name ?? "Cliente"}</p>
                          <p className="truncate text-xs text-cocoa-400">{(o.order_items ?? []).map((i) => `${Number(i.quantity)}× ${i.description}`).join(", ")}</p>
                        </div>
                        <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Lo más vendido del mes" subtitle="Por piezas" icon={<CakeSlice className="h-5 w-5" />} />
          <div className="p-5 sm:p-6">
            {loading || !month ? (
              <Skeleton className="h-48" />
            ) : (
              <BarList items={[...month.products].sort((a, b) => b.qty - a.qty).map((p) => ({ name: p.name, value: p.qty }))} valueFormat={qtyFmt} max={6} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Cotizaciones recientes" icon={<FileText className="h-5 w-5" />} action={<Link href="/dashboard/cotizaciones" className="text-sm font-bold text-rose-500 hover:underline">Ver todo</Link>} />
          <div className="p-3 sm:p-4">
            {loading ? (
              <Skeleton className="h-48" />
            ) : data!.quotes.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-cocoa-400">Aún no has enviado cotizaciones.</p>
                <ButtonLink href="/dashboard/cotizaciones/nueva" size="sm" className="mt-3"><Plus className="h-4 w-4" /> Primera cotización</ButtonLink>
              </div>
            ) : (
              <ul className="space-y-1">
                {data!.quotes.map((q) => (
                  <li key={q.id}>
                    <Link href={`/dashboard/cotizaciones/${q.id}`} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 hover:bg-cream-100">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-cocoa-700">{q.clients?.name ?? "Sin cliente"}</p>
                        <p className="text-xs text-cocoa-400">{folio("C", q.folio)} · {date(q.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Badge>
                        <span className="text-sm font-semibold tabular-nums">{money(q.total)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Accesos */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/dashboard/tienda", icon: Store, title: profile.store_enabled ? "Tu tienda está en línea" : "Abre tu tienda en línea", text: profile.store_enabled ? "Comparte tu enlace en redes" : "Recibe pedidos por WhatsApp", tone: "bg-mint-50 text-mint-600" },
          { href: "/dashboard/ingredientes", icon: Wheat, title: "Actualiza precios", text: "Tus costos se recalculan solos", tone: "bg-cream-200 text-cocoa-500" },
          { href: "/dashboard/postres", icon: CakeSlice, title: `${data?.dessertCount ?? "…"} postres`, text: "Revisa márgenes y precios", tone: "bg-rose-50 text-rose-500" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${a.tone}`}><a.icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-cocoa-700">{a.title}</p>
              <p className="text-sm text-cocoa-400">{a.text}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-cocoa-300 transition group-hover:translate-x-1 group-hover:text-rose-500" />
          </Link>
        ))}
      </div>
    </>
  );
}

/** Aviso y adornos de temporada en el inicio del panel */
function HomeFestive() {
  const fest = usePanelFestive();
  if (!fest) return null;
  return (
    <>
      <FestiveRibbon theme={fest} href="/dashboard/temporadas" cta="Preparar temporada" />
      <FestiveParticles theme={fest} count={12} seconds={12} />
    </>
  );
}

/** Papel picado y ramillete dentro de la bienvenida del panel (no tapan texto: se achican u ocultan) */
function HeroFestiveArt({ theme }: { theme: FestiveTheme }) {
  return (
    <>
      <FestiveSwags theme={theme} width={0.4} />
      <FestiveBouquet theme={theme} corner="br" size={170} offset={-4} />
    </>
  );
}
