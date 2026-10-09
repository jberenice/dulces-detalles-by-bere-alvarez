"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Minus, Package, Plus, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { money, num } from "@/lib/format";
import type { Extra, Ingredient } from "@/lib/types";

export type PickerOption = {
  id: string;
  name: string;
  /** Precio por unidad que se cobra */
  price: number;
  note?: string;
  /** Existencias (solo si el inventario está activado) */
  stock?: number | null;
  unit?: string;
};

const clampQty = (n: number) => Math.min(1000, Math.max(0.01, Math.round(n * 100) / 100));

/** Selector compacto de varias opciones con cantidad: eliges una o varias de una vez y se agregan con "Agregar" */
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
  qtys,
  onQtyChange,
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
  /** Si se pasa, cada opción lleva cantidad (ej. 3 vasos) */
  qtys?: Record<string, number>;
  onQtyChange?: (id: string, qty: number) => void;
  icon?: typeof Package;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const qtyOf = (id: string) => (qtys ? Number(qtys[id]) || 1 : 1);
  const chosen = value.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => !!x);
  const total = Math.round(chosen.reduce((a, o) => a + Number(o.price ?? 0) * qtyOf(o.id), 0) * 100) / 100;
  const short = chosen.filter((o) => o.stock != null && o.stock < qtyOf(o.id));
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
      {qtys && onQtyChange && chosen.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {chosen.map((o) => {
            const n = qtyOf(o.id);
            const low = o.stock != null && o.stock < n;
            return (
              <li key={o.id} className={cn("flex items-center gap-2 rounded-2xl px-3 py-2 ring-1", low ? "bg-amber-50 ring-amber-300" : "bg-rose-50/60 ring-rose-200")}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-cocoa-700">{o.name}</span>
                  <span className={cn("block text-[11px]", low ? "font-bold text-amber-800" : "text-cocoa-400")}>
                    {money(o.price)} c/u{o.stock != null && <> · en stock: {num(o.stock, 2)}{o.unit ? ` ${o.unit}` : ""}</>}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center rounded-full bg-white ring-1 ring-black/10">
                  <button type="button" onClick={() => onQtyChange(o.id, clampQty(n - 1))} disabled={n <= 1} className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/5 disabled:opacity-30" aria-label={`Una menos de ${o.name}`}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    className="w-10 bg-transparent text-center text-sm font-bold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    type="number"
                    min={0.01}
                    max={1000}
                    step="any"
                    inputMode="decimal"
                    value={n}
                    onChange={(e) => e.target.value !== "" && onQtyChange(o.id, clampQty(Number(e.target.value)))}
                    aria-label={`Cantidad de ${o.name}`}
                  />
                  <button type="button" onClick={() => onQtyChange(o.id, clampQty(n + 1))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/5" aria-label={`Una más de ${o.name}`}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </span>
                <span className="w-16 shrink-0 text-right text-sm font-bold text-rose-600 tabular-nums">+{money(Number(o.price) * n)}</span>
                <button type="button" onClick={() => onChange(value.filter((id) => id !== o.id))} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-cocoa-400 hover:bg-black/5 hover:text-rose-600" aria-label={`Quitar ${o.name}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {!qtys && chosen.map((o) => (
          <span key={o.id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-rose-50 py-1 pr-1 pl-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
            <span className="truncate">{o.name}{o.note && <span className="ml-1 text-[11px] font-normal opacity-70">({o.note})</span>}</span>
            <span className="text-xs font-normal opacity-80">+{money(Number(o.price))}</span>
            <button type="button" onClick={() => onChange(value.filter((id) => id !== o.id))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-black/10" aria-label={`Quitar ${o.name}`}>
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
      {short.length > 0 && (
        <p className="mt-1.5 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            No te alcanza el inventario para un paquete: {short.map((o) => `${o.name} (necesitas ${num(qtyOf(o.id), 2)}, tienes ${num(o.stock ?? 0, 2)})`).join(" · ")}
          </span>
        </p>
      )}

      {open && (
        <div className={cn("absolute left-0 z-30 w-full min-w-[280px] max-w-sm overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-cocoa-800/10", up ? "bottom-full mb-2" : "top-full mt-2")}>
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
              const none = o.stock != null && o.stock <= 0;
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-cocoa-700">{o.name}{o.note && <span className="ml-1.5 text-[11px] font-normal text-cocoa-400">({o.note})</span>}</span>
                      {o.stock != null && (
                        <span className={cn("block text-[11px] font-semibold", none ? "text-rose-600" : o.stock <= 3 ? "text-amber-700" : "text-cocoa-400")}>
                          {none ? "Sin existencias" : `En stock: ${num(o.stock, 2)}${o.unit ? ` ${o.unit}` : ""}`}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-cocoa-500 tabular-nums">+{money(o.price)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-cocoa-800/8 bg-cream-50 p-2">
            <span className="pl-2 text-xs whitespace-nowrap text-cocoa-500">{sel.length ? `${sel.length} elegido${sel.length === 1 ? "" : "s"}` : "Marca una o varias"}</span>
            <button type="button" disabled={!sel.length} onClick={add} className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-4 py-1.5 text-sm font-bold whitespace-nowrap text-white transition enabled:hover:bg-rose-600 disabled:opacity-40">
              <Plus className="h-4 w-4" /> Agregar{sel.length > 1 ? ` (${sel.length})` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Cajas y empaques de un paquete (caja, vasos, papel…): se cobran a la clienta según la cantidad */
export function PackagingPicker({
  options,
  value,
  qtys,
  onChange,
  onQtyChange,
  inventoryOn,
}: {
  options: Pick<Ingredient, "id" | "name" | "unit_cost" | "stock" | "unit">[];
  value: string[];
  qtys: Record<string, number>;
  onChange: (ids: string[]) => void;
  onQtyChange: (id: string, qty: number) => void;
  inventoryOn: boolean;
}) {
  return (
    <MultiPicker
      label="Cajas y empaques"
      addLabel="Agregar caja o empaque"
      noun="empaque"
      nounPlural="empaques"
      hint="Se le cobra a tu clienta (costo × cantidad) y se descuenta de tu inventario al entregar"
      empty='Aún no tienes empaques. Créalos en Inventario con el tipo "Empaque".'
      options={options.map((o) => ({ id: o.id, name: o.name, price: Number(o.unit_cost ?? 0), stock: inventoryOn ? Number(o.stock ?? 0) : null, unit: o.unit }))}
      value={value}
      onChange={onChange}
      qtys={qtys}
      onQtyChange={onQtyChange}
    />
  );
}

/** Extras que la clienta puede agregar a su pedido (listón, moño, tarjeta…) */
export function ExtrasPicker({
  options,
  value,
  onChange,
  stockOf,
}: {
  options: Pick<Extra, "id" | "name" | "price" | "available" | "unit_label">[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** Existencias del extra (en unidades que vende), o null si no está ligado al inventario */
  stockOf: (id: string) => number | null;
}) {
  return (
    <MultiPicker
      label="Extras que puede agregar"
      addLabel="Agregar extra"
      noun="extra"
      nounPlural="extras"
      hint="La clienta los elige y se suman a su pedido"
      empty="Crea tu catálogo (listón, moño, tarjeta…) en la pestaña Extras."
      options={options.map((o) => ({
        id: o.id,
        name: o.name,
        price: Number(o.price ?? 0),
        note: o.available ? undefined : "agotado",
        stock: stockOf(o.id),
        unit: o.unit_label && o.unit_label !== "pieza" ? `${o.unit_label}s` : undefined,
      }))}
      value={value}
      onChange={onChange}
      icon={Sparkles}
    />
  );
}
