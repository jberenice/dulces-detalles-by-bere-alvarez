import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rejectCrossSite } from "@/lib/same-origin";
import { sendPush, type PushSub } from "@/lib/push-server";

export const runtime = "nodejs";

/**
 * Avisa a la repostería (push) que entró un pedido de su tienda en línea.
 * Público pero seguro: solo funciona una vez por pedido, para pedidos de tienda creados hace menos de 10 minutos.
 */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const { order_id, quote_id } = (await request.json().catch(() => ({}))) as { order_id?: string; quote_id?: string };
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 200 });

  // Solicitud de pastel personalizado (cotización en borrador desde la tienda)
  if (quote_id && /^[0-9a-f-]{36}$/i.test(quote_id)) {
    const { data: q } = await admin
      .from("quotes")
      .update({ push_notified: true })
      .eq("id", quote_id)
      .eq("source", "tienda")
      .eq("push_notified", false)
      .gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString())
      .select("id, user_id, folio, event_date, request")
      .maybeSingle();
    if (!q) return NextResponse.json({ ok: true, sent: 0 });
    const r = (q.request ?? {}) as { name?: string; people?: number };
    const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", q.user_id);
    const { sent, gone } = await sendPush((subs ?? []) as PushSub[], {
      title: `🎂 Nueva solicitud de pastel personalizado`,
      body: `${r.name ?? "Cliente"} · ${r.people ?? "?"} personas${q.event_date ? ` · ${q.event_date.split("-").reverse().join("/")}` : ""} — ponle precio y envíala`,
      url: `/dashboard/cotizaciones/${q.id}`,
      tag: `solicitud-${q.id}`,
    });
    if (gone.length) await admin.from("push_subscriptions").delete().in("id", gone);
    return NextResponse.json({ ok: true, sent });
  }
  if (!order_id || !/^[0-9a-f-]{36}$/i.test(order_id)) return NextResponse.json({ ok: false }, { status: 400 });

  // Marca como notificado de forma atómica (evita repeticiones)
  const { data: order } = await admin
    .from("orders")
    .update({ push_notified: true })
    .eq("id", order_id)
    .eq("source", "tienda")
    .eq("push_notified", false)
    .gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString())
    .select("id, user_id, folio, total, customer_name, delivery_date")
    .maybeSingle();
  if (!order) return NextResponse.json({ ok: true, sent: 0 });

  const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", order.user_id);
  const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(order.total) || 0);
  const { sent, gone } = await sendPush((subs ?? []) as PushSub[], {
    title: `🛍️ ¡Nuevo pedido de tu tienda! P-${String(order.folio).padStart(4, "0")}`,
    body: `${order.customer_name ?? "Cliente"} · ${money}${order.delivery_date ? ` · entrega ${order.delivery_date.split("-").reverse().join("/")}` : ""}`,
    url: `/dashboard/pedidos/${order.id}`,
    tag: `pedido-${order.id}`,
  });
  if (gone.length) await admin.from("push_subscriptions").delete().in("id", gone);
  return NextResponse.json({ ok: true, sent });
}
