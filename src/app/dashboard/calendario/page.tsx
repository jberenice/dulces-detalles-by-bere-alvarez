"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarDays, ChevronLeft, ChevronRight, Plus, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ORDER_STATUS } from "@/lib/constants";
import { addDays, dateLong, folio, money, toISODate } from "@/lib/format";
import { notificationsSupported } from "@/lib/reminders";
import { enableNotifications } from "@/lib/push-client";
import { hourLabel, timezoneLabel } from "@/lib/timezones";
import { cn } from "@/lib/cn";
import type { Order, OrderStatus } from "@/lib/types";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DOT: Record<OrderStatus, string> = {
  pendiente: "bg-amber-400",
  confirmado: "bg-sky-500",
  en_preparacion: "bg-rose-500",
  listo: "bg-mint-500",
  entregado: "bg-cocoa-300",
  cancelado: "bg-cocoa-200",
};

export default function CalendarPage() {
  const sb = createClient();
  const { profile } = useBusiness();
  const today = toISODate(new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("granted");
  useEffect(() => setPerm(notificationsSupported() ? Notification.permission : "unsupported"), []);

  // Cuadrícula: de lunes a domingo, cubriendo el mes completo
  const days = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const start = addDays(first, -offset);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const total = Math.ceil((offset + last.getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDays(start, i));
  }, [month]);
  const from = toISODate(days[0]);
  const to = toISODate(days[days.length - 1]);

  const { data, loading } = useAsync(
    async () =>
      must(
        await sb
          .from("orders")
          .select("id, folio, status, source, delivery_date, delivery_time, delivery_type, total, deposit, customer_name, clients(name), order_items(description, quantity)")
          .neq("status", "cancelado")
          .gte("delivery_date", from)
          .lte("delivery_date", to)
          .order("delivery_time", { nullsFirst: false }),
      ) as Order[],
    [from, to],
  );

  const byDay = useMemo(() => {
    const m = new Map<string, Order[]>();
    for (const o of data ?? []) m.set(o.delivery_date!, [...(m.get(o.delivery_date!) ?? []), o]);
    return m;
  }, [data]);

  const selectedOrders = byDay.get(selected) ?? [];
  const monthLabel = month.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const monthOrders = (data ?? []).filter((o) => o.delivery_date!.slice(0, 7) === toISODate(month).slice(0, 7));

  const go = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  async function enableNotifications() {
    const r = await enableNotifications();
    if (r === "ios-install") return toast.info("En iPhone primero agrega la app a tu pantalla de inicio (Compartir → Agregar a inicio)");
    if (r === "unsupported") return toast.error("Tu navegador no permite notificaciones");
    setPerm(Notification.permission);
    if (r === "push" || r === "local") toast.success("Te avisaremos de tus entregas en este dispositivo 🔔");
  }

  return (
    <>
      <PageHeader
        eyebrow="Tu agenda dulce"
        title="Calendario de entregas"
        subtitle={`Te avisamos ${profile.reminder_days_before ? `${profile.reminder_days_before} día(s) antes y ` : ""}el día de cada entrega · resumen por correo a las ${hourLabel(profile.reminder_hour ?? 7)} (${timezoneLabel(profile.timezone).split(" · ")[0]}).`}
        actions={
          <>
            {perm !== "granted" && perm !== "unsupported" && (
              <Button variant="outline" onClick={enableNotifications}>
                <BellRing className="h-4 w-4" /> Activar avisos
              </Button>
            )}
            <ButtonLink href="/dashboard/pedidos/nuevo"><Plus className="h-4 w-4" /> Nuevo pedido</ButtonLink>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 pt-4 sm:px-6 sm:pt-5">
            <h2 className="text-2xl font-semibold capitalize">{monthLabel}</h2>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(today); }}>Hoy</Button>
              <Button size="icon" variant="ghost" onClick={() => go(-1)} aria-label="Mes anterior"><ChevronLeft className="h-5 w-5" /></Button>
              <Button size="icon" variant="ghost" onClick={() => go(1)} aria-label="Mes siguiente"><ChevronRight className="h-5 w-5" /></Button>
            </div>
          </div>
          <p className="px-4 pb-2 text-sm text-cocoa-400 sm:px-6">
            {monthOrders.length} entregas · {money(monthOrders.reduce((a, o) => a + Number(o.total), 0))}
          </p>
          <div className="grid grid-cols-7 border-t border-cocoa-800/5 text-center text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">
            {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>
          {loading ? (
            <Skeleton className="m-4 h-[420px]" />
          ) : (
            <div className="grid grid-cols-7 border-t border-cocoa-800/5">
              {days.map((d) => {
                const iso = toISODate(d);
                const list = byDay.get(iso) ?? [];
                const inMonth = d.getMonth() === month.getMonth();
                const isToday = iso === today;
                const isSel = iso === selected;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelected(iso)}
                    className={cn(
                      "relative flex min-h-[64px] flex-col items-stretch gap-1 border-r border-b border-cocoa-800/5 p-1.5 text-left transition sm:min-h-[104px] sm:p-2",
                      !inMonth && "bg-cream-50/70 text-cocoa-200",
                      isSel ? "bg-rose-50/80" : "hover:bg-cream-100/70",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center self-center rounded-full text-sm font-bold sm:self-start",
                        isToday ? "bg-rose-500 text-white" : inMonth ? "text-cocoa-600" : "text-cocoa-300",
                        isSel && !isToday && "ring-2 ring-rose-300",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {/* Móvil: puntos; escritorio: etiquetas */}
                    <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                      {list.slice(0, 4).map((o) => <span key={o.id} className={cn("h-1.5 w-1.5 rounded-full", DOT[o.status])} />)}
                    </span>
                    <span className="hidden space-y-1 sm:block">
                      {list.slice(0, 3).map((o) => (
                        <span key={o.id} className="flex items-center gap-1 truncate rounded-lg bg-white px-1.5 py-0.5 text-[11px] font-semibold text-cocoa-600 shadow-sm ring-1 ring-cocoa-800/5">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[o.status])} />
                          <span className="truncate">{o.delivery_time ? `${o.delivery_time} ` : ""}{o.clients?.name ?? o.customer_name ?? folio("P", o.folio)}</span>
                        </span>
                      ))}
                      {list.length > 3 && <span className="block text-[11px] font-bold text-rose-500">+{list.length - 3} más</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-xs text-cocoa-400 sm:px-6">
            {(["pendiente", "confirmado", "en_preparacion", "listo", "entregado"] as OrderStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", DOT[s])} /> {ORDER_STATUS[s].label}</span>
            ))}
          </div>
        </Card>

        <Card className="xl:sticky xl:top-8">
          <div className="flex items-center gap-3 px-5 pt-5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-500"><CalendarDays className="h-5 w-5" /></span>
            <div>
              <h3 className="text-lg font-semibold capitalize">{selected === today ? "Hoy" : dateLong(selected)}</h3>
              <p className="text-[13px] text-cocoa-400">{selectedOrders.length} entrega{selectedOrders.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div className="p-4">
            {selectedOrders.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-cocoa-400">Día libre de entregas 🌸</p>
                <ButtonLink href="/dashboard/pedidos/nuevo" size="sm" variant="secondary" className="mt-3"><Plus className="h-4 w-4" /> Agendar pedido</ButtonLink>
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedOrders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/dashboard/pedidos/${o.id}`} className="block rounded-2xl bg-cream-50 p-3 ring-1 ring-cocoa-800/5 transition hover:bg-cream-100">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-cocoa-700">{o.clients?.name ?? o.customer_name ?? "Cliente"}</p>
                        <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-cocoa-400">
                        <span>{folio("P", o.folio)}</span>
                        {o.delivery_time && <span>· {o.delivery_time} h</span>}
                        {o.delivery_type === "envio" && <span className="flex items-center gap-1">· <Truck className="h-3 w-3" /> Envío</span>}
                        {o.source === "tienda" && <span className="flex items-center gap-1">· <Store className="h-3 w-3" /> Tienda</span>}
                      </p>
                      <p className="mt-1.5 text-sm text-cocoa-600">{(o.order_items ?? []).map((i) => `${Number(i.quantity)}× ${i.description}`).join(", ")}</p>
                      <p className="mt-1.5 text-right text-sm font-semibold tabular-nums">
                        {money(o.total)}
                        {Number(o.total) > Number(o.deposit) && <span className="ml-1 text-xs font-normal text-rose-500">(resta {money(Number(o.total) - Number(o.deposit))})</span>}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
