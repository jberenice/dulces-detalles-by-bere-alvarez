import type { Dessert, Ingredient, Order } from "./types";

export type Need = {
  ingredient: Ingredient;
  need: number;
  stock: number;
  toBuy: number;
  packages: number;
  cost: number;
  usedIn: Set<string>;
};

export type DayPlan = { date: string; orders: number; items: { name: string; qty: number; unit: string }[] };

/** Cantidad legible: 2500 g → 2.5 kg, 1500 ml → 1.5 L */
export function fmtQty(value: number, unit: string) {
  const u = unit.toLowerCase();
  const n = (v: number, d = 2) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: d }).format(v);
  if (u === "g" && Math.abs(value) >= 1000) return `${n(value / 1000)} kg`;
  if (u === "ml" && Math.abs(value) >= 1000) return `${n(value / 1000)} L`;
  if (u === "pz") return `${n(Math.ceil(value - 1e-9), 0)} pz`;
  return `${n(value, value < 10 ? 2 : 0)} ${unit}`;
}

/**
 * Calcula qué hornear cada día y qué ingredientes comprar:
 * cada partida del pedido se divide entre el rendimiento de la receta.
 */
export function computeProduction(orders: Order[], desserts: Dessert[], ingredientsById: Map<string, Ingredient>, useStock: boolean) {
  const byId = new Map(desserts.map((d) => [d.id, d]));
  const needs = new Map<string, Need>();
  const days = new Map<string, Map<string, { name: string; qty: number; unit: string }>>();
  const ordersPerDay = new Map<string, number>();
  const noRecipe = new Map<string, number>();
  let pieces = 0;

  for (const o of orders) {
    const day = o.delivery_date ?? "sin-fecha";
    ordersPerDay.set(day, (ordersPerDay.get(day) ?? 0) + 1);
    for (const it of o.order_items ?? []) {
      const qty = Number(it.quantity) || 0;
      pieces += qty;
      const d = it.dessert_id ? byId.get(it.dessert_id) : undefined;
      const dayMap = days.get(day) ?? new Map();
      const key = d?.id ?? `libre:${it.description}`;
      const prev = dayMap.get(key) ?? { name: d?.name ?? it.description, qty: 0, unit: d?.unit_label ?? "pz" };
      prev.qty += qty;
      dayMap.set(key, prev);
      days.set(day, dayMap);

      if (!d || !(d.dessert_items ?? []).length) {
        noRecipe.set(it.description, (noRecipe.get(it.description) ?? 0) + qty);
        continue;
      }
      const batches = qty / (Number(d.yield_units) || 1);
      for (const di of d.dessert_items ?? []) {
        const ing = ingredientsById.get(di.ingredient_id);
        if (!ing) continue;
        const n = needs.get(ing.id) ?? { ingredient: ing, need: 0, stock: 0, toBuy: 0, packages: 0, cost: 0, usedIn: new Set<string>() };
        n.need += Number(di.quantity) * batches;
        n.usedIn.add(d.name);
        needs.set(ing.id, n);
      }
    }
  }

  for (const n of needs.values()) {
    n.stock = useStock ? Math.max(Number(n.ingredient.stock) || 0, 0) : 0;
    n.toBuy = Math.max(n.need - n.stock, 0);
    const pkg = Number(n.ingredient.package_qty) || 1;
    n.packages = n.toBuy > 0 ? Math.ceil(n.toBuy / pkg - 1e-9) : 0;
    n.cost = n.packages * (Number(n.ingredient.package_price) || 0);
  }

  const list = [...needs.values()].sort((a, b) => a.ingredient.kind.localeCompare(b.ingredient.kind) || a.ingredient.name.localeCompare(b.ingredient.name));
  const plan: DayPlan[] = [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, m]) => ({ date, orders: ordersPerDay.get(date) ?? 0, items: [...m.values()].sort((a, b) => b.qty - a.qty) }));

  return {
    needs: list,
    plan,
    pieces,
    noRecipe: [...noRecipe.entries()].map(([name, qty]) => ({ name, qty })),
    totalCost: list.reduce((a, n) => a + n.cost, 0),
  };
}
