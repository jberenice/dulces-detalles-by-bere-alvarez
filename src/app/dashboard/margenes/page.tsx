"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CakeSlice, CheckCircle2, TrendingDown, TrendingUp, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useCatalog } from "@/hooks/useCatalog";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { useConfirm } from "@/components/ui/Confirm";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { marginPct, roundPrice } from "@/lib/costing";
import { date, money, num } from "@/lib/format";
import type { Profile } from "@/lib/types";

type Hist = { id: string; ingredient_id: string; old_unit_cost: number; new_unit_cost: number; changed_at: string };

export default function MarginsPage() {
  const sb = createClient();
  const confirm = useConfirm();
  const { setProfile } = useBusiness();
  const { data, loading, costs, profile, ingredientsById, reload } = useCatalog();
  const tolerance = Number(profile.margin_tolerance_pct ?? 5);
  const [busy, setBusy] = useState(false);
  const hist = useAsync(async () => {
    const since = new Date(Date.now() - 45 * 86_400_000).toISOString();
    return must(await sb.from("ingredient_price_history").select("*").gte("changed_at", since).order("changed_at", { ascending: false }).limit(60)) as Hist[];
  });

  const rows = useMemo(() => {
    if (!data) return [];
    return data.desserts
      .filter((d) => d.active && d.sale_price != null && Number(d.sale_price) > 0)
      .map((d) => {
        const c = costs.get(d.id)!;
        const price = Number(d.sale_price);
        const suggested = roundPrice(c.unitPrice);
        const real = marginPct(price, c.unitCost);
        const target = marginPct(c.unitPrice, c.unitCost);
        const low = price < c.unitPrice * (1 - tolerance / 100);
        return { d, c, price, suggested, real, target, low, profit: price - c.unitCost };
      })
      .sort((a, b) => Number(b.low) - Number(a.low) || a.real - b.real);
  }, [data, costs, tolerance]);

  const low = rows.filter((r) => r.low);
  const noPrice = (data?.desserts ?? []).filter((d) => d.active && (d.sale_price == null || Number(d.sale_price) <= 0)).length;
  const lostPerUnit = low.reduce((a, r) => a + (r.suggested - r.price), 0);

  // Ingredientes que subieron y cuántos postres los usan
  const increases = useMemo(() => {
    const seen = new Set<string>();
    return (hist.data ?? [])
      .filter((h) => Number(h.new_unit_cost) > Number(h.old_unit_cost))
      .filter((h) => (seen.has(h.ingredient_id) ? false : (seen.add(h.ingredient_id), true)))
      .map((h) => ({
        ...h,
        name: ingredientsById.get(h.ingredient_id)?.name ?? "Ingrediente",
        pct: ((Number(h.new_unit_cost) - Number(h.old_unit_cost)) / Number(h.old_unit_cost)) * 100,
        uses: (data?.desserts ?? []).filter((d) => d.dessert_items?.some((i) => i.ingredient_id === h.ingredient_id)).length,
      }));
  }, [hist.data, ingredientsById, data]);

  async function setPrice(ids: { id: string; price: number }[]) {
    setBusy(true);
    try {
      for (const r of ids) {
        const { error } = await sb.from("desserts").update({ sale_price: r.price }).eq("id", r.id);
        if (error) throw error;
      }
      toast.success(ids.length === 1 ? "Precio actualizado 💕" : `${ids.length} precios actualizados 💕`);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function changeTolerance(v: number) {
    const { data: p, error } = await sb.from("profiles").update({ margin_tolerance_pct: v }).eq("id", profile.id).select().single();
    if (error) return toast.error(error.message);
    setProfile(p as Profile);
  }

  return (
    <>
      <PageHeader
        eyebrow="Cuida tu ganancia"
        title="Alerta de margen"
        subtitle="Comparamos el precio al que vendes cada postre con lo que cuesta hacerlo hoy. Si un ingrediente sube, aquí verás qué postres quedaron cortos y el precio sugerido."
        actions={
          <Select aria-label="Tolerancia" value={tolerance} onChange={(e) => changeTolerance(Number(e.target.value))} className="w-auto">
            {[0, 3, 5, 10, 15].map((v) => (
              <option key={v} value={v}>
                Avisar si estoy {v === 0 ? "por debajo" : `${v}% por debajo`}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Con margen bajo" value={low.length} icon={<TrendingDown />} tone="rose" hint={`de ${rows.length} postres con precio`} />
        <StatCard label="Dejas de ganar" value={money(lostPerUnit)} icon={<ArrowUpRight />} tone="cream" hint="Por pieza, sumando todos" />
        <StatCard label="Ingredientes que subieron" value={increases.length} icon={<TrendingUp />} tone="cocoa" hint="Últimos 45 días" />
        <StatCard label="Sin precio de venta" value={noPrice} icon={<CakeSlice />} tone="mint" hint="Se cotizan con el precio sugerido" />
      </div>

      {increases.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <CardHeader title="Lo que subió de precio" subtitle="Cambios registrados al actualizar tus ingredientes" icon={<TrendingUp className="h-5 w-5" />} />
          <div className="flex gap-3 overflow-x-auto p-4 scrollbar-none sm:px-6">
            {increases.map((h) => (
              <div key={h.id} className="min-w-[200px] rounded-2xl border border-cocoa-800/5 bg-cream-50 p-3.5">
                <p className="truncate font-semibold text-cocoa-700">{h.name}</p>
                <p className="mt-1 text-xs text-cocoa-400">{date(h.changed_at, { day: "numeric", month: "short" })}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm">
                  <Badge tone="danger">+{num(h.pct, 1)}%</Badge>
                  <span className="text-xs text-cocoa-400">en {h.uses} postre{h.uses === 1 ? "" : "s"}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <CardHeader
          title="Tus postres"
          subtitle="Precio de venta contra costo actual por pieza"
          icon={<CakeSlice className="h-5 w-5" />}
          action={
            low.length > 1 && (
              <Button
                size="sm"
                loading={busy}
                onClick={async () =>
                  (await confirm({
                    title: `¿Actualizar ${low.length} precios?`,
                    message: "Se usará el precio sugerido redondeado de cada postre. Las cotizaciones y pedidos ya hechos no cambian.",
                    confirmText: "Actualizar",
                  })) && setPrice(low.map((r) => ({ id: r.d.id, price: r.suggested })))
                }
              >
                <Wand2 className="h-4 w-4" /> Ajustar todos
              </Button>
            )
          }
        />
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<CakeSlice className="h-8 w-8" />} title="Aún no hay postres con precio de venta" description="Ponle precio de venta a tus postres para vigilar tu margen." />
        ) : (
          <>
            {low.length === 0 && (
              <div className="mx-4 mt-4 flex items-center gap-2 rounded-2xl bg-mint-50 p-3 text-sm font-semibold text-mint-700 sm:mx-6">
                <CheckCircle2 className="h-5 w-5" /> ¡Todos tus precios cubren tus costos y tu ganancia!
              </div>
            )}
            <ul className="mt-2 divide-y divide-cocoa-800/5">
              {rows.map((r) => (
                <li key={r.d.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
                  <Link href={`/dashboard/postres/${r.d.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-cocoa-700">{r.d.name}</p>
                      {r.low ? <Badge tone="danger">Margen bajo</Badge> : <Badge tone="success">Bien</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-cocoa-400">
                      Costo {money(r.c.unitCost)} por {r.d.unit_label} · Ganas {money(r.profit)} ({num(r.real, 0)}% de margen, meta {num(r.target, 0)}%)
                    </p>
                    <div className="mt-2 h-1.5 max-w-[260px] overflow-hidden rounded-full bg-cream-200">
                      <div
                        className={`h-full rounded-full ${r.low ? "bg-rose-400" : "bg-mint-400"}`}
                        style={{ width: `${Math.max(4, Math.min(100, (r.real / Math.max(r.target, 1)) * 100))}%` }}
                      />
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Vendes en</p>
                      <p className="font-display text-lg font-semibold text-cocoa-700 tabular-nums">{money(r.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Sugerido</p>
                      <p className={`font-display text-lg font-semibold tabular-nums ${r.low ? "text-rose-600" : "text-mint-600"}`}>{money(r.suggested)}</p>
                    </div>
                    {r.low && (
                      <Button size="sm" variant="mint" disabled={busy} onClick={() => setPrice([{ id: r.d.id, price: r.suggested }])}>
                        Usar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
