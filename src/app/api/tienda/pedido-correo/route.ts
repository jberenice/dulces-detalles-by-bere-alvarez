import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { rejectCrossSite } from "@/lib/same-origin";
import { brandFromProfile, brandedEmail, esc, paragraphs } from "@/lib/email-template";
import { dateLong, folio, money } from "@/lib/format";
import { isToken, orderByToken, orderPdfName } from "@/lib/order-token.server";
import { logError } from "@/lib/error-log.server";
import { enforceIpLimit } from "@/lib/ip-limit.server";

export const runtime = "nodejs";

/**
 * Envía a la clienta la copia de su pedido de la tienda en PDF.
 * Público pero seguro:
 *  · necesita el token secreto del pedido (solo lo tiene quien acaba de hacerlo)
 *  · solo va al correo que la clienta escribió en el pedido (no se puede elegir otro destinatario)
 *  · se envía una sola vez y solo durante los 15 minutos siguientes al pedido
 */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const limited = await enforceIpLimit(request, "pedido-correo", 10, 600);
  if (limited) return limited;
  const { token } = (await request.json().catch(() => ({}))) as { token?: string };
  if (!isToken(token)) return NextResponse.json({ ok: false }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, reason: "not_configured" });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, reason: "not_configured" });

  // Se marca como enviado de forma atómica (evita duplicados aunque llegue dos veces)
  const { data: claimed } = await admin
    .from("orders")
    .update({ customer_email_sent_at: new Date().toISOString() })
    .eq("public_token", token)
    .eq("source", "tienda")
    .is("customer_email_sent_at", null)
    .not("customer_email", "is", null)
    .gte("created_at", new Date(Date.now() - 15 * 60_000).toISOString())
    .select("id")
    .maybeSingle();
  if (!claimed) return NextResponse.json({ ok: true, sent: false });

  const found = await orderByToken(admin, token);
  if (!found) return NextResponse.json({ ok: false }, { status: 404 });
  const { order, profile } = found;
  const to = order.customer_email ?? "";
  if (profile.is_demo || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to) || to.length > 200) return NextResponse.json({ ok: true, sent: false });

  const origin = new URL(request.url).origin;
  const link = `${origin}/p/${order.public_token}`;
  // Plan Premium: el correo lleva el logo y los colores de la repostería
  const { data: plan } = await admin.rpc("current_plan", { p_uid: profile.id });
  const brand = brandFromProfile(profile, plan === "premium");
  const f = folio("P", order.folio);
  const first = (order.customer_name ?? "").split(" ")[0];
  const items = (order.order_items ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((i) => `<tr><td style="padding:4px 0">${esc(`${Number(i.quantity)} × ${i.description}`)}</td><td style="padding:4px 0;text-align:right;white-space:nowrap">${esc(money(Number(i.quantity) * Number(i.unit_price)))}</td></tr>`)
    .join("");
  const when = order.delivery_date ? `${dateLong(order.delivery_date)}${order.delivery_time ? ` a las ${order.delivery_time}` : ""}` : "por confirmar";

  // El PDF se adjunta si se pudo generar; si no, el correo va con el enlace para descargarlo
  let attachment: { filename: string; content: string } | null = null;
  try {
    // Carga diferida: si la librería del PDF falla, el correo se envía igual con el enlace
    const { renderOrderPdf } = await import("@/lib/order-pdf.server");
    const pdf = await renderOrderPdf(order, profile, origin);
    attachment = { filename: orderPdfName(order, profile.business_name), content: Buffer.from(pdf).toString("base64") };
  } catch (e) {
    await logError({ source: "servidor", message: `PDF del pedido para correo: ${e instanceof Error ? e.message : String(e)}`, stack: e instanceof Error ? e.stack : null, path: "POST /api/tienda/pedido-correo" }).catch(() => {});
  }

  try {
    const html = brandedEmail({
      brand,
      preheader: `Tu pedido ${f} por ${money(Number(order.total))}`,
      title: `¡Gracias por tu pedido${first ? `, ${first}` : ""}!`,
      body:
        paragraphs(`Recibimos tu pedido ${f}. ${attachment ? "Te enviamos la copia en PDF adjunta." : "Puedes descargar tu nota en PDF con el botón de abajo."} Te confirmaremos disponibilidad y forma de pago por WhatsApp.`, brand.primary) +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 16px;background:${brand.background};border-radius:16px"><tr><td style="padding:16px 18px">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px">${items}
            <tr><td style="padding-top:10px;border-top:1px solid rgba(0,0,0,.08)"><b>Total</b></td><td style="padding-top:10px;border-top:1px solid rgba(0,0,0,.08);text-align:right"><b>${esc(money(Number(order.total)))}</b></td></tr>
          </table>
          <p style="margin:12px 0 0;font-size:13px">📅 Entrega: ${esc(when)}<br/>${order.delivery_type === "envio" ? "🚚 Envío a domicilio" : "🏠 Recoger en tienda"}</p>
        </td></tr></table>`,
      cta: { label: "Ver mi pedido", url: `${origin}/seguimiento/${order.public_token}` },
      note: `<a href="${esc(link)}" style="color:${brand.primary};font-weight:bold">Descargar mi nota en PDF</a> · Guarda este correo: los enlaces son personales.`,
      site: origin,
    });
    const base = process.env.RESEND_FROM ?? "Dulces Detalles <onboarding@resend.dev>";
    const fromEmail = /<([^>]+)>/.exec(base)?.[1] ?? base;
    const name = profile.business_name.replace(/["<>\r\n]/g, "").slice(0, 60) || "Dulces Detalles";
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: `"${name}" <${fromEmail}>`,
      to,
      replyTo: profile.email || undefined,
      subject: `Tu pedido ${f} en ${name}`,
      html,
      ...(attachment ? { attachments: [attachment] } : {}),
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, sent: true });
  } catch {
    // Si falló, se libera para poder reintentar
    await admin.from("orders").update({ customer_email_sent_at: null }).eq("id", claimed.id);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
