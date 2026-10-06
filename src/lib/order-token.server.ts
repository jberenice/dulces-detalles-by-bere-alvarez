/** Busca un pedido por su token secreto (para la clienta). Sin @react-pdf: se puede usar en páginas. */
import type { BusinessLike } from "@/lib/pdf-docs";
import { folio } from "@/lib/format";
import type { Db } from "@/lib/supabase/db";
import type { Order } from "@/lib/types";

export const PROFILE_FIELDS = "id, business_name, owner_name, whatsapp, phone, email, address, instagram, facebook, bank_info, logo_url, store_theme, is_demo";
const ORDER_FIELDS =
  "id, user_id, folio, public_token, created_at, status, source, delivery_date, delivery_time, delivery_type, delivery_address, payment_status, " +
  "customer_name, customer_phone, customer_email, subtotal, discount, shipping, iva, total, deposit, notes, " +
  "order_items(description, quantity, unit_price, position), clients(id, name, phone, email, address)";

export type OrderForPdf = Order & { user_id: string; source: string };
export type ProfileForPdf = BusinessLike & { id: string; store_theme: unknown; is_demo: boolean | null };

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isToken = (t: unknown): t is string => typeof t === "string" && TOKEN.test(t);

/** Busca el pedido por su token secreto (nunca por id ni folio) */
export async function orderByToken(admin: Db, token: string) {
  if (!isToken(token)) return null;
  const { data: order } = await admin.from("orders").select(ORDER_FIELDS).eq("public_token", token).maybeSingle();
  if (!order) return null;
  const o = order as unknown as OrderForPdf;
  const { data: profile } = await admin.from("profiles").select(PROFILE_FIELDS).eq("id", o.user_id).single();
  if (!profile) return null;
  return { order: o, profile: profile as unknown as ProfileForPdf };
}

export const orderPdfName = (order: Pick<Order, "folio">, business: string) =>
  `Pedido ${folio("P", order.folio)} - ${business}`.replace(/[^\w.\- áéíóúñÁÉÍÓÚÑ]+/g, "").slice(0, 70) + ".pdf";
