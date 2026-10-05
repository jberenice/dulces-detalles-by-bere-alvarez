"use client";
import { CalendarClock, Images, ListPlus, Plus, Store, Trash2, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Toggle } from "@/components/ui/Field";
import { ImagePicker } from "@/components/ui/ImagePicker";
import type { VariantGroup } from "@/lib/types";

const PRESETS: { name: string; options: string[] }[] = [
  { name: "Tamaño", options: ["10 personas", "20 personas", "30 personas"] },
  { name: "Sabor", options: ["Vainilla", "Chocolate", "Red velvet"] },
  { name: "Relleno", options: ["Cajeta", "Nutella", "Frutos rojos"] },
  { name: "Decoración", options: ["Sencilla", "Con flores", "Personalizada"] },
];

const MAX_GALLERY = 7;

/** Variantes (tamaños, sabores, rellenos), galería y anticipación de un postre en la tienda */
export function StoreOptionsEditor({
  variants,
  gallery,
  minNotice,
  storeMinNotice,
  onChange,
}: {
  variants: VariantGroup[];
  gallery: string[];
  minNotice: number | null;
  storeMinNotice: number;
  onChange: (patch: { variants?: VariantGroup[]; gallery?: string[]; min_notice_days?: number | null }) => void;
}) {
  const setGroup = (i: number, patch: Partial<VariantGroup>) => onChange({ variants: variants.map((g, j) => (j === i ? { ...g, ...patch } : g)) });
  const usedNames = new Set(variants.map((g) => g.name.toLowerCase()));

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="En tu tienda en línea"
        subtitle="Opciones que tu cliente elige al pedir, más fotos y anticipación"
        icon={<Store className="h-5 w-5" />}
      />
      <div className="space-y-7 p-4 sm:p-6">
        {/* Variantes */}
        <section>
          <h4 className="flex items-center gap-2 text-sm font-bold text-cocoa-700">
            <ListPlus className="h-4 w-4 text-rose-400" /> Variantes con precio
          </h4>
          <p className="mt-0.5 text-xs text-cocoa-400">
            El precio de venta es la base; cada opción puede sumar un extra. Ej. Tamaño 20 personas +$250, Relleno de Nutella +$40.
          </p>
          <div className="mt-3 space-y-3">
            {variants.map((g, i) => (
              <div key={i} className="rounded-2xl border border-cocoa-800/8 bg-cream-50 p-3 sm:p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Input className="min-w-[160px] flex-1" label="Grupo" value={g.name} maxLength={40} onChange={(e) => setGroup(i, { name: e.target.value })} placeholder="Tamaño, Sabor, Relleno…" />
                  <Toggle className="pb-2.5" checked={g.required} onChange={(v) => setGroup(i, { required: v })} label="Obligatorio" />
                  <Button size="icon" variant="ghost" onClick={() => onChange({ variants: variants.filter((_, j) => j !== i) })} aria-label="Quitar grupo">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {g.options.map((o, k) => (
                    <div key={k} className="grid grid-cols-[1fr_120px_36px] items-center gap-2">
                      <input
                        className="field py-2"
                        value={o.name}
                        maxLength={60}
                        placeholder="Opción"
                        onChange={(e) => setGroup(i, { options: g.options.map((x, j) => (j === k ? { ...x, name: e.target.value } : x)) })}
                      />
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-cocoa-400">+$</span>
                        <input
                          className="field py-2 pl-8"
                          type="number"
                          min={0}
                          step="any"
                          value={o.price}
                          onChange={(e) => setGroup(i, { options: g.options.map((x, j) => (j === k ? { ...x, price: e.target.value as unknown as number } : x)) })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setGroup(i, { options: g.options.filter((_, j) => j !== k) })}
                        className="grid h-9 w-9 place-items-center rounded-xl text-cocoa-300 hover:bg-rose-50 hover:text-rose-500"
                        aria-label="Quitar opción"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {g.options.length < 20 && (
                    <button type="button" onClick={() => setGroup(i, { options: [...g.options, { name: "", price: 0 }] })} className="flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:text-rose-600">
                      <Plus className="h-4 w-4" /> Agregar opción
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {variants.length < 6 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.filter((p) => !usedNames.has(p.name.toLowerCase())).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => onChange({ variants: [...variants, { name: p.name, required: p.name === "Tamaño" || p.name === "Sabor", options: p.options.map((name) => ({ name, price: 0 })) }] })}
                  className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                >
                  <Plus className="h-3.5 w-3.5" /> {p.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onChange({ variants: [...variants, { name: "", required: false, options: [{ name: "", price: 0 }] }] })}
                className="flex items-center gap-1 rounded-full bg-cream-200 px-3 py-1.5 text-xs font-bold text-cocoa-500 hover:bg-cream-300"
              >
                <Plus className="h-3.5 w-3.5" /> Otro grupo
              </button>
            </div>
          )}
        </section>

        {/* Galería */}
        <section>
          <h4 className="flex items-center gap-2 text-sm font-bold text-cocoa-700">
            <Images className="h-4 w-4 text-rose-400" /> Más fotos ({gallery.length}/{MAX_GALLERY})
          </h4>
          <p className="mt-0.5 text-xs text-cocoa-400">Se muestran en el detalle del postre, después de la foto principal.</p>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {gallery.map((url, i) => (
              <ImagePicker
                key={url + i}
                value={url}
                folder="postres"
                aspect="aspect-square"
                label=""
                onChange={(v) => onChange({ gallery: v ? gallery.map((x, j) => (j === i ? v : x)) : gallery.filter((_, j) => j !== i) })}
              />
            ))}
            {gallery.length < MAX_GALLERY && (
              <ImagePicker key={`new-${gallery.length}`} value={null} folder="postres" aspect="aspect-square" label="Agregar" onChange={(v) => v && onChange({ gallery: [...gallery, v] })} />
            )}
          </div>
        </section>

        {/* Anticipación */}
        <section>
          <h4 className="flex items-center gap-2 text-sm font-bold text-cocoa-700">
            <CalendarClock className="h-4 w-4 text-rose-400" /> Anticipación para este postre
          </h4>
          <div className="mt-2 grid items-end gap-3 sm:grid-cols-[180px_1fr]">
            <Input
              type="number"
              min={0}
              max={90}
              suffix="días"
              value={minNotice ?? ""}
              placeholder={String(storeMinNotice)}
              onChange={(e) => onChange({ min_notice_days: e.target.value === "" ? null : Math.max(0, Math.min(90, Math.round(Number(e.target.value)))) })}
            />
            <p className="pb-2 text-xs text-cocoa-400">
              Para postres que necesitan más tiempo que el resto (tu tienda pide {storeMinNotice} día{storeMinNotice === 1 ? "" : "s"}), como pasteles personalizados. Vacío = lo mismo que tu tienda.
            </p>
          </div>
        </section>
      </div>
    </Card>
  );
}

/** Limpia variantes antes de guardar: sin grupos u opciones vacías y precios numéricos */
export function cleanVariants(v: VariantGroup[] | undefined): VariantGroup[] {
  const groups = new Set<string>();
  return (v ?? [])
    .map((g) => {
      const seen = new Set<string>();
      return {
        name: g.name.trim(),
        required: !!g.required,
        options: g.options
          .map((o) => ({ name: o.name.trim(), price: Math.max(0, Number(o.price) || 0) }))
          .filter((o) => o.name && !seen.has(o.name.toLowerCase()) && seen.add(o.name.toLowerCase())),
      };
    })
    .filter((g) => g.name && g.options.length && !groups.has(g.name.toLowerCase()) && groups.add(g.name.toLowerCase()));
}
