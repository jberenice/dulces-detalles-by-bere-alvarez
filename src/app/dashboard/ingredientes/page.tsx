"use client";
import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Trash2, Wheat, AlertTriangle, PackagePlus, History, Boxes } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Field";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { fmtQty } from "@/lib/production";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput, matches } from "@/components/ui/SearchInput";
import { useConfirm } from "@/components/ui/Confirm";
import { UNITS } from "@/lib/constants";
import { money, num, date } from "@/lib/format";
import type { Ingredient, IngredientKind, Profile } from "@/lib/types";

type StockForm = { ingredient: Ingredient; reason: "compra" | "ajuste" | "merma"; packages: string; amount: string; price: string; note: string };
type Movement = { id: string; quantity: number; reason: string; note: string | null; created_at: string; order_id: string | null };
const REASON_LABEL: Record<string, string> = { compra: "Compra", ajuste: "Ajuste", merma: "Merma", pedido_entregado: "Pedido entregado", pedido_revertido: "Pedido regresado" };

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

  const { profile, setProfile } = useBusiness();
  const inv = profile.inventory_enabled;
  const [lowOnly, setLowOnly] = useState(false);
  const [stock, setStock] = useState<StockForm | null>(null);
  const [history, setHistory] = useState<{ ingredient: Ingredient; rows: Movement[] | null } | null>(null);
  const isLow = (i: Ingredient) => i.min_stock > 0 && Number(i.stock) <= Number(i.min_stock);
  const lowCount = (data?.ingredients ?? []).filter(isLow).length;

  const list = useMemo(
    () => (data?.ingredients ?? []).filter((i) => (lowOnly ? isLow(i) : i.kind === kind) && matches(q, i.name, i.supplier)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, kind, q, lowOnly],
  );

  async function toggleInventory(v: boolean) {
    const { data: p, error } = await sb.from("profiles").update({ inventory_enabled: v }).eq("id", profile.id).select().single();
    if (error) return toast.error(error.message);
    setProfile(p as Profile);
    toast.success(v ? "Inventario activado: los pedidos entregados descontarán ingredientes" : "Inventario desactivado");
  }

  async function saveStock() {
    if (!stock) return;
    const i = stock.ingredient;
    const fromPackages = Number(stock.packages) * Number(i.package_qty);
    let delta = stock.reason === "compra" ? fromPackages || Number(stock.amount) : Number(stock.amount);
    if (!delta || !isFinite(delta)) return toast.error("Escribe una cantidad");
    if (stock.reason === "merma") delta = -Math.abs(delta);
    const { error } = await sb.rpc("adjust_stock", {
      p_ingredient: i.id,
      p_delta: delta,
      p_reason: stock.reason,
      p_note: stock.note || null,
      p_package_price: stock.reason === "compra" && stock.price ? Number(stock.price) : null,
    });
    if (error) return toast.error(error.message);
    toast.success(`${i.name}: ${delta > 0 ? "+" : ""}${fmtQty(delta, i.unit)}`);
    setStock(null);
    reload();
  }

  async function openHistory(i: Ingredient) {
    setHistory({ ingredient: i, rows: null });
    const { data: rows } = await sb.from("inventory_movements").select("id, quantity, reason, note, created_at, order_id").eq("ingredient_id", i.id).order("created_at", { ascending: false }).limit(50);
    setHistory({ ingredient: i, rows: (rows ?? []) as Movement[] });
  }
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

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <Toggle
          checked={inv}
          onChange={toggleInventory}
          label="Control de inventario"
          description="Lleva tus existencias: se descuentan solas al marcar un pedido como entregado."
        />
        {inv && lowCount > 0 && (
          <button onClick={() => setLowOnly(!lowOnly)} className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold ${lowOnly ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700"}`}>
            <AlertTriangle className="h-4 w-4" /> {lowCount} con stock bajo {lowOnly ? "· ver todo" : ""}
          </button>
        )}
      </Card>

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
                    <th>{inv ? "Existencia" : "Actualizado"}</th>
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
                      {inv ? (
                        <td>
                          <p className={`font-semibold tabular-nums ${Number(i.stock) < 0 ? "text-rose-600" : isLow(i) ? "text-amber-600" : "text-cocoa-700"}`}>{fmtQty(Number(i.stock), i.unit)}</p>
                          {i.min_stock > 0 && <p className="text-[11px] text-cocoa-400">mín. {fmtQty(Number(i.min_stock), i.unit)}</p>}
                        </td>
                      ) : (
                        <td className="text-xs text-cocoa-400">{date(i.updated_at)}</td>
                      )}
                      <td>
                        <div className="flex justify-end gap-1">
                          {inv && (
                            <>
                              <Button size="icon" variant="ghost" title="Registrar compra o ajuste" onClick={() => setStock({ ingredient: i, reason: "compra", packages: "1", amount: "", price: String(i.package_price), note: "" })} aria-label="Registrar compra"><PackagePlus className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" title="Historial" onClick={() => openHistory(i)} aria-label="Historial"><History className="h-4 w-4" /></Button>
                            </>
                          )}
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
                <li key={i.id} className="flex items-center">
                  <button className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3.5 pl-4 text-left" onClick={() => setForm({ ...i, supplier: i.supplier ?? "" })}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-cocoa-700">{i.name}</p>
                      <p className="text-xs text-cocoa-400">{num(i.package_qty)} {i.unit} · {money(i.package_price)}</p>
                      {inv && (
                        <p className={`text-xs font-semibold ${Number(i.stock) < 0 ? "text-rose-600" : isLow(i) ? "text-amber-600" : "text-mint-600"}`}>
                          Existencia: {fmtQty(Number(i.stock), i.unit)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">${num(i.unit_cost, 3)}</p>
                      <p className="text-[11px] text-cocoa-400">por {i.unit}</p>
                    </div>
                  </button>
                  {inv && (
                    <button onClick={() => setStock({ ingredient: i, reason: "compra", packages: "1", amount: "", price: String(i.package_price), note: "" })} className="grid h-12 w-12 shrink-0 place-items-center text-mint-600" aria-label="Registrar compra">
                      <PackagePlus className="h-5 w-5" />
                    </button>
                  )}
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
      {/* Compra / ajuste de existencias */}
      <Modal
        open={!!stock}
        onClose={() => setStock(null)}
        title={stock ? `Existencia · ${stock.ingredient.name}` : ""}
        description={stock ? `Tienes ${fmtQty(Number(stock.ingredient.stock), stock.ingredient.unit)}` : ""}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setStock(null)}>Cancelar</Button><Button variant="mint" onClick={saveStock}>Guardar</Button></>}
      >
        {stock && (
          <div className="space-y-4">
            <Tabs
              value={stock.reason}
              onChange={(v) => setStock({ ...stock, reason: v })}
              className="w-full"
              options={[
                { value: "compra", label: "Compra" },
                { value: "ajuste", label: "Ajuste" },
                { value: "merma", label: "Merma" },
              ]}
            />
            {stock.reason === "compra" ? (
              <>
                <Input label={`Paquetes de ${fmtQty(Number(stock.ingredient.package_qty), stock.ingredient.unit)}`} type="number" min={0} step="any" value={stock.packages} onChange={(e) => setStock({ ...stock, packages: e.target.value, amount: "" })} hint={`= ${fmtQty(Number(stock.packages || 0) * Number(stock.ingredient.package_qty), stock.ingredient.unit)}`} />
                <Input label="Precio por paquete (actualiza tus costos)" type="number" min={0} step="any" prefix="$" value={stock.price} onChange={(e) => setStock({ ...stock, price: e.target.value })} />
              </>
            ) : (
              <Input
                label={stock.reason === "merma" ? `Cantidad perdida (${stock.ingredient.unit})` : `Cantidad a sumar o restar (${stock.ingredient.unit})`}
                type="number"
                step="any"
                value={stock.amount}
                onChange={(e) => setStock({ ...stock, amount: e.target.value })}
                hint={stock.reason === "ajuste" ? "Usa números negativos para restar. Ej. -250" : "Producto caducado, roto o que se echó a perder"}
              />
            )}
            <Input label="Nota (opcional)" maxLength={300} value={stock.note} onChange={(e) => setStock({ ...stock, note: e.target.value })} placeholder="Costco, inventario físico…" />
          </div>
        )}
      </Modal>

      {/* Historial */}
      <Modal open={!!history} onClose={() => setHistory(null)} title={history ? `Historial · ${history.ingredient.name}` : ""} size="md">
        {!history?.rows ? (
          <Skeleton className="h-40" />
        ) : history.rows.length === 0 ? (
          <EmptyState icon={<Boxes className="h-8 w-8" />} title="Sin movimientos" description="Aquí verás compras, ajustes y lo que se descuenta con cada pedido entregado." />
        ) : (
          <ul className="divide-y divide-cocoa-800/5">
            {history.rows.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-cocoa-700">{REASON_LABEL[m.reason] ?? m.reason}</p>
                  <p className="truncate text-xs text-cocoa-400">{date(m.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{m.note ? ` · ${m.note}` : ""}</p>
                </div>
                <span className={`font-semibold tabular-nums ${Number(m.quantity) < 0 ? "text-rose-600" : "text-mint-600"}`}>
                  {Number(m.quantity) > 0 ? "+" : ""}{fmtQty(Number(m.quantity), history.ingredient.unit)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
