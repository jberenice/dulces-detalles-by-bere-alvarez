import type { Metadata } from "next";
import { BizLogo } from "@/components/store/BizLogo";
import { notFound } from "next/navigation";
import { Ban, Check, ChefHat, Clock, Download, MessageCircle, Package, PartyPopper, Store, Truck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTheme, themeVars } from "@/lib/storeTheme";
import { dateLong, folio, money, waLink } from "@/lib/format";
import { AutoRefresh } from "@/components/store/AutoRefresh";

export const dynamic = "force-dynamic";

type Row = {
  folio: number;
  status: "pendiente" | "confirmado" | "en_preparacion" | "listo" | "entregado" | "cancelado";
  payment_status: "pendiente" | "anticipo" | "pagado";
  public_token: string;
  updated_at: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_type: "envio" | "recoger";
  customer_name: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  deposit: number;
  user_id: string;
  clients: { name: string } | null;
  order_items: { description: string; quantity: number; unit_price: number; position: number | null }[];
};
type Biz = { business_name: string; logo_url: string | null; whatsapp: string | null; store_theme: unknown; address: string | null };

/**
 * Seguimiento del pedido para la clienta.
 * Solo se abre con el token secreto del pedido (UUID aleatorio): el folio o el id no sirven para entrar.
 */
async function getData(token: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: o } = await admin
    .from("orders")
    .select("folio, status, payment_status, public_token, updated_at, delivery_date, delivery_time, delivery_type, customer_name, subtotal, discount, shipping, total, deposit, user_id, clients(name), order_items(description, quantity, unit_price, position)")
    .eq("public_token", token)
    .maybeSingle();
  if (!o) return null;
  const order = o as unknown as Row;
  const { data: b } = await admin.from("profiles").select("business_name, logo_url, whatsapp, store_theme, address").eq("id", order.user_id).single();
  if (!b) return null;
  return { order, biz: b as Biz };
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const d = await getData(token);
  return { title: d ? `Pedido ${folio("P", d.order.folio)} · ${d.biz.business_name}` : "Seguimiento de pedido", robots: { index: false, follow: false } };
}

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await getData(token);
  if (!d) notFound();
  const { order: o, biz } = d;
  const theme = normalizeTheme(biz.store_theme);
  const envio = o.delivery_type === "envio";
  const steps = [
    { key: "pendiente", label: "Recibido", text: "Recibimos tu pedido. En breve te lo confirmamos.", icon: Clock },
    { key: "confirmado", label: "Confirmado", text: "¡Tu pedido está confirmado y apartado en nuestra agenda!", icon: Check },
    { key: "en_preparacion", label: "En preparación", text: "Estamos horneando y decorando tu pedido con mucho cariño.", icon: ChefHat },
    { key: "listo", label: envio ? "Listo para entrega" : "Listo para recoger", text: envio ? "Tu pedido está listo y pronto sale a entrega." : "Tu pedido está listo. ¡Te esperamos!", icon: envio ? Truck : Package },
    { key: "entregado", label: "Entregado", text: "¡Gracias por tu compra! Esperamos que lo disfrutes.", icon: PartyPopper },
  ] as const;
  const idx = steps.findIndex((s) => s.key === o.status);
  const current = idx >= 0 ? steps[idx] : null;
  const name = (o.clients?.name ?? o.customer_name ?? "").split(" ")[0];
  const items = [...o.order_items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const balance = Math.max(Number(o.total) - Number(o.deposit), 0);
  const code = folio("P", o.folio);

  return (
    <main className="min-h-dvh bg-[var(--st-bg)] px-4 py-8 text-[var(--st-text)]" style={themeVars(theme)}>
      <AutoRefresh seconds={60} />
      <div className="mx-auto max-w-lg">
        <header className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <BizLogo src={biz.logo_url} name={biz.business_name} className="mx-auto h-20 w-20 bg-white text-[80px] shadow-md ring-4 ring-white" />
          <p className="mt-3 text-sm font-semibold text-[var(--st-muted)]">{biz.business_name}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold" style={{ fontFamily: "var(--st-heading)" }}>
            {name ? `¡Hola, ${name}!` : "Tu pedido"}
          </h1>
          <p className="mt-1 text-sm text-[var(--st-muted)]">Pedido {code}</p>
        </header>

        <section className="mt-6 rounded-[var(--st-radius)] bg-[var(--st-surface)] p-5 shadow-[0_10px_28px_-12px_rgb(0_0_0/0.18)] ring-1 ring-[var(--st-line)]">
          {o.status === "cancelado" ? (
            <p className="flex items-center gap-2 font-semibold text-rose-600"><Ban className="h-5 w-5" /> Este pedido fue cancelado. Escríbenos si tienes dudas.</p>
          ) : (
            <>
              <p className="text-xs font-bold tracking-wider text-[var(--st-muted)] uppercase">Estado de tu pedido</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--st-primary)]">{current?.label}</p>
              <p className="mt-1 text-sm text-[var(--st-muted)]">{current?.text}</p>
              <ol className="mt-5 space-y-0">
                {steps.map((s, i) => {
                  const done = i <= idx;
                  const Icon = s.icon;
                  return (
                    <li key={s.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                          style={done ? { background: "var(--st-primary)", color: "var(--st-on-primary)" } : { background: "var(--st-soft)", color: "var(--st-muted)" }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {i < steps.length - 1 && <span className="my-1 h-6 w-0.5 rounded-full" style={{ background: i < idx ? "var(--st-primary)" : "var(--st-line)" }} />}
                      </div>
                      <p className={`pt-2 text-sm ${i === idx ? "font-bold" : done ? "font-semibold" : "text-[var(--st-muted)]"}`}>{s.label}</p>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>

        <section className="mt-4 rounded-[var(--st-radius)] bg-[var(--st-surface)] p-5 ring-1 ring-[var(--st-line)]">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {envio ? <Truck className="h-4 w-4 text-[var(--st-primary)]" /> : <Store className="h-4 w-4 text-[var(--st-primary)]" />}
            {envio ? "Envío a domicilio" : "Recoges en tienda"}
          </p>
          <p className="mt-1 text-sm text-[var(--st-muted)] first-letter:uppercase">
            {o.delivery_date ? dateLong(o.delivery_date) : "Fecha por confirmar"}
            {o.delivery_time ? ` · ${o.delivery_time} h` : ""}
          </p>
          {!envio && biz.address && <p className="mt-1 text-sm text-[var(--st-muted)]">{biz.address}</p>}
          <ul className="mt-4 divide-y divide-[var(--st-line)] text-sm">
            {items.map((i, k) => (
              <li key={k} className="flex justify-between gap-3 py-2">
                <span>{Number(i.quantity)} × {i.description}</span>
                <span className="shrink-0 tabular-nums">{money(Number(i.quantity) * Number(i.unit_price))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-1 border-t border-[var(--st-line)] pt-3 text-sm">
            {Number(o.discount) > 0 && <p className="flex justify-between"><span>Descuento</span><span className="tabular-nums">-{money(o.discount)}</span></p>}
            {Number(o.shipping) > 0 && <p className="flex justify-between"><span>Envío</span><span className="tabular-nums">{money(o.shipping)}</span></p>}
            <p className="flex justify-between text-base font-bold"><span>Total</span><span className="tabular-nums">{money(o.total)}</span></p>
            {Number(o.deposit) > 0 && <p className="flex justify-between text-[var(--st-muted)]"><span>Pagado</span><span className="tabular-nums">{money(o.deposit)}</span></p>}
            {o.payment_status !== "pagado" && Number(o.deposit) > 0 && <p className="flex justify-between font-semibold"><span>Por pagar</span><span className="tabular-nums">{money(balance)}</span></p>}
            {o.payment_status === "pagado" && <p className="font-semibold text-[var(--st-primary)]">✓ Pagado</p>}
          </div>
        </section>

        <div className="mt-5 flex flex-col gap-2">
          {biz.whatsapp && (
            <a href={waLink(biz.whatsapp, `¡Hola! Tengo una duda sobre mi pedido ${code}`)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-mint-500 px-5 py-3 font-bold text-white">
              <MessageCircle className="h-5 w-5" /> Escribir por WhatsApp
            </a>
          )}
          <a href={`/pedido/${o.public_token}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-[var(--st-primary)] ring-1 ring-[var(--st-line)]">
            <Download className="h-4 w-4" /> Descargar nota en PDF
          </a>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--st-muted)]">Esta página se actualiza sola. Guárdala para revisar tu pedido cuando quieras.</p>
      </div>
    </main>
  );
}
