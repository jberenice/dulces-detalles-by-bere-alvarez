"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, Cake, Check, Copy, Ribbon, Gift, Pencil, Plus, Store, Tags, Trash2, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCatalog } from "@/hooks/useCatalog";
import { must, useAsync } from "@/hooks/useAsync";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { Combobox } from "@/components/ui/Combobox";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { useConfirm } from "@/components/ui/Confirm";
import { SearchInput, matches } from "@/components/ui/SearchInput";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/cn";
import { KIND_LABEL, cakeOptions, cupcakeOptions, dessertPrice, fixedPieces, kindOf, packageStats, rangeText, type PackageStats } from "@/lib/packages";
import type { Dessert, Extra, FlavorGroup, Package, PackageKind } from "@/lib/types";

type Draft = Omit<Package, "id" | "created_at" | "price"> & { id?: string; amount: string };

const KIND_HINT: Record<PackageKind, string> = {
  cupcakes: "Tu clienta elige sus cupcakes de las categorías que tú escojas (ej. caja mexicana: sin alcohol y con alcohol).",
  pastel: "Un pastel mini (ella elige el sabor) más cupcakes de las categorías que escojas.",
  postres: "Paquetes con contenido fijo: los postres que tú eliges.",
};
const KIND_ICON: Record<PackageKind, typeof Gift> = { cupcakes: Gift, pastel: Cake, postres: Boxes };

const blank = (kind: PackageKind): Draft => ({
  name: "",
  description: "",
  image_url: null,
  kind,
  mode: kind === "postres" ? "fijo" : "surtido",
  pieces: kind === "pastel" ? 5 : 6,
  cakes: 1,
  groups: [],
  cake_items: [],
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
  return d.price_mode === "pieza" && kindOf(d) !== "pastel" ? Math.round(a * pieces * 100) / 100 : a;
};

export default function PackagesPage() {
  const sb = createClient();
  const confirm = useConfirm();
  const catalog = useCatalog();
  const { data, costs, ingredientsById } = catalog;
  const packsQ = useAsync(async () => must(await sb.from("packages").select("*").order("position").order("name")) as Package[]);
  const seasonsQ = useAsync(async () => ((await sb.from("seasons").select("id, name, emoji").order("start_date")).data ?? []) as { id: string; name: string; emoji: string | null }[]);
  const [tab, setTab] = useState<PackageKind | "extras">("cupcakes");
  const kind: PackageKind = tab === "extras" ? "cupcakes" : tab;
  const [form, setForm] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const allDesserts = useMemo(() => data?.desserts ?? [], [data]);
  const desserts = useMemo(() => allDesserts.filter((d) => d.active), [allDesserts]);
  const groups = data?.groups ?? [];
  const extras = useMemo(() => data?.extras ?? [], [data]);
  const boxes = useMemo(() => (data?.ingredients ?? []).filter((i) => i.kind === "empaque"), [data]);
  const stats = (p: Package | Draft) => packageStats({ ...p, price: "amount" in p ? priceOf(p) : p.price }, allDesserts, costs, ingredientsById);

  const all = packsQ.data ?? [];
  const count = (k: PackageKind) => all.filter((p) => kindOf(p) === k).length;
  const list = all.filter((p) => kindOf(p) === kind && matches(q, p.name, p.description));

  function edit(p: Package) {
    const pieces = p.mode === "fijo" ? fixedPieces(p.items) : p.pieces;
    setForm({
      ...p,
      kind: kindOf(p),
      groups: p.groups ?? [],
      cake_items: p.cake_items ?? [],
      cakes: p.cakes ?? 1,
      amount: String(p.price_mode === "pieza" && pieces && kindOf(p) !== "pastel" ? Math.round((p.price / pieces) * 100) / 100 : p.price),
    });
  }

  async function save() {
    if (!form) return;
    const k = kindOf(form);
    const price = priceOf(form);
    const items = form.items.filter((i) => i.dessert_id && (k !== "postres" || (Number(i.qty) || 0) > 0));
    if (!form.name.trim()) return toast.error("Ponle nombre al paquete");
    if (k === "postres" && !items.length) return toast.error("Agrega lo que trae el paquete");
    if (k !== "postres") {
      if (!cupcakeOptions({ ...form, items }, desserts).length) return toast.error("Elige al menos una categoría con cupcakes");
      if (!(Number(form.pieces) >= 1)) return toast.error("¿Cuántos cupcakes lleva?");
    }
    if (k === "pastel" && !(form.cake_items ?? []).length) return toast.error("Elige los sabores de pastel mini");
    if (!(price > 0)) return toast.error("Escribe el precio del paquete");
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      image_url: form.image_url,
      kind: k,
      mode: k === "postres" ? "fijo" : "surtido",
      pieces: k === "postres" ? Math.max(1, fixedPieces(items)) : Math.round(Number(form.pieces)),
      cakes: k === "pastel" ? Math.max(1, Math.min(10, Math.round(Number(form.cakes) || 1))) : 1,
      groups: k === "postres" ? [] : form.groups ?? [],
      // Solo los apagados que siguen en las categorías elegidas (se manda si hay o si ya existía la columna)
      ...(() => {
        const off = k === "postres" ? [] : (form.excluded ?? []).filter((id) => desserts.some((d) => d.id === id && d.flavor_group_id && (form.groups ?? []).includes(d.flavor_group_id)));
        return off.length || "excluded" in form ? { excluded: off } : {};
      })(),
      cake_items: k === "pastel" ? (form.cake_items ?? []).map((i) => ({ dessert_id: i.dessert_id })) : [],
      price,
      price_mode: k === "pastel" ? "total" : form.price_mode,
      items: items.map((i) => (k === "postres" ? { dessert_id: i.dessert_id, qty: Number(i.qty) } : { dessert_id: i.dessert_id })),
      packaging_id: form.packaging_id || null,
      // "Otro costo extra" se reemplazó por el catálogo de extras
      extra_cost: 0,
      ...(() => {
        const offered = (form.extras ?? []).filter((id) => extras.some((x) => x.id === id));
        return offered.length || "extras" in form ? { extras: offered } : {};
      })(),
      store_visible: form.store_visible,
      active: form.active,
      min_notice_days: form.min_notice_days === null || (form.min_notice_days as unknown) === "" ? null : Number(form.min_notice_days),
      season_id: form.season_id || null,
    };
    setSaving(true);
    const { error } = form.id ? await sb.from("packages").update(payload).eq("id", form.id) : await sb.from("packages").insert({ ...payload, position: all.length });
    setSaving(false);
    if (error) return toast.error(/extras/.test(error.message) ? "Falta ejecutar la migración 0017 en Supabase" : /excluded/.test(error.message) ? "Falta ejecutar la migración 0016 en Supabase" : /kind|groups|cake_items/.test(error.message) ? "Falta ejecutar la migración 0015 en Supabase" : error.message);
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
    const { error } = await sb.from("packages").insert({ ...rest, name: `${p.name} (copia)`, store_visible: false, position: all.length });
    if (error) return toast.error(error.message);
    packsQ.reload();
  }

  const loading = catalog.loading || packsQ.loading;
  const Icon = KIND_ICON[kind];
  const newLabel = kind === "cupcakes" ? "Nueva caja de cupcakes" : kind === "pastel" ? "Nuevo pastel con cupcakes" : "Nuevo paquete de postres";

  return (
    <>
      <PageHeader
        eyebrow="Pedidos especiales"
        title="Paquetes y cajas"
        subtitle="Arma cajas con precio especial. Te decimos cuánto ganas y cuánto se ahorra tu clienta."
        actions={tab !== "extras" && <Button onClick={() => setForm({ ...blank(kind), extras: extras.filter((x) => x.available).map((x) => x.id) })}><Plus className="h-4 w-4" /> {newLabel}</Button>}
      />

      <Tabs
        value={tab}
        onChange={(k) => { setTab(k); setQ(""); }}
        className="mb-3"
        options={[
          ...(["cupcakes", "pastel", "postres"] as PackageKind[]).map((k) => {
            const I = KIND_ICON[k];
            return { value: k as PackageKind | "extras", label: <><I className="h-4 w-4" /> {KIND_LABEL[k]}</>, count: count(k) };
          }),
          { value: "extras" as const, label: <><Ribbon className="h-4 w-4" /> Extras</>, count: extras.length },
        ]}
      />
      <p className="mb-5 text-sm text-cocoa-400">{tab === "extras" ? "Lo que vendes aparte para acompañar: listón, moño, tarjeta, carrito… Tu clienta los agrega en la tienda y se suman a su cuenta." : KIND_HINT[kind]}</p>

      {tab === "extras" ? (
        loading ? <Skeleton className="h-60" /> : <ExtrasManager extras={extras} onChanged={catalog.reload} />
      ) : (
      <>

      {kind === "cupcakes" && !loading && <GroupsManager desserts={desserts} groups={groups} onChanged={catalog.reload} />}

      {!loading && list.length > 3 && <SearchInput value={q} onChange={setQ} placeholder="Buscar paquete" className="mb-5 lg:w-72" />}

      {packsQ.error ? (
        <Card className="p-6 text-sm text-rose-600">No se pudieron cargar los paquetes. Ejecuta las migraciones 0013 y 0015 en Supabase.</Card>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icon className="h-8 w-8" />}
            title={`Aún no tienes ${KIND_LABEL[kind].toLowerCase()}`}
            description={
              kind === "cupcakes"
                ? "Ej. “Caja mexicana de 6” a $360, donde tu clienta elige entre tus cupcakes mexicanos con y sin alcohol."
                : kind === "pastel"
                  ? "Ej. “Pastel mini + 5 cupcakes”: ella elige el sabor del pastel y sus cupcakes."
                  : "Ej. “Mesa de postres”: 12 cupcakes + 1 pay + 20 galletas."
            }
            action={<Button onClick={() => setForm({ ...blank(kind), extras: extras.filter((x) => x.available).map((x) => x.id) })}><Plus className="h-4 w-4" /> {newLabel}</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p, idx) => {
            const s = stats(p);
            const gNames = (p.groups ?? []).map((g) => groups.find((x) => x.id === g)?.name).filter(Boolean);
            const detail =
              kindOf(p) === "postres"
                ? p.items.map((i) => `${num(Number(i.qty), 0)} ${allDesserts.find((d) => d.id === i.dessert_id)?.name ?? "?"}`).join(", ")
                : `${kindOf(p) === "pastel" ? `${p.cakes ?? 1} pastel mini + ` : ""}${p.pieces} cupcakes · ${gNames.length ? gNames.join(", ") : `${cupcakeOptions(p, desserts).length} sabores`}`;
            return (
              <Card key={p.id} className="flex flex-col overflow-hidden animate-fade-up" style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}>
                <button onClick={() => edit(p)} className="relative block aspect-[16/9] overflow-hidden bg-cream-200 text-left">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="sprinkles grid h-full w-full place-items-center"><Icon className="h-12 w-12 text-rose-300" /></div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
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
                  <p className="mt-1 line-clamp-2 text-xs text-cocoa-400">{detail}</p>
                  <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
                    <Stat label="Precio">
                      <span className="text-rose-500">{money(s.total)}</span>
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

      </>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form ? `${form.id ? "Editar" : "Nuevo"}: ${KIND_LABEL[kindOf(form)].toLowerCase()}` : ""}
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
            groups={groups}
            extras={extras}
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

/* ------------------------------------------------------------------ categorías */

/** Categorías de cupcakes: crearlas y meter cada cupcake donde corresponde */
function GroupsManager({ desserts, groups, onChanged }: { desserts: Dessert[]; groups: FlavorGroup[]; onChanged: () => void }) {
  const sb = createClient();
  const confirm = useConfirm();
  const [name, setName] = useState("");
  const [picking, setPicking] = useState<FlavorGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const inGroup = (g: string) => desserts.filter((d) => d.flavor_group_id === g);
  const loose = desserts.filter((d) => /cupcake/i.test(d.category) && !d.flavor_group_id);

  async function create() {
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    const { error } = await sb.from("flavor_groups").insert({ name: n.slice(0, 60), position: groups.length });
    setBusy(false);
    if (error) return toast.error(error.message.includes("flavor_groups") ? "Falta ejecutar la migración 0015 en Supabase" : error.message);
    setName("");
    onChanged();
  }
  async function rename(g: FlavorGroup) {
    const n = window.prompt("Nuevo nombre de la categoría", g.name)?.trim();
    if (!n || n === g.name) return;
    const { error } = await sb.from("flavor_groups").update({ name: n.slice(0, 60) }).eq("id", g.id);
    if (error) return toast.error(error.message);
    onChanged();
  }
  async function remove(g: FlavorGroup) {
    if (!(await confirm({ title: `¿Eliminar la categoría “${g.name}”?`, message: "Sus cupcakes quedan sin categoría y las cajas que la usaban dejarán de mostrarlos.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("flavor_groups").delete().eq("id", g.id);
    if (error) return toast.error(error.message);
    onChanged();
  }
  async function setGroup(ids: string[], groupId: string | null) {
    if (!ids.length) return;
    const { error } = await sb.from("desserts").update({ flavor_group_id: groupId }).in("id", ids);
    if (error) return toast.error(error.message.includes("flavor_group") ? "Falta ejecutar la migración 0015 en Supabase" : error.message);
    onChanged();
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader
        title="Categorías de cupcakes"
        subtitle="Agrupa tus cupcakes (ej. Clásicos, Mexicanos sin alcohol, Mexicanos con alcohol). Cada caja muestra solo las categorías que elijas."
        icon={<Tags className="h-5 w-5" />}
      />
      <div className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id} className="rounded-2xl bg-cream-100 p-4 ring-1 ring-cocoa-800/5">
              <div className="flex items-center justify-between gap-2">
                <button onClick={() => rename(g)} className="truncate text-left font-semibold text-cocoa-700 hover:text-rose-500" title="Cambiar nombre">{g.name}</button>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => setPicking(g)} className="rounded-lg px-2 py-1 text-xs font-bold text-rose-500 hover:bg-rose-50">+ Cupcakes</button>
                  <button onClick={() => remove(g)} className="grid h-7 w-7 place-items-center rounded-lg text-cocoa-300 hover:bg-rose-50 hover:text-rose-500" aria-label="Eliminar categoría"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {inGroup(g.id).map((d) => (
                  <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-white py-1 pr-1 pl-2.5 text-xs font-bold text-cocoa-600 ring-1 ring-cocoa-800/8">
                    {d.name}
                    <button onClick={() => setGroup([d.id], null)} className="grid h-5 w-5 place-items-center rounded-full text-cocoa-300 hover:bg-rose-50 hover:text-rose-500" aria-label={`Quitar ${d.name}`}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {!inGroup(g.id).length && <span className="text-xs text-cocoa-400">Sin cupcakes todavía</span>}
              </div>
            </div>
          ))}
          <div className="flex flex-col justify-center gap-2 rounded-2xl border-2 border-dashed border-cocoa-800/10 p-4">
            <span className="text-sm font-bold text-cocoa-600">Nueva categoría</span>
            <div className="flex gap-2">
              <input className="field flex-1 !py-2 text-sm" maxLength={60} placeholder="Ej. Mexicanos con alcohol" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
              <Button size="sm" onClick={create} loading={busy}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        {loose.length > 0 && groups.length > 0 && (
          <p className="text-xs text-cocoa-400">
            Cupcakes sin categoría: <b className="text-cocoa-600">{loose.map((d) => d.name).join(", ")}</b>. Toca “+ Cupcakes” en una categoría para agregarlos.
          </p>
        )}
      </div>

      <Modal open={!!picking} onClose={() => setPicking(null)} title={picking ? `Cupcakes de “${picking.name}”` : ""} size="lg">
        {picking && <GroupPicker group={picking} groups={groups} desserts={desserts} onSave={async (ids) => {
          const current = inGroup(picking.id).map((d) => d.id);
          await setGroup(ids.filter((x) => !current.includes(x)), picking.id);
          await setGroup(current.filter((x) => !ids.includes(x)), null);
          setPicking(null);
          toast.success("Categoría actualizada");
        }} />}
      </Modal>
    </Card>
  );
}

function GroupPicker({ group, groups, desserts, onSave }: { group: FlavorGroup; groups: FlavorGroup[]; desserts: Dessert[]; onSave: (ids: string[]) => void }) {
  const [onlyCupcakes, setOnlyCupcakes] = useState(true);
  const [chosen, setChosen] = useState<string[]>(desserts.filter((d) => d.flavor_group_id === group.id).map((d) => d.id));
  const list = desserts.filter((d) => !onlyCupcakes || /cupcake/i.test(d.category) || chosen.includes(d.id));
  return (
    <div className="space-y-4">
      <Toggle checked={onlyCupcakes} onChange={setOnlyCupcakes} label="Mostrar solo postres de la categoría “Cupcakes”" />
      <div className="flex max-h-[50vh] flex-wrap gap-2 overflow-y-auto">
        {list.map((d) => {
          const on = chosen.includes(d.id);
          const other = !on && d.flavor_group_id ? groups.find((g) => g.id === d.flavor_group_id)?.name : null;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setChosen((c) => (on ? c.filter((x) => x !== d.id) : [...c, d.id]))}
              className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold transition", on ? "border-rose-400 bg-rose-50 text-rose-600" : "border-cocoa-800/10 bg-white text-cocoa-500 hover:border-rose-200")}
              title={other ? `Está en “${other}”; se moverá aquí` : undefined}
            >
              {d.name}
              {other && <span className="ml-1 text-[11px] font-normal text-cocoa-400">({other})</span>}
            </button>
          );
        })}
        {!list.length && <p className="text-sm text-cocoa-400">No hay postres en la categoría “Cupcakes”. Apaga el filtro para ver todos.</p>}
      </div>
      <p className="text-xs text-cocoa-400">Cada cupcake pertenece a una sola categoría. Si eliges uno que ya está en otra, se cambia a esta.</p>
      <div className="flex justify-end">
        <Button onClick={() => onSave(chosen)}>Guardar ({chosen.length})</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ extras */

type ExtraDraft = { id?: string; name: string; description: string; price: string; cost: string; available: boolean };

/** Catálogo de extras: lo que vendes aparte (listón, moño, tarjeta, carrito…) */
function ExtrasManager({ extras, onChanged }: { extras: Extra[]; onChanged: () => void }) {
  const sb = createClient();
  const confirm = useConfirm();
  const [form, setForm] = useState<ExtraDraft | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form) return;
    const name = form.name.trim();
    const price = Number(form.price);
    if (!name) return toast.error("Ponle nombre al extra");
    if (!(price >= 0) || form.price === "") return toast.error("Escribe el precio para tu clienta");
    const payload = { name: name.slice(0, 60), description: form.description.trim().slice(0, 200) || null, price, cost: Number(form.cost) || 0, available: form.available };
    setSaving(true);
    const { error } = form.id ? await sb.from("extras").update(payload).eq("id", form.id) : await sb.from("extras").insert({ ...payload, position: extras.length });
    setSaving(false);
    if (error) return toast.error(/extras/.test(error.message) ? "Falta ejecutar la migración 0017 en Supabase" : error.message);
    toast.success("Extra guardado");
    setForm(null);
    onChanged();
  }
  async function toggle(x: Extra, available: boolean) {
    const { error } = await sb.from("extras").update({ available }).eq("id", x.id);
    if (error) return toast.error(error.message);
    onChanged();
  }
  async function remove(x: Extra) {
    if (!(await confirm({ title: `¿Eliminar “${x.name}”?`, message: "Los pedidos que ya lo tienen lo conservan. Si solo se te acabó, mejor márcalo como no disponible.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("extras").delete().eq("id", x.id);
    if (error) return toast.error(error.message);
    onChanged();
  }
  const blankExtra = (): ExtraDraft => ({ name: "", description: "", price: "", cost: "", available: true });

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Catálogo de extras"
        subtitle="Ponles precio y activa los que tienes disponibles. En cada paquete eliges cuáles se ofrecen."
        icon={<Ribbon className="h-5 w-5" />}
        action={<Button size="sm" onClick={() => setForm(blankExtra())}><Plus className="h-4 w-4" /> Nuevo extra</Button>}
      />
      {extras.length === 0 ? (
        <EmptyState
          icon={<Ribbon className="h-8 w-8" />}
          title="Aún no tienes extras"
          description="Ej. Listón $15, Moño $25, Tarjeta con mensaje $20, Carrito Hot Wheels $60."
          action={<Button onClick={() => setForm(blankExtra())}><Plus className="h-4 w-4" /> Crear mi primer extra</Button>}
        />
      ) : (
        <ul className="divide-y divide-cocoa-800/5">
          {extras.map((x) => {
            const gain = Number(x.price) - Number(x.cost);
            return (
              <li key={x.id} className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5", !x.available && "bg-cream-50")}>
                <div className="min-w-0 flex-1">
                  <button onClick={() => setForm({ id: x.id, name: x.name, description: x.description ?? "", price: String(x.price), cost: Number(x.cost) ? String(x.cost) : "", available: x.available })} className={cn("text-left font-semibold hover:text-rose-500", x.available ? "text-cocoa-700" : "text-cocoa-400 line-through")}>
                    {x.name}
                  </button>
                  <p className="text-xs text-cocoa-400">
                    {x.description ? `${x.description} · ` : ""}
                    {Number(x.cost) > 0 ? <>te cuesta {money(x.cost)} · ganas <b className={gain >= 0 ? "text-mint-700" : "text-rose-600"}>{money(gain)}</b></> : "sin costo registrado"}
                  </p>
                </div>
                <span className="font-display text-xl font-semibold text-rose-500 tabular-nums">{money(x.price)}</span>
                <Toggle checked={x.available} onChange={(v) => toggle(x, v)} label={x.available ? "Disponible" : "No disponible"} />
                <ActionMenu
                  actions={[
                    { label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => setForm({ id: x.id, name: x.name, description: x.description ?? "", price: String(x.price), cost: Number(x.cost) ? String(x.cost) : "", available: x.available }) },
                    { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => remove(x), danger: true },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Editar extra" : "Nuevo extra"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={save} loading={saving}>Guardar</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <Input label="Nombre" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Carrito Hot Wheels" autoFocus />
            <Input label="Descripción (se ve en la tienda)" maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej. Modelo sorpresa" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Precio para tu clienta" type="number" min={0} step="any" prefix="$" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Input label="Lo que te cuesta (opcional)" type="number" min={0} step="any" prefix="$" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} hint="Para calcular tu ganancia" />
            </div>
            <Toggle checked={form.available} onChange={(v) => setForm({ ...form, available: v })} label="Disponible (se muestra en la tienda)" />
          </div>
        )}
      </Modal>
    </Card>
  );
}

/* ------------------------------------------------------------------ editor */

function PackageEditor({
  form,
  setForm,
  desserts,
  groups,
  extras,
  costs,
  boxes,
  seasons,
  stats,
}: {
  form: Draft;
  setForm: (fn: (f: Draft | null) => Draft | null) => void;
  desserts: Dessert[];
  groups: FlavorGroup[];
  extras: Extra[];
  costs: ReturnType<typeof useCatalog>["costs"];
  boxes: NonNullable<ReturnType<typeof useCatalog>["data"]>["ingredients"];
  seasons: { id: string; name: string; emoji: string | null }[];
  stats: PackageStats;
}) {
  const set = (patch: Partial<Draft>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const k = kindOf(form);
  const categories = useMemo(() => [...new Set(desserts.map((d) => d.category))], [desserts]);
  const [cakeCat, setCakeCat] = useState<string>(() => {
    const first = desserts.find((d) => d.id === form.cake_items?.[0]?.dessert_id);
    return first?.category ?? categories.find((c) => /mini/i.test(c)) ?? categories.find((c) => /pastel/i.test(c)) ?? categories[0] ?? "";
  });
  const options = useMemo(() => desserts.map((d) => ({ value: d.id, label: d.name, hint: `${d.category} · ${money(dessertPrice(d, costs.get(d.id)))}` })), [desserts, costs]);
  const chosenGroups = form.groups ?? [];
  const cups = cupcakeOptions(form, desserts);
  const cakeIds = new Set((form.cake_items ?? []).map((i) => i.dessert_id));
  const pieces = Number(form.pieces) || 0;
  const other = form.price_mode === "total" ? (stats.pieces ? stats.price / stats.pieces : 0) : stats.price;
  const legacy = k !== "postres" && !chosenGroups.length && form.items.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div className="space-y-4">
            <Input label="Nombre" maxLength={120} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={k === "cupcakes" ? "Ej. Caja mexicana de 6" : k === "pastel" ? "Ej. Pastel mini + 5 cupcakes" : "Ej. Mesa de postres"} />
            <Textarea label="Descripción (opcional)" rows={2} maxLength={1000} value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder="Lo que verá tu clienta en la tienda" />
          </div>
          <ImagePicker value={form.image_url} onChange={(url) => set({ image_url: url })} folder="postres" label="Foto" aspect="aspect-[16/7] sm:aspect-[4/3]" />
        </div>

        {k === "pastel" && (
          <div className="rounded-3xl bg-cream-100 p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-semibold text-cocoa-700">1. Sabores de pastel mini</p>
                <p className="text-xs text-cocoa-400">Tu clienta elige uno de estos. ¿Falta un sabor? <Link href="/dashboard/postres/nuevo" target="_blank" className="font-bold text-rose-500 hover:underline">Créalo como postre</Link>.</p>
              </div>
              <select className="field !w-auto !py-1.5 text-sm" value={cakeCat} onChange={(e) => setCakeCat(e.target.value)} aria-label="Categoría de recetas">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {desserts.filter((d) => d.category === cakeCat || cakeIds.has(d.id)).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => set({ cake_items: cakeIds.has(d.id) ? (form.cake_items ?? []).filter((i) => i.dessert_id !== d.id) : [...(form.cake_items ?? []), { dessert_id: d.id }] })}
                  className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold transition", cakeIds.has(d.id) ? "border-rose-400 bg-rose-50 text-rose-600" : "border-cocoa-800/10 bg-white text-cocoa-500 hover:border-rose-200")}
                >
                  {d.name} <span className="font-normal text-cocoa-400">{money(dessertPrice(d, costs.get(d.id)))}</span>
                </button>
              ))}
            </div>
            <Input className="mt-3 sm:w-48" label="Pasteles mini por paquete" type="number" min={1} max={10} value={form.cakes ?? 1} onChange={(e) => set({ cakes: e.target.value as unknown as number })} />
          </div>
        )}

        {k !== "postres" && (
          <div className={cn(k === "pastel" && "rounded-3xl bg-cream-100 p-4")}>
            {k === "pastel" && <p className="mb-3 font-semibold text-cocoa-700">2. Cupcakes</p>}
            <Input label="¿Cuántos cupcakes lleva?" type="number" min={1} max={200} value={form.pieces} onChange={(e) => set({ pieces: e.target.value as unknown as number })} className="sm:w-48" />
            <div className="mt-4">
              <span className="label">Categorías que puede elegir</span>
              {groups.length ? (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const on = chosenGroups.includes(g.id);
                    const n = desserts.filter((d) => d.flavor_group_id === g.id).length;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => set({ groups: on ? chosenGroups.filter((x) => x !== g.id) : [...chosenGroups, g.id] })}
                        className={cn("rounded-2xl border-2 px-3.5 py-2 text-left text-sm font-bold transition", on ? "border-rose-400 bg-rose-50 text-rose-600" : "border-cocoa-800/10 bg-white text-cocoa-500 hover:border-rose-200")}
                      >
                        {g.name} <span className="font-normal text-cocoa-400">· {n}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Primero crea tus categorías de cupcakes en la pestaña “Cajas de cupcakes”.</p>
              )}
              {legacy && (
                <p className="mt-2 text-xs text-amber-700">Esta caja usa sabores elegidos uno por uno ({form.items.length}). Elige categorías para que se actualice sola cuando agregues cupcakes nuevos.</p>
              )}
              {chosenGroups.length > 0 && (
                <div className="mt-3 space-y-2.5">
                  {groups.filter((g) => chosenGroups.includes(g.id)).map((g) => {
                    const list = desserts.filter((d) => d.flavor_group_id === g.id);
                    const off = new Set(form.excluded ?? []);
                    const onCount = list.filter((d) => !off.has(d.id)).length;
                    const setAll = (enabled: boolean) =>
                      set({ excluded: enabled ? (form.excluded ?? []).filter((id) => !list.some((d) => d.id === id)) : [...new Set([...(form.excluded ?? []), ...list.map((d) => d.id)])] });
                    return (
                      <div key={g.id} className="rounded-2xl bg-white p-3 ring-1 ring-cocoa-800/8">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-cocoa-700">
                            {g.name} <span className="font-normal text-cocoa-400">· {onCount} de {list.length} disponibles</span>
                          </p>
                          {list.length > 1 && (
                            <div className="flex gap-1 text-xs font-bold">
                              <button type="button" onClick={() => setAll(true)} className="rounded-lg px-2 py-1 text-mint-700 hover:bg-mint-50">Todos</button>
                              <button type="button" onClick={() => setAll(false)} className="rounded-lg px-2 py-1 text-cocoa-400 hover:bg-cream-100">Ninguno</button>
                            </div>
                          )}
                        </div>
                        {list.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {list.map((d) => {
                              const on = !off.has(d.id);
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => set({ excluded: on ? [...(form.excluded ?? []), d.id] : (form.excluded ?? []).filter((x) => x !== d.id) })}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border-2 py-1 pr-3 pl-1.5 text-sm font-bold transition",
                                    on ? "border-mint-300 bg-mint-50 text-mint-700" : "border-dashed border-cocoa-800/15 bg-cream-50 text-cocoa-300 line-through",
                                  )}
                                  title={on ? "Disponible en esta caja · toca para apagarlo" : "No disponible en esta caja · toca para encenderlo"}
                                >
                                  <span className={cn("grid h-5 w-5 place-items-center rounded-full", on ? "bg-mint-500 text-white" : "bg-cocoa-800/10")}>
                                    {on && <Check className="h-3 w-3" />}
                                  </span>
                                  {d.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-cocoa-400">Esta categoría no tiene cupcakes todavía.</p>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-xs text-cocoa-400">
                    Toca un sabor para apagarlo o encenderlo solo en esta caja. Podrá elegir <b className="text-cocoa-600">{cups.length}</b> {cups.length === 1 ? "sabor" : "sabores"}.
                  </p>
                </div>
              )}
              {!chosenGroups.length && cups.length > 0 && <p className="mt-2 text-xs text-cocoa-400">Podrá elegir: {cups.map((d) => d.name).join(", ")}</p>}
            </div>
          </div>
        )}

        {k === "postres" && (
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
            {k !== "pastel" && (
              <div className="inline-flex rounded-2xl bg-cream-200 p-1">
                {(["total", "pieza"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set({ price_mode: m, amount: other ? String(Math.round(other * 100) / 100) : form.amount })}
                    className={cn("rounded-xl px-3 py-1.5 text-sm font-bold transition", form.price_mode === m ? "bg-white text-cocoa-700 shadow-soft" : "text-cocoa-400")}
                  >
                    {m === "total" ? "Total" : "Por pieza"}
                  </button>
                ))}
              </div>
            )}
            <div className="relative w-40">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-cocoa-400">$</span>
              <input className="field pl-7 text-right tabular-nums" type="number" min={0} step="any" value={form.amount} onChange={(e) => set({ amount: e.target.value })} aria-label="Precio" />
            </div>
            {k !== "pastel" && (
              <span className="text-sm text-cocoa-500">
                {form.price_mode === "total" ? <>= <b>{money(other)}</b> por pieza</> : <>× {num(k === "postres" ? stats.pieces : pieces, 0)} = <b>{money(stats.price)}</b> en total</>}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Caja o empaque" value={form.packaging_id ?? ""} onChange={(e) => set({ packaging_id: e.target.value || null })} hint="Se le cobra a tu clienta: se suma al precio del paquete.">
            <option value="">Sin caja</option>
            {boxes.map((b) => <option key={b.id} value={b.id}>{b.name} · {money(b.unit_cost)}</option>)}
          </Select>
          <div>
            <span className="label">Extras que puede agregar</span>
            {extras.length ? (
              <div className="flex flex-wrap gap-1.5">
                {extras.map((x) => {
                  const on = (form.extras ?? []).includes(x.id);
                  return (
                    <button
                      key={x.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ extras: on ? (form.extras ?? []).filter((id) => id !== x.id) : [...(form.extras ?? []), x.id] })}
                      className={cn(
                        "rounded-full border-2 px-3 py-1.5 text-sm font-bold transition",
                        on ? "border-rose-400 bg-rose-50 text-rose-600" : "border-cocoa-800/10 bg-white text-cocoa-400 hover:border-rose-200",
                        !x.available && "opacity-60",
                      )}
                      title={x.available ? undefined : "No disponible por ahora (actívalo en la pestaña Extras)"}
                    >
                      {x.name} <span className="font-normal text-cocoa-400">+{money(x.price)}</span>
                      {!x.available && <span className="ml-1 text-[11px] font-normal">(agotado)</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl bg-cream-100 px-3 py-2.5 text-xs text-cocoa-500">Crea tu catálogo (listón, moño, tarjeta…) en la pestaña <b>Extras</b>.</p>
            )}
            {Number(form.extra_cost) > 0 && <p className="mt-1.5 text-xs text-amber-700">Antes tenía {money(Number(form.extra_cost))} de “otro costo extra”; al guardar se quita y se usan los extras del catálogo.</p>}
          </div>
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

      <Summary stats={stats} variable={k !== "postres"} contents={k === "pastel" ? `${Number(form.cakes) || 1} pastel mini + ${pieces} cupcakes` : undefined} />
    </div>
  );
}

function Summary({ stats: s, variable, contents }: { stats: PackageStats; variable: boolean; contents?: string }) {
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
        <p className="mt-1 font-display text-3xl font-semibold text-rose-500 tabular-nums">{money(s.total)}</p>
        <p className="text-sm text-cocoa-500">{contents ?? <>{num(s.pieces, 0)} piezas · <b>{money(s.perPiece)}</b> c/u</>}</p>
        {s.boxPrice > 0 && (
          <div className="mt-3 border-t border-dashed border-cocoa-800/10 pt-2">
            {row("Paquete", money(s.price))}
            {row("Caja o empaque", `+${money(s.boxPrice)}`)}
          </div>
        )}
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
        {s.extraCost > 0 && row("Otros costos", money(s.extraCost))}
        {row("Ganancia", rangeText(s.profit, money), loss ? "text-rose-600" : "text-mint-700")}
        {row("Margen", rangeText(s.margin, (n) => `${num(n, 0)}%`), marginTone(s.margin.min))}
        {variable && Math.abs(s.cost.max - s.cost.min) > 0.01 && (
          <p className="mt-2 text-[11px] leading-snug text-cocoa-400">Va de la combinación más barata a la más cara de hacer, según los sabores que elija.</p>
        )}
        {loss && <p className="mt-2 text-xs font-semibold text-rose-600">Con este precio podrías perder dinero en algunas combinaciones.</p>}
      </div>
      <p className="px-1 text-[11px] leading-snug text-cocoa-400">El costo de cada postre incluye el empaque que tenga en su receta.</p>
    </div>
  );
}
