"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Package, Plus, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { Extra, Ingredient } from "@/lib/types";

export type PickerOption = { id: string; name: string; price: number; note?: string };

/** Selector compacto de varias opciones: eliges una o varias de una vez y se agregan con "Agregar" */
export function MultiPicker({
  label,
  addLabel,
  noun,
  nounPlural,
  hint,
  empty,
  options,
  value,
  onChange,
  icon: Icon = Package,
}: {
  label: string;
  addLabel: string;
  noun: string;
  nounPlural: string;
  hint: string;
  empty: string;
  options: PickerOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  icon?: typeof Package;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const chosen = value.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x);
  const total = Math.round(chosen.reduce((a, o) => a + Number(o.price ?? 0), 0) * 100) / 100;
  const available = useMemo(() => {
    const n = q.trim().toLowerCase();
    return options.filter((o) => !value.includes(o.id) && (!n || o.name.toLowerCase().includes(n)));
  }, [options, value, q]);

  // se abre hacia arriba cuando abajo no hay espacio (por ejemplo, dentro de una ventana)
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 110;
    setUp(below < 330 && r.top > below);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key, true);
    };
  }, [open]);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const add = () => {
    if (sel.length) onChange([...value, ...sel.filter((id) => !value.includes(id))]);
    setSel([]);
    setQ("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <span className="label">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {chosen.map((o) => (
          <span key={o.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-rose-50 py-1 pr-1 pl-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
            <span className="truncate">{o.name}{o.note && <span className="ml-1 text-[11px] font-normal opacity-70">({o.note})</span>}</span>
            <span className="text-xs font-normal text-rose-500">+{money(o.price)}</span>
            <button type="button" onClick={() => onChange(value.filter((id) => id !== o.id))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-rose-100" aria-label={`Quitar ${o.name}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-rose-300 px-3 py-1 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
        >
          <Plus className="h-4 w-4" /> {chosen.length ? "Agregar" : addLabel}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-cocoa-500">
        {hint}
        {chosen.length > 0 && <> · <b className="text-cocoa-700">{money(total)}</b> en {chosen.length === 1 ? `1 ${noun}` : `${chosen.length} ${nounPlural}`}</>}.
      </p>

      {open && (
        <div className={cn("absolute left-0 z-30 w-full min-w-[260px] max-w-sm overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-cocoa-800/10", up ? "bottom-full mb-2" : "top-full mt-2")}>
          <div className="relative border-b border-cocoa-800/8 p-2">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-cocoa-400" />
            <input autoFocus className="field !py-2 pl-9 text-sm" placeholder={`Buscar ${noun}…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Buscar ${noun}`} />
          </div>
          <ul className="max-h-[min(14rem,40vh)] overflow-y-auto p-1.5" role="listbox" aria-multiselectable="true">
            {available.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-cocoa-400">
                {options.length === 0 ? empty : value.length === options.length ? "Ya agregaste todos" : "Sin resultados"}
              </li>
            )}
            {available.map((o) => {
              const on = sel.includes(o.id);
              return (
                <li key={o.id} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => toggle(o.id)}
                    className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition", on ? "bg-rose-50" : "hover:bg-cream-100")}
                  >
                    <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md ring-1", on ? "bg-rose-500 text-white ring-rose-500" : "bg-white text-transparent ring-cocoa-800/20")}>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <Icon className="h-4 w-4 shrink-0 text-cocoa-300" />
                    <span className="min-w-0 flex-1 truncate font-semibold text-cocoa-700">{o.name}{o.note && <span className="ml-1.5 text-[11px] font-normal text-cocoa-400">({o.note})</span>}</span>
                    <span className="shrink-0 text-xs font-bold text-cocoa-500 tabular-nums">+{money(o.price)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-cocoa-800/8 bg-cream-50 p-2">
            <span className="pl-2 text-xs whitespace-nowrap text-cocoa-500">{sel.length ? `${sel.length} elegido${sel.length === 1 ? "" : "s"}` : "Marca una o varias"}</span>
            <button type="button" disabled={!sel.length} onClick={add} className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-4 py-1.5 whitespace-nowrap text-sm font-bold text-white transition enabled:hover:bg-rose-600 disabled:opacity-40">
              <Plus className="h-4 w-4" /> Agregar{sel.length > 1 ? ` (${sel.length})` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Cajas y empaques de un paquete (caja, vaso, papel…): se cobran a la clienta */
export function PackagingPicker({ options, value, onChange }: { options: Pick<Ingredient, "id" | "name" | "unit_cost">[]; value: string[]; onChange: (ids: string[]) => void }) {
  return (
    <MultiPicker
      label="Cajas y empaques"
      addLabel="Agregar caja o empaque"
      noun="empaque"
      nounPlural="empaques"
      hint="Se le cobra a tu clienta: se suma al precio del paquete"
      empty='Aún no tienes empaques. Créalos en Inventario con el tipo "Empaque".'
      options={options.map((o) => ({ id: o.id, name: o.name, price: Number(o.unit_cost ?? 0) }))}
      value={value}
      onChange={onChange}
    />
  );
}

/** Extras que la clienta puede agregar a su pedido (listón, moño, tarjeta…) */
export function ExtrasPicker({ options, value, onChange }: { options: Pick<Extra, "id" | "name" | "price" | "available">[]; value: string[]; onChange: (ids: string[]) => void }) {
  return (
    <MultiPicker
      label="Extras que puede agregar"
      addLabel="Agregar extra"
      noun="extra"
      nounPlural="extras"
      hint="La clienta los elige y se suman a su pedido"
      empty="Crea tu catálogo (listón, moño, tarjeta…) en la pestaña Extras."
      options={options.map((o) => ({ id: o.id, name: o.name, price: Number(o.price ?? 0), note: o.available ? undefined : "agotado" }))}
      value={value}
      onChange={onChange}
      icon={Sparkles}
    />
  );
}
