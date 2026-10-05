"use client";
import { createClient } from "./supabase/client";
import { addDays, toISODate } from "./format";
import type { Order } from "./types";

export const ACTIVE_STATUSES = ["pendiente", "confirmado", "en_preparacion", "listo"];

/** Pedidos activos atrasados o que se entregan dentro de los próximos `daysAhead` días */
export async function fetchUpcomingDeliveries(daysAhead: number) {
  const until = toISODate(addDays(new Date(), Math.max(daysAhead, 0)));
  const { data, error } = await createClient()
    .from("orders")
    .select("id, folio, status, delivery_date, delivery_time, delivery_type, total, deposit, customer_name, clients(name), order_items(description, quantity)")
    .in("status", ACTIVE_STATUSES)
    .not("delivery_date", "is", null)
    .lte("delivery_date", until)
    .order("delivery_date")
    .order("delivery_time", { nullsFirst: false });
  if (error) throw new Error(error.message);
  return data as Order[];
}

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

/** Muestra una notificación del navegador una sola vez por pedido y día */
export function notifyOnce(key: string, title: string, body: string, url: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const storageKey = `dd-notified-${key}-${toISODate(new Date())}`;
  try {
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, "1");
  } catch {}
  try {
    const n = new Notification(title, { body, icon: "/icon.png", tag: key });
    n.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  } catch {
    // Algunos navegadores móviles solo permiten notificaciones desde un service worker
  }
}

/** Enlace para agregar la entrega a Google Calendar */
export function googleCalendarUrl(o: { delivery_date: string | null; delivery_time: string | null; title: string; details: string; location?: string | null; timezone?: string }) {
  if (!o.delivery_date) return null;
  const d = o.delivery_date.replace(/-/g, "");
  let dates: string;
  if (o.delivery_time && /^\d{2}:\d{2}/.test(o.delivery_time)) {
    const [h, m] = o.delivery_time.split(":").map(Number);
    const start = `${d}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
    const endH = Math.min(h + 1, 23);
    dates = `${start}/${d}T${String(endH).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  } else {
    const next = toISODate(addDays(new Date(o.delivery_date + "T12:00:00"), 1)).replace(/-/g, "");
    dates = `${d}/${next}`;
  }
  const p = new URLSearchParams({ action: "TEMPLATE", text: o.title, dates, details: o.details, ctz: o.timezone || "America/Mexico_City" });
  if (o.location) p.set("location", o.location);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
