"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlarmClock, HandCoins, MessageCircle, PiggyBank, Users, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { PaymentModal } from "@/components/dashboard/PaymentModal";
import { getTemplate, renderTemplate } from "@/lib/templates";
import { ORDER_STATUS } from "@/lib/constants";
import { date, dateLong, folio, money, parseDate, waLink } from "@/lib/format";
import type { Order, OrderPayment } from "@/lib/types";

type Row = Pick<Order, "id" | "folio" | "status" | "delivery_date" | "delivery_time" | "total" | "deposit" | "customer_name" | "customer_phone" | "client_id"> & {
  clients: { id: string; name: string; phone: string | null } | null;
};
type PaymentRow = OrderPayment & { orders: { folio: number; customer_name: string | null; clients: { name: string } | null } | null };

const DAY = 86_400_000;

export default function BalancesPage() {
  const sb = createClient();
  const { profile } = useBusiness();
  const [tab, setTab] = useState<"pronto" | "clientes" | "cobros">("pronto");
  const [paying, setPaying] = useState<Row | null>(null);

  const { data, loading, reload } = useAsync(async () => {
    const [orders, payments] = await Promise.all([
      sb
        .from("orders")
        .select("id, folio, status, delivery_date, delivery_time, total, deposit, customer_name, customer_phone, client_id, clients(id, name, phone)")
        .neq("status", "cancelado")
        .order("delivery_date", { ascending: true, nullsFirst: false }),
      sb.from("order_payments").select("*, orders(folio, customer_name, clients(name))").order("paid_at", { ascending: false }).limit(40),
    ]);
    return {
      orders: (must(orders) as Row[]).filter((o) => Number(o.total) - Number(o.deposit) > 0.009),
      payments: must(payments) as PaymentRow[],
    };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const orders = data?.orders ?? [];
  const balance = (o: Row) => Math.max(Number(o.total) - Number(o.deposit), 0);
  const name = (o: Row) => o.clients?.name ?? o.customer_name ?? "Sin nombre";
  const phone = (o: Row) => o.clients?.phone ?? o.customer_phone;

  const soon = orders.filter((o) => o.delivery_date && parseDate(o.delivery_date)!.getTime() - today.getTime() <= 2 * DAY);
  const byClient = useMemo(() => {
    const m = new Map<string, { name: string; phone: string | null; total: number; orders: Row[] }>();
    for (const o of orders) {
      const key = o.client_id ?? `n:${name(o)}`;
      const g = m.get(key) ?? { name: name(o), phone: phone(o), total: 0, orders: [] };
      g.total += balance(o);
      g.orders.push(o);
      m.set(key, g);
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const totalOwed = orders.reduce((a, o) => a + balance(o), 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const collectedMonth = (data?.payments ?? []).filter((p) => new Date(p.paid_at).getTime() >= monthStart).reduce((a, p) => a + Number(p.amount), 0);

  function remind(o: Row) {
    const text = renderTemplate(getTemplate(profile, "recordatorio_pago"), {
      cliente: name(o).split(" ")[0],
      folio: folio("P", o.folio),
      total: money(o.total),
      anticipo: Number(o.deposit) > 0 ? money(o.deposit) : "",
      saldo: money(balance(o)),
      fecha: o.delivery_date ? dateLong(o.delivery_date) : "",
      hora: o.delivery_time ? `a las ${o.delivery_time}` : "",
      datos_pago: profile.bank_info ?? "",
      negocio: profile.business_name,
      tu_nombre: profile.owner_name ?? profile.business_name,
    });
    window.open(waLink(phone(o), text), "_blank", "noopener");
  }

  const OrderLine = ({ o }: { o: Row }) => {
    const d = o.delivery_date ? Math.round((parseDate(o.delivery_date)!.getTime() - today.getTime()) / DAY) : null;
    const pct = Math.min(100, (Number(o.deposit) / Math.max(Number(o.total), 1)) * 100);
    return (
      <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
        <Link href={`/dashboard/pedidos/${o.id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-cocoa-300">{folio("P", o.folio)}</span>
            <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
            {d !== null && (
              <Badge tone={d < 0 ? "danger" : d <= 1 ? "warning" : "neutral"}>
                {d < 0 ? `Entregado hace ${-d} d` : d === 0 ? "Entrega hoy" : d === 1 ? "Entrega mañana" : `Entrega ${date(o.delivery_date, { day: "numeric", month: "short" })}`}
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate font-semibold text-cocoa-700">{name(o)}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 max-w-[220px] flex-1 overflow-hidden rounded-full bg-cream-200">
              <div className="h-full rounded-full bg-mint-400" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-cocoa-400 tabular-nums">
              {money(o.deposit)} de {money(o.total)}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <p className="font-display text-lg font-semibold text-rose-600 tabular-nums">{money(balance(o))}</p>
          <div className="ml-auto flex gap-1.5 sm:ml-0">
            <Button size="sm" variant="ghost" onClick={() => remind(o)} disabled={!phone(o)} title="Recordar por WhatsApp">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="mint" onClick={() => setPaying(o)}>
              <HandCoins className="h-4 w-4" /> Cobrar
            </Button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Cuentas claras"
        title="Saldos"
        subtitle="Quién te debe, cuánto y cuándo entregas. Registra pagos parciales y manda un recordatorio amable antes de la entrega."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Por cobrar" value={money(totalOwed)} icon={<Wallet />} tone="rose" hint={`${orders.length} pedido(s) con saldo`} />
        <StatCard label="Cobrar pronto" value={soon.length} icon={<AlarmClock />} tone="cream" hint="Entregas en 2 días o vencidas" />
        <StatCard label="Clientes con saldo" value={byClient.length} icon={<Users />} tone="cocoa" />
        <StatCard label="Cobrado este mes" value={money(collectedMonth)} icon={<PiggyBank />} tone="mint" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        options={[
          { value: "pronto", label: "Cobrar pronto", count: soon.length },
          { value: "clientes", label: "Por cliente", count: byClient.length },
          { value: "cobros", label: "Últimos cobros" },
        ]}
      />

      {loading ? (
        <Card className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</Card>
      ) : tab === "pronto" ? (
        <Card className="overflow-hidden">
          {soon.length === 0 ? (
            <EmptyState icon={<PiggyBank className="h-8 w-8" />} title="Nada urgente por cobrar" description="Aquí aparecen los pedidos con saldo que se entregan hoy, mañana o pasado mañana." />
          ) : (
            <ul className="divide-y divide-cocoa-800/5">{soon.map((o) => <OrderLine key={o.id} o={o} />)}</ul>
          )}
        </Card>
      ) : tab === "clientes" ? (
        byClient.length === 0 ? (
          <Card>
            <EmptyState icon={<PiggyBank className="h-8 w-8" />} title="¡Nadie te debe!" description="Todos tus pedidos activos están pagados." />
          </Card>
        ) : (
          <div className="space-y-4">
            {byClient.map((g) => (
              <Card key={g.name + g.orders[0].id} className="overflow-hidden">
                <CardHeader
                  title={g.name}
                  subtitle={`${g.orders.length} pedido(s)`}
                  icon={<Users className="h-5 w-5" />}
                  action={<p className="font-display text-xl font-semibold text-rose-600 tabular-nums">{money(g.total)}</p>}
                />
                <ul className="mt-2 divide-y divide-cocoa-800/5 border-t border-cocoa-800/5">{g.orders.map((o) => <OrderLine key={o.id} o={o} />)}</ul>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card className="overflow-hidden">
          {(data?.payments ?? []).length === 0 ? (
            <EmptyState icon={<HandCoins className="h-8 w-8" />} title="Aún no registras cobros" />
          ) : (
            <ul className="divide-y divide-cocoa-800/5">
              {data!.payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${Number(p.amount) > 0 ? "bg-mint-50 text-mint-600" : "bg-rose-50 text-rose-500"}`}>
                    <HandCoins className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-cocoa-700">
                      {p.orders?.clients?.name ?? p.orders?.customer_name ?? "Pedido"} · {folio("P", p.orders?.folio)}
                    </p>
                    <p className="truncate text-xs text-cocoa-400">
                      {date(p.paid_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {p.method && ` · ${p.method}`}
                      {p.note && ` · ${p.note}`}
                    </p>
                  </div>
                  <p className={`font-semibold tabular-nums ${Number(p.amount) > 0 ? "text-mint-600" : "text-rose-500"}`}>{money(p.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <PaymentModal
        order={paying ? { id: paying.id, folio: paying.folio, total: paying.total, deposit: paying.deposit, customer: name(paying) } : null}
        onClose={() => setPaying(null)}
        onSaved={reload}
      />
    </>
  );
}
