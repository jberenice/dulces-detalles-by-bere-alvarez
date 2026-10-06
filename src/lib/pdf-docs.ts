/** Datos del PDF de cotización / nota de pedido. Sin "use client": se usa en el navegador y en el servidor. */
import type { PdfDoc } from "@/components/pdf/DocumentPDF";
import { date, dateLong, facebookLabel, folio as fmtFolio, siteUrl } from "./format";
import type { Order, Profile, Quote } from "./types";

/** Código corto de verificación (no secreto) a partir del token: permite comprobar que el PDF es auténtico */
export const verifyCode = (token?: string | null) => (token ? token.replace(/-/g, "").slice(0, 8).toUpperCase().replace(/(.{4})(.{4})/, "$1-$2") : null);

export type BusinessLike = Pick<Profile, "business_name" | "owner_name" | "whatsapp" | "phone" | "email" | "address" | "instagram" | "facebook" | "bank_info" | "logo_url">;

function businessOf(p: BusinessLike, origin?: string) {
  const logo = p.logo_url && !p.logo_url.endsWith(".webp") ? p.logo_url : `${origin ?? siteUrl()}/logo-transparent.png`;
  return {
    name: p.business_name,
    owner: p.owner_name,
    phone: p.whatsapp || p.phone,
    email: p.email,
    address: p.address,
    instagram: p.instagram,
    facebook: p.facebook ? facebookLabel(p.facebook) : null,
    bank: p.bank_info,
    logo,
  };
}

export function quoteToPdf(q: Quote, p: BusinessLike): PdfDoc {
  const meta = [{ label: "Fecha", value: date(q.created_at) }];
  if (q.event_date) meta.push({ label: "Evento", value: date(q.event_date) });
  if (q.valid_until) meta.push({ label: "Vigencia", value: date(q.valid_until) });
  return {
    kind: "cotizacion",
    folio: fmtFolio("C", q.folio),
    verify: verifyCode(q.public_token),
    issuedAt: dateLong(q.created_at),
    title: q.title,
    business: businessOf(p),
    client: q.clients ?? null,
    meta,
    items: [...(q.quote_items ?? [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((i) => ({ description: i.description, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
    subtotal: Number(q.subtotal),
    discount: Number(q.discount),
    shipping: Number(q.shipping),
    iva: Number(q.iva),
    total: Number(q.total),
    notes: q.notes,
    terms: q.terms,
    link: q.share_enabled === false ? null : `${siteUrl()}/c/${q.public_token}`,
  };
}

export function orderToPdf(o: Order, p: BusinessLike, origin?: string): PdfDoc {
  const meta = [{ label: "Pedido", value: date(o.created_at) }];
  if (o.delivery_date) meta.push({ label: "Entrega", value: `${date(o.delivery_date)}${o.delivery_time ? " · " + o.delivery_time : ""}` });
  meta.push({ label: "Modalidad", value: o.delivery_type === "envio" ? "Envío a domicilio" : "Recoger en tienda" });
  meta.push({ label: "Pago", value: o.payment_status === "pagado" ? "Pagado" : o.payment_status === "anticipo" ? "Con anticipo" : "Pendiente" });
  const client = o.clients ?? (o.customer_name ? { name: o.customer_name, phone: o.customer_phone, email: o.customer_email, address: null } : null);
  return {
    kind: "pedido",
    folio: fmtFolio("P", o.folio),
    verify: verifyCode(o.public_token),
    issuedAt: dateLong(o.created_at),
    business: businessOf(p, origin),
    client: client ? { ...client, address: o.delivery_type === "envio" ? o.delivery_address ?? client.address : client.address } : null,
    meta,
    items: [...(o.order_items ?? [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((i) => ({ description: i.description, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    shipping: Number(o.shipping),
    iva: Number(o.iva),
    total: Number(o.total),
    deposit: Number(o.deposit) || 0,
    notes: o.notes,
  };
}

