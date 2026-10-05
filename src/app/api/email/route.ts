import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSite } from "@/lib/same-origin";

export const runtime = "nodejs";

type Body = { to: string; subject: string; message: string; filename: string; pdfBase64: string };

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

  const { data: profile } = await supabase.from("profiles").select("business_name, email").eq("id", user.id).single();
  const businessName = profile?.business_name ?? "Dulces Detalles";

  const html = `
  <div style="background:#fffaef;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#3f250d">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #f4e4c2">
      <div style="height:6px;background:linear-gradient(90deg,#eb5473 0 50%,#7fcaa6 50% 85%,#6aa68a 85%)"></div>
      <div style="padding:32px">
        <p style="font-family:Georgia,serif;font-style:italic;font-size:26px;color:#eb5473;margin:0 0 4px">${escapeHtml(businessName)}</p>
        <p style="font-size:12px;letter-spacing:3px;color:#6aa68a;text-transform:uppercase;margin:0 0 24px">Hechos con amor de hogar</p>
        <div style="font-size:15px;line-height:1.6;white-space:pre-line">${escapeHtml(message)}</div>
        <p style="margin-top:28px;font-size:13px;color:#a87b55">Encontrarás el documento adjunto en PDF.</p>
      </div>
    </div>
  </div>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Dulces Detalles <onboarding@resend.dev>",
    to: body.to,
    replyTo: profile?.email || user.email || undefined,
    subject,
    html,
    attachments: [{ filename, content: body.pdfBase64 }],
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
