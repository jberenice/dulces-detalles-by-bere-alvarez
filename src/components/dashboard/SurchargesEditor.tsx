"use client";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { finalPrice, surchargeOf, type Surcharges } from "@/lib/pricing";
import type { Dessert, FlavorGroup } from "@/lib/types";

function AmountInput({ value, onChange, label }: { value: string | number; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative w-28 shrink-0">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-bold text-cocoa-400">+$</span>
      <input
        className="field !py-1.5 pr-2 pl-8 text-right text-sm tabular-nums"
        type="number"
        min={0}
        max={100000}
        step="any"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Precio extra por pieza de ${label}`}
      />
    </label>
  );
}

function Section({ title, items, surcharges, set, setMany }: { title: string; items: Dessert[]; surcharges: Surcharges; set: (id: string, v: string) => void; setMany: (ids: string[], v: string) => void }) {
  const [all, setAll] = useState("");
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-cocoa-800/8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-cocoa-700">{title}</p>
        {items.length > 1 && (
          <div className="flex items-center gap-1.5">
            <AmountInput value={all} onChange={setAll} label={`todos los de ${title}`} />
            <button
              type="button"
              onClick={() => {
                setMany(items.map((d) => d.id), all);
                setAll("");
              }}
              className="rounded-lg bg-cream-100 px-2.5 py-1.5 text-xs font-bold text-cocoa-600 hover:bg-cream-200"
            >
              Aplicar a todos
            </button>
          </div>
        )}
      </div>
      <ul className="grid gap-x-6 gap-y-2 md:grid-cols-2">
        {items.map((d) => {
          const v = surcharges[d.id];
          const has = surchargeOf(surcharges, d.id) > 0;
          return (
            <li key={d.id} className="flex items-center justify-between gap-2">
              <span className={cn("min-w-0 flex-1 text-sm leading-tight break-words", has ? "font-bold text-cocoa-800" : "text-cocoa-600")}>
                {d.name}
                {!has && <span className="block text-[11px] font-normal text-cocoa-400">incluido en el precio</span>}
              </span>
              <AmountInput value={v ?? ""} onChange={(x) => set(d.id, x)} label={d.name} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Suplemento por pieza de cada sabor disponible en la caja (lo que cuesta de más cada cupcake o pastel) */
export function SurchargesEditor({
  surcharges,
  onChange,
  cups,
  cakes,
  groups,
  pieces,
  nCakes,
  base,
}: {
  surcharges: Surcharges;
  onChange: (next: Surcharges) => void;
  cups: Dessert[];
  cakes: Dessert[];
  groups: FlavorGroup[];
  pieces: number;
  nCakes: number;
  /** Precio base (con empaque) para el ejemplo */
  base: number;
}) {
  const set = (id: string, v: string) => {
    const next = { ...surcharges };
    if (v === "") delete next[id];
    else next[id] = v as unknown as number;
    onChange(next);
  };
  const setMany = (ids: string[], v: string) => {
    const next = { ...surcharges };
    for (const id of ids) {
      if (v === "") delete next[id];
      else next[id] = v as unknown as number;
    }
    onChange(next);
  };
  const sections = useMemo(() => {
    const out: { title: string; items: Dessert[] }[] = [];
    const named = groups.map((g) => ({ title: g.name, items: cups.filter((d) => d.flavor_group_id === g.id) })).filter((s) => s.items.length);
    const rest = cups.filter((d) => !groups.some((g) => g.id === d.flavor_group_id));
    out.push(...named);
    if (rest.length) out.push({ title: named.length ? "Otros sabores" : "Sabores", items: rest });
    return out;
  }, [cups, groups]);

  // Ejemplo con el sabor de mayor suplemento
  const top = [...cups, ...cakes].sort((a, b) => surchargeOf(surcharges, b.id) - surchargeOf(surcharges, a.id))[0];
  const topCup = [...cups].sort((a, b) => surchargeOf(surcharges, b.id) - surchargeOf(surcharges, a.id))[0];
  const topSur = top ? surchargeOf(surcharges, top.id) : 0;
  const exCups = pieces > 0 && topCup && surchargeOf(surcharges, topCup.id) > 0;

  return (
    <div className="rounded-3xl bg-cream-100 p-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-500"><Plus className="h-4 w-4" /></span>
        <div>
          <p className="font-semibold text-cocoa-700">Precio extra por sabor <span className="font-normal text-cocoa-400">(opcional)</span></p>
          <p className="text-xs text-cocoa-500">
            Deja vacío lo que va incluido en el precio base. Escribe cuánto se cobra de más <b>por cada pieza</b> de los sabores especiales. La clienta ve cómo sube el precio mientras elige.
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2.5">
        {nCakes > 0 && cakes.length > 0 && <Section title="Pastel mini" items={cakes} surcharges={surcharges} set={set} setMany={setMany} />}
        {sections.map((s) => <Section key={s.title} title={s.title} items={s.items} surcharges={surcharges} set={set} setMany={setMany} />)}
      </div>
      <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs leading-relaxed text-cocoa-500 ring-1 ring-cocoa-800/8">
        <b className="text-cocoa-700">Precio final = precio base + suplementos de los sabores elegidos.</b>{" "}
        {exCups ? (
          <>
            Ej.: {pieces} de {topCup.name} = {money(base)} + {pieces} × {money(surchargeOf(surcharges, topCup.id))} = <b className="text-rose-600">{money(finalPrice(base, surcharges, [{ dessert_id: topCup.id, qty: pieces }]))}</b>
            {" · "}solo sabores incluidos = <b>{money(base)}</b>.
          </>
        ) : topSur > 0 ? (
          <>Ej.: con {top.name} = {money(base)} + {money(topSur)} = <b className="text-rose-600">{money(base + topSur)}</b>.</>
        ) : (
          <>Ej.: caja de 6 con 1 sabor de +$6 y otro de +$14 = base + $20.</>
        )}
      </p>
    </div>
  );
}
