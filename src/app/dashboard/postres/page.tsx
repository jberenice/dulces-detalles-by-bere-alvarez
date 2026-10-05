"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CakeSlice, Plus, Store, TrendingUp, Copy } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCatalog } from "@/hooks/useCatalog";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { SearchInput, matches } from "@/components/ui/SearchInput";
import { money, num } from "@/lib/format";
import { marginPct } from "@/lib/costing";
import { cn } from "@/lib/cn";

export default function DessertsPage() {
  const { data, loading, costs, reload } = useCatalog();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todos");

  const categories = useMemo(() => ["Todos", ...new Set((data?.desserts ?? []).map((d) => d.category))], [data]);
  const list = (data?.desserts ?? []).filter((d) => (cat === "Todos" || d.category === cat) && matches(q, d.name, d.category));

  async function duplicate(id: string) {
    const sb = createClient();
    const d = data?.desserts.find((x) => x.id === id);
    if (!d) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, dessert_items, created_at, ...rest } = d;
    const { data: created, error } = await sb.from("desserts").insert({ ...rest, name: `${d.name} (copia)`, store_visible: false }).select().single();
    if (error) return toast.error(error.message);
    if (dessert_items?.length)
      await sb.from("dessert_items").insert(dessert_items.map((it) => ({ dessert_id: created.id, ingredient_id: it.ingredient_id, section: it.section, quantity: it.quantity, position: it.position })));
    toast.success("Receta duplicada");
    reload();
  }

  return (
    <>
      <PageHeader
        eyebrow="Tu recetario"
        title="Postres"
        subtitle="Cada receta calcula su costo real y te sugiere el precio de venta con tu margen de ganancia."
        actions={
          <ButtonLink href="/dashboard/postres/nuevo">
            <Plus className="h-4 w-4" /> Nuevo postre
          </ButtonLink>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition",
                cat === c ? "bg-cocoa-800 text-cream-100" : "bg-white text-cocoa-500 shadow-soft hover:text-rose-500",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar postre" className="lg:w-72" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CakeSlice className="h-8 w-8" />}
            title="Tu recetario está vacío"
            description="Crea tu primer postre: agrega sus ingredientes y te diremos cuánto cuesta y a cuánto venderlo."
            action={<ButtonLink href="/dashboard/postres/nuevo"><Plus className="h-4 w-4" /> Crear postre</ButtonLink>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((d, idx) => {
            const c = costs.get(d.id);
            const price = d.sale_price ?? c?.unitPrice ?? 0;
            const margin = marginPct(price, c?.unitCost ?? 0);
            return (
              <Card key={d.id} className="group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift animate-fade-up" style={{ animationDelay: `${Math.min(idx, 12) * 30}ms` }}>
                <Link href={`/dashboard/postres/${d.id}`} className="relative block aspect-[16/10] overflow-hidden bg-cream-200">
                  {d.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image_url} alt={d.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="sprinkles grid h-full w-full place-items-center">
                      <CakeSlice className="h-12 w-12 text-rose-300" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge className="bg-white/90 backdrop-blur">{d.category}</Badge>
                    {d.store_visible && <Badge tone="mint" className="backdrop-blur"><Store className="h-3 w-3" /> En tienda</Badge>}
                  </div>
                  {!d.active && <span className="absolute inset-0 grid place-items-center bg-white/60 text-sm font-bold text-cocoa-500">Inactivo</span>}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/dashboard/postres/${d.id}`} className="font-display text-xl leading-tight font-semibold text-cocoa-700 hover:text-rose-500">
                      {d.name}
                    </Link>
                    <button onClick={() => duplicate(d.id)} className="rounded-lg p-1.5 text-cocoa-300 hover:bg-cream-200 hover:text-cocoa-600" title="Duplicar receta">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-cocoa-400">
                    Rinde {num(d.yield_units)} {d.unit_label}
                    {Number(d.yield_units) !== 1 ? "s" : ""} · {d.dessert_items?.length ?? 0} ingredientes · {num(d.labor_hours)} h
                  </p>
                  <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
                    <div>
                      <p className="text-[10.5px] font-bold tracking-wider text-cocoa-300 uppercase">Costo</p>
                      <p className="font-semibold tabular-nums">{money(c?.unitCost)}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-bold tracking-wider text-cocoa-300 uppercase">Precio</p>
                      <p className="font-semibold text-rose-500 tabular-nums">{money(price)}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-bold tracking-wider text-cocoa-300 uppercase">Margen</p>
                      <p className={cn("flex items-center gap-1 font-semibold tabular-nums", margin >= 30 ? "text-mint-600" : margin >= 15 ? "text-amber-600" : "text-rose-600")}>
                        <TrendingUp className="h-3.5 w-3.5" /> {num(margin, 0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
