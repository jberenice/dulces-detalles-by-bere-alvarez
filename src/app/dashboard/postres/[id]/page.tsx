"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CakeSlice, GripVertical, Package, Plus, Save, Sparkles, Trash2, Wand2, Layers } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCatalog } from "@/hooks/useCatalog";
import { useConfirm } from "@/components/ui/Confirm";
import { Card, CardHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { StoreOptionsEditor, cleanVariants } from "@/components/dashboard/StoreOptionsEditor";
import { Modal } from "@/components/ui/Modal";
import { CATEGORIES, UNITS } from "@/lib/constants";
import { computeCost, marginPct, roundPrice } from "@/lib/costing";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Dessert, Ingredient, IngredientKind } from "@/lib/types";

type Row = { key: string; ingredient_id: string; section: string; quantity: number | string };
type Form = Omit<Dessert, "id" | "created_at" | "dessert_items">;

const newKey = () => Math.random().toString(36).slice(2);

export default function DessertEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "nuevo";
  const router = useRouter();
  const confirm = useConfirm();
  const sb = createClient();
  const { data, loading, ingredientsById, profile, setData } = useCatalog();

  const [form, setForm] = useState<Form | null>(null);
  const [sections, setSections] = useState<string[]>(["Ingredientes"]);
  const [rows, setRows] = useState<Row[]>([]);
  const [packRows, setPackRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState<{ name: string; kind: IngredientKind; unit: string; package_qty: string; package_price: string; target: { list: "rows" | "pack"; key: string } } | null>(null);

  // Cargar datos
  useEffect(() => {
    if (!data || form) return;
    if (isNew) {
      setForm({
        name: "",
        category: "Pasteles",
        description: "",
        image_url: null,
        yield_units: 1,
        unit_label: "pieza",
        labor_hours: 1,
        profit_pct: profile.default_profit_pct,
        wear_pct: profile.default_wear_pct,
        shipping: 0,
        apply_iva: false,
        apply_card_fee: false,
        sale_price: null,
        store_visible: false,
        active: true,
        variants: [],
        gallery: [],
        min_notice_days: null,
      });
      setRows([{ key: newKey(), ingredient_id: "", section: "Ingredientes", quantity: "" }]);
      return;
    }
    const d = data.desserts.find((x) => x.id === id);
    if (!d) {
      toast.error("No encontramos ese postre");
      router.replace("/dashboard/postres");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _i, created_at, dessert_items, ...rest } = d;
    setForm(rest);
    const items = [...(dessert_items ?? [])].sort((a, b) => a.position - b.position);
    const ing = items.filter((it) => ingredientsById.get(it.ingredient_id)?.kind !== "empaque");
    const pk = items.filter((it) => ingredientsById.get(it.ingredient_id)?.kind === "empaque");
    const secs = [...new Set(ing.map((it) => it.section?.trim() || "Ingredientes"))];
    setSections(secs.length ? secs : ["Ingredientes"]);
    setRows(ing.map((it) => ({ key: newKey(), ingredient_id: it.ingredient_id, section: it.section?.trim() || "Ingredientes", quantity: it.quantity })));
    setPackRows(pk.map((it) => ({ key: newKey(), ingredient_id: it.ingredient_id, section: "", quantity: it.quantity })));
  }, [data, form, id, isNew, ingredientsById, profile, router]);

  const ingOptions = useMemo(
    () => (data?.ingredients ?? []).filter((i) => i.kind === "ingrediente").map((i) => ({ value: i.id, label: i.name, hint: `$${num(i.unit_cost, 3)}/${i.unit}` })),
    [data],
  );
  const packOptions = useMemo(
    () => (data?.ingredients ?? []).filter((i) => i.kind === "empaque").map((i) => ({ value: i.id, label: i.name, hint: `$${num(i.unit_cost, 2)}/${i.unit}` })),
    [data],
  );

  const cost = useMemo(() => {
    if (!form || !data) return null;
    const items = [...rows, ...packRows]
      .filter((r) => r.ingredient_id)
      .map((r) => ({ ingredient_id: r.ingredient_id, quantity: Number(r.quantity) || 0, section: r.section }));
    return computeCost(form, items, ingredientsById, data.fixed, profile);
  }, [form, rows, packRows, ingredientsById, data, profile]);

  if (loading || !form || !cost)
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-[600px]" />
        <Skeleton className="h-[480px]" />
      </div>
    );

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  const suggested = roundPrice(cost.unitPrice, cost.unitPrice < 100 ? 5 : 10);
  const price = form.sale_price ?? suggested;
  const margin = marginPct(price, cost.unitCost);

  function updateRow(list: "rows" | "pack", key: string, patch: Partial<Row>) {
    const setter = list === "rows" ? setRows : setPackRows;
    setter((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function createIngredient() {
    if (!creating) return;
    const qty = Number(creating.package_qty);
    if (!creating.name.trim() || !(qty > 0)) return toast.error("Completa nombre y cantidad");
    const { data: ing, error } = await sb
      .from("ingredients")
      .insert({ kind: creating.kind, name: creating.name.trim(), unit: creating.unit, package_qty: qty, package_price: Number(creating.package_price) || 0 })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setData((d) => (d ? { ...d, ingredients: [...d.ingredients, ing as Ingredient] } : d));
    updateRow(creating.target.list, creating.target.key, { ingredient_id: ing.id });
    setCreating(null);
    toast.success(`${ing.name} agregado a tu despensa`);
  }

  async function save() {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Ponle nombre a tu postre");
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        yield_units: Number(form.yield_units) || 1,
        labor_hours: Number(form.labor_hours) || 0,
        profit_pct: Number(form.profit_pct) || 0,
        wear_pct: Number(form.wear_pct) || 0,
        shipping: Number(form.shipping) || 0,
        sale_price: form.sale_price === null || (form.sale_price as unknown) === "" ? null : Number(form.sale_price),
        variants: cleanVariants(form.variants),
        gallery: (form.gallery ?? []).slice(0, 7),
      };
      if (payload.store_visible && payload.sale_price === null) payload.sale_price = suggested;
      let dessertId = id;
      if (isNew) {
        const { data: created, error } = await sb.from("desserts").insert(payload).select().single();
        if (error) throw error;
        dessertId = created.id;
      } else {
        const { error } = await sb.from("desserts").update(payload).eq("id", id);
        if (error) throw error;
        const { error: delErr } = await sb.from("dessert_items").delete().eq("dessert_id", id);
        if (delErr) throw delErr;
      }
      const ordered = [
        ...sections.flatMap((s) => rows.filter((r) => r.section === s)),
        ...packRows,
      ].filter((r) => r.ingredient_id && Number(r.quantity) > 0);
      if (ordered.length) {
        const { error } = await sb.from("dessert_items").insert(
          ordered.map((r, i) => ({
            dessert_id: dessertId,
            ingredient_id: r.ingredient_id,
            section: ingredientsById.get(r.ingredient_id)?.kind === "empaque" ? null : r.section || null,
            quantity: Number(r.quantity),
            position: i,
          })),
        );
        if (error) throw error;
      }
      toast.success("Receta guardada");
      router.replace("/dashboard/postres");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!(await confirm({ title: "¿Eliminar este postre?", message: "Se borrará la receta. Los pedidos y cotizaciones anteriores se conservan.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("desserts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Postre eliminado");
    router.replace("/dashboard/postres");
  }

  const renderRow = (r: Row, list: "rows" | "pack") => {
    const ing = ingredientsById.get(r.ingredient_id);
    const lineCost = ing ? ing.unit_cost * (Number(r.quantity) || 0) : 0;
    return (
      <div key={r.key} className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[18px_1fr_130px_100px_36px]">
        <GripVertical className="hidden h-4 w-4 text-cocoa-200 sm:block" />
        <Combobox
          className="col-span-2 sm:col-span-1"
          value={r.ingredient_id || null}
          onChange={(v) => updateRow(list, r.key, { ingredient_id: v })}
          options={list === "rows" ? ingOptions : packOptions}
          placeholder={list === "rows" ? "Busca un ingrediente" : "Busca un empaque"}
          onCreate={(text) =>
            setCreating({
              name: text,
              kind: list === "rows" ? "ingrediente" : "empaque",
              unit: list === "rows" ? "g" : "pz",
              package_qty: list === "rows" ? "1000" : "1",
              package_price: "",
              target: { list, key: r.key },
            })
          }
          createLabel="Crear"
        />
        <div className="relative">
          <input
            className="field pr-11 text-right tabular-nums"
            type="number"
            step="any"
            min={0}
            placeholder="0"
            value={r.quantity}
            onChange={(e) => updateRow(list, r.key, { quantity: e.target.value })}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-cocoa-400">{ing?.unit ?? ""}</span>
        </div>
        <p className="text-right text-sm font-semibold text-cocoa-600 tabular-nums">{money(lineCost)}</p>
        <button
          type="button"
          onClick={() => (list === "rows" ? setRows : setPackRows)((rs) => rs.filter((x) => x.key !== r.key))}
          className="grid h-9 w-9 place-items-center rounded-xl text-cocoa-300 hover:bg-rose-50 hover:text-rose-500"
          aria-label="Quitar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const line = (label: string, value: number, opts: { strong?: boolean; tone?: string; note?: string } = {}) => (
    <div className={cn("flex items-baseline justify-between gap-3 py-1.5", opts.strong && "border-t border-dashed border-cocoa-800/10 pt-2.5")}>
      <span className={cn("text-sm", opts.strong ? "font-bold text-cocoa-700" : "text-cocoa-500")}>
        {label}
        {opts.note && <span className="ml-1 text-xs text-cocoa-300">{opts.note}</span>}
      </span>
      <span className={cn("tabular-nums", opts.strong ? "font-bold text-cocoa-800" : "font-semibold text-cocoa-600", opts.tone)}>{money(value)}</span>
    </div>
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/postres" className="inline-flex items-center gap-2 text-sm font-bold text-cocoa-400 hover:text-rose-500">
          <ArrowLeft className="h-4 w-4" /> Recetario
        </Link>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="danger" onClick={remove}>
              <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Eliminar</span>
            </Button>
          )}
          <Button onClick={save} loading={saving}>
            <Save className="h-4 w-4" /> Guardar receta
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Datos generales */}
          <Card className="p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-[220px_1fr]">
              <ImagePicker value={form.image_url} onChange={(v) => set("image_url", v)} folder="postres" label="Foto del postre" aspect="aspect-square" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input className="sm:col-span-2" label="Nombre del postre" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Pastel 3 leches con fresas" />
                <div>
                  <label className="label">Categoría</label>
                  <input className="field" list="cats" value={form.category} onChange={(e) => set("category", e.target.value)} />
                  <datalist id="cats">
                    {[...new Set([...CATEGORIES, ...(data?.desserts ?? []).map((d) => d.category)])].map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Rinde" type="number" min={1} step="any" value={form.yield_units} onChange={(e) => set("yield_units", e.target.value as unknown as number)} />
                  <Input label="Unidad" value={form.unit_label} onChange={(e) => set("unit_label", e.target.value)} placeholder="pieza" />
                </div>
                <Textarea className="sm:col-span-2" label="Descripción (se muestra en tu tienda y cotización)" rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Bizcocho húmedo bañado en tres leches, relleno de fresas naturales…" />
              </div>
            </div>
          </Card>

          {/* Ingredientes por sección */}
          <Card>
            <CardHeader
              title="Receta"
              subtitle="Agrega los ingredientes por sección (pan, relleno, cobertura…). Si no existe, créalo al vuelo."
              icon={<CakeSlice className="h-5 w-5" />}
            />
            <div className="space-y-6 p-5 sm:p-6">
              {sections.map((s, si) => {
                const sectionRows = rows.filter((r) => r.section === s);
                const sectionCost = sectionRows.reduce((a, r) => a + (ingredientsById.get(r.ingredient_id)?.unit_cost ?? 0) * (Number(r.quantity) || 0), 0);
                return (
                  <div key={si} className="rounded-3xl bg-cream-50 p-4 ring-1 ring-cocoa-800/5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-mint-500" />
                        <input
                          className="rounded-lg bg-transparent px-1 font-display text-lg font-semibold text-cocoa-700 outline-none focus:bg-white"
                          value={s}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSections(sections.map((x, i) => (i === si ? v : x)));
                            setRows(rows.map((r) => (r.section === s ? { ...r, section: v } : r)));
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-cocoa-500 tabular-nums">{money(sectionCost)}</span>
                        {sections.length > 1 && (
                          <button
                            onClick={() => {
                              setSections(sections.filter((_, i) => i !== si));
                              setRows(rows.filter((r) => r.section !== s));
                            }}
                            className="rounded-lg p-1 text-cocoa-300 hover:text-rose-500"
                            aria-label="Quitar sección"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="hidden grid-cols-[18px_1fr_130px_100px_36px] gap-2 px-0 pb-1 text-[10.5px] font-bold tracking-wider text-cocoa-300 uppercase sm:grid">
                      <span />
                      <span>Ingrediente</span>
                      <span className="text-right">Cantidad</span>
                      <span className="text-right">Costo</span>
                      <span />
                    </div>
                    <div className="space-y-2">{sectionRows.map((r) => renderRow(r, "rows"))}</div>
                    <button
                      onClick={() => setRows([...rows, { key: newKey(), ingredient_id: "", section: s, quantity: "" }])}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:text-rose-600"
                    >
                      <Plus className="h-4 w-4" /> Agregar ingrediente
                    </button>
                  </div>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const name = `Sección ${sections.length + 1}`;
                  setSections([...sections, name]);
                  setRows([...rows, { key: newKey(), ingredient_id: "", section: name, quantity: "" }]);
                }}
              >
                <Layers className="h-4 w-4" /> Nueva sección
              </Button>
            </div>
          </Card>

          {/* Empaque */}
          <Card>
            <CardHeader title="Empaque y presentación" subtitle="Cajas, capacillos, bases, listones, toppers…" icon={<Package className="h-5 w-5" />} />
            <div className="space-y-2 p-5 sm:p-6">
              {packRows.map((r) => renderRow(r, "pack"))}
              <button
                onClick={() => setPackRows([...packRows, { key: newKey(), ingredient_id: "", section: "", quantity: 1 }])}
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:text-rose-600"
              >
                <Plus className="h-4 w-4" /> Agregar empaque
              </button>
            </div>
          </Card>

          {/* Parámetros */}
          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Parámetros de costeo</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Horas de trabajo" type="number" min={0} step="0.25" value={form.labor_hours} onChange={(e) => set("labor_hours", e.target.value as unknown as number)} suffix="h" hint={`${money(cost.fixedPerHour)} / hora`} />
              <Input label="% Ganancia" type="number" min={0} step="1" value={form.profit_pct} onChange={(e) => set("profit_pct", e.target.value as unknown as number)} suffix="%" />
              <Input label="% Desgaste maquinaria" type="number" min={0} step="0.5" value={form.wear_pct} onChange={(e) => set("wear_pct", e.target.value as unknown as number)} suffix="%" />
              <Input label="Envío" type="number" min={0} step="any" value={form.shipping} onChange={(e) => set("shipping", e.target.value as unknown as number)} prefix="$" />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Toggle checked={form.apply_iva} onChange={(v) => set("apply_iva", v)} label={`Incluir IVA (${profile.iva_pct}%)`} description="Si facturas o quieres el precio con IVA." />
              <Toggle checked={form.apply_card_fee} onChange={(v) => set("apply_card_fee", v)} label={`Comisión por tarjeta (${profile.card_fee_pct}%)`} description="Cubre la comisión de la terminal." />
            </div>
          </Card>

          {/* Tienda: variantes, galería y anticipación */}
          <StoreOptionsEditor
            variants={form.variants ?? []}
            gallery={form.gallery ?? []}
            minNotice={form.min_notice_days ?? null}
            storeMinNotice={profile.store_min_notice_days}
            onChange={(patch) => setForm({ ...form, ...patch })}
          />
        </div>

        {/* Resumen de costos */}
        <div className="space-y-4 lg:sticky lg:top-8">
          <Card className="overflow-hidden">
            <div className="sprinkles bg-cocoa-800 px-6 py-5 text-cream-100">
              <p className="text-xs font-bold tracking-[0.2em] text-mint-300 uppercase">Precio sugerido</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="font-display text-4xl font-semibold text-white tabular-nums">{money(cost.unitPrice)}</p>
                <p className="pb-1 text-sm text-cream-200/80">por {form.unit_label || "pieza"}</p>
              </div>
              {Number(form.yield_units) > 1 && <p className="mt-1 text-sm text-cream-200/70">Lote completo ({num(form.yield_units)}): {money(cost.total)}</p>}
            </div>
            <div className="px-6 py-4">
              <p className="mb-1 text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Resumen final</p>
              {line("Gastos fijos", cost.fixed, { note: `${num(form.labor_hours)} h` })}
              {cost.sections.length > 1
                ? cost.sections.map((s) => <div key={s.name}>{line(s.name, s.cost)}</div>)
                : line("Ingredientes", cost.variable)}
              {line("Desgaste de maquinaria", cost.wear, { note: `${num(form.wear_pct)}%` })}
              {line("Total costos", cost.totalCost, { strong: true })}
              {line("Ganancia", cost.profit, { tone: "text-mint-600", note: `${num(form.profit_pct)}%` })}
              {line("Empaquetado", cost.packaging)}
              {cost.shipping > 0 && line("Envío", cost.shipping)}
              {line("Subtotal", cost.subtotal, { strong: true })}
              {form.apply_iva && line("IVA", cost.iva, { note: `${num(profile.iva_pct)}%` })}
              {form.apply_card_fee && line("Comisión tarjeta", cost.cardFee, { note: `${num(profile.card_fee_pct)}%` })}
              {line("Precio de venta (lote)", cost.total, { strong: true, tone: "text-rose-500" })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Tu precio de venta</h3>
              <Sparkles className="h-5 w-5 text-rose-400" />
            </div>
            <p className="mt-1 text-sm text-cocoa-400">Se usa en cotizaciones, pedidos y tu tienda.</p>
            <div className="mt-4 flex gap-2">
              <Input
                className="flex-1"
                type="number"
                min={0}
                step="any"
                prefix="$"
                placeholder={String(suggested)}
                value={form.sale_price ?? ""}
                onChange={(e) => set("sale_price", e.target.value === "" ? null : (e.target.value as unknown as number))}
              />
              <Button variant="mint" onClick={() => set("sale_price", suggested)} title="Usar precio sugerido redondeado">
                <Wand2 className="h-4 w-4" /> {money(suggested).replace(".00", "")}
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-cream-100 p-3">
                <p className="text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Costo / {form.unit_label || "pieza"}</p>
                <p className="font-display text-xl font-semibold tabular-nums">{money(cost.unitCost)}</p>
              </div>
              <div className={cn("rounded-2xl p-3", margin >= 30 ? "bg-mint-50" : margin >= 15 ? "bg-amber-50" : "bg-rose-50")}>
                <p className="text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Margen real</p>
                <p className={cn("font-display text-xl font-semibold tabular-nums", margin >= 30 ? "text-mint-600" : margin >= 15 ? "text-amber-600" : "text-rose-600")}>
                  {num(margin, 1)}%
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-cocoa-800/5 pt-5">
              <Toggle checked={form.store_visible} onChange={(v) => set("store_visible", v)} label="Mostrar en mi tienda en línea" />
              <Toggle checked={form.active} onChange={(v) => set("active", v)} label="Postre activo" description="Desactívalo si ya no lo ofreces." />
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={!!creating}
        onClose={() => setCreating(null)}
        title={creating?.kind === "empaque" ? "Nuevo empaque" : "Nuevo ingrediente"}
        description="Se guarda en tu despensa y queda disponible para todas tus recetas."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(null)}>Cancelar</Button>
            <Button onClick={createIngredient}>Agregar</Button>
          </>
        }
      >
        {creating && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label="Nombre" value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} />
            <Select label="Unidad" value={creating.unit} onChange={(e) => setCreating({ ...creating, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </Select>
            <Input label="Cantidad del paquete" type="number" step="any" value={creating.package_qty} onChange={(e) => setCreating({ ...creating, package_qty: e.target.value })} suffix={creating.unit} />
            <Input className="sm:col-span-2" label="Precio del paquete" type="number" step="any" prefix="$" value={creating.package_price} onChange={(e) => setCreating({ ...creating, package_price: e.target.value })} autoFocus />
          </div>
        )}
      </Modal>
    </>
  );
}
