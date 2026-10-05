"use client";
import { useMemo } from "react";
import { CakeSlice, Plus, Trash2, PenLine } from "lucide-react";
import { Combobox } from "@/components/ui/Combobox";
import { money, num } from "@/lib/format";
import type { CostBreakdown } from "@/lib/costing";
import { roundPrice } from "@/lib/costing";
import type { Dessert, LineItem } from "@/lib/types";
import type { calcTotals } from "@/lib/totals";

export type EditableLine = LineItem & { key: string };
export const lineKey = () => Math.random().toString(36).slice(2);

export function priceFor(d: Dessert, c?: CostBreakdown) {
  if (d.sale_price != null) return Number(d.sale_price);
  return c ? roundPrice(c.unitPrice, c.unitPrice < 100 ? 5 : 10) : 0;
}

export function LineItemsEditor({
  items,
  setItems,
  desserts,
  costs,
}: {
  items: EditableLine[];
  setItems: (fn: (prev: EditableLine[]) => EditableLine[]) => void;
  desserts: Dessert[];
  costs: Map<string, CostBreakdown>;
}) {
  const options = useMemo(
    () =>
      desserts
        .filter((d) => d.active)
        .map((d) => ({ value: d.id, label: d.name, hint: money(priceFor(d, costs.get(d.id))) })),
    [desserts, costs],
  );

  const update = (key: string, patch: Partial<EditableLine>) => setItems((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  function pickDessert(key: string, id: string) {
    const d = desserts.find((x) => x.id === id);
    if (!d) return;
    const c = costs.get(id);
    update(key, { dessert_id: id, description: d.name, unit_price: priceFor(d, c), unit_cost: c?.unitCost ?? 0 });
  }

  return (
    <div>
      <div className="hidden grid-cols-[1fr_90px_130px_110px_36px] gap-2 pb-2 text-[10.5px] font-bold tracking-wider text-cocoa-300 uppercase md:grid">
        <span>Postre / concepto</span>
        <span className="text-right">Cant.</span>
        <span className="text-right">Precio unit.</span>
        <span className="text-right">Importe</span>
        <span />
      </div>
      <div className="space-y-3">
        {items.map((l) => (
          <div key={l.key} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-2xl bg-cream-50 p-3 ring-1 ring-cocoa-800/5 md:grid-cols-[1fr_90px_130px_110px_36px] md:items-start md:bg-transparent md:p-0 md:ring-0">
            <div className="col-span-3 space-y-1.5 md:col-span-1">
              {l.dessert_id !== null ? (
                <Combobox value={l.dessert_id} onChange={(v) => pickDessert(l.key, v)} options={options} placeholder="Elige un postre de tu recetario" />
              ) : null}
              {(l.dessert_id === null || !!l.dessert_id) && (
                <input
                  className="field !py-2 text-sm"
                  value={l.description}
                  onChange={(e) => update(l.key, { description: e.target.value })}
                  placeholder="Descripción (ej. Pastel personalizado 20 personas)"
                />
              )}
            </div>
            <input
              className="field text-right tabular-nums"
              type="number"
              min={0}
              step="any"
              value={l.quantity}
              onChange={(e) => update(l.key, { quantity: e.target.value as unknown as number })}
              aria-label="Cantidad"
            />
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-cocoa-400">$</span>
              <input
                className="field pl-7 text-right tabular-nums"
                type="number"
                min={0}
                step="any"
                value={l.unit_price}
                onChange={(e) => update(l.key, { unit_price: e.target.value as unknown as number })}
                aria-label="Precio unitario"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between md:col-span-1 md:block md:pt-2.5 md:text-right">
              <span className="text-xs text-cocoa-400 md:hidden">Importe</span>
              <span className="font-semibold text-cocoa-700 tabular-nums">{money((Number(l.quantity) || 0) * (Number(l.unit_price) || 0))}</span>
              {Number(l.unit_cost) > 0 && (
                <p className="hidden text-[11px] text-cocoa-300 md:block">costo {money(Number(l.unit_cost) * (Number(l.quantity) || 0))}</p>
              )}
            </div>
            <button
              onClick={() => setItems((prev) => prev.filter((x) => x.key !== l.key))}
              className="grid h-10 w-10 place-items-center justify-self-end rounded-xl text-cocoa-300 hover:bg-rose-50 hover:text-rose-500"
              aria-label="Quitar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setItems((p) => [...p, { key: lineKey(), dessert_id: "", description: "", quantity: 1, unit_price: 0, unit_cost: 0 }])}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100"
        >
          <CakeSlice className="h-4 w-4" /> <Plus className="-ml-1 h-3 w-3" /> Postre
        </button>
        <button
          onClick={() => setItems((p) => [...p, { key: lineKey(), dessert_id: null, description: "", quantity: 1, unit_price: 0, unit_cost: 0 }])}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cream-200 px-3 py-2 text-sm font-bold text-cocoa-600 hover:bg-cream-300"
        >
          <PenLine className="h-4 w-4" /> Concepto libre
        </button>
      </div>
      {items.length > 0 && (
        <p className="mt-3 text-xs text-cocoa-400">{num(items.reduce((a, i) => a + (Number(i.quantity) || 0), 0), 0)} piezas en total</p>
      )}
    </div>
  );
}

export function TotalsBox({
  totals,
  showProfit = true,
}: {
  totals: ReturnType<typeof calcTotals>;
  showProfit?: boolean;
}) {
  const row = (l: string, v: number, cls = "") => (
    <div className={`flex justify-between py-1 text-sm ${cls}`}>
      <span className="text-cocoa-500">{l}</span>
      <span className="font-semibold tabular-nums">{money(v)}</span>
    </div>
  );
  return (
    <div>
      {row("Subtotal", totals.subtotal)}
      {totals.discount > 0 && row("Descuento", -totals.discount, "text-rose-600")}
      {totals.shipping > 0 && row("Envío", totals.shipping)}
      {totals.iva > 0 && row("IVA", totals.iva)}
      <div className="mt-2 flex items-end justify-between border-t border-dashed border-cocoa-800/10 pt-3">
        <span className="font-bold text-cocoa-700">Total</span>
        <span className="font-display text-3xl font-semibold text-rose-500 tabular-nums">{money(totals.total)}</span>
      </div>
      {showProfit && totals.cost > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-mint-50 p-3 text-sm">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-mint-600 uppercase">Costo producción</p>
            <p className="font-semibold tabular-nums">{money(totals.cost)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-mint-600 uppercase">Utilidad estimada</p>
            <p className="font-semibold text-mint-700 tabular-nums">{money(totals.profit)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
