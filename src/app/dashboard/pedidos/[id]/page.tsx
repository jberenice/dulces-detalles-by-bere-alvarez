"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, Check, ChefHat, Clock, Download, FileText, MapPin, MessageCircle, Package, Pencil, PartyPopper, Phone, CalendarPlus, Send, Share2, Store, Trash2, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { useConfirm } from "@/components/ui/Confirm";
import { Badge, Card, Skeleton } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SendDialog } from "@/components/dashboard/SendDialog";
import { PaymentModal } from "@/components/dashboard/PaymentModal";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { getTemplate, renderTemplate } from "@/lib/templates";
import { buildPdf, downloadBlob, orderToPdf } from "@/lib/pdf";
import { sharePdf } from "@/lib/documents";
import { googleCalendarUrl } from "@/lib/reminders";
import { date, dateLong, folio, money, num, waLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Order, OrderPayment, OrderStatus } from "@/lib/types";

const FLOW: { key: OrderStatus; label: string; icon: typeof Check }[] = [
  { key: "pendiente", label: "Pendiente", icon: Clock },
  { key: "confirmado", label: "Confirmado", icon: Check },
  { key: "en_preparacion", label: "Preparando", icon: ChefHat },
  { key: "listo", label: "Listo", icon: Package },
  { key: "entregado", label: "Entregado", icon: PartyPopper },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const sb = createClient();
  const confirm = useConfirm();
  const { profile } = useBusiness();
  const [sending, setSending] = useState(false);
  const [sendTab, setSendTab] = useState<"whatsapp" | "email">("whatsapp");
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: o, loading, setData, reload } = useAsync(
    async () => must(await sb.from("orders").select("*, clients(id, name, phone, email, address), order_items(*)").eq("id", id).single()) as Order,
    [id],
  );
  const payments = useAsync(
    async () => must(await sb.from("order_payments").select("*").eq("order_id", id).order("paid_at", { ascending: true })) as OrderPayment[],
    [id],
  );
  const reloadAll = () => {
    reload();
    payments.reload();
  };

  useEffect(() => {
    if (!o) return;
    const v = new URLSearchParams(window.location.search).get("enviar");
    if (v === "whatsapp" || v === "correo") {
      setSendTab(v === "correo" ? "email" : "whatsapp");
      setSending(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [o]);

  if (loading || !o) return <Skeleton className="h-[640px]" />;

  const code = folio("P", o.folio);
  const items = [...(o.order_items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const cost = items.reduce((a, i) => a + Number(i.unit_cost) * Number(i.quantity), 0);
  const name = o.clients?.name ?? o.customer_name ?? "Cliente";
  const phone = o.clients?.phone ?? o.customer_phone;
  const email = o.clients?.email ?? o.customer_email;
  const balance = Math.max(Number(o.total) - Number(o.deposit), 0);
  const stepIdx = FLOW.findIndex((s) => s.key === o.status);
  const getPdf = async () => ({ blob: await buildPdf(orderToPdf(o, profile)), filename: `Pedido-${code}.pdf` });

  async function patch(p: Partial<Order>, msg?: string) {
    const { error } = await sb.from("orders").update(p).eq("id", id);
    if (error) return toast.error(error.message);
    setData({ ...o!, ...p });
    if (msg) toast.success(msg);
  }

  async function removePayment(p: OrderPayment) {
    if (!(await confirm({ title: "¿Eliminar este pago?", message: `Se restarán ${money(p.amount)} de lo pagado.`, confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("order_payments").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Pago eliminado");
    reloadAll();
  }

  async function remove() {
    if (!(await confirm({ title: "¿Eliminar pedido?", message: "Se quitará también de tus reportes de ventas.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    router.replace("/dashboard/pedidos");
  }

  const first = name.split(" ")[0];
  const summary = items.map((i) => `• ${num(i.quantity)} × ${i.description}`).join("\n");
  const tplVars = {
    cliente: first,
    folio: code,
    total: money(o.total),
    fecha: o.delivery_date ? dateLong(o.delivery_date) : "por confirmar",
    hora: o.delivery_time ? `a las ${o.delivery_time}` : "",
    postres: summary,
    anticipo: Number(o.deposit) > 0 ? money(o.deposit) : "",
    saldo: balance > 0 ? money(balance) : "",
    entrega: o.delivery_type === "envio" ? "en camino a tu domicilio" : "lista para recoger",
    datos_pago: profile.bank_info ?? "",
    negocio: profile.business_name,
    tu_nombre: profile.owner_name ?? profile.business_name,
  };
  const quick = [
    { label: "Confirmar pedido", text: renderTemplate(getTemplate(profile, "pedido_confirmado"), tplVars) },
    { label: "Pedido listo", text: renderTemplate(getTemplate(profile, "pedido_listo"), tplVars) },
    { label: "Recordar pago", text: renderTemplate(getTemplate(profile, "recordatorio_pago"), tplVars) },
    { label: "Gracias", text: renderTemplate(getTemplate(profile, "agradecimiento"), tplVars) },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/pedidos" className="inline-flex items-center gap-2 text-sm font-bold text-cocoa-400 hover:text-rose-500">
          <ArrowLeft className="h-4 w-4" /> Pedidos
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={remove} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
          <ButtonLink href={`/dashboard/pedidos/${id}/editar`} variant="outline"><Pencil className="h-4 w-4" /> Editar</ButtonLink>
          <Button variant="outline" loading={busy} onClick={async () => { setBusy(true); const p = await getPdf(); downloadBlob(p.blob, p.filename); setBusy(false); }}>
            <Download className="h-4 w-4" /> Nota PDF
          </Button>
          <Button variant="outline" onClick={async () => { const p = await getPdf(); await sharePdf(p.blob, p.filename, `Pedido ${code}`); }}>
            <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Compartir</span>
          </Button>
          <Button onClick={() => { setSendTab("whatsapp"); setSending(true); }}><Send className="h-4 w-4" /> Enviar</Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-widest text-cocoa-300">{code}</p>
          <h1 className="text-[32px] leading-tight font-semibold">{name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
            <Badge tone={PAYMENT_STATUS[o.payment_status].tone}>{PAYMENT_STATUS[o.payment_status].label}</Badge>
            {o.source === "tienda" && <Badge tone="mint"><Store className="h-3 w-3" /> Tienda en línea</Badge>}
            {o.source === "cotizacion" && <Badge tone="info"><FileText className="h-3 w-3" /> Desde cotización</Badge>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold tracking-wider text-cocoa-300 uppercase">Entrega</p>
          <p className="font-display text-xl font-semibold capitalize">{o.delivery_date ? dateLong(o.delivery_date) : "Sin fecha"}</p>
          {o.delivery_time && <p className="text-sm text-cocoa-500">{o.delivery_time} h</p>}
        </div>
      </div>

      {/* Progreso */}
      {o.status !== "cancelado" ? (
        <Card className="mb-6 p-4 sm:p-5">
          <ol className="grid grid-cols-5 gap-1">
            {FLOW.map((s, i) => {
              const done = i <= stepIdx;
              const Icon = s.icon;
              return (
                <li key={s.key}>
                  <button onClick={() => patch({ status: s.key }, `Pedido: ${s.label.toLowerCase()}`)} className="group flex w-full flex-col items-center gap-1.5">
                    <div className="flex w-full items-center">
                      <span className={cn("h-1 flex-1 rounded-full", i === 0 ? "opacity-0" : done ? "bg-mint-400" : "bg-cocoa-800/8")} />
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full transition", done ? "bg-mint-500 text-white shadow-[0_8px_18px_-8px_rgb(106_166_138)]" : "bg-cream-200 text-cocoa-300 group-hover:bg-cream-300", i === stepIdx && "ring-4 ring-mint-100")}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className={cn("h-1 flex-1 rounded-full", i === FLOW.length - 1 ? "opacity-0" : i < stepIdx ? "bg-mint-400" : "bg-cocoa-800/8")} />
                    </div>
                    <span className={cn("text-[11px] font-bold sm:text-xs", done ? "text-mint-700" : "text-cocoa-300")}>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Card>
      ) : (
        <Card className="mb-6 flex items-center justify-between gap-3 bg-rose-50 p-4">
          <p className="flex items-center gap-2 font-semibold text-rose-700"><Ban className="h-5 w-5" /> Pedido cancelado</p>
          <Button size="sm" variant="outline" onClick={() => patch({ status: "pendiente" }, "Pedido reactivado")}>Reactivar</Button>
        </Card>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5">
              <h3 className="text-lg font-semibold">Postres</h3>
              <span className="text-sm text-cocoa-400">{num(items.reduce((a, i) => a + Number(i.quantity), 0), 0)} piezas</span>
            </div>
            <ul className="mt-3 divide-y divide-cocoa-800/5">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-6 py-3.5">
                  <span className="grid h-10 min-w-10 place-items-center rounded-xl bg-rose-50 px-2 font-display font-semibold text-rose-500">{num(i.quantity)}×</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-cocoa-700">{i.description}</p>
                    <p className="text-xs text-cocoa-400">{money(i.unit_price)} c/u</p>
                  </div>
                  <p className="font-semibold tabular-nums">{money(Number(i.quantity) * Number(i.unit_price))}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-cocoa-800/5 bg-cream-50 px-6 py-4 text-sm">
              <p className="flex justify-between"><span className="text-cocoa-400">Subtotal</span><b className="tabular-nums">{money(o.subtotal)}</b></p>
              {o.discount > 0 && <p className="flex justify-between text-rose-600"><span>Descuento</span><b className="tabular-nums">-{money(o.discount)}</b></p>}
              {o.shipping > 0 && <p className="flex justify-between"><span className="text-cocoa-400">Envío</span><b className="tabular-nums">{money(o.shipping)}</b></p>}
              {o.iva > 0 && <p className="flex justify-between"><span className="text-cocoa-400">IVA</span><b className="tabular-nums">{money(o.iva)}</b></p>}
              <p className="flex items-end justify-between pt-2"><span className="font-bold">Total</span><span className="font-display text-2xl font-semibold text-rose-500 tabular-nums">{money(o.total)}</span></p>
            </div>
          </Card>

          {o.notes && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Notas</h3>
              <p className="mt-2 text-sm whitespace-pre-line text-cocoa-600">{o.notes}</p>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><MessageCircle className="h-5 w-5 text-mint-500" /> Mensajes rápidos</h3>
            <p className="mt-1 text-sm text-cocoa-400">
              Abre WhatsApp con el mensaje listo para tu cliente. <Link href="/dashboard/mensajes" className="font-bold text-rose-500 hover:underline">Personalizar mensajes</Link>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {quick.map((m) => (
                <a key={m.label} href={waLink(phone, m.text)} target="_blank" rel="noreferrer" className="rounded-xl bg-mint-50 px-3.5 py-2 text-sm font-bold text-mint-700 transition hover:bg-mint-100">
                  {m.label}
                </a>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-8">
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-semibold"><Wallet className="h-5 w-5 text-rose-400" /> Pago</h3>
            <div className="mt-4">
              <div className="h-2.5 overflow-hidden rounded-full bg-cream-200">
                <div className="h-full rounded-full bg-mint-400 transition-all" style={{ width: `${Math.min(100, (Number(o.deposit) / Math.max(Number(o.total), 1)) * 100)}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-cocoa-400">Pagado</p><p className="font-display text-lg font-semibold text-mint-600 tabular-nums">{money(o.deposit)}</p></div>
                <div><p className="text-cocoa-400">Por cobrar</p><p className="font-display text-lg font-semibold tabular-nums">{money(balance)}</p></div>
              </div>
            </div>
            {o.payment_status !== "pagado" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" onClick={() => setPayOpen(true)}>Registrar abono</Button>
                <Button size="sm" variant="mint" onClick={async () => { await patch({ payment_status: "pagado" }, "Pedido pagado ✨"); reloadAll(); }}>Marcar pagado</Button>
              </div>
            )}
            {(payments.data ?? []).length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-cocoa-800/5 pt-3">
                {payments.data!.map((p) => (
                  <li key={p.id} className="group flex items-center gap-2 text-[13px]">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", Number(p.amount) > 0 ? "bg-mint-400" : "bg-rose-400")} />
                    <span className="min-w-0 flex-1 truncate text-cocoa-500">
                      {date(p.paid_at, { day: "numeric", month: "short" })}
                      {p.method && ` · ${p.method}`}
                      {p.note && ` · ${p.note}`}
                    </span>
                    <span className="font-semibold text-cocoa-700 tabular-nums">{money(p.amount)}</span>
                    <button onClick={() => removePayment(p)} className="rounded-lg p-1 text-cocoa-300 opacity-60 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100" aria-label="Eliminar pago">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {o.payment_method && <p className="mt-3 text-xs text-cocoa-400">Método: {o.payment_method}</p>}
          </Card>

          <Card className="space-y-3 p-5 text-sm">
            <h3 className="font-semibold">Cliente</h3>
            {phone && <a href={waLink(phone, `Hola ${first}`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-cocoa-600 hover:text-mint-600"><Phone className="h-4 w-4 text-cocoa-300" /> {phone}</a>}
            {email && <a href={`mailto:${email}`} className="flex items-center gap-2 truncate text-cocoa-600 hover:text-rose-500"><Send className="h-4 w-4 text-cocoa-300" /> {email}</a>}
            <p className="flex items-start gap-2 text-cocoa-600">
              {o.delivery_type === "envio" ? <Truck className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-300" /> : <Store className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-300" />}
              {o.delivery_type === "envio" ? `${o.delivery_zone ? o.delivery_zone + " · " : ""}${o.delivery_address || "Envío (sin dirección)"}` : "Recoge en tienda"}
            </p>
            {o.delivery_type === "envio" && o.delivery_address && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(o.delivery_address)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-rose-500"><MapPin className="h-4 w-4" /> Abrir en mapas</a>
            )}
            {(() => {
              const gcal = googleCalendarUrl({
                delivery_date: o.delivery_date,
                delivery_time: o.delivery_time,
                title: `🧁 Entrega ${code} · ${name}`,
                details: `${items.map((i) => `${num(i.quantity)} × ${i.description}`).join("\n")}\n\nTotal: ${money(o.total)}${balance > 0 ? ` · Por cobrar: ${money(balance)}` : ""}\nTel: ${phone ?? "—"}`,
                location: o.delivery_type === "envio" ? o.delivery_address : null,
                timezone: profile.timezone,
              });
              return gcal ? (
                <a href={gcal} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-mint-600 hover:underline"><CalendarPlus className="h-4 w-4" /> Agregar a Google Calendar</a>
              ) : null;
            })()}
            <p className="text-xs text-cocoa-400">Pedido creado {date(o.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </Card>

          {cost > 0 && (
            <Card className="p-5">
              <p className="text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Rentabilidad</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-cocoa-400">Costo</p><p className="font-display text-lg font-semibold tabular-nums">{money(cost)}</p></div>
                <div><p className="text-cocoa-400">Utilidad</p><p className="font-display text-lg font-semibold text-mint-600 tabular-nums">{money(o.subtotal - o.discount - cost)}</p></div>
              </div>
            </Card>
          )}

          {o.status !== "cancelado" && (
            <button
              onClick={async () => (await confirm({ title: "¿Cancelar pedido?", confirmText: "Cancelar pedido", danger: true })) && patch({ status: "cancelado" }, "Pedido cancelado")}
              className="w-full rounded-2xl py-2 text-sm font-semibold text-cocoa-400 hover:text-rose-500"
            >
              Cancelar pedido
            </button>
          )}
        </div>
      </div>

      <PaymentModal
        order={payOpen ? { id: o.id, folio: o.folio, total: o.total, deposit: o.deposit, customer: name } : null}
        onClose={() => setPayOpen(false)}
        onSaved={reloadAll}
      />

      <SendDialog
        open={sending}
        onClose={() => setSending(false)}
        getPdf={getPdf}
        phone={phone}
        email={email}
        whatsappText={quick[0].text}
        initialTab={sendTab}
        emailSubject={`Tu pedido ${code} · ${profile.business_name}`}
        emailText={`Hola ${first},\n\n¡Gracias por tu pedido! Te comparto la nota con el detalle.\n\nEntrega: ${o.delivery_date ? dateLong(o.delivery_date) : "por confirmar"}${o.delivery_time ? ` a las ${o.delivery_time}` : ""}\nTotal: ${money(o.total)}${balance > 0 ? `\nSaldo pendiente: ${money(balance)}` : ""}\n\nCon cariño,\n${profile.owner_name ?? profile.business_name}`}
      />
    </>
  );
}
