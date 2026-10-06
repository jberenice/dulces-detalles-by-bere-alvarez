import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderByToken } from "@/lib/order-token.server";
import { folio } from "@/lib/format";
import { PublicOrderPdf } from "@/components/store/PublicOrderPdf";

export const dynamic = "force-dynamic";

/**
 * Nota del pedido en PDF para la clienta. Solo se abre con el token secreto del pedido (UUID aleatorio):
 * el folio o el id no sirven para entrar. El PDF se arma en el navegador (igual que en el panel).
 */
async function getData(token: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const found = await orderByToken(admin, token);
  if (!found || found.order.status === "cancelado") return null;
  // Solo lo necesario para el PDF (nada de costos ni datos internos)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, id, source, ...order } = found.order;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _pid, is_demo, store_theme, ...business } = found.profile;
  return { order, business };
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const d = await getData(token);
  return { title: d ? `Pedido ${folio("P", d.order.folio)} · ${d.business.business_name}` : "Pedido", robots: { index: false, follow: false } };
}

export default async function OrderPdfPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await getData(token);
  if (!d) notFound();
  return <PublicOrderPdf order={d.order} business={d.business} token={token} />;
}
