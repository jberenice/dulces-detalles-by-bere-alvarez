"use client";
import { storeUrl } from "@/lib/domains";
import { useState } from "react";
import { CalendarHeart, Check, Download, MessageCircle, Store } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { buildPdf, downloadBlob, quoteToPdf } from "@/lib/pdf";
import { date, folio, money, num, waLink } from "@/lib/format";
import type { Quote } from "@/lib/types";

export type PublicQuoteData = {
  quote: Omit<Quote, "clients" | "quote_items">;
  client: { name: string; phone: string | null; email: string | null; address: string | null } | null;
  items: { description: string; quantity: number; unit_price: number; total: number }[];
  business: {
    business_name: string;
    owner_name: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    logo_url: string | null;
    instagram: string | null;
    facebook?: string | null;
    bank_info: string | null;
    store_slug: string | null;
  };
};

export function PublicQuote({ data, token }: { data: PublicQuoteData; token: string }) {
  const { quote: q, business: b, items } = data;
  const [status, setStatus] = useState(q.status);
  const [busy, setBusy] = useState(false);
  const code = folio("C", q.folio);
  const expired = q.valid_until && new Date(q.valid_until + "T23:59:59") < new Date();

  async function accept() {
    setBusy(true);
    const { data: ok, error } = await createClient().rpc("accept_public_quote", { p_token: token });
    setBusy(false);
    if (error || !ok) return toast.error("No se pudo aceptar la cotización");
    setStatus("aceptada");
    toast.success("¡Gracias! Avisamos a la repostería 💕");
    window.open(waLink(b.whatsapp, `¡Hola! Acepto la cotización ${code} por ${money(q.total)} 🧁 ¿Cómo confirmo mi pedido?`), "_blank");
  }

  async function pdf() {
    setBusy(true);
    try {
      const blob = await buildPdf(
        quoteToPdf({ ...q, clients: data.client ? { id: "", ...data.client } : null, quote_items: items.map((i, idx) => ({ ...i, dessert_id: null, unit_cost: 0, position: idx })) } as Quote, {
          business_name: b.business_name,
          owner_name: b.owner_name,
          whatsapp: b.whatsapp,
          phone: b.phone,
          email: b.email,
          address: b.address,
          instagram: b.instagram,
          facebook: b.facebook ?? null,
          bank_info: b.bank_info,
          logo_url: b.logo_url,
        }),
      );
      downloadBlob(blob, `Cotizacion-${code}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sprinkles min-h-dvh bg-cream-100 px-4 py-8 sm:py-14">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-lift animate-fade-up">
        <header className="flex flex-col items-center gap-4 bg-cream-100 px-6 py-7 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.logo_url || "/logo-transparent.svg"} alt={b.business_name} className="h-24 w-24 rounded-full bg-white object-cover shadow-sm" />
          <div className="sm:text-right">
            <p className="font-display text-2xl font-semibold text-cocoa-700 italic">{b.business_name}</p>
            <p className="text-sm text-cocoa-400">{[b.whatsapp, b.email].filter(Boolean).join(" · ")}</p>
          </div>
        </header>
        <div className="flex h-1.5"><span className="flex-[3] bg-rose-500" /><span className="flex-[2] bg-mint-400" /><span className="flex-1 bg-mint-500" /></div>

        <div className="px-6 py-8 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-script text-2xl text-rose-400">{data.client ? `Para ${data.client.name.split(" ")[0]}` : "Tu cotización"}</p>
              <h1 className="font-display text-4xl font-semibold text-cocoa-700 italic">{q.title || "Cotización"}</h1>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold tracking-widest text-cocoa-400">{code}</p>
              <p className="text-cocoa-400">{date(q.created_at)}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {q.event_date && <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 font-semibold text-rose-600"><CalendarHeart className="h-4 w-4" /> {date(q.event_date, { weekday: "long", day: "numeric", month: "long" })}</span>}
            {q.valid_until && <span className={`rounded-full px-3 py-1.5 font-semibold ${expired ? "bg-amber-50 text-amber-700" : "bg-cream-200 text-cocoa-500"}`}>{expired ? "Vencida el" : "Válida hasta"} {date(q.valid_until)}</span>}
          </div>

          <ul className="mt-8 divide-y divide-cocoa-800/5 border-y border-cocoa-800/5">
            {items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-4 py-4">
                <span className="grid h-10 min-w-10 place-items-center rounded-xl bg-rose-50 px-2 font-display font-semibold text-rose-500">{num(i.quantity)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-cocoa-700">{i.description}</p>
                  <p className="text-xs text-cocoa-400">{money(i.unit_price)} c/u</p>
                </div>
                <p className="font-semibold tabular-nums">{money(i.total)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 ml-auto max-w-xs space-y-1 text-sm">
            <p className="flex justify-between"><span className="text-cocoa-400">Subtotal</span><b className="tabular-nums">{money(q.subtotal)}</b></p>
            {q.discount > 0 && <p className="flex justify-between text-rose-600"><span>Descuento</span><b className="tabular-nums">-{money(q.discount)}</b></p>}
            {q.shipping > 0 && <p className="flex justify-between"><span className="text-cocoa-400">Envío</span><b className="tabular-nums">{money(q.shipping)}</b></p>}
            {q.iva > 0 && <p className="flex justify-between"><span className="text-cocoa-400">IVA</span><b className="tabular-nums">{money(q.iva)}</b></p>}
            <p className="mt-2 flex items-center justify-between rounded-2xl bg-rose-500 px-4 py-3 text-white"><span className="font-bold tracking-widest">TOTAL</span><span className="font-display text-2xl font-semibold tabular-nums">{money(q.total)}</span></p>
          </div>

          {q.notes && <section className="mt-8"><h2 className="text-lg font-semibold italic">Notas</h2><p className="mt-1 text-sm whitespace-pre-line text-cocoa-500">{q.notes}</p></section>}
          {q.terms && <section className="mt-5"><h2 className="text-lg font-semibold italic">Términos y condiciones</h2><p className="mt-1 text-sm whitespace-pre-line text-cocoa-500">{q.terms}</p></section>}
          {b.bank_info && <section className="mt-5 rounded-2xl bg-mint-50 p-4"><h2 className="text-xs font-bold tracking-widest text-mint-600 uppercase not-italic">Datos para pago</h2><p className="mt-1 text-sm whitespace-pre-line text-cocoa-600">{b.bank_info}</p></section>}

          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            {status === "aceptada" ? (
              <p className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-mint-50 py-3 font-bold text-mint-700"><Check className="h-5 w-5" /> Cotización aceptada</p>
            ) : (
              <Button size="lg" variant="mint" className="flex-1" onClick={accept} loading={busy} disabled={!!expired || status === "rechazada"}>
                <Check className="h-5 w-5" /> Aceptar cotización
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={pdf} loading={busy}><Download className="h-5 w-5" /> Descargar PDF</Button>
            {b.whatsapp && (
              <a href={waLink(b.whatsapp, `¡Hola! Tengo una duda sobre la cotización ${code} 🧁`)} target="_blank" rel="noreferrer" className="flex h-13 items-center justify-center gap-2 rounded-2xl px-5 font-bold text-mint-700 hover:bg-mint-50">
                <MessageCircle className="h-5 w-5" /> Preguntar
              </a>
            )}
          </div>
        </div>
      </article>
      <div className="mt-8 text-center">
        <p className="font-script text-2xl text-rose-400">Hechos con amor de hogar</p>
        {b.store_slug && (
          <a href={storeUrl(b.store_slug)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-cocoa-500 hover:text-rose-500"><Store className="h-4 w-4" /> Visita nuestra tienda</a>
        )}
        <SiteFooter compact social={false} />
      </div>
    </div>
  );
}
