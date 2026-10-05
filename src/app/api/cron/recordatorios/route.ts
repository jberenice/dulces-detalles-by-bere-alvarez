import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { SUPABASE_URL } from "@/lib/supabase/env";
import type { Db } from "@/lib/supabase/db";

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
  clients: { name: string } | null;
  order_items: { description: string; quantity: number }[];
};

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
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

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
  if (!serviceKey || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "Faltan SUPABASE_SERVICE_ROLE_KEY o RESEND_API_KEY" }, { status: 500 });
  }

  const admin: Db = createAdminClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const utcToday = new Date().toISOString().slice(0, 10);

  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, email, business_name, owner_name, reminder_days_before, reminder_hour, reminder_last_sent, timezone")
    .eq("reminder_email", true)
    .not("email", "is", null);
  if (pErr) return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });

  const { data: orders, error: oErr } = await admin
    .from("orders")
    .select("id, user_id, folio, status, delivery_date, delivery_time, delivery_type, total, deposit, customer_name, clients(name), order_items(description, quantity)")
    .in("status", ["pendiente", "confirmado", "en_preparacion", "listo"])
    .gte("delivery_date", plusDays(utcToday, -15))
    .lte("delivery_date", plusDays(utcToday, 9))
    .order("delivery_date")
    .order("delivery_time", { nullsFirst: false });
  if (oErr) return NextResponse.json({ ok: false, error: oErr.message }, { status: 500 });

  const byUser = new Map<string, Row[]>();
  for (const o of (orders ?? []) as unknown as Row[]) byUser.set(o.user_id, [...(byUser.get(o.user_id) ?? []), o]);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let sent = 0;

  for (const p of (profiles ?? []) as {
    id: string;
    email: string;
    business_name: string;
    owner_name: string | null;
    reminder_days_before: number;
    reminder_hour: number;
    reminder_last_sent: string | null;
    timezone: string;
  }[]) {
    // ¿Ya es la hora elegida en SU zona horaria y aún no se envía el de hoy?
    const local = localNow(p.timezone || "America/Mexico_City");
    if (local.hour < (p.reminder_hour ?? 7) || p.reminder_last_sent === local.date) continue;
    const today = local.date;
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
                <b>P-${String(o.folio).padStart(4, "0")} · ${who}</b><br/>
                <span style="font-size:13px;color:#a87b55">${o.delivery_date !== today ? esc(longDate(o.delivery_date)) + " · " : ""}${o.delivery_time ? esc(o.delivery_time) + " h · " : ""}${o.delivery_type === "envio" ? "Envío" : "Recoge"}</span><br/>
                <span style="font-size:14px">${items}</span>
                ${due > 0 ? `<br/><span style="font-size:13px;color:#eb5473">Por cobrar: ${money(due)}</span>` : ""}
              </a>`;
            })
            .join("")
        : "";

    const html = `<div style="background:#fffaef;padding:28px 12px;font-family:Helvetica,Arial,sans-serif;color:#3f250d">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #f4e4c2">
        <div style="height:6px;background:linear-gradient(90deg,#eb5473 0 50%,#7fcaa6 50% 85%,#6aa68a 85%)"></div>
        <div style="padding:28px">
          <p style="font-family:Georgia,serif;font-style:italic;font-size:24px;color:#eb5473;margin:0">${local.hour < 12 ? "¡Buenos días" : local.hour < 19 ? "¡Buenas tardes" : "¡Buenas noches"}${p.owner_name ? ", " + esc(p.owner_name.split(" ")[0]) : ""}!</p>
          <p style="margin:6px 0 0;font-size:15px">Estas son tus entregas en ${esc(p.business_name)}:</p>
          ${block("Atrasados", "#d43a5b", late)}${block("Hoy", "#eb5473", todays)}${block("Próximos", "#528a70", next)}
          <p style="margin-top:24px"><a href="${site}/dashboard/calendario" style="background:#eb5473;color:#fff;text-decoration:none;padding:12px 20px;border-radius:14px;font-weight:bold;display:inline-block">Ver mi calendario</a></p>
          <p style="margin-top:24px;font-size:12px;color:#a87b55">Puedes desactivar este resumen en Ajustes → Recordatorios de entrega.</p>
        </div>
      </div>
    </div>`;

    const subject = todays.length
      ? `🧁 Hoy entregas ${todays.length} pedido${todays.length > 1 ? "s" : ""}`
      : late.length
        ? `⚠️ Tienes ${late.length} entrega${late.length > 1 ? "s" : ""} atrasada${late.length > 1 ? "s" : ""}`
        : `📅 Próximas entregas: ${next.length}`;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Dulces Detalles <onboarding@resend.dev>",
      to: p.email as string,
      subject,
      html,
    });
    if (!error) {
      sent++;
      await admin.from("profiles").update({ reminder_last_sent: today }).eq("id", p.id);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
