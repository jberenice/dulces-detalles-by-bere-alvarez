/**
 * Precio de cajas con suplementos por sabor y control de margen mínimo.
 *
 *   Precio final = precio base de la caja + Σ (piezas × suplemento del sabor)
 *
 * Ej. caja de 6 a $200: 2 vainilla ($0), 1 red velvet ($6), 1 Nutella ($7), 1 chocolate ($8), 1 fresa y nata ($14)
 *     → 200 + 6 + 7 + 8 + 14 = $235.   Caja de 12 fresa y nata: 400 + 12 × 14 = $568.
 */
import type { CostBreakdown } from "./costing";
import { boxCostOf, cakeOptions, cupcakeOptions, kindOf, packagingPrice } from "./packages";
import type { Dessert, Ingredient, Package } from "./types";

/** Suplemento por pieza de cada sabor (id del postre → pesos extra) */
export type Surcharges = Record<string, number>;

/** Margen bruto mínimo por defecto (%) */
export const DEFAULT_MIN_MARGIN = 35;

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Suplemento por pieza de un sabor (nunca negativo) */
export const surchargeOf = (s: Surcharges | null | undefined, dessertId: string) => {
  const v = Number(s?.[dessertId]);
  return Number.isFinite(v) && v > 0 ? round2(v) : 0;
};

/** Suma de suplementos de una elección: Σ piezas × suplemento */
export function surchargeTotal(s: Surcharges | null | undefined, choices: { dessert_id: string; qty: number }[]) {
  return round2(choices.reduce((a, c) => a + (Number(c.qty) || 0) * surchargeOf(s, c.dessert_id), 0));
}

/** Precio final de una caja = precio base + suplementos de los sabores elegidos */
export const finalPrice = (base: number, s: Surcharges | null | undefined, choices: { dessert_id: string; qty: number }[]) =>
  round2((Number(base) || 0) + surchargeTotal(s, choices));

/** Suplementos limpios para guardar: solo sabores permitidos y montos mayores a cero */
export function cleanSurcharges(s: Surcharges | null | undefined, allowed: Set<string>): Surcharges {
  const out: Surcharges = {};
  for (const [id, v] of Object.entries(s ?? {})) {
    const n = surchargeOf({ [id]: Number(v) }, id);
    if (n > 0 && allowed.has(id)) out[id] = n;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Control de margen
// ---------------------------------------------------------------------------

export type MarginScenario = {
  /** Texto corto: "12 × Fresa y nata" o "Pastel Nutella + 5 × Vainilla" */
  label: string;
  /** Sabor de cupcake que domina esta combinación (null en paquetes de contenido fijo) */
  flavorId: string | null;
  flavorName: string;
  revenue: number;
  cost: number;
  margin: number;
  ok: boolean;
  /** Lo que tendría que pagar la clienta por esta combinación para llegar al margen objetivo */
  needTotal: number;
  /** Precio base de la caja (sin caja ni suplementos) que haría rentable esta combinación */
  needBase: number;
  /** Suplemento por pieza del cupcake que haría rentable esta combinación con el precio base actual */
  needSurcharge: number | null;
  /** Suplemento actual de ese sabor */
  surcharge: number;
};

export type PackageMarginReport = {
  scenarios: MarginScenario[];
  bad: MarginScenario[];
  worst: MarginScenario | null;
  best: MarginScenario | null;
  ok: boolean;
  /** Precio base necesario para que TODAS las combinaciones lleguen al margen objetivo */
  needBase: number;
};

type ReportInput = Pick<Package, "mode" | "pieces" | "items" | "price" | "packaging_id" | "extra_cost" | "kind" | "groups" | "cake_items" | "cakes" | "excluded"> & {
  packaging_ids?: string[] | null;
  packaging_qty?: Record<string, number> | null;
  surcharges?: Surcharges | null;
};

/** Margen bruto (%) sobre lo que paga la clienta */
export const grossMargin = (revenue: number, cost: number) => (revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0);

/**
 * Revisa las combinaciones de una caja contra el margen mínimo.
 * Como el margen es una razón entre dos funciones lineales de las piezas elegidas, el peor y el mejor caso
 * siempre están en las cajas de un solo sabor (todas del mismo cupcake); cualquier mezcla queda entre ellas.
 * Por eso basta revisar esas combinaciones (y, en pastel con cupcakes, cada pastel con cada cupcake).
 */
export function marginReport(
  p: ReportInput,
  desserts: Dessert[],
  costs: Map<string, CostBreakdown>,
  ingredientsById: Map<string, Ingredient>,
  targetPct: number,
): PackageMarginReport {
  const t = Math.min(Math.max(targetPct, 0), 95) / 100;
  const base = Number(p.price) || 0;
  const boxPrice = packagingPrice(p, ingredientsById);
  const packCost = boxCostOf(p, ingredientsById);
  const unitCost = (id: string) => costs.get(id)?.unitCost ?? 0;
  const s = p.surcharges ?? {};
  const scenarios: MarginScenario[] = [];

  const push = (label: string, flavorId: string | null, flavorName: string, revenue: number, cost: number, nCups: number, otherSur: number) => {
    revenue = round2(revenue);
    cost = round2(cost);
    const margin = grossMargin(revenue, cost);
    const needTotal = cost / (1 - t);
    const curSur = flavorId ? surchargeOf(s, flavorId) : 0;
    const surchargesTotal = revenue - base - boxPrice;
    scenarios.push({
      label,
      flavorId,
      flavorName,
      revenue,
      cost,
      margin,
      ok: margin + 1e-9 >= targetPct,
      needTotal: Math.ceil(needTotal * 100) / 100,
      needBase: Math.max(0, Math.ceil((needTotal - boxPrice - surchargesTotal) * 100) / 100),
      needSurcharge: flavorId && nCups > 0 ? Math.max(0, Math.ceil(((needTotal - base - boxPrice - otherSur) / nCups) * 100) / 100) : null,
      surcharge: curSur,
    });
  };

  if (p.mode === "fijo") {
    const byId = new Map(desserts.map((d) => [d.id, d]));
    let c = packCost;
    for (const it of p.items) if (byId.has(it.dessert_id)) c += (Number(it.qty) || 0) * unitCost(it.dessert_id);
    push("Contenido fijo", null, "Contenido fijo", base + boxPrice, c, 0, 0);
  } else {
    const cups = cupcakeOptions(p, desserts);
    const nCups = Number(p.pieces) || 0;
    const isCake = kindOf(p) === "pastel";
    const cakes = isCake ? cakeOptions(p, desserts) : [];
    const nCakes = isCake ? Number(p.cakes) || 1 : 0;
    if (isCake && cakes.length) {
      for (const g of cakes)
        for (const f of cups) {
          const sur = nCups * surchargeOf(s, f.id) + nCakes * surchargeOf(s, g.id);
          push(`${nCakes > 1 ? `${nCakes} × ` : ""}Pastel ${g.name} + ${nCups} × ${f.name}`, f.id, f.name, base + boxPrice + sur, packCost + nCups * unitCost(f.id) + nCakes * unitCost(g.id), nCups, nCakes * surchargeOf(s, g.id));
        }
    } else {
      for (const f of cups) push(`${nCups} × ${f.name}`, f.id, f.name, base + boxPrice + nCups * surchargeOf(s, f.id), packCost + nCups * unitCost(f.id), nCups, 0);
    }
  }

  const bad = scenarios.filter((x) => !x.ok).sort((a, b) => a.margin - b.margin);
  const sorted = [...scenarios].sort((a, b) => a.margin - b.margin);
  return {
    scenarios,
    bad,
    worst: sorted[0] ?? null,
    best: sorted[sorted.length - 1] ?? null,
    ok: bad.length === 0,
    needBase: scenarios.length ? Math.max(0, ...scenarios.map((x) => x.needBase)) : 0,
  };
}
