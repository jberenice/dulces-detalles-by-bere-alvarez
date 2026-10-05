"use client";
import { useMemo } from "react";
import { ShieldAlert, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { ALLERGENS, detectAllergens, ingredientsText } from "@/lib/allergens";
import { cn } from "@/lib/cn";
import type { Dessert, Season } from "@/lib/types";

type Patch = Partial<Pick<Dessert, "allergens" | "may_contain" | "ingredients_label" | "shelf_life_days" | "storage_note" | "season_id">>;

/** Ficha del postre: alérgenos, ingredientes para la etiqueta, caducidad, conservación y temporada */
export function DessertLabelEditor({
  value,
  recipe,
  onChange,
}: {
  value: Patch;
  /** Ingredientes de la receta (sin empaques) para generar la lista y detectar alérgenos */
  recipe: { name: string; quantity: number; unit: string }[];
  onChange: (p: Patch) => void;
}) {
  const sb = createClient();
  const seasonsQ = useAsync(async () => must(await sb.from("seasons").select("*").order("start_date")) as Season[]);
  const allergens = value.allergens ?? [];
  const may = value.may_contain ?? [];
  const detected = useMemo(() => detectAllergens(recipe.map((r) => r.name)), [recipe]);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <Card>
      <CardHeader
        title="Ficha del postre"
        subtitle="Alérgenos, ingredientes y caducidad: salen en tu tienda y en las etiquetas que imprimes."
        icon={<ShieldAlert className="h-5 w-5" />}
      />
      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <span className="label !mb-0">Contiene</span>
            {detected.some((d) => !allergens.includes(d)) && (
              <button type="button" onClick={() => onChange({ allergens: [...new Set([...allergens, ...detected])] })} className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600">
                <Wand2 className="h-3.5 w-3.5" /> Detectar desde la receta
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange({ allergens: toggle(allergens, a.id), may_contain: may.filter((x) => x !== a.id) })}
                className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold transition", allergens.includes(a.id) ? "border-rose-400 bg-rose-50 text-rose-600" : "border-cocoa-800/10 bg-white text-cocoa-500 hover:border-rose-200")}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">Puede contener trazas de</span>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.filter((a) => !allergens.includes(a.id)).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange({ may_contain: toggle(may, a.id) })}
                className={cn("rounded-full border-2 px-3 py-1 text-xs font-bold transition", may.includes(a.id) ? "border-amber-400 bg-amber-50 text-amber-700" : "border-cocoa-800/10 bg-white text-cocoa-400 hover:border-amber-200")}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <span className="label !mb-0">Ingredientes (para la etiqueta)</span>
            {recipe.length > 0 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ ingredients_label: ingredientsText(recipe) })}>
                <Wand2 className="h-4 w-4" /> Generar desde la receta
              </Button>
            )}
          </div>
          <Textarea
            className="mt-1.5"
            rows={3}
            maxLength={1500}
            value={value.ingredients_label ?? ""}
            onChange={(e) => onChange({ ingredients_label: e.target.value || null })}
            placeholder="Harina de trigo, azúcar, huevo, mantequilla, leche, vainilla."
            hint="De mayor a menor cantidad. Revísala y ajusta los nombres si hace falta."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Consumir en (días)"
            type="number"
            min={0}
            max={365}
            placeholder="Ej. 3"
            value={value.shelf_life_days ?? ""}
            onChange={(e) => onChange({ shelf_life_days: e.target.value === "" ? null : Math.min(365, Math.max(0, Math.round(Number(e.target.value)))) })}
            hint="Desde que lo preparas"
          />
          <Select label="Conservación" value={value.storage_note ?? ""} onChange={(e) => onChange({ storage_note: e.target.value || null })} className="sm:col-span-2">
            <option value="">Sin indicación</option>
            <option value="Mantener en refrigeración">Mantener en refrigeración</option>
            <option value="Mantener en refrigeración (2 a 6 °C)">Mantener en refrigeración (2 a 6 °C)</option>
            <option value="Conservar en lugar fresco y seco">Conservar en lugar fresco y seco</option>
            <option value="Conservar en congelación">Conservar en congelación</option>
            <option value="Consumir el mismo día">Consumir el mismo día</option>
          </Select>
        </div>
        <Select
          label="Temporada"
          value={value.season_id ?? ""}
          onChange={(e) => onChange({ season_id: e.target.value || null })}
          hint="Si lo eliges, en tu tienda solo se ve durante esas fechas. Crea temporadas en “Temporadas y cupones”."
        >
          <option value="">Todo el año</option>
          {(seasonsQ.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ""}{s.name}</option>
          ))}
        </Select>
      </div>
    </Card>
  );
}
