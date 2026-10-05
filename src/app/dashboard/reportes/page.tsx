"use client";
import { useMemo, useState } from "react";
import { BarChart3, CakeSlice, Download, HandCoins, Layers, Receipt, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { Card, CardHeader, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { BarList, CHART, SalesAreaChart, qtyFmt } from "@/components/dashboard/Charts";
import { fetchSales, summarize } from "@/lib/sales";
import { addDays, date, folio, money, num, parseDate, toISODate } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";

type Range = "7d" | "30d" | "mes" | "mes_ant" | "3m" | "anio" | "custom";

function rangeDates(r: Range, custom: { from: string; to: string }) {
  const now = new Date();
  const t = toISODate(now);
  switch (r) {
    case "7d": return { from: toISODate(addDays(now, -6)), to: t };
    case "30d": return { from: toISODate(addDays(now, -29)), to: t };
    case "mes": return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
    case "mes_ant": return { from: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: toISODate(new Date(now.getFullYear(), now.getMonth(), 0)) };
    case "3m": return { from: toISODate(addDays(now, -89)), to: t };
    case "anio": return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    default: return custom;
  }
}

export default function ReportsPage() {
  const sb = createClient();
  const [range, setRange] = useState<Range>("mes");
  const [custom, setCustom] = useState({ from: toISODate(addDays(new Date(), -29)), to: toISODate(new Date()) });
  const [rank, setRank] = useState<"qty" | "revenue" | "profit">("qty");
  const { from, to } = rangeDates(range, custom);

  const desserts = useAsync(async () => must(await sb.from("desserts").select("id, category")) as { id: string; category: string }[]);
  const sales = useAsync(() => fetchSales(from, to), [from, to]);

  const s = useMemo(() => {
    if (!sales.data) return null;
    const cat = new Map((desserts.data ?? []).map((d) => [d.id, d.category]));
    return summarize(sales.data, (id) => (id ? cat.get(id) ?? "Otros" : "Conceptos libres"));
  }, [sales.data, desserts.data]);

  const days = Math.round((parseDate(to)!.getTime() - parseDate(from)!.getTime()) / 86400000) + 1;
  const granularity: "day" | "week" | "month" = days > 120 ? "month" : days > 45 ? "week" : "day";

  const series = useMemo(() => {
    if (!s) return [];
    const out = new Map<string, number>();
    const start = parseDate(from)!;
    const keyOf = (d: Date) => {
      if (granularity === "month") return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
      if (granularity === "week") {
        const diff = (d.getDay() + 6) % 7;
        return toISODate(addDays(d, -diff));
      }
      return toISODate(d);
    };
    for (let i = 0; i < days; i++) out.set(keyOf(addDays(start, i)), 0);
    for (const [d, v] of s.byDay) {
      const k = keyOf(parseDate(d)!);
      if (out.has(k)) out.set(k, out.get(k)! + v);
    }
    return [...out.entries()].map(([day, total]) => ({ day, total }));
  }, [s, from, days, granularity]);

  const ranked = useMemo(() => {
    if (!s) return [];
    return [...s.products]
      .sort((a, b) => b[rank] - a[rank])
      .map((p) => ({ name: p.name, value: p[rank], extra: rank === "qty" ? money(p.revenue) : qtyFmt(p.qty) }));
  }, [s, rank]);

  function exportCsv() {
    if (!sales.data) return;
    const rows = [["Folio", "Fecha", "Cliente", "Estado", "Origen", "Postres", "Subtotal", "Descuento", "Envío", "IVA", "Total", "Pagado", "Costo"]];
    for (const o of [...sales.data].sort((a, b) => a.day.localeCompare(b.day))) {
      rows.push([
        folio("P", o.folio),
        o.day,
        o.clients?.name ?? o.customer_name ?? "",
        ORDER_STATUS[o.status].label,
        o.source,
        (o.order_items ?? []).map((i) => `${Number(i.quantity)}x ${i.description}`).join(" | "),
        String(o.subtotal), String(o.discount), String(o.shipping), String(o.iva), String(o.total), String(o.deposit),
        String((o.order_items ?? []).reduce((a, i) => a + Number(i.quantity) * Number(i.unit_cost), 0).toFixed(2)),
      ]);
    }
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const loading = sales.loading || desserts.loading;
  const sourceLabel: Record<string, string> = { manual: "Pedidos directos", cotizacion: "Desde cotización", tienda: "Tienda en línea" };

  return (
    <>
      <PageHeader
        eyebrow="Tus números, claros"
        title="Reportes de ventas"
        subtitle={`Del ${date(from, { day: "numeric", month: "long" })} al ${date(to, { day: "numeric", month: "long", year: "numeric" })} · según fecha de entrega, sin pedidos cancelados.`}
        actions={<Button variant="outline" onClick={exportCsv} disabled={!sales.data?.length}><Download className="h-4 w-4" /> Exportar CSV</Button>}
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end">
        <Tabs
          value={range}
          onChange={setRange}
          options={[
            { value: "7d", label: "7 días" },
            { value: "30d", label: "30 días" },
            { value: "mes", label: "Este mes" },
            { value: "mes_ant", label: "Mes pasado" },
            { value: "3m", label: "3 meses" },
            { value: "anio", label: "Este año" },
            { value: "custom", label: "Personalizado" },
          ]}
        />
        {range === "custom" && (
          <div className="flex gap-2">
            <Input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} aria-label="Desde" />
            <Input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} aria-label="Hasta" />
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading || !s ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[116px]" />)
        ) : (
          <>
            <StatCard label="Ventas" value={money(s.revenue)} hint={`${s.count} pedidos`} icon={<TrendingUp className="h-5 w-5" />} tone="rose" />
            <StatCard label="Utilidad estimada" value={money(s.profit)} hint={`Costo de producción ${money(s.cost)}`} icon={<Sparkles className="h-5 w-5" />} tone="mint" />
            <StatCard label="Ticket promedio" value={money(s.avgTicket)} hint={`${num(s.pieces, 0)} piezas vendidas`} icon={<Receipt className="h-5 w-5" />} tone="cocoa" />
            <StatCard label="Cobrado" value={money(s.collected)} hint={`Pendiente ${money(s.pending)}`} icon={<HandCoins className="h-5 w-5" />} tone="cream" />
          </>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Evolución de ventas"
          subtitle={granularity === "day" ? "Por día" : granularity === "week" ? "Por semana" : "Por mes"}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <div className="px-3 pt-4 pb-4 sm:px-5">{loading ? <Skeleton className="h-[300px]" /> : <SalesAreaChart data={series} height={300} granularity={granularity} />}</div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Postres más vendidos"
            icon={<CakeSlice className="h-5 w-5" />}
            action={
              <Tabs
                value={rank}
                onChange={setRank}
                options={[
                  { value: "qty", label: "Piezas" },
                  { value: "revenue", label: "Ventas" },
                  { value: "profit", label: "Utilidad" },
                ]}
              />
            }
            className="flex-col sm:flex-row"
          />
          <div className="p-5 sm:p-6">
            {loading ? <Skeleton className="h-72" /> : <BarList items={ranked} max={10} valueFormat={rank === "qty" ? qtyFmt : (v) => money(v)} sub={(i) => i.extra} color={rank === "profit" ? CHART.green : CHART.rose} />}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Por categoría" icon={<Layers className="h-5 w-5" />} />
            <div className="p-5 sm:p-6">
              {loading || !s ? <Skeleton className="h-40" /> : <BarList items={s.categories.map((c) => ({ name: c.name, value: c.revenue, extra: qtyFmt(c.qty) }))} sub={(i) => i.extra} color={CHART.green} />}
            </div>
          </Card>
          <Card>
            <CardHeader title="Por canal de venta" icon={<ShoppingBag className="h-5 w-5" />} />
            <div className="p-5 sm:p-6">
              {loading || !s ? (
                <Skeleton className="h-28" />
              ) : (
                <BarList items={[...s.sources.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: sourceLabel[k] ?? k, value: v, extra: s.revenue ? `${Math.round((v / s.revenue) * 100)}%` : "" }))} sub={(i) => i.extra} />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Tabla accesible con el detalle */}
      <Card className="mt-6 overflow-hidden">
        <CardHeader title="Detalle de pedidos" subtitle="La misma información de las gráficas, en tabla" />
        <div className="mt-4 max-h-[420px] overflow-auto">
          <table className="table-base min-w-[640px]">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th className="text-right">Piezas</th>
                <th className="text-right">Total</th>
                <th className="text-right">Utilidad</th>
              </tr>
            </thead>
            <tbody>
              {[...(sales.data ?? [])].sort((a, b) => b.day.localeCompare(a.day)).map((o) => {
                const c = (o.order_items ?? []).reduce((a, i) => a + Number(i.quantity) * Number(i.unit_cost), 0);
                const pcs = (o.order_items ?? []).reduce((a, i) => a + Number(i.quantity), 0);
                return (
                  <tr key={o.id}>
                    <td className="font-semibold">{folio("P", o.folio)}</td>
                    <td>{date(o.day)}</td>
                    <td>{o.clients?.name ?? o.customer_name ?? "—"}</td>
                    <td className="text-right tabular-nums">{num(pcs, 0)}</td>
                    <td className="text-right font-semibold tabular-nums">{money(o.total)}</td>
                    <td className="text-right text-mint-700 tabular-nums">{c > 0 ? money(Number(o.subtotal) - Number(o.discount) - c) : "—"}</td>
                  </tr>
                );
              })}
              {!loading && !sales.data?.length && (
                <tr><td colSpan={6} className="py-10 text-center text-cocoa-400">Sin ventas en este periodo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
