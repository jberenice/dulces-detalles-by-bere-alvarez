"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Pencil, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { useCatalog } from "@/hooks/useCatalog";
import { Badge, Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { money, num } from "@/lib/format";
import { kindOf } from "@/lib/packages";
import { DEFAULT_MIN_MARGIN, marginReport, type MarginScenario, type PackageMarginReport } from "@/lib/pricing";
import type { Package, Profile } from "@/lib/types";

/** Margen bruto mínimo configurado (por defecto 35 %) */
export const useMinMargin = () => {
  const { profile } = useBusiness();
  const v = Number(profile.min_margin_pct);
  return Number.isFinite(v) && v >= 0 ? v : DEFAULT_MIN_MARGIN;
};

type Catalog = ReturnType<typeof useCatalog>;

/** Reporte de margen de cada paquete activo contra el objetivo */
export function usePackageReports(catalog: Catalog, target: number) {
  const { data, costs, ingredientsById } = catalog;
  return useMemo(() => {
    if (!data) return [];
    return data.packages
      .filter((p) => p.active)
      .map((pkg) => ({ pkg, report: marginReport(pkg, data.desserts, costs, ingredientsById, target) }))
      .filter((r) => r.report.scenarios.length > 0);
  }, [data, costs, ingredientsById, target]);
}

const tone = (m: number, target: number) => (m >= target ? "text-mint-700" : m >= target - 10 ? "text-amber-600" : "text-rose-600");

/** Qué sabores quedan por debajo del objetivo y qué precio los arreglaría */
export function MarginProblems({ report, pkg, target, compact = false }: { report: PackageMarginReport; pkg: Pick<Package, "price" | "kind" | "mode" | "pieces">; target: number; compact?: boolean }) {
  const isFixed = pkg.mode === "fijo";
  return (
    <div>
      <div className="overflow-x-auto rounded-2xl ring-1 ring-rose-200/70">
        <table className="w-full min-w-[460px] text-left text-sm">
          <thead className="bg-rose-50 text-[11px] font-bold tracking-wider text-rose-700 uppercase">
            <tr>
              <th className="px-3 py-2">{isFixed ? "Paquete" : "Combinación"}</th>
              <th className="px-3 py-2 text-right">Margen</th>
              {!isFixed && <th className="px-3 py-2 text-right">Suplemento</th>}
              <th className="px-3 py-2 text-right">Precio necesario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-100 bg-white">
            {report.bad.slice(0, compact ? 4 : 40).map((s: MarginScenario) => (
              <tr key={s.label}>
                <td className="px-3 py-2 font-semibold text-cocoa-700">{s.label}</td>
                <td className="px-3 py-2 text-right font-bold text-rose-600 tabular-nums">{num(s.margin, 1)}%</td>
                {!isFixed && (
                  <td className="px-3 py-2 text-right tabular-nums text-cocoa-600">
                    {money(s.surcharge)} <span className="text-cocoa-300">→</span> <b className="text-cocoa-800">{money(s.needSurcharge ?? 0)}</b>
                    <span className="block text-[10px] text-cocoa-400">por pieza</span>
                  </td>
                )}
                <td className="px-3 py-2 text-right tabular-nums text-cocoa-600">
                  <b className="text-cocoa-800">{money(s.needTotal)}</b>
                  <span className="block text-[10px] text-cocoa-400">hoy {money(s.revenue)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.bad.length > (compact ? 4 : 40) && <p className="mt-1.5 text-xs text-cocoa-400">…y {report.bad.length - (compact ? 4 : 40)} combinaciones más.</p>}
      <p className="mt-2 text-xs leading-relaxed text-cocoa-500">
        Para que <b>todas</b> las combinaciones lleguen a {num(target, 0)}% subirías el precio base de {money(pkg.price)} a <b className="text-rose-600">{money(report.needBase)}</b>
        {isFixed ? "." : ", o subirías el suplemento de los sabores marcados."}
      </p>
    </div>
  );
}

/** Aviso en el panel de inicio cuando alguna caja baja del margen mínimo */
export function PackageMarginAlert() {
  const catalog = useCatalog();
  const target = useMinMargin();
  const rows = usePackageReports(catalog, target);
  const bad = rows.filter((r) => !r.report.ok);
  if (catalog.loading || !bad.length) return null;
  const flavors = [...new Set(bad.flatMap((r) => r.report.bad.map((s) => s.flavorName)))];
  return (
    <Link href="/dashboard/paquetes" className="mb-6 flex items-start gap-3 rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200/80 transition hover:bg-rose-100/70">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600"><AlertTriangle className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-rose-800">
          {bad.length} caja{bad.length === 1 ? "" : "s"} o paquete{bad.length === 1 ? "" : "s"} por debajo de tu margen mínimo de {num(target, 0)}%
        </p>
        <p className="text-sm text-rose-700">
          {bad.map((r) => `${r.pkg.name} (${num(r.report.worst?.margin ?? 0, 1)}%)`).slice(0, 3).join(" · ")}
          {bad.length > 3 ? ` · +${bad.length - 3}` : ""}
          {flavors.length > 0 && flavors[0] !== "Contenido fijo" ? ` — sabores: ${flavors.slice(0, 4).join(", ")}${flavors.length > 4 ? "…" : ""}` : ""}
        </p>
      </div>
      <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-rose-600" />
    </Link>
  );
}

/** Objetivo de margen + lista de cajas que no lo cumplen */
export function PackageMarginPanel({ catalog, onEdit }: { catalog: Catalog; onEdit: (p: Package) => void }) {
  const sb = createClient();
  const { profile, setProfile } = useBusiness();
  const target = useMinMargin();
  const [draft, setDraft] = useState(String(target));
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(String(target)), [target]);
  const rows = usePackageReports(catalog, target);
  const bad = rows.filter((r) => !r.report.ok);
  const [open, setOpen] = useState<string | null>(null);

  async function save() {
    const v = Math.round(Number(draft) * 10) / 10;
    if (!Number.isFinite(v) || v < 0 || v > 95) {
      setDraft(String(target));
      return toast.error("El margen mínimo va de 0 a 95%");
    }
    if (v === target) return;
    setSaving(true);
    const { data: p, error } = await sb.from("profiles").update({ min_margin_pct: v }).eq("id", profile.id).select().single();
    setSaving(false);
    if (error) {
      setDraft(String(target));
      return toast.error(/min_margin/.test(error.message) ? "Falta ejecutar la migración 0021 en Supabase" : error.message);
    }
    setProfile(p as Profile);
    toast.success(`Margen mínimo: ${num(v, 1)}%`);
  }

  if (catalog.loading || !rows.length) return null;
  return (
    <Card className={cn("mb-6 overflow-hidden", bad.length ? "ring-2 ring-rose-300/70" : "")}>
      <CardHeader
        icon={bad.length ? <AlertTriangle className="h-5 w-5 text-rose-500" /> : <ShieldCheck className="h-5 w-5 text-mint-600" />}
        title="Margen bruto mínimo"
        subtitle="Revisamos todas las combinaciones de sabores de cada caja con sus suplementos. Margen = (lo que paga la clienta − lo que te cuesta) ÷ lo que paga."
        action={
          <label className="flex items-center gap-2 text-sm font-semibold text-cocoa-600">
            Objetivo
            <span className="relative">
              <input
                className="field !w-24 !py-1.5 pr-7 text-right tabular-nums"
                type="number"
                min={0}
                max={95}
                step="any"
                inputMode="decimal"
                value={draft}
                disabled={saving}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur(), undefined)}
                aria-label="Margen bruto mínimo en porcentaje"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-cocoa-400">%</span>
            </span>
          </label>
        }
      />
      <div className="space-y-3 p-4 sm:p-5">
        {bad.length === 0 ? (
          <p className="flex items-center gap-2 rounded-2xl bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-800">
            <CheckCircle2 className="h-4 w-4" /> Todas tus cajas y paquetes cumplen el {num(target, 0)}% en cualquier combinación de sabores.
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {bad.length} de {rows.length} quedan por debajo de {num(target, 0)}% en alguna combinación. Revisa cuáles sabores o tamaños lo causan:
            </p>
            {bad.map(({ pkg, report }) => {
              const isOpen = open === pkg.id || bad.length === 1;
              return (
                <div key={pkg.id} className="rounded-2xl bg-white p-3 ring-1 ring-rose-200/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button type="button" onClick={() => setOpen(isOpen && bad.length > 1 ? null : pkg.id)} className="min-w-0 text-left">
                      <span className="font-display text-lg font-semibold text-cocoa-700">{pkg.name}</span>
                      <span className="ml-2 text-xs text-cocoa-400">
                        {pkg.mode === "fijo" ? "contenido fijo" : `${pkg.pieces} ${kindOf(pkg) === "pastel" ? "cupcakes + pastel" : "piezas"}`}
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="danger">peor caso {num(report.worst?.margin ?? 0, 1)}%</Badge>
                      <Badge tone="warning">{report.bad.length} de {report.scenarios.length} combinaciones</Badge>
                      <button type="button" onClick={() => onEdit(pkg)} className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                    </div>
                  </div>
                  {isOpen ? (
                    <div className="mt-3"><MarginProblems report={report} pkg={pkg} target={target} /></div>
                  ) : (
                    <p className={cn("mt-1 text-xs", tone(report.worst?.margin ?? 0, target))}>
                      Sabores con problema: {[...new Set(report.bad.map((s) => s.flavorName))].slice(0, 6).join(", ")} · precio base necesario {money(report.needBase)} (hoy {money(pkg.price)}) — toca el nombre para ver el detalle
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </Card>
  );
}
