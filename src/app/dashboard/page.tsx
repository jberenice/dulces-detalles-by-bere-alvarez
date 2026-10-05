"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CakeSlice, FileText, HandCoins, Plus, ShoppingBag, Sparkles, Store, TrendingUp, Wheat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, CardHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { BarList, SalesAreaChart, qtyFmt } from "@/components/dashboard/Charts";
import { fetchSales, summarize } from "@/lib/sales";
import { ORDER_STATUS, QUOTE_STATUS } from "@/lib/constants";
import { addDays, date, folio, money, parseDate, toISODate } from "@/lib/format";
import type { Order, Quote } from "@/lib/types";

export default function DashboardHome() {
  const { profile } = useBusiness();
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
    const active = must(await sb.from("orders").select("total, deposit").in("status", ["pendiente", "confirmado", "en_preparacion", "listo"])) as Pick<Order, "total" | "deposit">[];
    return {
      sales30,
      salesMonth,
      upcoming: must(upcoming) as Order[],
      quotes: must(quotes) as Quote[],
      dessertCount: counts.count ?? 0,
      receivable: active.reduce((a, o) => a + Math.max(Number(o.total) - Number(o.deposit), 0), 0),
      activeCount: active.length,
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
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const firstName = (profile.owner_name ?? "").split(" ")[0];

  return (
    <>
      {/* Bienvenida */}
      <section className="sprinkles relative mb-6 overflow-hidden rounded-[32px] bg-cocoa-800 px-6 py-7 text-cream-100 sm:px-9 sm:py-9">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-rose-500/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-mint-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="animate-fade-up">
            <p className="font-script text-2xl text-rose-300">{greeting}{firstName ? `, ${firstName}` : ""}</p>
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
            <ButtonLink href="/dashboard/cotizaciones/nueva"><FileText className="h-4 w-4" /> Cotizar</ButtonLink>
            <ButtonLink href="/dashboard/pedidos/nuevo" variant="secondary"><ShoppingBag className="h-4 w-4" /> Pedido</ButtonLink>
            <ButtonLink href="/dashboard/postres/nuevo" variant="secondary" className="hidden sm:inline-flex"><CakeSlice className="h-4 w-4" /> Postre</ButtonLink>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {loading || !month || !data ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[116px]" />)
        ) : (
          <>
            <StatCard label="Ventas del mes" value={money(month.revenue)} hint={`${month.count} pedidos`} icon={<TrendingUp className="h-5 w-5" />} tone="rose" />
            <StatCard label="Utilidad estimada" value={money(month.profit)} hint={month.revenue ? `${Math.round((month.profit / month.revenue) * 100)}% de las ventas` : "—"} icon={<Sparkles className="h-5 w-5" />} tone="mint" />
            <StatCard label="Pedidos activos" value={data.activeCount} hint={`${month.pieces.toLocaleString("es-MX")} piezas este mes`} icon={<ShoppingBag className="h-5 w-5" />} tone="cocoa" />
            <StatCard label="Por cobrar" value={money(data.receivable)} hint="Saldo de pedidos activos" icon={<HandCoins className="h-5 w-5" />} tone="cream" />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
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
