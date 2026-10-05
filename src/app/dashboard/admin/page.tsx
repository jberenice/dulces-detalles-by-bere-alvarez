"use client";
import Link from "next/link";
import { AlarmClock, BadgeDollarSign, CalendarPlus, KeyRound, MessageCircle, PlayCircle, Repeat, ShieldOff, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { SalesAreaChart } from "@/components/dashboard/Charts";
import { BILLING_LABEL, PLANS, planName, type Billing, type PlanId } from "@/lib/plans";
import { date, money, money0, waLink } from "@/lib/format";

type Metrics = {
  active: number;
  expiring_30: number;
  expired: number;
  available: number;
  suspended: number;
  new_month: number;
  revenue_month: number;
  revenue_year: number;
  revenue_total: number;
  mrr: number;
  demos_month: number;
  demos_total: number;
  by_plan: Partial<Record<PlanId, number>>;
  monthly: { month: string; activations: number; revenue: number; demos: number }[];
  expiring: { id: string; code: string; plan: PlanId; billing: Billing; expires_at: string; email: string | null; business_name: string | null; whatsapp: string | null }[];
};

const PLAN_COLOR: Record<PlanId, string> = { basico: "bg-mint-400", profesional: "bg-rose-400", premium: "bg-cocoa-500" };

export default function AdminMetricsPage() {
  const { profile } = useBusiness();
  const sb = createClient();
  const { data: m, loading } = useAsync(async () => must(await sb.rpc("admin_metrics")) as Metrics);

  if (profile.role !== "admin") return <EmptyState icon={<ShieldOff className="h-8 w-8" />} title="Solo para administración" />;

  const months = m?.monthly ?? [];
  const maxBar = Math.max(1, ...months.map((x) => Math.max(x.activations, x.demos)));
  const planTotal = Object.values(m?.by_plan ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  const conversion = m && m.demos_month ? Math.round((m.new_month / m.demos_month) * 100) : null;
  const monthLabel = (s: string) => new Date(`${s}-01T12:00:00`).toLocaleDateString("es-MX", { month: "short" });

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Métricas del negocio"
        subtitle="Cómo van tus licencias, tus ingresos y cuántas personas prueban la demo."
        actions={<ButtonLink href="/dashboard/admin/licencias"><KeyRound className="h-4 w-4" /> Licencias</ButtonLink>}
      />

      {loading || !m ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Licencias activas" value={m.active} icon={<Users />} tone="mint" hint={`${m.available} disponibles · ${m.suspended} suspendidas`} />
            <StatCard label="Por vencer (30 días)" value={m.expiring_30} icon={<AlarmClock />} tone="rose" hint={m.expired ? `${m.expired} ya vencidas` : "Ninguna vencida"} />
            <StatCard label="Nuevas este mes" value={m.new_month} icon={<CalendarPlus />} tone="cocoa" hint={conversion !== null ? `${conversion}% de las demos del mes` : undefined} />
            <StatCard label="Demos este mes" value={m.demos_month} icon={<PlayCircle />} tone="cream" hint={`${m.demos_total} en total`} />
            <StatCard label="Ingresos del mes" value={money0(m.revenue_month)} icon={<BadgeDollarSign />} tone="mint" />
            <StatCard label="Ingresos del año" value={money0(m.revenue_year)} icon={<BadgeDollarSign />} tone="cocoa" />
            <StatCard label="Ingreso recurrente" value={money0(m.mrr)} icon={<Repeat />} tone="rose" hint="Mensual estimado (anuales ÷ 12)" />
            <StatCard label="Ingresos totales" value={money0(m.revenue_total)} icon={<Sparkles />} tone="cream" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card className="overflow-hidden">
              <CardHeader title="Ingresos por mes" subtitle="Ventas y renovaciones registradas" icon={<BadgeDollarSign className="h-5 w-5" />} />
              <div className="px-2 pt-4 pb-3 sm:px-4">
                <SalesAreaChart data={months.map((x) => ({ day: `${x.month}-01`, total: Number(x.revenue) }))} granularity="month" />
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader title="Licencias por plan" subtitle="Activas y vigentes" icon={<KeyRound className="h-5 w-5" />} />
              <div className="p-4 sm:p-6">
                {planTotal === 0 ? (
                  <p className="text-sm text-cocoa-400">Aún no hay licencias activas.</p>
                ) : (
                  <>
                    <div className="flex h-4 overflow-hidden rounded-full bg-cream-200">
                      {PLANS.map((p) => (
                        <div key={p.id} className={PLAN_COLOR[p.id]} style={{ width: `${((m.by_plan[p.id] ?? 0) / planTotal) * 100}%` }} title={p.name} />
                      ))}
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {PLANS.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 text-sm">
                          <span className={`h-3 w-3 rounded-full ${PLAN_COLOR[p.id]}`} />
                          <span className="flex-1 font-semibold text-cocoa-600">{p.name}</span>
                          <span className="font-display text-lg font-semibold tabular-nums">{m.by_plan[p.id] ?? 0}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </Card>
          </div>

          <Card className="mt-6 overflow-hidden">
            <CardHeader title="Demos y activaciones" subtitle="Últimos 12 meses" icon={<PlayCircle className="h-5 w-5" />} />
            <div className="overflow-x-auto px-4 pt-5 pb-4 sm:px-6">
              <div className="flex h-44 min-w-[560px] items-end gap-2">
                {months.map((x) => (
                  <div key={x.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-36 w-full items-end justify-center gap-1">
                      <div className="w-1/3 rounded-t-md bg-cream-300" style={{ height: `${(x.demos / maxBar) * 100}%` }} title={`${x.demos} demos`} />
                      <div className="w-1/3 rounded-t-md bg-rose-400" style={{ height: `${(x.activations / maxBar) * 100}%` }} title={`${x.activations} activaciones`} />
                    </div>
                    <span className="text-[10px] font-bold text-cocoa-400 capitalize">{monthLabel(x.month)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-5 text-xs text-cocoa-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-cream-300" /> Demos</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Licencias activadas</span>
              </div>
            </div>
          </Card>

          <Card className="mt-6 overflow-hidden">
            <CardHeader title="Por vencer" subtitle="Escríbeles antes de que se les corte el acceso" icon={<AlarmClock className="h-5 w-5" />} />
            {m.expiring.length === 0 ? (
              <EmptyState icon={<AlarmClock className="h-8 w-8" />} title="Nada por vencer" description="Ninguna licencia vence en los próximos 30 días." />
            ) : (
              <ul className="mt-2 divide-y divide-cocoa-800/5">
                {m.expiring.map((l) => {
                  const past = new Date(l.expires_at) < new Date();
                  const msg = `¡Hola! Te escribo de Dulces Detalles 🧁 Tu plan ${planName(l.plan)} (${BILLING_LABEL[l.billing]}) ${past ? "venció" : "vence"} el ${date(l.expires_at, { day: "numeric", month: "long" })}. ¿Te ayudo a renovarlo para que no pierdas acceso a tu panel?`;
                  return (
                    <li key={l.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-cocoa-700">{l.business_name ?? l.email ?? l.code}</p>
                        <p className="truncate text-xs text-cocoa-400">{l.email} · {planName(l.plan)} {BILLING_LABEL[l.billing].toLowerCase()}</p>
                      </div>
                      <Badge tone={past ? "danger" : "warning"}>{past ? "Venció" : "Vence"} {date(l.expires_at, { day: "numeric", month: "short" })}</Badge>
                      {l.whatsapp && (
                        <a href={waLink(l.whatsapp, msg)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-mint-50 px-3 py-2 text-sm font-bold text-mint-700 hover:bg-mint-100">
                          <MessageCircle className="h-4 w-4" /> Recordar
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <p className="mt-4 text-center text-xs text-cocoa-400">
            Los ingresos se registran al generar licencias con precio y al renovarlas en <Link href="/dashboard/admin/licencias" className="font-semibold text-rose-500 hover:underline">Licencias</Link>. Total: {money(m.revenue_total)}.
          </p>
        </>
      )}
    </>
  );
}
