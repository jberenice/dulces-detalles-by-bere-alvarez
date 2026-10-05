"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CalendarDays } from "lucide-react";
import { useBusiness } from "./BusinessProvider";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Card";
import { ORDER_STATUS } from "@/lib/constants";
import { dateLong, folio, money, toISODate } from "@/lib/format";
import { fetchUpcomingDeliveries, notificationsSupported, notifyOnce } from "@/lib/reminders";
import { cn } from "@/lib/cn";
import { toast } from "sonner";
import { enableNotifications } from "@/lib/push-client";
import type { Order } from "@/lib/types";

/** Campana con entregas de hoy, próximas y atrasadas; dispara notificaciones del navegador. */
export function NotificationBell({ className }: { className?: string }) {
  const { profile } = useBusiness();
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchUpcomingDeliveries(profile.reminder_days_before ?? 1);
      setOrders(list);
      const today = toISODate(new Date());
      for (const o of list) {
        const who = o.clients?.name ?? o.customer_name ?? "Cliente";
        const when = o.delivery_date! < today ? "atrasado" : o.delivery_date === today ? "hoy" : `el ${dateLong(o.delivery_date)}`;
        notifyOnce(
          o.id,
          `🧁 Entrega ${when}: ${folio("P", o.folio)}`,
          `${who}${o.delivery_time ? ` · ${o.delivery_time} h` : ""} — ${(o.order_items ?? []).map((i) => `${Number(i.quantity)}× ${i.description}`).join(", ")}`,
          `/dashboard/pedidos/${o.id}`,
        );
      }
    } catch {}
  }, [profile.reminder_days_before]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15 * 60_000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  const today = toISODate(new Date());
  const late = orders.filter((o) => o.delivery_date! < today);
  const todays = orders.filter((o) => o.delivery_date === today);
  const next = orders.filter((o) => o.delivery_date! > today);
  const urgent = late.length + todays.length;

  const Group = ({ title, list, tone }: { title: string; list: Order[]; tone: string }) =>
    list.length ? (
      <section>
        <p className={cn("mb-2 text-xs font-bold tracking-widest uppercase", tone)}>{title}</p>
        <ul className="space-y-1.5">
          {list.map((o) => (
            <li key={o.id}>
              <Link href={`/dashboard/pedidos/${o.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl bg-cream-50 px-3 py-2.5 ring-1 ring-cocoa-800/5 hover:bg-cream-100">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-cocoa-700">
                    {folio("P", o.folio)} · {o.clients?.name ?? o.customer_name ?? "Cliente"}
                  </p>
                  <p className="truncate text-xs text-cocoa-400">
                    {o.delivery_date !== today && `${dateLong(o.delivery_date)} · `}
                    {o.delivery_time ? `${o.delivery_time} h · ` : ""}
                    {(o.order_items ?? []).map((i) => `${Number(i.quantity)}× ${i.description}`).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  {Number(o.total) > Number(o.deposit) && <p className="mt-1 text-[11px] text-cocoa-400">Cobrar {money(Number(o.total) - Number(o.deposit))}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn("relative grid h-10 w-10 place-items-center rounded-xl text-cocoa-500 transition hover:bg-cocoa-800/5 hover:text-rose-500", className)}
        aria-label={`Entregas próximas${urgent ? `: ${urgent} para hoy o atrasadas` : ""}`}
      >
        {urgent ? <BellRing className="h-[22px] w-[22px] text-rose-500" /> : <Bell className="h-[22px] w-[22px]" />}
        {orders.length > 0 && (
          <span className={cn("absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white ring-2 ring-white", urgent ? "bg-rose-500" : "bg-mint-500")}>
            {orders.length}
          </span>
        )}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Entregas" description="Pedidos atrasados, de hoy y próximos">
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-cocoa-400">No tienes entregas pendientes por ahora 🧁</p>
        ) : (
          <div className="space-y-5">
            <Group title="Atrasados" list={late} tone="text-rose-600" />
            <Group title="Hoy" list={todays} tone="text-rose-500" />
            <Group title="Próximos" list={next} tone="text-mint-600" />
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-cocoa-800/5 pt-4">
          <Link href="/dashboard/calendario" onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:underline">
            <CalendarDays className="h-4 w-4" /> Ver calendario
          </Link>
          {notificationsSupported() && Notification.permission !== "granted" && (
            <button
              onClick={async () => {
                const r = await enableNotifications();
                if (r === "push" || r === "local") {
                  toast.success("Avisos activados en este dispositivo 🔔");
                  load();
                } else if (r === "ios-install") toast.info("En iPhone primero agrega la app a tu pantalla de inicio (Compartir → Agregar a inicio)");
                else toast.error("Los avisos están bloqueados en la configuración del navegador");
              }}
              className="text-sm font-bold text-mint-600 hover:underline"
            >
              Activar avisos en este dispositivo
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
