/**
 * Motor de costeo — replica la lógica de tus hojas de Excel:
 *
 *  Costo fijo por hora  = Σ gastos fijos mensuales / días al mes / horas al día
 *  Total CF             = costo fijo por hora × horas de trabajo de la receta
 *  Total CV             = Σ (costo unitario del ingrediente × cantidad)
 *  Desgaste maquinaria  = (CF + CV) × % desgaste
 *  Total costos         = CF + CV + desgaste
 *  Ganancia             = Total costos × % ganancia
 *  Empaquetado          = Σ (costo unitario del empaque × cantidad)
 *  Subtotal             = Total costos + ganancia + empaquetado + envío
 *  IVA                  = Subtotal × % IVA            (opcional)
 *  Comisión tarjeta     = (Subtotal + IVA) × % tarjeta (opcional)
 *  Precio total         = Subtotal + IVA + comisión
 *  Precio por pieza     = Precio total / rendimiento
 */
import type { Dessert, DessertItem, FixedCost, Ingredient, Profile } from "./types";

export type CostSettings = Pick<
  Profile,
  "days_per_month" | "hours_per_day" | "iva_pct" | "card_fee_pct" | "default_profit_pct" | "default_wear_pct"
>;

export type CostBreakdown = {
  fixedPerHour: number;
  fixed: number;
  variable: number;
  wear: number;
  totalCost: number;
  profit: number;
  packaging: number;
  shipping: number;
  subtotal: number;
  iva: number;
  cardFee: number;
  total: number;
  unitPrice: number;
  /** Costo de producción por unidad (sin ganancia, IVA ni comisión) */
  unitCost: number;
  sections: { name: string; cost: number }[];
};

export function fixedCostPerHour(fixed: FixedCost[], s: Pick<CostSettings, "days_per_month" | "hours_per_day">) {
  const monthly = fixed.reduce((a, f) => a + Number(f.monthly_amount || 0), 0);
  const days = Number(s.days_per_month) || 30;
  const hours = Number(s.hours_per_day) || 8;
  return monthly / days / hours;
}

type DessertLike = Pick<
  Dessert,
  "yield_units" | "labor_hours" | "profit_pct" | "wear_pct" | "shipping" | "apply_iva" | "apply_card_fee"
>;

export function computeCost(
  dessert: DessertLike,
  items: Pick<DessertItem, "ingredient_id" | "quantity" | "section">[],
  ingredientsById: Map<string, Ingredient>,
  fixed: FixedCost[],
  settings: CostSettings,
): CostBreakdown {
  const fixedPerHour = fixedCostPerHour(fixed, settings);
  const fixedCost = fixedPerHour * Number(dessert.labor_hours || 0);

  let variable = 0;
  let packaging = 0;
  const sectionMap = new Map<string, number>();
  for (const it of items) {
    const ing = ingredientsById.get(it.ingredient_id);
    if (!ing) continue;
    const cost = Number(ing.unit_cost) * Number(it.quantity || 0);
    if (ing.kind === "empaque") {
      packaging += cost;
    } else {
      variable += cost;
      const key = it.section?.trim() || "Ingredientes";
      sectionMap.set(key, (sectionMap.get(key) ?? 0) + cost);
    }
  }

  const wear = (fixedCost + variable) * (Number(dessert.wear_pct) / 100);
  const totalCost = fixedCost + variable + wear;
  const profit = totalCost * (Number(dessert.profit_pct) / 100);
  const shipping = Number(dessert.shipping || 0);
  const subtotal = totalCost + profit + packaging + shipping;
  const iva = dessert.apply_iva ? subtotal * (Number(settings.iva_pct) / 100) : 0;
  const cardFee = dessert.apply_card_fee ? (subtotal + iva) * (Number(settings.card_fee_pct) / 100) : 0;
  const total = subtotal + iva + cardFee;
  const yieldUnits = Number(dessert.yield_units) || 1;

  return {
    fixedPerHour,
    fixed: fixedCost,
    variable,
    wear,
    totalCost,
    profit,
    packaging,
    shipping,
    subtotal,
    iva,
    cardFee,
    total,
    unitPrice: total / yieldUnits,
    unitCost: (totalCost + packaging) / yieldUnits,
    sections: [...sectionMap.entries()].map(([name, cost]) => ({ name, cost })),
  };
}

/** Redondea hacia arriba al múltiplo indicado (precios "bonitos") */
export function roundPrice(value: number, step = 5) {
  if (!isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / step) * step;
}

export function marginPct(price: number, cost: number) {
  if (!price) return 0;
  return ((price - cost) / price) * 100;
}
