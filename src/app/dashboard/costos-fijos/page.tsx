"use client";
import { useEffect, useState } from "react";
import { Clock, Plus, Receipt, Save, Trash2, CalendarDays, Sun } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Card, CardHeader, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { money } from "@/lib/format";
import type { FixedCost } from "@/lib/types";

type Row = { id?: string; name: string; monthly_amount: number | string; _dirty?: boolean };

export default function FixedCostsPage() {
  const sb = createClient();
  const { profile, setProfile } = useBusiness();
  const { data, loading, reload } = useAsync(async () => must(await sb.from("fixed_costs").select("*").order("created_at")) as FixedCost[]);
  const [rows, setRows] = useState<Row[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [days, setDays] = useState(profile.days_per_month);
  const [hours, setHours] = useState(profile.hours_per_day);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setRows(data.map((d) => ({ ...d })));
  }, [data]);

  const monthly = rows.reduce((a, r) => a + (Number(r.monthly_amount) || 0), 0);
  const daily = monthly / (Number(days) || 30);
  const hourly = daily / (Number(hours) || 8);
  const dirty = rows.some((r) => r._dirty || !r.id) || removed.length > 0 || days !== profile.days_per_month || hours !== profile.hours_per_day;

  async function saveAll() {
    setSaving(true);
    try {
      if (removed.length) must(await sb.from("fixed_costs").delete().in("id", removed));
      const upd = rows.filter((r) => r.id && r._dirty);
      for (const r of upd) must(await sb.from("fixed_costs").update({ name: r.name, monthly_amount: Number(r.monthly_amount) || 0 }).eq("id", r.id!));
      const ins = rows.filter((r) => !r.id && r.name.trim());
      if (ins.length) must(await sb.from("fixed_costs").insert(ins.map((r) => ({ name: r.name.trim(), monthly_amount: Number(r.monthly_amount) || 0 }))));
      if (days !== profile.days_per_month || hours !== profile.hours_per_day) {
        const p = must(await sb.from("profiles").update({ days_per_month: Number(days) || 30, hours_per_day: Number(hours) || 8 }).eq("id", profile.id).select().single());
        setProfile(p);
      }
      setRemoved([]);
      toast.success("Gastos fijos guardados — tus costos se recalcularon");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Lo que cuesta abrir la cocina"
        title="Gastos fijos"
        subtitle="Renta, luz, gas, sueldos… Se reparten por hora de trabajo y se suman al costo de cada receta según las horas que te toma prepararla."
        actions={
          <Button onClick={saveAll} loading={saving} disabled={!dirty}>
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Al mes" value={money(monthly)} icon={<CalendarDays className="h-5 w-5" />} tone="cocoa" />
        <StatCard label="Al día" value={money(daily)} hint={`Entre ${days} días`} icon={<Sun className="h-5 w-5" />} tone="mint" />
        <StatCard label="Por hora de trabajo" value={money(hourly)} hint={`Jornada de ${hours} h`} icon={<Clock className="h-5 w-5" />} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Conceptos" subtitle="Monto mensual de cada gasto" icon={<Receipt className="h-5 w-5" />} />
          <div className="p-5 sm:p-6">
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <div className="space-y-2.5">
                {rows.map((r, idx) => (
                  <div key={r.id ?? `n${idx}`} className="flex items-center gap-2">
                    <input
                      className="field flex-1"
                      value={r.name}
                      placeholder="Concepto (ej. Renta)"
                      onChange={(e) => setRows(rows.map((x, i) => (i === idx ? { ...x, name: e.target.value, _dirty: true } : x)))}
                    />
                    <div className="relative w-36 sm:w-44">
                      <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-cocoa-400">$</span>
                      <input
                        className="field pl-7 text-right tabular-nums"
                        type="number"
                        step="any"
                        min={0}
                        value={r.monthly_amount}
                        onChange={(e) => setRows(rows.map((x, i) => (i === idx ? { ...x, monthly_amount: e.target.value, _dirty: true } : x)))}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Quitar"
                      onClick={() => {
                        if (r.id) setRemoved([...removed, r.id]);
                        setRows(rows.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => setRows([...rows, { name: "", monthly_amount: 0 }])}>
                  <Plus className="h-4 w-4" /> Agregar concepto
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="h-fit p-6">
          <h3 className="text-lg font-semibold">Tu jornada</h3>
          <p className="mt-1 text-sm text-cocoa-400">Con esto calculamos cuánto te cuesta cada hora en la cocina.</p>
          <div className="mt-5 space-y-4">
            <Input label="Días de trabajo al mes" type="number" min={1} max={31} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            <Input label="Horas de trabajo al día" type="number" min={1} max={24} step="0.5" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </div>
          <div className="mt-6 rounded-2xl bg-cream-200/70 p-4 text-sm text-cocoa-500">
            <p>
              <b className="text-cocoa-700">Ejemplo:</b> un pastel que te lleva 2 horas absorbe <b className="text-rose-500">{money(hourly * 2)}</b> de gastos fijos.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
