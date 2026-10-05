"use client";
import { useMemo, useState } from "react";
import { Boxes, Copy, Gift, Pencil, Plus, Store, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCatalog } from "@/hooks/useCatalog";
import { must, useAsync } from "@/hooks/useAsync";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Combobox } from "@/components/ui/Combobox";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { useConfirm } from "@/components/ui/Confirm";
import { SearchInput, matches } from "@/components/ui/SearchInput";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/cn";
import { dessertPrice, fixedPieces, packageStats, rangeText, type PackageStats } from "@/lib/packages";
import type { Dessert, Package } from "@/lib/types";

type Draft = Omit<Package, "id" | "created_at" | "price"> & { id?: string; amount: string };

const blank = (): Draft => ({
  name: "",
  description: "",
  image_url: null,
  mode: "surtido",
  pieces: 6,
  price_mode: "total",
  amount: "",
  items: [],
  packaging_id: null,
  extra_cost: 0,
  store_visible: true,
  active: true,
  position: 0,
  min_notice_days: null,
  season_id: null,
});

/** Precio total a partir de lo capturado (total de la caja o precio por pieza) */
const priceOf = (d: Draft) => {
  const a = Number(d.amount) || 0;
  const pieces = d.mode === "fijo" ? fixedPieces(d.items) : Number(d.pieces) || 0;
  return d.price_mode === "pieza" ? Math.round(a * pieces * 100) / 100 : a;
};

export default function PackagesPage() {
  const sb = createClient();
  const confirm = useConfirm();
  const catalog = useCatalog();
  const { data, costs, ingredientsById } = catalog;
  const packsQ = useAsync(async () => must(await sb.from("packages").select("*").order("position").order("name")) as Package[]);
  const seasonsQ = useAsync(async () => ((await sb.from("seasons").select("id, name, emoji").order("start_date")).data ?? []) as { id: string; name: string; emoji: string | null }[]);
  const [form, setForm] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const desserts = useMemo(() => (data?.desserts ?? []).filter((d) => d.active), [data]);
  const dessertsById = useMemo(() => new Map((data?.desserts ?? []).map((d) => [d.id, d])), [data]);
  const boxes = useMemo(() => (data?.ingredients ?? []).filter((i) => i.kind === "empaque"), [data]);
  const stats = (p: Package | Draft) => packageStats({ ...p, price: "amount" in p ? priceOf(p) : p.price }, dessertsById, costs, ingredientsById);

  const list = (packsQ.data ?? []).filter((p) => matches(q, p.name, p.description));

  function edit(p: Package) {
    const pieces = p.mode === "fijo" ? fixedPieces(p.items) : p.pieces;
    setForm({ ...p, amount: String(p.price_mode === "pieza" && pieces ? Math.round((p.price / pieces) * 100) / 100 : p.price) });
  }

  async function save() {
    if (!form) return;
    const price = priceOf(form);
    const items = form.items.filter((i) => i.dessert_id && (form.mode === "surtido" || (Number(i.qty) || 0) > 0));
    if (!form.name.trim()) return toast.error("Ponle nombre al paquete");
    if (!items.length) return toast.error(form.mode === "fijo" ? "Agrega lo que trae el paquete" : "Elige al menos un sabor");
    if (form.mode === "surtido" && !(Number(form.pieces) >= 1)) return toast.error("¿Cuántas piezas lleva la caja?");
    if (!(price > 0)) return toast.error("Escribe el precio del paquete");
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      image_url: form.image_url,
      mode: form.mode,
      pieces: form.mode === "fijo" ? Math.max(1, fixedPieces(items)) : Math.round(Number(form.pieces)),
      price,
      price_mode: form.price_mode,
      items: items.map((i) => (form.mode === "fijo" ? { dessert_id: i.dessert_id, qty: Number(i.qty) } : { dessert_id: i.dessert_id })),
      packaging_id: form.packaging_id || null,
      extra_cost: Number(form.extra_cost) || 0,
      store_visible: form.store_visible,
      active: form.active,
      min_notice_days: form.min_notice_days === null || (form.min_notice_days as unknown) === "" ? null : Number(form.min_notice_days),
      ...(form.season_id !== undefined ? { season_id: form.season_id || null } : {}),
    };
    setSaving(true);
    const { error } = form.id ? await sb.from("packages").update(payload).eq("id", form.id) : await sb.from("packages").insert({ ...payload, position: packsQ.data?.length ?? 0 });
    setSaving(false);
    if (error) return toast.error(error.message.includes("packages") ? "Falta ejecutar la migración 0013 en Supabase" : error.message);
    toast.success("Paquete guardado 🎁");
    setForm(null);
    packsQ.reload();
  }

  async function remove(p: Package) {
    if (!(await confirm({ title: `¿Eliminar “${p.name}”?`, message: "Las cotizaciones y pedidos que ya lo usan se conservan.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("packages").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    packsQ.reload();
  }

  async function duplicate(p: Package) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...rest } = p;
    const { error } = await sb.from("packages").insert({ ...rest, name: `${p.name} (copia)`, store_visible: false, position: packsQ.data?.length ?? 0 });
    if (error) return toast.error(error.message);
    packsQ.reload();
  }

  const loading = catalog.loading || packsQ.loading;

  return (
    <>
      <PageHeader
        eyebrow="Pedidos especiales"
        title="Paquetes y cajas"
        subtitle="Arma cajas con precio especial: tú decides qué traen o dejas que tu clienta elija los sabores. Te decimos cuánto ganas y cuánto se ahorra ella."
        actions={
          <Button onClick={() => setForm(blank())}>
            <Plus className="h-4 w-4" /> Nuevo paquete
          </Button>
        }
      />

      {!loading && (packsQ.data?.length ?? 0) > 0 && <SearchInput value={q} onChange={setQ} placeholder="Buscar paquete" className="mb-5 lg:w-72" />}

      {packsQ.error ? (
        <Card className="p-6 text-sm text-rose-600">No se pudieron cargar los paquetes. Si acabas de actualizar, ejecuta la migración 0013_packages.sql en Supabase.</Card>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Gift className="h-8 w-8" />}
            title="Aún no tienes paquetes"
            description="Por ejemplo: “Caja de 6 cupcakes” a $192 donde tu clienta elige vainilla, chocolate o Nutella, o “Pastel mini + 5 cupcakes”."
            action={<Button onClick={() => setForm(blank())}><Plus className="h-4 w-4" /> Crear paquete</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p, idx) => {
            const s = stats(p);
            return (
              <Card key={p.id} className="flex flex-col overflow-hidden animate-fade-up" style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}>
                <button onClick={() => edit(p)} className="relative block aspect-[16/9] overflow-hidden bg-cream-200 text-left">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="sprinkles grid h-full w-full place-items-center"><Gift className="h-12 w-12 text-rose-300" /></div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge className="bg-white/90 backdrop-blur">{p.mode === "fijo" ? "Contenido fijo" : "Elige sabores"}</Badge>
                    {p.store_visible && <Badge tone="mint" className="backdrop-blur"><Store className="h-3 w-3" /> En tienda</Badge>}
                  </div>
                  {!p.active && <span className="absolute inset-0 grid place-items-center bg-white/60 text-sm font-bold text-cocoa-500">Inactivo</span>}
                </button>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => edit(p)} className="text-left font-display text-xl leading-tight font-semibold text-cocoa-700 hover:text-rose-500">{p.name}</button>
                    <ActionMenu
                      actions={[
                        { label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => edit(p) },
                        { label: "Duplicar", icon: <Copy className="h-4 w-4" />, onClick: () => duplicate(p) },
                        { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => remove(p), danger: true },
                      ]}
                    />
                  </div>
                  <p className="mt-1 text-xs text-cocoa-400">
                    {num(s.pieces, 0)} piezas · {money(s.perPiece)} c/u
                    {p.mode === "fijo"
                      ? ` · ${p.items.map((i) => `${num(Number(i.qty), 0)} ${dessertsById.get(i.dessert_id)?.name ?? "?"}`).join(", ")}`
                      : ` · ${p.items.length} sabores`}
                  </p>
                  <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
                    <Stat label="Precio">
                      <span className="text-rose-500">{money(s.price)}</span>
                      {s.regular.max > s.price + 0.5 && <span className="block text-[11px] font-normal text-cocoa-300 line-through">{rangeText(s.regular, money)}</span>}
                    </Stat>
                    <Stat label="Costo">{rangeText(s.cost, money)}</Stat>
                    <Stat label="Margen">
                      <span className={cn("flex items-center gap-1", marginTone(s.margin.min))}>
                        <TrendingUp className="h-3.5 w-3.5" /> {rangeText(s.margin, (n) => `${num(n, 0)}%`)}
                      </span>
                    </Stat>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Editar paquete" : "Nuevo paquete"}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={save} loading={saving}>Guardar paquete</Button>
          </>
        }
      >
        {form && (
          <PackageEditor
            form={form}
            setForm={setForm}
            desserts={desserts}
            costs={costs}
            boxes={boxes}
            seasons={seasonsQ.data ?? []}
            stats={stats(form)}
          />
        )}
      </Modal>
    </>
  );
}

const marginTone = (m: number) => (m >= 30 ? "text-mint-600" : m >= 15 ? "text-amber-600" : "text-rose-600");

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold tracking-wider text-cocoa-300 uppercase">{label}</p>
      <div className="font-semibold tabular-nums">{children}</div>
    </div>
  );
}

function PackageEditor({
  form,
  setForm,
  desserts,
  costs,
  boxes,
  seasons,
  stats,
}: {
  form: Draft;
  setForm: (fn: (f: Draft | null) => Draft | null) => void;
  desserts: Dessert[];
  costs: ReturnType<typeof useCatalog>["costs"];
  boxes: NonNullable<ReturnType<typeof useCatalog>["data"]>["ingredients"];
  stats: PackageStats;
  seasons: { id: string; name: string; emoji: string | null }[];
}) {
  const set = (patch: Partial<Draft>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const categories = useMemo(() => [...new Set(desserts.map((d) => d.category))], [desserts]);
  const [cat, setCat] = useState<string>(() => {
    const first = desserts.find((d) => d.id === form.items[0]?.dessert_id);
    return first?.category ?? categories.find((c) => /cupcake/i.test(c)) ?? categories[0] ?? "";
  });
  const options = useMemo(() => desserts.map((d) => ({ value: d.id, label: d.name, hint: `${d.category} · ${money(dessertPrice(d, costs.get(d.id)))}` })), [desserts, costs]);
  const chosen = new Set(form.items.map((i) => i.dessert_id));
  const toggleFlavor = (id: string) => set({ items: chosen.has(id) ? form.items.filter((i) => i.dessert_id !== id) : [...form.items, { dessert_id: id }] });
  const pieces = stats.pieces;
  const other = form.price_mode === "total" ? (pieces ? stats.price / pieces : 0) : stats.price;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div className="space-y-4">
            <Input label="Nombre" maxLength={120} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej. Caja de 6 cupcakes" />
            <Textarea label="Descripción (opcional)" rows={2} maxLength={1000} value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder="Ej. Arma tu caja con tus sabores favoritos" />
          </div>
          <ImagePicker value={form.image_url} onChange={(url) => set({ image_url: url })} folder="postres" label="Foto de la caja" aspect="aspect-[16/7] sm:aspect-[4/3]" />
        </div>

        <div>
          <span className="label">¿Cómo se arma?</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <ModeOpt active={form.mode === "surtido"} onClick={() => set({ mode: "surtido", items: form.items.map((i) => ({ dessert_id: i.dessert_id })) })} title="La clienta elige sabores" hint="Ej. caja de 6 cupcakes: ella reparte vainilla, chocolate o Nutella" />
            <ModeOpt active={form.mode === "fijo"} onClick={() => set({ mode: "fijo", items: form.items.map((i) => ({ dessert_id: i.dessert_id, qty: i.qty ?? 1 })) })} title="Contenido fijo" hint="Ej. pastel mini + 5 cupcakes, siempre igual" />
          </div>
        </div>

        {form.mode === "surtido" ? (
          <div className="space-y-3">
            <Input label="Piezas que lleva la caja" type="number" min={1} max={200} value={form.pieces} onChange={(e) => set({ pieces: e.target.value as unknown as number })} className="sm:w-48" />
            <div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <span className="label !mb-0">Sabores que puede elegir ({form.items.length})</span>
                {categories.length > 1 && (
                  <select className="field !w-auto !py-1.5 text-sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {desserts.filter((d) => d.category === cat || chosen.has(d.id)).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleFlavor(d.id)}
                    className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold transition", chosen.has(d.id) ? "border-rose-400 bg-rose-50 text-rose-600" : "border-cocoa-800/10 bg-white text-cocoa-500 hover:border-rose-200")}
                  >
                    {d.name} <span className="font-normal text-cocoa-400">{money(dessertPrice(d, costs.get(d.id)))}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <span className="label">Qué trae el paquete</span>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_40px] items-start gap-2">
                  <Combobox value={it.dessert_id} onChange={(v) => set({ items: form.items.map((x, j) => (j === i ? { ...x, dessert_id: v } : x)) })} options={options} placeholder="Elige un postre" />
                  <input className="field text-right tabular-nums" type="number" min={1} value={it.qty ?? 1} onChange={(e) => set({ items: form.items.map((x, j) => (j === i ? { ...x, qty: e.target.value as unknown as number } : x)) })} aria-label="Cantidad" />
                  <button type="button" onClick={() => set({ items: form.items.filter((_, j) => j !== i) })} className="grid h-11 w-10 place-items-center rounded-xl text-cocoa-300 hover:bg-rose-50 hover:text-rose-500" aria-label="Quitar"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => set({ items: [...form.items, { dessert_id: "", qty: 1 }] })} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100">
              <Plus className="h-4 w-4" /> Agregar postre
            </button>
          </div>
        )}

        <div>
          <span className="label">Precio del paquete</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-2xl bg-cream-200 p-1">
              {(["total", "pieza"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set({ price_mode: m, amount: other ? String(Math.round(other * 100) / 100) : form.amount })}
                  className={cn("rounded-xl px-3 py-1.5 text-sm font-bold transition", form.price_mode === m ? "bg-white text-cocoa-700 shadow-soft" : "text-cocoa-400")}
                >
                  {m === "total" ? "Total de la caja" : "Por pieza"}
                </button>
              ))}
            </div>
            <div className="relative w-40">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-cocoa-400">$</span>
              <input className="field pl-7 text-right tabular-nums" type="number" min={0} step="any" value={form.amount} onChange={(e) => set({ amount: e.target.value })} aria-label="Precio" />
            </div>
            <span className="text-sm text-cocoa-500">
              {form.price_mode === "total" ? <>= <b>{money(other)}</b> por pieza</> : <>× {num(pieces, 0)} = <b>{money(stats.price)}</b> la caja</>}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Caja o empaque (opcional)" value={form.packaging_id ?? ""} onChange={(e) => set({ packaging_id: e.target.value || null })}>
            <option value="">Sin caja extra</option>
            {boxes.map((b) => <option key={b.id} value={b.id}>{b.name} · {money(b.unit_cost)}</option>)}
          </Select>
          <Input label="Otro costo extra (moño, tarjeta…)" type="number" min={0} step="any" prefix="$" value={form.extra_cost} onChange={(e) => set({ extra_cost: e.target.value as unknown as number })} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle checked={form.store_visible} onChange={(v) => set({ store_visible: v })} label="Mostrar en mi tienda" />
          <Toggle checked={form.active} onChange={(v) => set({ active: v })} label="Activo" />
          <Input label="Días de anticipación" type="number" min={0} max={90} placeholder="Los de tu tienda" value={form.min_notice_days ?? ""} onChange={(e) => set({ min_notice_days: (e.target.value === "" ? null : e.target.value) as unknown as number })} />
        </div>
        {seasons.length > 0 && (
          <Select label="Temporada" value={form.season_id ?? ""} onChange={(e) => set({ season_id: e.target.value || null })} hint="Si la eliges, el paquete solo aparece en tu tienda durante esas fechas.">
            <option value="">Todo el año</option>
            {seasons.map((x) => <option key={x.id} value={x.id}>{x.emoji ? `${x.emoji} ` : ""}{x.name}</option>)}
          </Select>
        )}
      </div>

      <Summary stats={stats} mode={form.mode} />
    </div>
  );
}

function ModeOpt({ active, onClick, title, hint }: { active: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-2xl border-2 p-3 text-left transition", active ? "border-rose-400 bg-rose-50/60" : "border-cocoa-800/8 bg-white hover:border-rose-200")}>
      <span className="flex items-center gap-2 text-sm font-bold text-cocoa-700">{title === "Contenido fijo" ? <Boxes className="h-4 w-4 text-rose-400" /> : <Gift className="h-4 w-4 text-rose-400" />} {title}</span>
      <span className="mt-0.5 block text-xs text-cocoa-400">{hint}</span>
    </button>
  );
}

function Summary({ stats: s, mode }: { stats: PackageStats; mode: Package["mode"] }) {
  const row = (label: string, value: React.ReactNode, cls = "") => (
    <div className={cn("flex items-baseline justify-between gap-3 py-1.5 text-sm", cls)}>
      <span className="text-cocoa-500">{label}</span>
      <span className="text-right font-semibold tabular-nums">{value}</span>
    </div>
  );
  const loss = s.price > 0 && s.profit.min < 0;
  return (
    <div className="space-y-3 lg:sticky lg:top-0 lg:self-start">
      <div className="rounded-3xl bg-cream-100 p-4 ring-1 ring-cocoa-800/5">
        <p className="text-[11px] font-bold tracking-wider text-cocoa-400 uppercase">Para tu clienta</p>
        <p className="mt-1 font-display text-3xl font-semibold text-rose-500 tabular-nums">{money(s.price)}</p>
        <p className="text-sm text-cocoa-500">{num(s.pieces, 0)} piezas · <b>{money(s.perPiece)}</b> c/u</p>
        {s.regular.max > 0 && (
          <div className="mt-3 border-t border-dashed border-cocoa-800/10 pt-2">
            {row("Sueltas costarían", rangeText(s.regular, money))}
            {s.savings.max > 0.5
              ? row("Se ahorra", s.savings.min > 0.5 ? rangeText(s.savings, money) : `hasta ${money(s.savings.max)}`, "text-mint-700")
              : row("Ahorro", "sin descuento", "text-cocoa-400")}
          </div>
        )}
      </div>
      <div className={cn("rounded-3xl p-4 ring-1", loss ? "bg-rose-50 ring-rose-200" : "bg-mint-50 ring-mint-200/60")}>
        <p className={cn("text-[11px] font-bold tracking-wider uppercase", loss ? "text-rose-600" : "text-mint-600")}>Para ti</p>
        {row("Costo de los postres", rangeText({ min: s.cost.min - s.boxCost, max: s.cost.max - s.boxCost }, money))}
        {s.boxCost > 0 && row("Caja y extras", money(s.boxCost))}
        {row("Ganancia", rangeText(s.profit, money), loss ? "text-rose-600" : "text-mint-700")}
        {row("Margen", rangeText(s.margin, (n) => `${num(n, 0)}%`), marginTone(s.margin.min))}
        {mode === "surtido" && Math.abs(s.cost.max - s.cost.min) > 0.01 && (
          <p className="mt-2 text-[11px] leading-snug text-cocoa-400">Va de la combinación más barata a la más cara de hacer, según los sabores que elija.</p>
        )}
        {loss && <p className="mt-2 text-xs font-semibold text-rose-600">Con este precio podrías perder dinero en algunas combinaciones.</p>}
      </div>
      <p className="px-1 text-[11px] leading-snug text-cocoa-400">El costo de cada postre incluye el empaque que tenga en su receta.</p>
    </div>
  );
}
