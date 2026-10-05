"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, parseDate, toISODate } from "@/lib/format";
import { cn } from "@/lib/cn";

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];

/** Calendario para elegir la fecha de entrega: marca días llenos y respeta la anticipación mínima */
export function DeliveryCalendar({
  value,
  onChange,
  today,
  minNotice,
  unavailable,
}: {
  value: string;
  onChange: (v: string) => void;
  today: string;
  minNotice: number;
  unavailable: string[];
}) {
  const base = parseDate(today) ?? new Date();
  const min = addDays(base, minNotice);
  const max = addDays(base, 365);
  const [month, setMonth] = useState(() => {
    const start = parseDate(value) ?? min;
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });
  const blocked = useMemo(() => new Set(unavailable), [unavailable]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // semana inicia en lunes
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const canPrev = month > new Date(min.getFullYear(), min.getMonth(), 1);
  const canNext = month < new Date(max.getFullYear(), max.getMonth(), 1);
  const label = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(month);

  return (
    <div className="rounded-3xl bg-cream-50 p-3 ring-1 ring-cocoa-800/5 select-none">
      <div className="mb-2 flex items-center justify-between px-1">
        <button type="button" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-8 w-8 place-items-center rounded-full text-cocoa-500 hover:bg-white disabled:opacity-30" aria-label="Mes anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold text-cocoa-700 capitalize">{label}</p>
        <button type="button" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-8 w-8 place-items-center rounded-full text-cocoa-500 hover:bg-white disabled:opacity-30" aria-label="Mes siguiente">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEK.map((d, i) => (
          <span key={i} className="py-1 text-[10.5px] font-bold text-cocoa-300">{d}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const iso = toISODate(d);
          const full = blocked.has(iso);
          const off = d < min || d > max;
          const selected = iso === value;
          return (
            <button
              key={i}
              type="button"
              disabled={off || full}
              onClick={() => onChange(iso)}
              title={full ? "Sin cupo" : off ? "Requiere más anticipación" : undefined}
              className={cn(
                "relative aspect-square rounded-xl text-sm font-semibold transition",
                selected
                  ? "bg-[var(--st-primary)] text-[var(--st-on-primary)] shadow-md"
                  : full
                    ? "cursor-not-allowed text-cocoa-300 line-through decoration-rose-400"
                    : off
                      ? "cursor-not-allowed text-cocoa-300/45"
                      : "text-cocoa-700 hover:bg-white hover:ring-1 hover:ring-[var(--st-primary)]",
              )}
            >
              {d.getDate()}
              {full && !off && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose-400" />}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-cocoa-400">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Sin cupo</span>
        <span>Pedidos con {minNotice} día{minNotice === 1 ? "" : "s"} de anticipación</span>
      </div>
    </div>
  );
}

/** Primer día disponible a partir de la anticipación mínima */
export function firstAvailable(today: string, minNotice: number, unavailable: string[]) {
  const set = new Set(unavailable);
  let d = addDays(parseDate(today) ?? new Date(), minNotice);
  for (let i = 0; i < 366 && set.has(toISODate(d)); i++) d = addDays(d, 1);
  return toISODate(d);
}
