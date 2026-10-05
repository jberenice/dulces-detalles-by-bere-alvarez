"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarHeart, Check, Copy, Download, ExternalLink, Pencil, RefreshCw, Send, ShieldCheck, ShoppingBag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { useConfirm } from "@/components/ui/Confirm";
import { Badge, Card, Skeleton } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SendDialog } from "@/components/dashboard/SendDialog";
import { CustomRequestCard } from "@/components/dashboard/CustomRequestCard";
import { Toggle } from "@/components/ui/Field";
import { QUOTE_STATUS } from "@/lib/constants";
import { getTemplate, renderTemplate } from "@/lib/templates";
import { buildPdf, downloadBlob, quoteToPdf, verifyCode } from "@/lib/pdf";
import { date, dateLong, folio, money, num, siteUrl } from "@/lib/format";
import type { Quote, QuoteStatus } from "@/lib/types";

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const sb = createClient();
  const confirm = useConfirm();
  const { profile } = useBusiness();
  const [sending, setSending] = useState(false);
  const [sendTab, setSendTab] = useState<"whatsapp" | "email">("whatsapp");
  const [busy, setBusy] = useState(false);
  const { data: q, loading, setData } = useAsync(
    async () => must(await sb.from("quotes").select("*, clients(id, name, phone, email, address), quote_items(*)").eq("id", id).single()) as Quote,
    [id],
  );

  // Abre el diálogo de envío si se llegó desde el menú de acciones (?enviar=whatsapp|correo)
  useEffect(() => {
    if (!q) return;
    const v = new URLSearchParams(window.location.search).get("enviar");
    if (v === "whatsapp" || v === "correo") {
      setSendTab(v === "correo" ? "email" : "whatsapp");
      setSending(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [q]);

  if (loading || !q) return <Skeleton className="h-[640px]" />;

  const code = folio("C", q.folio);
  const link = `${siteUrl()}/c/${q.public_token}`;
  const items = [...(q.quote_items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const cost = items.reduce((a, i) => a + Number(i.unit_cost) * Number(i.quantity), 0);
  const firstName = q.clients?.name.split(" ")[0] ?? "";
  const getPdf = async () => ({ blob: await buildPdf(quoteToPdf(q, profile)), filename: `Cotizacion-${code}-${profile.business_name.replace(/\s+/g, "")}.pdf` });

  async function setStatus(status: QuoteStatus, extra: Record<string, unknown> = {}) {
    const { error } = await sb.from("quotes").update({ status, ...extra }).eq("id", id);
    if (error) return toast.error(error.message);
    setData({ ...q!, status, ...extra } as Quote);
  }

  async function toOrder() {
    setBusy(true);
    try {
      const order = must(
        await sb
          .from("orders")
          .insert({
            client_id: q!.client_id,
            quote_id: q!.id,
            source: "cotizacion",
            status: "confirmado",
            delivery_date: q!.event_date,
            customer_name: q!.clients?.name ?? null,
            customer_phone: q!.clients?.phone ?? null,
            customer_email: q!.clients?.email ?? null,
            delivery_address: q!.clients?.address ?? null,
            notes: q!.notes,
            subtotal: q!.subtotal,
            discount: q!.discount,
            shipping: q!.shipping,
            iva: q!.iva,
            total: q!.total,
          })
          .select("id")
          .single(),
      ) as { id: string };
      must(
        await sb.from("order_items").insert(
          items.map((i, idx) => ({
            order_id: order.id,
            dessert_id: i.dessert_id,
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
            unit_cost: i.unit_cost,
            position: idx,
            // Las cajas conservan qué traen (para producción e inventario)
            ...(items.some((x) => x.package_id) ? { package_id: i.package_id ?? null, components: i.components ?? [] } : {}),
          })),
        ),
      );
      if (q!.status !== "aceptada") await sb.from("quotes").update({ status: "aceptada", accepted_at: new Date().toISOString() }).eq("id", id);
      toast.success("¡Pedido creado! 🎂");
      router.push(`/dashboard/pedidos/${order.id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  async function toggleShare(enabled: boolean) {
    const { error } = await sb.from("quotes").update({ share_enabled: enabled }).eq("id", id);
    if (error) return toast.error(error.message);
    setData({ ...q!, share_enabled: enabled });
    toast.success(enabled ? "Enlace público activado" : "Enlace desactivado: nadie podrá abrirlo");
  }

  async function regenerate() {
    if (!(await confirm({ title: "¿Generar un enlace nuevo?", message: "El enlace anterior dejará de funcionar de inmediato. Úsalo si se compartió por error.", confirmText: "Generar nuevo" }))) return;
    const { data: token, error } = await sb.rpc("regenerate_quote_token", { p_id: id });
    if (error) return toast.error(error.message);
    setData({ ...q!, public_token: token as string, share_enabled: true });
    toast.success("Enlace nuevo generado");
  }

  async function remove() {
    if (!(await confirm({ title: "¿Eliminar cotización?", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("quotes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    router.replace("/dashboard/cotizaciones");
  }

  const st = QUOTE_STATUS[q.status];
  const shareOn = q.share_enabled !== false;
  const tplVars = {
    cliente: firstName,
    folio: code,
    total: money(q.total),
    titulo: q.title ? ` de "${q.title}"` : "",
    fecha: q.event_date ? dateLong(q.event_date) : "",
    vigencia: q.valid_until ? dateLong(q.valid_until) : "",
    enlace: shareOn ? link : "",
    postres: items.map((i) => `• ${num(i.quantity)} × ${i.description}`).join("\n"),
    datos_pago: profile.bank_info ?? "",
    negocio: profile.business_name,
    tu_nombre: profile.owner_name ?? profile.business_name,
  };
  const waText = renderTemplate(getTemplate(profile, "cotizacion_whatsapp"), tplVars);
  const emailText = renderTemplate(getTemplate(profile, "cotizacion_correo"), tplVars);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/cotizaciones" className="inline-flex items-center gap-2 text-sm font-bold text-cocoa-400 hover:text-rose-500">
          <ArrowLeft className="h-4 w-4" /> Cotizaciones
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={remove} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
          <ButtonLink href={`/dashboard/cotizaciones/${id}/editar`} variant="outline"><Pencil className="h-4 w-4" /> Editar</ButtonLink>
          <Button variant="outline" onClick={async () => { setBusy(true); const p = await getPdf(); downloadBlob(p.blob, p.filename); setBusy(false); }} loading={busy}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          <Button onClick={() => { setSendTab("whatsapp"); setSending(true); }}><Send className="h-4 w-4" /> Enviar</Button>
        </div>
      </div>

      {q.source === "tienda" && q.request && <CustomRequestCard q={q} />}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        {/* Vista previa estilo documento */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-5 bg-cream-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.logo_url || "/logo-transparent.png"} alt="" className="h-20 w-20 object-contain" />
            <div className="sm:text-right">
              <p className="font-display text-xl font-semibold text-cocoa-700 italic">{profile.business_name}</p>
              <p className="text-xs text-cocoa-400">{[profile.whatsapp, profile.email].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <div className="flex h-1.5"><span className="flex-[3] bg-rose-500" /><span className="flex-[2] bg-mint-400" /><span className="flex-1 bg-mint-500" /></div>
          <div className="px-6 py-8 sm:px-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-4xl font-semibold text-rose-500 italic">Cotización</h1>
                {q.title && <p className="mt-1 font-display text-lg text-cocoa-600 italic">{q.title}</p>}
              </div>
              <div className="text-right">
                <Badge tone={st.tone}>{st.label}</Badge>
                <p className="mt-1 text-sm font-bold tracking-widest text-cocoa-400">{code}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-cream-100 p-4">
                <p className="text-[10.5px] font-bold tracking-widest text-mint-500 uppercase">Preparada para</p>
                <p className="mt-1 font-semibold text-cocoa-700">{q.clients?.name ?? "Sin cliente"}</p>
                <p className="text-sm text-cocoa-500">{[q.clients?.phone, q.clients?.email].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="space-y-1 rounded-2xl bg-cream-100 p-4 text-sm">
                <p className="flex justify-between"><span className="text-cocoa-400">Fecha</span><b>{date(q.created_at)}</b></p>
                {q.event_date && <p className="flex justify-between"><span className="text-cocoa-400">Evento</span><b className="flex items-center gap-1"><CalendarHeart className="h-3.5 w-3.5 text-rose-400" /> {date(q.event_date)}</b></p>}
                {q.valid_until && <p className="flex justify-between"><span className="text-cocoa-400">Vigencia</span><b>{date(q.valid_until)}</b></p>}
              </div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b-2 border-rose-400 text-left text-[10.5px] font-bold tracking-widest text-rose-500 uppercase">
                    <th className="pb-2">Descripción</th>
                    <th className="pb-2 text-center">Cant.</th>
                    <th className="pb-2 text-right">Precio</th>
                    <th className="pb-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-b border-cocoa-800/5">
                      <td className="py-3 font-semibold text-cocoa-700">{i.description}</td>
                      <td className="py-3 text-center">{num(i.quantity)}</td>
                      <td className="py-3 text-right text-cocoa-500 tabular-nums">{money(i.unit_price)}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{money(Number(i.quantity) * Number(i.unit_price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 ml-auto max-w-xs space-y-1 text-sm">
              <p className="flex justify-between"><span className="text-cocoa-400">Subtotal</span><b className="tabular-nums">{money(q.subtotal)}</b></p>
              {q.discount > 0 && <p className="flex justify-between text-rose-600"><span>Descuento</span><b className="tabular-nums">-{money(q.discount)}</b></p>}
              {q.shipping > 0 && <p className="flex justify-between"><span className="text-cocoa-400">Envío</span><b className="tabular-nums">{money(q.shipping)}</b></p>}
              {q.iva > 0 && <p className="flex justify-between"><span className="text-cocoa-400">IVA</span><b className="tabular-nums">{money(q.iva)}</b></p>}
              <p className="mt-2 flex items-center justify-between rounded-2xl bg-rose-500 px-4 py-3 text-white"><span className="font-bold tracking-widest">TOTAL</span><span className="font-display text-2xl font-semibold tabular-nums">{money(q.total)}</span></p>
            </div>
            {q.notes && <div className="mt-8"><h3 className="text-lg font-semibold italic">Notas</h3><p className="mt-1 text-sm whitespace-pre-line text-cocoa-500">{q.notes}</p></div>}
            {q.terms && <div className="mt-5"><h3 className="text-lg font-semibold italic">Términos y condiciones</h3><p className="mt-1 text-sm whitespace-pre-line text-cocoa-500">{q.terms}</p></div>}
          </div>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-4 xl:sticky xl:top-8">
          <Card className="p-5">
            <p className="text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Estado</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["borrador", "enviada", "aceptada", "rechazada"] as QuoteStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s, s === "aceptada" ? { accepted_at: new Date().toISOString() } : {})}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition ${q.status === s ? "bg-cocoa-800 text-cream-100" : "bg-cream-100 text-cocoa-500 hover:bg-cream-200"}`}
                >
                  {s === "aceptada" && <Check className="h-4 w-4" />}
                  {s === "rechazada" && <X className="h-4 w-4" />}
                  {QUOTE_STATUS[s].label}
                </button>
              ))}
            </div>
            {q.sent_at && <p className="mt-3 text-xs text-cocoa-400">Enviada el {date(q.sent_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
            {q.accepted_at && <p className="mt-1 text-xs text-mint-600">Aceptada el {date(q.accepted_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
          </Card>
          <Card className="p-5">
            <Button variant="mint" className="w-full" onClick={toOrder} loading={busy}>
              <ShoppingBag className="h-4 w-4" /> Convertir en pedido
            </Button>
            <p className="mt-2 text-center text-xs text-cocoa-400">Crea el pedido con los mismos postres y fecha.</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-cocoa-300 uppercase"><ShieldCheck className="h-3.5 w-3.5 text-mint-500" /> Enlace privado</p>
              <Toggle checked={q.share_enabled !== false} onChange={toggleShare} />
            </div>
            <p className="mt-1 text-sm text-cocoa-500">
              {q.share_enabled !== false
                ? "Solo quien tenga este enlace secreto puede ver, descargar y aceptar la cotización."
                : "Desactivado: el enlace no abre para nadie."}
            </p>
            {q.share_enabled !== false && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Enlace copiado"))}><Copy className="h-4 w-4" /> Copiar</Button>
                <ButtonLink size="sm" variant="secondary" href={link}><ExternalLink className="h-4 w-4" /> Ver</ButtonLink>
              </div>
            )}
            <button onClick={regenerate} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-cocoa-400 hover:text-rose-500"><RefreshCw className="h-3.5 w-3.5" /> Generar enlace nuevo</button>
            <p className="mt-2 text-[11px] text-cocoa-300">Código de verificación del PDF: <span className="font-mono font-semibold text-cocoa-500">{verifyCode(q.public_token)}</span></p>
          </Card>
          {cost > 0 && (
            <Card className="p-5">
              <p className="text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Solo para ti</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-cocoa-400">Costo</p><p className="font-display text-lg font-semibold tabular-nums">{money(cost)}</p></div>
                <div><p className="text-cocoa-400">Utilidad</p><p className="font-display text-lg font-semibold text-mint-600 tabular-nums">{money(q.subtotal - q.discount - cost)}</p></div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <SendDialog
        open={sending}
        onClose={() => setSending(false)}
        getPdf={getPdf}
        phone={q.clients?.phone}
        email={q.clients?.email}
        whatsappText={waText}
        emailSubject={`Cotización ${code} · ${profile.business_name}`}
        emailText={emailText}
        link={q.share_enabled !== false ? link : undefined}
        initialTab={sendTab}
        onSent={() => q.status === "borrador" && setStatus("enviada", { sent_at: new Date().toISOString() })}
      />
    </>
  );
}
