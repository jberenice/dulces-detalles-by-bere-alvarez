"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { matches } from "./SearchInput";

export type ComboOption = { value: string; label: string; hint?: string };

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  onCreate,
  createLabel = "Crear",
  className,
}: {
  value: string | null;
  onChange: (v: string) => void;
  options: ComboOption[];
  placeholder?: string;
  onCreate?: (text: string) => void;
  createLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => options.filter((o) => matches(q, o.label)).slice(0, 60), [options, q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className="relative">
        <input
          className="field pr-9"
          value={open ? q : selected?.label ?? ""}
          placeholder={selected?.label ?? placeholder}
          onFocus={() => {
            setOpen(true);
            setHi(0);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setHi(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHi((h) => Math.min(h + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHi((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[hi]) pick(filtered[hi].value);
              else if (onCreate && q.trim()) {
                onCreate(q.trim());
                setOpen(false);
              }
            } else if (e.key === "Escape") setOpen(false);
          }}
        />
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1.5 max-h-72 w-full min-w-[240px] overflow-y-auto rounded-2xl border border-cocoa-800/8 bg-white p-1.5 shadow-lift">
          {filtered.map((o, i) => (
            <button
              key={o.value}
              type="button"
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(o.value)}
              className={cn("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm", i === hi ? "bg-rose-50 text-rose-700" : "text-cocoa-700")}
            >
              <span className="truncate">{o.label}</span>
              {o.hint && <span className="shrink-0 text-xs text-cocoa-400">{o.hint}</span>}
            </button>
          ))}
          {filtered.length === 0 && !onCreate && <p className="px-3 py-2 text-sm text-cocoa-400">Sin resultados</p>}
          {onCreate && q.trim() && (
            <button
              type="button"
              onClick={() => {
                onCreate(q.trim());
                setOpen(false);
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-cocoa-800/5 px-3 py-2 text-left text-sm font-bold text-mint-600 hover:bg-mint-50"
            >
              <Plus className="h-4 w-4" /> {createLabel} «{q.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}
