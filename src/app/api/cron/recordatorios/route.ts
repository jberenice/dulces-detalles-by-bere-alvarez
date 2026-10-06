import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { SUPABASE_URL } from "@/lib/supabase/env";
import type { Db } from "@/lib/supabase/db";
import { sendPush, type PushSub } from "@/lib/push-server";
import { brandFromProfile, brandedEmail, esc as escHtml, paragraphs } from "@/lib/email-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_id: string;
  folio: number;
  status: string;
  delivery_date: string;
  delivery_time: string | null;
  delivery_type: string;
  total: number;
  deposit: number;
  customer_name: string | null;
  customer_email: string | null;
  balance_reminded_at: string | null;
  clients: { name: string; email: string | null } | null;
  order_items: { description: string; quantity: number }[];
};

type Profile = {
  id: string;
  email: string;
  business_name: string;
  owner_name: string | null;
  reminder_days_before: number;
  reminder_hour: number;
  reminder_last_sent: string | null;
  timezone: string;
  reminder_email: boolean;
  is_demo: boolean | null;
  role: string;
  balance_reminder_email: boolean | null;
  bank_info: string | null;
  logo_url: string | null;
  store_theme: unknown;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
};
const RANK: Record<string, number> = { basico: 1, profesional: 2, premium: 3 };

/** Fecha (YYYY-MM-DD) y hora local en la zona horaria de cada usuaria */
function localNow(tz: string) {
  const zone = (() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      return "America/Mexico_City";
    }
  })();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}
const plusDays = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(n) || 0);
const longDate = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(iso + "T12:00:00Z"));
const esc = escHtml;

/**
 * Resumen diario de entregas por correo, a la hora local que eligió cada usuaria.
 * Se ejecuta cada hora (Supabase pg_cron, ver supabase/cron_setup.sql) y una vez al día como respaldo (vercel.json).
 * Cada usuaria recibe un solo correo por día: se registra en profiles.reminder_last_sent.
 * Requiere: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ ok: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const admin: Db = createAdminClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const utcToday = new Date().toISOString().slice(0, 10);

  // Limpieza: borra las cuentas demo vencidas (sus datos se eliminan en cascada)
  let demosDeleted = 0;
  const { data: expiredDemos } = await admin.rpc("demo_expired_users", { p_limit: 100 });
  for (const id of (expiredDemos ?? []) as string[]) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (!error) demosDeleted++;
  }

  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("*");
  if (pErr) return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });

  // Plan de cada usuaria (administración y demo = premium)
  const { data: licenses } = await admin.from("licenses").select("user_id, plan, status").eq("status", "activa");
  const planByUser = new Map<string, string>();
  for (const l of (licenses ?? []) as { user_id: string | null; plan?: string }[]) if (l.user_id) planByUser.set(l.user_id, l.plan ?? "premium");
  const rankOf = (p: Profile) => (p.role === "admin" || p.is_demo ? 3 : RANK[planByUser.get(p.id) ?? "basico"] ?? 1);

  const { data: orders, error: oErr } = await admin
    .from("orders")
    .select("*, clients(name, email), order_items(description, quantity)")
    .in("status", ["pendiente", "confirmado", "en_preparacion", "listo"])
    .gte("delivery_date", plusDays(utcToday, -15))
    .lte("delivery_date", plusDays(utcToday, 9))
    .order("delivery_date")
    .order("delivery_time", { nullsFirst: false });
  if (oErr) return NextResponse.json({ ok: false, error: oErr.message }, { status: 500 });

  // Dispositivos con notificaciones push (app instalada)
  const { data: allSubs } = await admin.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth");
  const subsByUser = new Map<string, PushSub[]>();
  for (const s of (allSubs ?? []) as (PushSub & { user_id: string })[]) subsByUser.set(s.user_id, [...(subsByUser.get(s.user_id) ?? []), s]);
  let pushed = 0;

  const byUser = new Map<string, Row[]>();
  for (const o of (orders ?? []) as unknown as Row[]) byUser.set(o.user_id, [...(byUser.get(o.user_id) ?? []), o]);

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let sent = 0;
  let balanceSent = 0;
  const fromBase = process.env.RESEND_FROM ?? "Dulces Detalles <onboarding@resend.dev>";
  const fromEmail = /<([^>]+)>/.exec(fromBase)?.[1] ?? fromBase;

  for (const p of (profiles ?? []) as Profile[]) {
    if (p.is_demo) continue;
    const rank = rankOf(p);
    // ¿Ya es la hora elegida en SU zona horaria?
    const local = localNow(p.timezone || "America/Mexico_City");
    if (local.hour < (p.reminder_hour ?? 7)) continue;
    const today = local.date;

    // --- Premium: recordatorio de saldo por correo a cada cliente, un día antes de su entrega ---
    if (resend && rank >= 3 && p.balance_reminder_email) {
      const tomorrow = plusDays(today, 1);
      const brand = brandFromProfile(p, true);
      for (const o of byUser.get(p.id) ?? []) {
        const due = Number(o.total) - Number(o.deposit);
        const to = o.customer_email || o.clients?.email;
        if (o.delivery_date !== tomorrow || due <= 0.009 || o.balance_reminded_at || !to || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to)) continue;
        const first = (o.clients?.name ?? o.customer_name ?? "").split(" ")[0];
        const items = o.order_items.map((i) => `• ${Number(i.quantity)} × ${i.description}`).join("\n");
        const body =
          paragraphs(`¡Hola${first ? " " + first : ""}! Te recordamos con cariño que mañana, ${longDate(o.delivery_date)}${o.delivery_time ? ` a las ${o.delivery_time}` : ""}, ${o.delivery_type === "envio" ? "entregamos" : "tienes lista para recoger"} tu orden P-${String(o.folio).padStart(5, "0")}:\n${items}`, brand.primary) +
          `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 16px;background:${brand.background};border-radius:16px"><tr><td style="padding:16px 18px">
             <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.7">Saldo pendiente</p>
             <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:28px;color:${brand.primary}">${money(due)}</p>
             <p style="margin:6px 0 0;font-size:13px;opacity:.75">Total ${money(o.total)} · Pagado ${money(o.deposit)}</p>
           </td></tr></table>` +
          (p.bank_info ? paragraphs(`Datos para transferencia:\n${p.bank_info}`, brand.primary) : "") +
          paragraphs("Si ya realizaste tu pago, ¡muchas gracias! Puedes ignorar este mensaje.", brand.primary);
        const html = brandedEmail({
          brand,
          preheader: `Saldo de tu pedido: ${money(due)}`,
          title: "Tu pedido es mañana 🧁",
          body,
          cta: p.whatsapp ? { label: "Enviar comprobante por WhatsApp", url: `https://wa.me/${p.whatsapp.replace(/\D/g, "").replace(/^(\d{10})$/, "52$1")}?text=${encodeURIComponent(`¡Hola! Te envío el comprobante del pedido P-${String(o.folio).padStart(5, "0")}`)}` } : null,
          site,
        });
        // Se "aparta" el pedido antes de enviar para que dos ejecuciones del cron no manden el correo dos veces
        const { data: claimed } = await admin
          .from("orders")
          .update({ balance_reminded_at: new Date().toISOString() })
          .eq("id", o.id)
          .is("balance_reminded_at", null)
          .select("id");
        if (!claimed?.length) continue;
        const { error } = await resend.emails.send({
          from: `"${p.business_name.replace(/["<>\r\n]/g, "").slice(0, 60)}" <${fromEmail}>`,
          to,
          replyTo: p.email || undefined,
          subject: `Recordatorio: tu pedido de ${p.business_name} es mañana`,
          html,
        });
        if (!error) balanceSent++;
        else await admin.from("orders").update({ balance_reminded_at: null }).eq("id", o.id);
      }
    }

    // --- Resumen diario: correo (Premium) y notificación push (Profesional y Premium) ---
    if (p.reminder_last_sent === today) continue;
    const subs = rank >= 2 ? (subsByUser.get(p.id) ?? []) : [];
    const wantsEmail = rank >= 3 && p.reminder_email && !!p.email && !!resend;
    if (!wantsEmail && !subs.length) continue;
    const until = plusDays(today, Math.min(Math.max(Number(p.reminder_days_before) || 0, 0), 7));
    const list = (byUser.get(p.id) ?? []).filter((o) => o.delivery_date <= until && o.delivery_date >= plusDays(today, -14));
    if (!list.length) {
      await admin.from("profiles").update({ reminder_last_sent: today }).eq("id", p.id);
      continue;
    }

    const late = list.filter((o) => o.delivery_date < today);
    const todays = list.filter((o) => o.delivery_date === today);
    const next = list.filter((o) => o.delivery_date > today);

    const block = (title: string, color: string, rows: Row[]) =>
      rows.length
        ? `<p style="margin:24px 0 8px;font-size:12px;letter-spacing:2px;font-weight:bold;color:${color};text-transform:uppercase">${title}</p>` +
          rows
            .map((o) => {
              const who = esc(o.clients?.name ?? o.customer_name ?? "Cliente");
              const items = esc(o.order_items.map((i) => `${Number(i.quantity)}× ${i.description}`).join(", "));
              const due = Number(o.total) - Number(o.deposit);
              return `<a href="${site}/dashboard/pedidos/${o.id}" style="display:block;text-decoration:none;color:#3f250d;background:#fffaef;border-radius:16px;padding:14px 16px;margin-bottom:8px">
                <b>P-${String(o.folio).padStart(5, "0")} · ${who}</b><br/>
                <span style="font-size:13px;color:#a87b55">${o.delivery_date !== today ? esc(longDate(o.delivery_date)) + " · " : ""}${o.delivery_time ? esc(o.delivery_time) + " h · " : ""}${o.delivery_type === "envio" ? "Envío" : "Recoge"}</span><br/>
                <span style="font-size:14px">${items}</span>
                ${due > 0 ? `<br/><span style="font-size:13px;color:#eb5473">Por cobrar: ${money(due)}</span>` : ""}
              </a>`;
            })
            .join("")
        : "";

    const greeting = `${local.hour < 12 ? "¡Buenos días" : local.hour < 19 ? "¡Buenas tardes" : "¡Buenas noches"}${p.owner_name ? ", " + p.owner_name.split(" ")[0] : ""}!`;
    const html = brandedEmail({
      brand: brandFromProfile(p, false),
      preheader: `${list.length} entrega${list.length === 1 ? "" : "s"} en tu agenda`,
      title: greeting,
      body: `<p style="margin:0">Estas son tus entregas en ${esc(p.business_name)}:</p>${block("Atrasados", "#d43a5b", late)}${block("Hoy", "#eb5473", todays)}${block("Próximos", "#528a70", next)}`,
      cta: { label: "Ver mi calendario", url: `${site}/dashboard/calendario` },
      note: "Puedes desactivar este resumen en Ajustes → Recordatorios de entrega.",
      site,
    });

    const subject = todays.length
      ? `🧁 Hoy entregas ${todays.length} pedido${todays.length > 1 ? "s" : ""}`
      : late.length
        ? `⚠️ Tienes ${late.length} entrega${late.length > 1 ? "s" : ""} atrasada${late.length > 1 ? "s" : ""}`
        : `📅 Próximas entregas: ${next.length}`;

    let delivered = false;
    if (wantsEmail && resend) {
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM ?? "Dulces Detalles <onboarding@resend.dev>",
        to: p.email as string,
        subject,
        html,
      });
      if (!error) {
        sent++;
        delivered = true;
      }
    }
    if (subs.length) {
      const first = todays[0] ?? late[0] ?? next[0];
      const r = await sendPush(subs, {
        title: subject,
        body: list
          .slice(0, 3)
          .map((o) => `${o.delivery_date === today ? "Hoy" : o.delivery_date < today ? "Atrasado" : longDate(o.delivery_date)}: ${o.clients?.name ?? o.customer_name ?? "Cliente"}`)
          .join(" · ") + (list.length > 3 ? ` y ${list.length - 3} más` : ""),
        url: list.length === 1 && first ? `/dashboard/pedidos/${first.id}` : "/dashboard/calendario",
        tag: `resumen-${today}`,
      });
      if (r.gone.length) await admin.from("push_subscriptions").delete().in("id", r.gone);
      if (r.sent) {
        pushed += r.sent;
        delivered = true;
      }
    }
    if (delivered) await admin.from("profiles").update({ reminder_last_sent: today }).eq("id", p.id);
  }

  return NextResponse.json({ ok: true, sent, pushed, balanceSent, demosDeleted });
}
