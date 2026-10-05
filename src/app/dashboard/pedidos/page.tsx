"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Download, Eye, List, Mail, MessageCircle, Pencil, Plus, Share2, ShoppingBag, Store, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { useConfirm } from "@/components/ui/Confirm";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { downloadOrderPdf, shareOrderPdf } from "@/lib/documents";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput, matches } from "@/components/ui/SearchInput";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { date, dateLong, folio, money, parseDate, toISODate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/types";

type Filter = "activos" | "entregado" | "cancelado" | "todos";
const ACTIVE = ["pendiente", "confirmado", "en_preparacion", "listo"];

export default function OrdersPage() {
  const sb = createClient();
  const [tab, setTab] = useState<Filter>("activos");
  const [view, setView] = useState<"agenda" | "lista">("agenda");
  const [q, setQ] = useState("");
  const router = useRouter();
  const confirm = useConfirm();
  const { profile } = useBusiness();
  const { data, loading, setData } = useAsync(
    async () =>
      must(
        await sb
          .from("orders")
          .select("*, clients(id, name, phone, email, address), order_items(description, quantity)")
          .order("delivery_date", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false }),
      ) as Order[],
  );

  const list = useMemo(
    () =>
      (data ?? []).filter(
        (o) =>
          (tab === "todos" || (tab === "activos" ? ACTIVE.includes(o.status) : o.status === tab)) &&
          matches(q, o.clients?.name, o.customer_name, String(o.folio), o.customer_phone),
      ),
    [data, tab, q],
  );

  const groups = useMemo(() => {
    const m = new Map<string, Order[]>();
    for (const o of list) {
      const k = o.delivery_date ?? "sin-fecha";
      m.set(k, [...(m.get(k) ?? []), o]);
    }
    return [...m.entries()];
  }, [list]);

  const todayIso = toISODate(new Date());

  async function run(fn: () => Promise<unknown>, ok?: string) {
    try {
      await fn();
      if (ok) toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(o: Order) {
    if (!(await confirm({ title: `¿Eliminar el pedido ${folio("P", o.folio)}?`, message: "Se quitará también de tus reportes de ventas.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("orders").delete().eq("id", o.id);
    if (error) return toast.error(error.message);
    setData((d) => (d ?? []).filter((x) => x.id !== o.id));
    toast.success("Pedido eliminado");
  }
  const count = (f: Filter) => (data ?? []).filter((o) => (f === "activos" ? ACTIVE.includes(o.status) : f === "todos" || o.status === f)).length;

  const Row = ({ o }: { o: Order }) => {
    const st = ORDER_STATUS[o.status];
    const pay = PAYMENT_STATUS[o.payment_status];
    const late = o.delivery_date && o.delivery_date < todayIso && ACTIVE.includes(o.status);
    return (
      <div className="flex items-center gap-2 pr-2 transition hover:bg-cream-100/70 sm:pr-4">
      <Link href={`/dashboard/pedidos/${o.id}`} className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-4 sm:pl-6">
        <div className={cn("hidden w-14 shrink-0 flex-col items-center rounded-2xl py-1.5 sm:flex", late ? "bg-rose-50 text-rose-600" : "bg-cream-200 text-cocoa-600")}>
          <span className="text-[10px] font-bold uppercase">{o.delivery_date ? date(o.delivery_date, { month: "short" }) : "—"}</span>
          <span className="font-display text-xl leading-none font-semibold">{o.delivery_date ? parseDate(o.delivery_date)!.getDate() : "?"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-cocoa-300">{folio("P", o.folio)}</span>
            <Badge tone={st.tone}>{st.label}</Badge>
            <Badge tone={pay.tone}>{pay.label}</Badge>
            {o.source === "tienda" && <Badge tone="mint"><Store className="h-3 w-3" /> Tienda</Badge>}
            {o.delivery_type === "envio" && <Badge><Truck className="h-3 w-3" /> Envío</Badge>}
          </div>
          <p className="mt-0.5 truncate font-semibold text-cocoa-700">{o.clients?.name ?? o.customer_name ?? "Sin cliente"}</p>
          <p className="truncate text-xs text-cocoa-400">
            {o.delivery_time ? `${o.delivery_time} · ` : ""}
            {(o.order_items ?? []).map((i) => `${Number(i.quantity)}× ${i.description}`).join(", ")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold text-cocoa-700 tabular-nums">{money(o.total)}</p>
          {o.deposit > 0 && o.payment_status !== "pagado" && <p className="text-[11px] text-cocoa-400">Resta {money(o.total - o.deposit)}</p>}
        </div>
      </Link>
      <ActionMenu
        actions={[
          { label: "Ver", icon: <Eye />, onClick: () => router.push(`/dashboard/pedidos/${o.id}`) },
          { label: "Modificar", icon: <Pencil />, onClick: () => router.push(`/dashboard/pedidos/${o.id}/editar`) },
          { label: "Descargar nota PDF", icon: <Download />, onClick: () => run(() => downloadOrderPdf(o.id, profile), "PDF descargado") },
          { label: "Enviar por WhatsApp", icon: <MessageCircle />, onClick: () => router.push(`/dashboard/pedidos/${o.id}?enviar=whatsapp`) },
          { label: "Enviar por correo", icon: <Mail />, onClick: () => router.push(`/dashboard/pedidos/${o.id}?enviar=correo`) },
          { label: "Compartir PDF", icon: <Share2 />, onClick: () => run(() => shareOrderPdf(o.id, profile)) },
          { label: "Eliminar", icon: <Trash2 />, danger: true, onClick: () => remove(o) },
        ]}
      />
      </div>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Manos a la masa"
        title="Pedidos"
        subtitle="Tu agenda de entregas: lo que tienes que preparar, lo que ya está listo y lo que falta cobrar."
        actions={<ButtonLink href="/dashboard/pedidos/nuevo"><Plus className="h-4 w-4" /> Nuevo pedido</ButtonLink>}
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "activos", label: "Activos", count: count("activos") },
            { value: "entregado", label: "Entregados", count: count("entregado") },
            { value: "cancelado", label: "Cancelados", count: count("cancelado") },
            { value: "todos", label: "Todos", count: count("todos") },
          ]}
        />
        <div className="flex gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Cliente, folio o teléfono" className="flex-1 lg:w-64" />
          <Tabs
            value={view}
            onChange={setView}
            options={[
              { value: "agenda", label: <CalendarDays className="h-4 w-4" /> },
              { value: "lista", label: <List className="h-4 w-4" /> },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <Card className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Sin pedidos aquí" description="Crea un pedido manual, convierte una cotización o comparte tu tienda en línea." action={<ButtonLink href="/dashboard/pedidos/nuevo"><Plus className="h-4 w-4" /> Nuevo pedido</ButtonLink>} />
        </Card>
      ) : view === "lista" ? (
        <Card className="overflow-hidden">
          <div className="divide-y divide-cocoa-800/5">{list.map((o) => <Row key={o.id} o={o} />)}</div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, orders]) => (
            <section key={day}>
              <div className="mb-2 flex items-baseline gap-3 px-1">
                <h2 className={cn("text-lg font-semibold capitalize", day === todayIso && "text-rose-500")}>
                  {day === "sin-fecha" ? "Sin fecha de entrega" : day === todayIso ? "Hoy" : dateLong(day)}
                </h2>
                <span className="text-sm text-cocoa-400">
                  {orders.length} pedido{orders.length > 1 ? "s" : ""} · {money(orders.reduce((a, o) => a + Number(o.total), 0))}
                </span>
              </div>
              <Card className="overflow-hidden">
                <div className="divide-y divide-cocoa-800/5">{orders.map((o) => <Row key={o.id} o={o} />)}</div>
              </Card>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
