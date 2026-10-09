/**
 * Paquetes y cajas ("pedidos especiales").
 *  · cupcakes: caja surtida; la clienta elige de las categorías que tú escojas (ej. caja de 6 a $192)
 *  · pastel: pastel mini (ella elige el sabor) + cupcakes de las categorías que escojas
 *  · postres: contenido fijo que tú defines
 */
import type { CostBreakdown } from "./costing";
import { roundPrice } from "./costing";
import type { Dessert, Ingredient, Package, PackageComponent, PackageKind } from "./types";

/** Precio suelto de un postre (el de venta o el sugerido por su costeo) */
export function dessertPrice(d: Dessert, c?: CostBreakdown) {
  if (d.sale_price != null) return Number(d.sale_price);
  return c ? roundPrice(c.unitPrice, c.unitPrice < 100 ? 5 : 10) : 0;
}

export const KIND_LABEL: Record<PackageKind, string> = {
  cupcakes: "Cajas de cupcakes",
  pastel: "Pastel con cupcakes",
  postres: "Paquetes de postres",
};

/** Tipo del paquete (los anteriores a 0015 se deducen por su modo) */
export const kindOf = (p: Pick<Package, "kind" | "mode">): PackageKind => p.kind ?? (p.mode === "fijo" ? "postres" : "cupcakes");

/** Piezas que trae un paquete fijo */
export const fixedPieces = (items: Package["items"]) => items.reduce((a, i) => a + (Number(i.qty) || 0), 0);

export const piecesOf = (p: Pick<Package, "mode" | "pieces" | "items" | "kind" | "cakes">) =>
  p.mode === "fijo" ? fixedPieces(p.items) : (Number(p.pieces) || 0) + (kindOf(p) === "pastel" ? Number(p.cakes) || 1 : 0);

/** Cupcakes que puede elegir la clienta: los de las categorías elegidas (o, en cajas viejas, los elegidos uno por uno) */
export function cupcakeOptions(p: Pick<Package, "groups" | "items" | "mode" | "excluded">, desserts: Dessert[]) {
  if (p.mode === "fijo") return [];
  const groups = p.groups ?? [];
  const off = new Set(p.excluded ?? []);
  if (groups.length) return desserts.filter((d) => d.active && d.flavor_group_id && groups.includes(d.flavor_group_id) && !off.has(d.id));
  const byId = new Map(desserts.map((d) => [d.id, d]));
  return p.items.map((i) => byId.get(i.dessert_id)).filter((d): d is Dessert => !!d && d.active);
}

/** Sabores de pastel mini para elegir */
export function cakeOptions(p: Pick<Package, "kind" | "mode" | "cake_items">, desserts: Dessert[]) {
  if (kindOf(p) !== "pastel") return [];
  const byId = new Map(desserts.map((d) => [d.id, d]));
  return (p.cake_items ?? []).map((i) => byId.get(i.dessert_id)).filter((d): d is Dessert => !!d && d.active);
}

export type Range = { min: number; max: number };
const range = (vals: number[]): Range => (vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : { min: 0, max: 0 });

export type PackageStats = {
  pieces: number;
  /** Precio del paquete (sin la caja) */
  price: number;
  /** Caja o empaque que se le cobra a la clienta */
  boxPrice: number;
  /** Lo que paga la clienta: paquete + caja */
  total: number;
  perPiece: number;
  /** Lo que costaría comprar las piezas sueltas */
  regular: Range;
  /** Lo que se ahorra la clienta */
  savings: Range;
  /** Costo de los postres + caja + otros costos */
  cost: Range;
  boxCost: number;
  /** Otros costos tuyos (campo anterior a 0017) */
  extraCost: number;
  profit: Range;
  /** Margen sobre el precio (%) */
  margin: Range;
};

/** Todos los empaques del paquete (el principal primero, sin repetir) */
export function packagingIdsOf(p: { packaging_id?: string | null; packaging_ids?: string[] | null }) {
  return [...new Set([p.packaging_id, ...(p.packaging_ids ?? [])].filter((x): x is string => !!x))];
}

type PackagingInput = { packaging_id?: string | null; packaging_ids?: string[] | null; packaging_qty?: Record<string, number> | null };

/** Cuántas piezas de un empaque lleva el paquete (3 vasos, 1 caja…) */
export const packagingQtyOf = (p: Pick<PackagingInput, "packaging_qty">, id: string) => {
  const v = Number(p.packaging_qty?.[id]);
  return Number.isFinite(v) && v > 0 ? v : 1;
};

/** Precio de la caja y empaques: Σ costo × cantidad; se le cobra a la clienta encima del precio del paquete */
export function packagingPrice(p: PackagingInput, ingredientsById: Map<string, Ingredient>) {
  const sum = packagingIdsOf(p).reduce((a, id) => a + Math.round(Number(ingredientsById.get(id)?.unit_cost ?? 0) * packagingQtyOf(p, id) * 100) / 100, 0);
  return Math.round(sum * 100) / 100;
}

/** Lo que paga la clienta por un paquete: su precio + los empaques */
export const packageTotal = (p: Pick<Package, "price"> & PackagingInput, ingredientsById?: Map<string, Ingredient>) =>
  Math.round((Number(p.price) + (ingredientsById ? packagingPrice(p, ingredientsById) : 0)) * 100) / 100;

/** Costo de los empaques y del extra */
export function boxCostOf(p: Pick<Package, "extra_cost"> & PackagingInput, ingredientsById: Map<string, Ingredient>) {
  const box = packagingIdsOf(p).reduce((a, id) => a + Number(ingredientsById.get(id)?.unit_cost ?? 0) * packagingQtyOf(p, id), 0);
  return box + (Number(p.extra_cost) || 0);
}

type StatsInput = Pick<Package, "mode" | "pieces" | "items" | "price" | "packaging_id" | "extra_cost" | "kind" | "groups" | "cake_items" | "cakes" | "excluded"> & { packaging_ids?: string[] | null; packaging_qty?: Record<string, number> | null };

export function packageStats(p: StatsInput, desserts: Dessert[], costs: Map<string, CostBreakdown>, ingredientsById: Map<string, Ingredient>): PackageStats {
  const price = Number(p.price) || 0;
  const boxCost = boxCostOf(p, ingredientsById);
  let regular: Range;
  let cost: Range;
  if (p.mode === "fijo") {
    const byId = new Map(desserts.map((d) => [d.id, d]));
    let r = 0;
    let c = 0;
    for (const it of p.items) {
      const d = byId.get(it.dessert_id);
      if (!d) continue;
      const q = Number(it.qty) || 0;
      r += q * dessertPrice(d, costs.get(d.id));
      c += q * (costs.get(d.id)?.unitCost ?? 0);
    }
    regular = { min: r, max: r };
    cost = { min: c + boxCost, max: c + boxCost };
  } else {
    const cups = cupcakeOptions(p, desserts);
    const cakes = cakeOptions(p, desserts);
    const nCups = Number(p.pieces) || 0;
    const nCakes = kindOf(p) === "pastel" ? Number(p.cakes) || 1 : 0;
    const cupPrice = range(cups.map((d) => dessertPrice(d, costs.get(d.id))));
    const cupCost = range(cups.map((d) => costs.get(d.id)?.unitCost ?? 0));
    const cakePrice = range(cakes.map((d) => dessertPrice(d, costs.get(d.id))));
    const cakeCost = range(cakes.map((d) => costs.get(d.id)?.unitCost ?? 0));
    regular = { min: cupPrice.min * nCups + cakePrice.min * nCakes, max: cupPrice.max * nCups + cakePrice.max * nCakes };
    cost = { min: cupCost.min * nCups + cakeCost.min * nCakes + boxCost, max: cupCost.max * nCups + cakeCost.max * nCakes + boxCost };
  }
  const pieces = piecesOf(p);
  const boxPrice = packagingPrice(p, ingredientsById);
  const total = price + boxPrice;
  // La caja se cobra aparte, así que la ganancia sale de lo que paga la clienta menos todos los costos
  const profit = { min: total - cost.max, max: total - cost.min };
  return {
    pieces,
    price,
    boxPrice,
    total,
    perPiece: pieces ? total / pieces : 0,
    regular,
    savings: { min: regular.min - total, max: regular.max - total },
    cost,
    boxCost,
    extraCost: Number(p.extra_cost) || 0,
    profit,
    // El margen se mide sobre el precio del paquete (la caja solo pasa de la clienta al proveedor)
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
  comps.length
    ? `${name}: ${comps.map((c) => `${c.qty} ${c.name}${Number(c.surcharge) > 0 ? ` (+$${Number((c.qty * Number(c.surcharge)).toFixed(2))})` : ""}`).join(", ")}`
    : name;

/** Costo de UNA caja con un contenido concreto */
export function componentsCost(comps: PackageComponent[], costs: Map<string, CostBreakdown>, boxCost: number) {
  return comps.reduce((a, c) => a + c.qty * (costs.get(c.dessert_id)?.unitCost ?? 0), 0) + boxCost;
}

/** Cuántos pasteles y cupcakes lleva una elección */
export function countChoice(p: Pick<Package, "kind" | "mode" | "cake_items">, comps: PackageComponent[]) {
  const cakeIds = new Set((kindOf(p) === "pastel" ? p.cake_items ?? [] : []).map((i) => i.dessert_id));
  let cakes = 0;
  let cups = 0;
  for (const c of comps) (cakeIds.has(c.dessert_id) ? (cakes += c.qty) : (cups += c.qty));
  return { cakes, cups };
}

/** Texto corto de un rango de dinero */
export const rangeText = (r: Range, fmt: (n: number) => string) => (Math.abs(r.max - r.min) < 0.005 ? fmt(r.min) : `${fmt(r.min)} – ${fmt(r.max)}`);
