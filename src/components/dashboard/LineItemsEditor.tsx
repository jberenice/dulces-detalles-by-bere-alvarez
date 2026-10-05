"use client";
import { useMemo } from "react";
import { CakeSlice, Gift, Minus, Plus, Trash2, PenLine } from "lucide-react";
import { Combobox } from "@/components/ui/Combobox";
import { money, num } from "@/lib/format";
import type { CostBreakdown } from "@/lib/costing";
import { roundPrice } from "@/lib/costing";
import type { Dessert, Ingredient, LineItem, Package, PackageComponent } from "@/lib/types";
import { boxCostOf, componentsCost, describePackage, fixedComponents } from "@/lib/packages";
import { cn } from "@/lib/cn";
import type { calcTotals } from "@/lib/totals";

export type EditableLine = LineItem & { key: string };
export const lineKey = () => Math.random().toString(36).slice(2);

export function priceFor(d: Dessert, c?: CostBreakdown) {
  if (d.sale_price != null) return Number(d.sale_price);
  return c ? roundPrice(c.unitPrice, c.unitPrice < 100 ? 5 : 10) : 0;
}

/** ¿Es una partida de paquete? (package_id "" = paquete aún sin elegir) */
export const isPackageLine = (l: Pick<LineItem, "package_id">) => l.package_id !== null && l.package_id !== undefined;

/** Piezas elegidas en una caja surtida */
export const chosenPieces = (l: Pick<LineItem, "components">) => (l.components ?? []).reduce((a, c) => a + (Number(c.qty) || 0), 0);

/** Revisa que las cajas surtidas estén completas; regresa el mensaje de error o null */
export function packageLinesProblem(items: LineItem[], packages: Package[]) {
  for (const l of items) {
    if (!isPackageLine(l)) continue;
    const p = packages.find((x) => x.id === l.package_id);
    if (!p) return "Elige el paquete en todas las partidas de paquete";
    if (p.mode === "surtido" && chosenPieces(l) !== p.pieces) return `“${p.name}” lleva ${p.pieces} piezas: elige los sabores (llevas ${chosenPieces(l)})`;
  }
  return null;
}

/** Columnas para guardar una partida; las de paquete solo se mandan si hay paquetes (por si falta la migración 0013) */
export function lineRow(i: LineItem, withPackages: boolean) {
  const row = {
    dessert_id: i.dessert_id || null,
    description: i.description.trim(),
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price) || 0,
    unit_cost: Number(i.unit_cost) || 0,
  };
  return withPackages ? { ...row, dessert_id: isPackageLine(i) ? null : row.dessert_id, package_id: i.package_id || null, components: i.components ?? [] } : row;
}

export function LineItemsEditor({
  items,
  setItems,
  desserts,
  costs,
  packages = [],
  ingredientsById,
}: {
  items: EditableLine[];
  setItems: (fn: (prev: EditableLine[]) => EditableLine[]) => void;
  desserts: Dessert[];
  costs: Map<string, CostBreakdown>;
  packages?: Package[];
  ingredientsById?: Map<string, Ingredient>;
}) {
  const options = useMemo(
    () =>
      desserts
        .filter((d) => d.active)
        .map((d) => ({ value: d.id, label: d.name, hint: money(priceFor(d, costs.get(d.id))) })),
    [desserts, costs],
  );

  const update = (key: string, patch: Partial<EditableLine>) => setItems((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const dessertsById = useMemo(() => new Map(desserts.map((d) => [d.id, d])), [desserts]);
  const packOptions = useMemo(
    () => packages.filter((p) => p.active).map((p) => ({ value: p.id, label: p.name, hint: `${p.pieces} pz · ${money(p.price)}` })),
    [packages],
  );

  /** Recalcula descripción y costo de una caja con su contenido */
  function withComponents(p: Package, comps: PackageComponent[]): Partial<EditableLine> {
    return {
      components: comps,
      description: describePackage(p.name, comps),
      unit_cost: Math.round(componentsCost(comps, costs, ingredientsById ? boxCostOf(p, ingredientsById) : 0) * 100) / 100,
    };
  }

  function pickPackage(key: string, id: string) {
    const p = packages.find((x) => x.id === id);
    if (!p) return;
    const comps = p.mode === "fijo" ? fixedComponents(p, dessertsById) : [];
    update(key, { package_id: id, dessert_id: null, unit_price: Number(p.price), ...withComponents(p, comps) });
  }

  function setFlavor(l: EditableLine, p: Package, dessertId: string, delta: number) {
    const comps = [...(l.components ?? [])];
    const i = comps.findIndex((c) => c.dessert_id === dessertId);
    const total = chosenPieces(l);
    if (delta > 0 && total >= p.pieces) return;
    if (i >= 0) comps[i] = { ...comps[i], qty: Math.max(0, comps[i].qty + delta) };
    else if (delta > 0) comps.push({ dessert_id: dessertId, name: dessertsById.get(dessertId)?.name ?? "", qty: delta });
    update(l.key, withComponents(p, comps.filter((c) => c.qty > 0)));
  }

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
              {isPackageLine(l) ? (
                <PackageLine
                  line={l}
                  pack={packages.find((p) => p.id === l.package_id)}
                  options={packOptions}
                  dessertsById={dessertsById}
                  onPick={(id) => pickPackage(l.key, id)}
                  onFlavor={(p, id, delta) => setFlavor(l, p, id, delta)}
                />
              ) : l.dessert_id !== null ? (
                <Combobox value={l.dessert_id} onChange={(v) => pickDessert(l.key, v)} options={options} placeholder="Elige un postre de tu recetario" />
              ) : null}
              {!isPackageLine(l) && (l.dessert_id === null || !!l.dessert_id) && (
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
        {packOptions.length > 0 && (
          <button
            onClick={() => setItems((p) => [...p, { key: lineKey(), dessert_id: null, package_id: "", components: [], description: "", quantity: 1, unit_price: 0, unit_cost: 0 }])}
            className="inline-flex items-center gap-1.5 rounded-xl bg-mint-50 px-3 py-2 text-sm font-bold text-mint-700 hover:bg-mint-100"
          >
            <Gift className="h-4 w-4" /> <Plus className="-ml-1 h-3 w-3" /> Paquete o caja
          </button>
        )}
        <button
          onClick={() => setItems((p) => [...p, { key: lineKey(), dessert_id: null, description: "", quantity: 1, unit_price: 0, unit_cost: 0 }])}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cream-200 px-3 py-2 text-sm font-bold text-cocoa-600 hover:bg-cream-300"
        >
          <PenLine className="h-4 w-4" /> Concepto libre
        </button>
      </div>
      {items.length > 0 && (
        <p className="mt-3 text-xs text-cocoa-400">{num(items.reduce((a, i) => a + (Number(i.quantity) || 0) * (isPackageLine(i) && chosenPieces(i) ? chosenPieces(i) : 1), 0), 0)} piezas en total</p>
      )}
    </div>
  );
}

/** Partida de paquete: elegir el paquete y, si es surtido, repartir los sabores */
function PackageLine({
  line,
  pack,
  options,
  dessertsById,
  onPick,
  onFlavor,
}: {
  line: EditableLine;
  pack?: Package;
  options: { value: string; label: string; hint?: string }[];
  dessertsById: Map<string, Dessert>;
  onPick: (id: string) => void;
  onFlavor: (p: Package, dessertId: string, delta: number) => void;
}) {
  const chosen = chosenPieces(line);
  return (
    <div className="space-y-2">
      <Combobox value={line.package_id ?? ""} onChange={onPick} options={options} placeholder="Elige un paquete o caja" />
      {pack?.mode === "surtido" && (
        <div className="rounded-xl bg-mint-50/60 p-2.5 ring-1 ring-mint-200/60">
          <p className={cn("mb-2 text-xs font-bold", chosen === pack.pieces ? "text-mint-700" : "text-amber-700")}>
            Sabores {chosen}/{pack.pieces} {chosen === pack.pieces ? "✓" : "· reparte las piezas"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pack.items.map((it) => {
              const d = dessertsById.get(it.dessert_id);
              if (!d) return null;
              const n = line.components?.find((c) => c.dessert_id === it.dessert_id)?.qty ?? 0;
              return (
                <span key={it.dessert_id} className={cn("inline-flex items-center gap-1 rounded-full bg-white py-0.5 pr-1 pl-2.5 text-xs font-bold ring-1", n ? "text-cocoa-700 ring-mint-300" : "text-cocoa-400 ring-cocoa-800/10")}>
                  {d.name}
                  <button type="button" onClick={() => onFlavor(pack, it.dessert_id, -1)} disabled={!n} className="grid h-6 w-6 place-items-center rounded-full hover:bg-cream-200 disabled:opacity-30" aria-label={`Quitar ${d.name}`}>
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-4 text-center tabular-nums">{n}</span>
                  <button type="button" onClick={() => onFlavor(pack, it.dessert_id, 1)} disabled={chosen >= pack.pieces} className="grid h-6 w-6 place-items-center rounded-full hover:bg-cream-200 disabled:opacity-30" aria-label={`Agregar ${d.name}`}>
                    <Plus className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
      {pack && line.description && <p className="text-xs text-cocoa-400">{line.description}</p>}
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
