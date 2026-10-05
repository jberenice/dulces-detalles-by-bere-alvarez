"use client";
import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Trash2, Wheat, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput, matches } from "@/components/ui/SearchInput";
import { useConfirm } from "@/components/ui/Confirm";
import { UNITS } from "@/lib/constants";
import { money, num, date } from "@/lib/format";
import type { Ingredient, IngredientKind } from "@/lib/types";

const empty = (kind: IngredientKind) => ({
  id: "",
  kind,
  name: "",
  unit: kind === "empaque" ? "pz" : "g",
  package_qty: 1000 as number | string,
  package_price: 0 as number | string,
  supplier: "",
  stock: 0 as number | string,
  min_stock: 0 as number | string,
});

export default function IngredientsPage() {
  const sb = createClient();
  const confirm = useConfirm();
  const [kind, setKind] = useState<IngredientKind>("ingrediente");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<ReturnType<typeof empty> | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    const [ings, items] = await Promise.all([
      sb.from("ingredients").select("*").order("name"),
      sb.from("dessert_items").select("ingredient_id"),
    ]);
    const usage = new Map<string, number>();
    for (const it of must(items) as { ingredient_id: string }[]) usage.set(it.ingredient_id, (usage.get(it.ingredient_id) ?? 0) + 1);
    return { ingredients: must(ings) as Ingredient[], usage };
  });

  const list = useMemo(
    () => (data?.ingredients ?? []).filter((i) => i.kind === kind && matches(q, i.name, i.supplier)),
    [data, kind, q],
  );
  const counts = {
    ingrediente: data?.ingredients.filter((i) => i.kind === "ingrediente").length ?? 0,
    empaque: data?.ingredients.filter((i) => i.kind === "empaque").length ?? 0,
  };

  async function save() {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Escribe el nombre");
    const qty = Number(form.package_qty);
    if (!(qty > 0)) return toast.error("La cantidad del paquete debe ser mayor a 0");
    setSaving(true);
    const payload = {
      kind: form.kind,
      name: form.name.trim(),
      unit: form.unit,
      package_qty: qty,
      package_price: Number(form.package_price) || 0,
      supplier: form.supplier || null,
      stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 0,
    };
    const res = form.id ? await sb.from("ingredients").update(payload).eq("id", form.id) : await sb.from("ingredients").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(form.id ? "Actualizado — tus recetas ya usan el nuevo precio" : "Agregado");
    setForm(null);
    reload();
  }

  async function remove(i: Ingredient) {
    const used = data?.usage.get(i.id) ?? 0;
    if (used) return toast.error(`No se puede eliminar: se usa en ${used} receta(s)`);
    if (!(await confirm({ title: `¿Eliminar ${i.name}?`, confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("ingredients").delete().eq("id", i.id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    reload();
  }

  const unitCost = form ? (Number(form.package_price) || 0) / (Number(form.package_qty) || 1) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Tu despensa"
        title="Ingredientes y empaques"
        subtitle="Registra lo que compras y cuánto te cuesta. El costo por unidad se calcula solo y se refleja al instante en todas tus recetas."
        actions={
          <Button onClick={() => setForm(empty(kind))}>
            <Plus className="h-4 w-4" /> Agregar {kind === "empaque" ? "empaque" : "ingrediente"}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={kind}
          onChange={setKind}
          options={[
            { value: "ingrediente", label: <><Wheat className="h-4 w-4" /> Ingredientes</>, count: counts.ingrediente },
            { value: "empaque", label: <><Package className="h-4 w-4" /> Empaques</>, count: counts.empaque },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre o proveedor" className="sm:w-80" />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={kind === "empaque" ? <Package className="h-8 w-8" /> : <Wheat className="h-8 w-8" />}
            title={q ? "Sin resultados" : `Aún no tienes ${kind === "empaque" ? "empaques" : "ingredientes"}`}
            description="Agrega cómo lo compras (ej. 1 kg de harina a $31) y calculamos el costo por gramo."
            action={<Button onClick={() => setForm(empty(kind))}><Plus className="h-4 w-4" /> Agregar</Button>}
          />
        ) : (
          <>
            {/* Tabla escritorio */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Presentación</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Costo por unidad</th>
                    <th>Uso</th>
                    <th>Actualizado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <p className="font-semibold text-cocoa-700">{i.name}</p>
                        {i.supplier && <p className="text-xs text-cocoa-400">{i.supplier}</p>}
                      </td>
                      <td className="text-cocoa-500">{num(i.package_qty)} {i.unit}</td>
                      <td className="text-right tabular-nums">{money(i.package_price)}</td>
                      <td className="text-right font-semibold text-cocoa-700 tabular-nums">
                        ${num(i.unit_cost, i.unit_cost < 1 ? 4 : 2)}
                        <span className="text-xs font-normal text-cocoa-400"> / {i.unit}</span>
                      </td>
                      <td>
                        {data?.usage.get(i.id) ? <Badge tone="mint">{data.usage.get(i.id)} recetas</Badge> : <span className="text-xs text-cocoa-300">Sin uso</span>}
                        {i.min_stock > 0 && i.stock <= i.min_stock && (
                          <Badge tone="warning" className="ml-1"><AlertTriangle className="h-3 w-3" /> Stock bajo</Badge>
                        )}
                      </td>
                      <td className="text-xs text-cocoa-400">{date(i.updated_at)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setForm({ ...i, supplier: i.supplier ?? "" })} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(i)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Lista móvil */}
            <ul className="divide-y divide-cocoa-800/5 md:hidden">
              {list.map((i) => (
                <li key={i.id}>
                  <button className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" onClick={() => setForm({ ...i, supplier: i.supplier ?? "" })}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-cocoa-700">{i.name}</p>
                      <p className="text-xs text-cocoa-400">{num(i.package_qty)} {i.unit} · {money(i.package_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">${num(i.unit_cost, 3)}</p>
                      <p className="text-[11px] text-cocoa-400">por {i.unit}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Editar" : form?.kind === "empaque" ? "Nuevo empaque" : "Nuevo ingrediente"}
        description="Escribe la presentación en la que lo compras."
        footer={
          <>
            {form?.id && (
              <Button variant="danger" className="sm:mr-auto" onClick={() => { const i = data?.ingredients.find((x) => x.id === form.id); setForm(null); if (i) remove(i); }}>
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            )}
            <Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={save} loading={saving}>Guardar</Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.kind === "empaque" ? "Caja para 4 cupcakes" : "Harina de trigo"} autoFocus />
            <Select label="Tipo" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as IngredientKind })}>
              <option value="ingrediente">Ingrediente</option>
              <option value="empaque">Empaque / decoración</option>
            </Select>
            <Select label="Unidad de medida" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </Select>
            <Input label="Cantidad del paquete" type="number" step="any" min={0} value={form.package_qty} onChange={(e) => setForm({ ...form, package_qty: e.target.value })} suffix={form.unit} hint="Ej. 1 kg = 1000 g" />
            <Input label="Precio del paquete" type="number" step="any" min={0} value={form.package_price} onChange={(e) => setForm({ ...form, package_price: e.target.value })} prefix="$" />
            <div className="rounded-2xl bg-mint-50 px-4 py-3 sm:col-span-2">
              <p className="text-xs font-bold tracking-wider text-mint-600 uppercase">Costo por {form.unit}</p>
              <p className="font-display text-2xl font-semibold text-cocoa-700">${num(unitCost, 4)}</p>
            </div>
            <Input label="Proveedor (opcional)" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Costco, Sam's…" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Existencia" type="number" step="any" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              <Input label="Mínimo" type="number" step="any" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
