"use client";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeCost, type CostBreakdown } from "@/lib/costing";
import { useBusiness } from "@/components/layout/BusinessProvider";
import type { Dessert, Extra, FixedCost, FlavorGroup, Ingredient, Package } from "@/lib/types";
import { must, useAsync } from "./useAsync";

/** Carga ingredientes, gastos fijos y postres (con receta) y calcula el costo de cada postre. */
export function useCatalog() {
  const { profile } = useBusiness();
  const q = useAsync(async () => {
    const sb = createClient();
    const [ingredients, fixed, desserts, packages, groups, extras] = await Promise.all([
      sb.from("ingredients").select("*").order("name"),
      sb.from("fixed_costs").select("*").order("created_at"),
      sb.from("desserts").select("*, dessert_items(*)").order("category").order("name"),
      sb.from("packages").select("*").order("position").order("name"),
      sb.from("flavor_groups").select("id, name, position").order("position").order("name"),
      sb.from("extras").select("*").order("position").order("name"),
    ]);
    return {
      ingredients: must(ingredients) as Ingredient[],
      fixed: must(fixed) as FixedCost[],
      desserts: must(desserts) as Dessert[],
      // Si aún no se ejecuta la migración 0013, simplemente no hay paquetes
      packages: (packages.error ? [] : packages.data ?? []) as Package[],
      // Categorías de cupcakes (migración 0015)
      groups: (groups.error ? [] : groups.data ?? []) as FlavorGroup[],
      // Catálogo de extras (migración 0017)
      extras: (extras.error ? [] : extras.data ?? []) as Extra[],
    };
  });

  const ingredientsById = useMemo(() => new Map((q.data?.ingredients ?? []).map((i) => [i.id, i])), [q.data]);

  const costs = useMemo(() => {
    const m = new Map<string, CostBreakdown>();
    if (!q.data) return m;
    for (const d of q.data.desserts) {
      m.set(d.id, computeCost(d, d.dessert_items ?? [], ingredientsById, q.data.fixed, profile));
    }
    return m;
  }, [q.data, ingredientsById, profile]);

  return { ...q, ingredientsById, costs, profile };
}
