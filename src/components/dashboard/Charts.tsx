"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, num, parseDate } from "@/lib/format";

/** Paleta de gráficas (validada para daltonismo): rosa de marca + verde profundo para contraste */
export const CHART = {
  rose: "#eb5473",
  green: "#2e8f6a",
  grid: "rgba(63,37,13,0.07)",
  axis: "#a87b55",
};

export function SalesAreaChart({ data, height = 260, granularity = "day" }: { data: { day: string; total: number }[]; height?: number; granularity?: "day" | "week" | "month" }) {
  const fmtTick = (d: string) => {
    const dt = parseDate(d)!;
    return granularity === "month"
      ? dt.toLocaleDateString("es-MX", { month: "short" })
      : dt.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="roseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.rose} stopOpacity={0.28} />
              <stop offset="100%" stopColor={CHART.rose} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="day" tickFormatter={fmtTick} tickLine={false} axisLine={false} tick={{ fill: CHART.axis, fontSize: 10 }} minTickGap={28} />
          <YAxis
            tickFormatter={(v: number) => "$" + new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(v)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART.axis, fontSize: 10 }}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: CHART.rose, strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-2xl border border-cocoa-800/5 bg-white px-3.5 py-2.5 text-sm shadow-lift">
                  <p className="text-xs text-cocoa-400 capitalize">
                    {granularity === "month"
                      ? parseDate(payload[0].payload.day)!.toLocaleDateString("es-MX", { month: "long", year: "numeric" })
                      : (granularity === "week" ? "Semana del " : "") + parseDate(payload[0].payload.day)!.toLocaleDateString("es-MX", { weekday: granularity === "day" ? "short" : undefined, day: "numeric", month: "long" })}
                  </p>
                  <p className="font-display text-lg font-semibold text-cocoa-800">{money(payload[0].value as number)}</p>
                </div>
              ) : null
            }
          />
          <Area type="monotone" dataKey="total" stroke={CHART.rose} strokeWidth={2} fill="url(#roseFill)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras horizontales en HTML: ranking legible en móvil, etiqueta directa y tooltip nativo */
export function BarList({
  items,
  valueFormat = (v) => money(v),
  color = CHART.rose,
  max = 8,
  sub,
}: {
  items: { name: string; value: number; extra?: string }[];
  valueFormat?: (v: number) => string;
  color?: string;
  max?: number;
  sub?: (i: { name: string; value: number; extra?: string }) => string | undefined;
}) {
  const top = items.slice(0, max);
  const peak = Math.max(...top.map((i) => i.value), 1);
  if (!top.length) return <p className="py-8 text-center text-sm text-cocoa-400">Aún no hay datos en este periodo</p>;
  return (
    <ul className="space-y-3">
      {top.map((i, idx) => (
        <li key={i.name} className="group" title={`${i.name}: ${valueFormat(i.value)}${i.extra ? ` · ${i.extra}` : ""}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="w-4 shrink-0 text-xs font-bold text-cocoa-300">{idx + 1}</span>
              <span className="truncate font-semibold text-cocoa-700">{i.name}</span>
            </span>
            <span className="shrink-0 font-semibold text-cocoa-700 tabular-nums">
              {valueFormat(i.value)}
              {sub?.(i) && <span className="ml-1.5 text-xs font-normal text-cocoa-400">{sub(i)}</span>}
            </span>
          </div>
          <div className="ml-6 h-2 rounded-full bg-cream-200">
            <div className="h-full rounded-full transition-all duration-700 group-hover:brightness-110" style={{ width: `${(i.value / peak) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const qtyFmt = (v: number) => `${num(v, 0)} pzas`;
