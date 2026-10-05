import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSite } from "@/lib/same-origin";
import { brandFromProfile, brandedEmail, paragraphs } from "@/lib/email-template";

export const runtime = "nodejs";

type Body = { to: string; subject: string; message: string; filename: string; pdfBase64: string; link?: string };

/** Envía la cotización / nota de pedido por correo con el PDF adjunto (Resend). */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 200 });

  // Las cuentas demo no envían correos reales
  const { data: demo } = await supabase.from("profiles").select("is_demo").eq("id", user.id).single();
  if (demo?.is_demo) return NextResponse.json({ ok: false, error: "En la demo no se envían correos reales. Puedes descargar el PDF 😉" }, { status: 403 });

  // Cupo por usuaria (anti spam): 40 correos por hora
  const { error: quotaError } = await supabase.rpc("consume_email_quota");
  if (quotaError) return NextResponse.json({ ok: false, error: quotaError.message }, { status: 429 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }
  const subject = String(body.subject ?? "").replace(/[\r\n]+/g, " ").slice(0, 180);
  const message = String(body.message ?? "").slice(0, 5000);
  const filename = String(body.filename ?? "documento.pdf").replace(/[^\w.\-]+/g, "_").slice(0, 80);
  if (!filename.toLowerCase().endsWith(".pdf")) return NextResponse.json({ ok: false, error: "Archivo inválido" }, { status: 400 });
  if (typeof body.to !== "string" || body.to.length > 200 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(body.to)) return NextResponse.json({ ok: false, error: "Correo inválido" }, { status: 400 });
  if (typeof body.pdfBase64 !== "string" || !body.pdfBase64.startsWith("JVBER") || body.pdfBase64.length > 8_000_000) return NextResponse.json({ ok: false, error: "PDF inválido" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, email, logo_url, store_theme, whatsapp, instagram, facebook")
    .eq("id", user.id)
    .single();
  // Plan Premium: el correo lleva el logo y los colores de la repostería
  const { data: planInfo } = await supabase.rpc("my_plan");
  const premium = (planInfo as { plan?: string } | null)?.plan === "premium";
  const brand = brandFromProfile(profile, premium);

  // Botón "Ver en línea" solo para enlaces de este mismo sitio (cotizaciones compartidas)
  const origin = new URL(request.url).origin;
  let link: string | null = null;
  try {
    const u = body.link ? new URL(body.link) : null;
    if (u && u.origin === origin && /^\/c\/[0-9a-f-]{36}$/i.test(u.pathname)) link = u.toString();
  } catch {}

  const html = brandedEmail({
    brand,
    preheader: subject,
    body: paragraphs(message, brand.primary),
    cta: link ? { label: "Ver y aceptar en línea", url: link } : null,
    note: "Encontrarás el documento adjunto en PDF.",
    site: origin,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: fromAddress(brand.business),
    to: body.to,
    replyTo: profile?.email || user.email || undefined,
    subject,
    html,
    attachments: [{ filename, content: body.pdfBase64 }],
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}

/** Remitente con el nombre de la repostería y la dirección configurada en RESEND_FROM */
function fromAddress(business: string) {
  const base = process.env.RESEND_FROM ?? "Dulces Detalles <onboarding@resend.dev>";
  const email = /<([^>]+)>/.exec(base)?.[1] ?? base;
  const name = business.replace(/["<>\r\n]/g, "").slice(0, 60) || "Dulces Detalles";
  return `"${name}" <${email}>`;
}
