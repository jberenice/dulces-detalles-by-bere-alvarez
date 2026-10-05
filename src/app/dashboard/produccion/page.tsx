"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarRange, Check, ChefHat, ClipboardList, Copy, Download, MessageCircle, Package, PackageCheck, Printer, ShoppingCart, Wheat } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useCatalog } from "@/hooks/useCatalog";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Toggle } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { addDays, dateLong, money, money0, num, toISODate } from "@/lib/format";
import { computeProduction, fmtQty } from "@/lib/production";
import { ACTIVE_STATUSES } from "@/lib/reminders";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/types";

type Range = "semana" | "7dias" | "proxima" | "custom";

function rangeOf(r: Range, custom: { from: string; to: string }) {
  const now = new Date();
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  switch (r) {
    case "semana": return { from: toISODate(now), to: toISODate(addDays(monday, 6)) };
    case "7dias": return { from: toISODate(now), to: toISODate(addDays(now, 6)) };
    case "proxima": return { from: toISODate(addDays(monday, 7)), to: toISODate(addDays(monday, 13)) };
    default: return custom;
  }
}

export default function ProductionPage() {
  const sb = createClient();
  const catalog = useCatalog();
  const { profile } = catalog;
  const [range, setRange] = useState<Range>("7dias");
  const [custom, setCustom] = useState({ from: toISODate(new Date()), to: toISODate(addDays(new Date(), 6)) });
  const [useStock, setUseStock] = useState(profile.inventory_enabled);
  const [view, setView] = useState<"compras" | "plan">("compras");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const { from, to } = rangeOf(range, custom);

  const orders = useAsync(
    async () =>
      must(
        await sb
          .from("orders")
          .select("id, folio, status, delivery_date, delivery_time, customer_name, clients(name), order_items(dessert_id, description, quantity)")
          .in("status", ACTIVE_STATUSES)
          .gte("delivery_date", from)
          .lte("delivery_date", to)
          .order("delivery_date"),
      ) as Order[],
    [from, to],
  );

  const result = useMemo(() => {
    if (!orders.data || !catalog.data) return null;
    return computeProduction(orders.data, catalog.data.desserts, catalog.ingredientsById, useStock);
  }, [orders.data, catalog.data, catalog.ingredientsById, useStock]);

  const toBuy = (result?.needs ?? []).filter((n) => n.toBuy > 0);
  const loading = orders.loading || catalog.loading;

  function listText() {
    const lines = toBuy.map((n) => `${checked[n.ingredient.id] ? "✅" : "▫️"} ${n.ingredient.name}: ${fmtQty(n.toBuy, n.ingredient.unit)} (${n.packages} × ${fmtQty(n.ingredient.package_qty, n.ingredient.unit)})`);
    return `🛒 Lista de compras · ${dateLong(from)} al ${dateLong(to)}\n\n${lines.join("\n")}\n\nCosto estimado: ${money(result?.totalCost ?? 0)}\n— ${profile.business_name}`;
  }

  function downloadCsv() {
    const rows = [["Tipo", "Ingrediente", "Se necesita", "Existencia", "Comprar", "Unidad", "Paquetes", "Presentación", "Costo estimado", "Se usa en"]];
    for (const n of result?.needs ?? [])
      rows.push([n.ingredient.kind, n.ingredient.name, n.need.toFixed(2), n.stock.toFixed(2), n.toBuy.toFixed(2), n.ingredient.unit, String(n.packages), `${n.ingredient.package_qty} ${n.ingredient.unit}`, n.cost.toFixed(2), [...n.usedIn].join(" | ")]);
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `lista-compras_${from}_${to}.csv`;
    a.click();
  }

  async function markBought(id: string) {
    const n = result?.needs.find((x) => x.ingredient.id === id);
    if (!n) return;
    setBusy(id);
    const amount = n.packages * Number(n.ingredient.package_qty);
    const { error } = await sb.rpc("adjust_stock", { p_ingredient: id, p_delta: amount, p_reason: "compra", p_note: "Lista de compras" });
    setBusy(null);
    if (error) return toast.error(error.message);
    setChecked((c) => ({ ...c, [id]: true }));
    toast.success(`${n.ingredient.name}: +${fmtQty(amount, n.ingredient.unit)} a tu existencia`);
    catalog.reload();
  }

  return (
    <>
      <PageHeader
        eyebrow="Planea tu semana"
        title="Producción y compras"
        subtitle="A partir de tus pedidos activos calculamos qué hornear cada día y exactamente qué ingredientes y empaques necesitas comprar."
        actions={
          toBuy.length > 0 && (
            <>
              <Button variant="outline" onClick={() => window.print()} className="no-print"><Printer className="h-4 w-4" /> Imprimir</Button>
              <Button variant="mint" className="no-print" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(listText())}`, "_blank")}>
                <MessageCircle className="h-4 w-4" /> Enviar lista
              </Button>
            </>
          )
        }
      />

      <div className="no-print mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Tabs
            value={range}
            onChange={setRange}
            options={[
              { value: "7dias", label: "Próximos 7 días" },
              { value: "semana", label: "Esta semana" },
              { value: "proxima", label: "Próxima semana" },
              { value: "custom", label: "Fechas" },
            ]}
          />
          {range === "custom" && (
            <div className="flex gap-2">
              <Input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} aria-label="Desde" />
              <Input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} aria-label="Hasta" />
            </div>
          )}
        </div>
        <Toggle checked={useStock} onChange={setUseStock} label="Descontar mi existencia" description={profile.inventory_enabled ? "Usa el inventario de Ingredientes" : "Activa el inventario en Ingredientes"} />
      </div>

      <p className="mb-4 flex items-center gap-2 text-sm text-cocoa-500">
        <CalendarRange className="h-4 w-4 text-rose-400" /> Del <b className="capitalize">{dateLong(from)}</b> al <b className="capitalize">{dateLong(to)}</b>
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading || !result ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <StatCard label="Pedidos" value={orders.data!.length} icon={<ClipboardList />} tone="rose" />
            <StatCard label="Piezas a preparar" value={num(result.pieces, 0)} icon={<ChefHat />} tone="mint" />
            <StatCard label="Por comprar" value={`${toBuy.length} insumos`} icon={<ShoppingCart />} tone="cocoa" />
            <StatCard label="Costo estimado" value={money0(result.totalCost)} hint="Por paquetes completos" icon={<Package />} tone="cream" />
          </>
        )}
      </div>

      {!loading && result && orders.data!.length === 0 ? (
        <Card>
          <EmptyState icon={<ChefHat className="h-8 w-8" />} title="Sin pedidos en estas fechas" description="Cuando tengas pedidos activos con fecha de entrega aquí verás tu plan de producción y tu lista de compras." />
        </Card>
      ) : (
        <>
          <Tabs
            value={view}
            onChange={setView}
            className="no-print mb-4"
            options={[
              { value: "compras", label: <><ShoppingCart className="h-4 w-4" /> Lista de compras</>, count: toBuy.length },
              { value: "plan", label: <><ChefHat className="h-4 w-4" /> Plan por día</>, count: result?.plan.length ?? 0 },
            ]}
          />

          {result && result.noRecipe.length > 0 && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Estos conceptos no tienen receta y no se incluyen en la lista: <b>{result.noRecipe.map((n) => `${n.name} (${num(n.qty, 0)})`).join(", ")}</b>.{" "}
                <Link href="/dashboard/postres" className="font-bold underline">Agregar recetas</Link>
              </p>
            </div>
          )}

          {view === "compras" ? (
            <Card className="overflow-hidden">
              <CardHeader
                title="Lista de compras"
                subtitle={useStock ? "Ya descontamos lo que tienes en existencia" : "Cantidades totales que piden tus recetas"}
                icon={<ShoppingCart className="h-5 w-5" />}
                action={
                  <div className="no-print flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(listText()).then(() => toast.success("Lista copiada"))}><Copy className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={downloadCsv}><Download className="h-4 w-4" /></Button>
                  </div>
                }
              />
              {loading || !result ? (
                <div className="p-4"><Skeleton className="h-60" /></div>
              ) : (
                (["ingrediente", "empaque"] as const).map((kind) => {
                  const rows = result.needs.filter((n) => n.ingredient.kind === kind);
                  if (!rows.length) return null;
                  return (
                    <div key={kind} className="mt-4">
                      <p className="flex items-center gap-2 px-4 pb-2 text-xs font-bold tracking-widest text-cocoa-300 uppercase sm:px-6">
                        {kind === "empaque" ? <Package className="h-3.5 w-3.5" /> : <Wheat className="h-3.5 w-3.5" />} {kind === "empaque" ? "Empaques" : "Ingredientes"}
                      </p>
                      <ul className="divide-y divide-cocoa-800/5 border-t border-cocoa-800/5">
                        {rows.map((n) => {
                          const done = checked[n.ingredient.id] || n.toBuy === 0;
                          return (
                            <li key={n.ingredient.id} className={cn("flex items-center gap-3 px-4 py-3 sm:px-6", done && "bg-mint-50/40")}>
                              <button
                                onClick={() => setChecked((c) => ({ ...c, [n.ingredient.id]: !c[n.ingredient.id] }))}
                                className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition", done ? "border-mint-500 bg-mint-500 text-white" : "border-cocoa-800/20")}
                                aria-label="Marcar"
                              >
                                {done && <Check className="h-4 w-4" />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className={cn("font-semibold text-cocoa-700", done && "text-cocoa-400 line-through")}>{n.ingredient.name}</p>
                                <p className="truncate text-xs text-cocoa-400">
                                  Necesitas {fmtQty(n.need, n.ingredient.unit)}
                                  {useStock && ` · tienes ${fmtQty(n.stock, n.ingredient.unit)}`} · {[...n.usedIn].slice(0, 3).join(", ")}
                                  {n.usedIn.size > 3 ? "…" : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                {n.toBuy > 0 ? (
                                  <>
                                    <p className="font-display text-lg leading-tight font-semibold text-rose-500 tabular-nums">{fmtQty(n.toBuy, n.ingredient.unit)}</p>
                                    <p className="text-[11px] text-cocoa-400">
                                      {n.packages} × {fmtQty(n.ingredient.package_qty, n.ingredient.unit)} · {money(n.cost)}
                                    </p>
                                  </>
                                ) : (
                                  <Badge tone="success">Suficiente</Badge>
                                )}
                              </div>
                              {profile.inventory_enabled && n.toBuy > 0 && !checked[n.ingredient.id] && (
                                <Button size="sm" variant="secondary" className="no-print max-sm:hidden" loading={busy === n.ingredient.id} onClick={() => markBought(n.ingredient.id)} title="Sumar a mi existencia">
                                  <PackageCheck className="h-4 w-4" /> Comprado
                                </Button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}
              {result && (
                <div className="flex items-center justify-between border-t border-cocoa-800/5 bg-cream-50 px-4 py-4 sm:px-6">
                  <span className="font-bold text-cocoa-600">Total estimado</span>
                  <span className="font-display text-2xl font-semibold text-cocoa-800 tabular-nums">{money(result.totalCost)}</span>
                </div>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {(result?.plan ?? []).map((d) => (
                <Card key={d.date} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 bg-cream-100 px-4 py-3 sm:px-6">
                    <h3 className="text-lg font-semibold capitalize">{d.date === "sin-fecha" ? "Sin fecha" : dateLong(d.date)}</h3>
                    <Badge tone="rose">{d.orders} pedido{d.orders === 1 ? "" : "s"}</Badge>
                  </div>
                  <ul className="divide-y divide-cocoa-800/5">
                    {d.items.map((it) => (
                      <li key={it.name} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                        <span className="grid h-10 min-w-12 place-items-center rounded-xl bg-rose-50 px-2 font-display text-lg font-semibold text-rose-500">{num(it.qty, 2)}</span>
                        <p className="flex-1 font-semibold text-cocoa-700">{it.name}</p>
                        <span className="text-xs text-cocoa-400">{it.unit}{it.qty === 1 ? "" : "s"}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
              <p className="text-center text-xs text-cocoa-400">Tip: prepara masas y rellenos un día antes de la entrega y decora el mismo día.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
