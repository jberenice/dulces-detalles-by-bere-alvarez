/**
 * Paquetes y cajas ("pedidos especiales").
 *  · fijo: tú defines qué trae (ej. pastel mini + 5 cupcakes)
 *  · surtido: la clienta elige sabores hasta llenar las piezas (ej. caja de 6 cupcakes a $192)
 */
import type { CostBreakdown } from "./costing";
import { roundPrice } from "./costing";
import type { Dessert, Ingredient, Package, PackageComponent } from "./types";

/** Precio suelto de un postre (el de venta o el sugerido por su costeo) */
export function dessertPrice(d: Dessert, c?: CostBreakdown) {
  if (d.sale_price != null) return Number(d.sale_price);
  return c ? roundPrice(c.unitPrice, c.unitPrice < 100 ? 5 : 10) : 0;
}

/** Piezas que trae un paquete fijo */
export const fixedPieces = (items: Package["items"]) => items.reduce((a, i) => a + (Number(i.qty) || 0), 0);

export const piecesOf = (p: Pick<Package, "mode" | "pieces" | "items">) => (p.mode === "fijo" ? fixedPieces(p.items) : Number(p.pieces) || 0);

export type Range = { min: number; max: number };
const range = (vals: number[]): Range => (vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : { min: 0, max: 0 });

export type PackageStats = {
  pieces: number;
  price: number;
  perPiece: number;
  /** Lo que costaría comprar las piezas sueltas */
  regular: Range;
  /** Lo que se ahorra la clienta */
  savings: Range;
  /** Costo de los postres + caja + extra */
  cost: Range;
  boxCost: number;
  profit: Range;
  /** Margen sobre el precio (%) */
  margin: Range;
};

/** Costo de la caja o empaque y del extra */
export function boxCostOf(p: Pick<Package, "packaging_id" | "extra_cost">, ingredientsById: Map<string, Ingredient>) {
  const box = p.packaging_id ? Number(ingredientsById.get(p.packaging_id)?.unit_cost ?? 0) : 0;
  return box + (Number(p.extra_cost) || 0);
}

export function packageStats(
  p: Pick<Package, "mode" | "pieces" | "items" | "price" | "packaging_id" | "extra_cost">,
  dessertsById: Map<string, Dessert>,
  costs: Map<string, CostBreakdown>,
  ingredientsById: Map<string, Ingredient>,
): PackageStats {
  const pieces = piecesOf(p);
  const price = Number(p.price) || 0;
  const boxCost = boxCostOf(p, ingredientsById);
  let regular: Range;
  let cost: Range;
  if (p.mode === "fijo") {
    let r = 0;
    let c = 0;
    for (const it of p.items) {
      const d = dessertsById.get(it.dessert_id);
      if (!d) continue;
      const q = Number(it.qty) || 0;
      r += q * dessertPrice(d, costs.get(d.id));
      c += q * (costs.get(d.id)?.unitCost ?? 0);
    }
    regular = { min: r, max: r };
    cost = { min: c + boxCost, max: c + boxCost };
  } else {
    const flavors = p.items.map((i) => dessertsById.get(i.dessert_id)).filter(Boolean) as Dessert[];
    const prices = range(flavors.map((d) => dessertPrice(d, costs.get(d.id))));
    const unit = range(flavors.map((d) => costs.get(d.id)?.unitCost ?? 0));
    regular = { min: prices.min * pieces, max: prices.max * pieces };
    cost = { min: unit.min * pieces + boxCost, max: unit.max * pieces + boxCost };
  }
  const profit = { min: price - cost.max, max: price - cost.min };
  return {
    pieces,
    price,
    perPiece: pieces ? price / pieces : 0,
    regular,
    savings: { min: regular.min - price, max: regular.max - price },
    cost,
    boxCost,
    profit,
    margin: { min: price ? (profit.min / price) * 100 : 0, max: price ? (profit.max / price) * 100 : 0 },
  };
}

/** Componentes de una caja fija */
export function fixedComponents(p: Pick<Package, "items">, dessertsById: Map<string, Dessert>): PackageComponent[] {
  return p.items
    .map((i) => ({ dessert_id: i.dessert_id, name: dessertsById.get(i.dessert_id)?.name ?? "", qty: Number(i.qty) || 0 }))
    .filter((c) => c.name && c.qty > 0);
}

/** "Caja de 6 cupcakes: 2 Vainilla, 4 Nutella" */
export const describePackage = (name: string, comps: PackageComponent[]) =>
  comps.length ? `${name}: ${comps.map((c) => `${c.qty} ${c.name}`).join(", ")}` : name;

/** Costo de UNA caja con un contenido concreto */
export function componentsCost(comps: PackageComponent[], costs: Map<string, CostBreakdown>, boxCost: number) {
  return comps.reduce((a, c) => a + c.qty * (costs.get(c.dessert_id)?.unitCost ?? 0), 0) + boxCost;
}

/** Texto corto de un rango de dinero */
export const rangeText = (r: Range, fmt: (n: number) => string) => (Math.abs(r.max - r.min) < 0.005 ? fmt(r.min) : `${fmt(r.min)} – ${fmt(r.max)}`);
