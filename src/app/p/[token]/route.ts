import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderByToken, orderPdfName, renderOrderPdf } from "@/lib/order-pdf.server";
import { enforceIpLimit } from "@/lib/ip-limit.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PDF de un pedido para la clienta. Solo se abre con el token secreto del pedido (UUID aleatorio de 122 bits),
 * que únicamente conocen la clienta (en su correo / pantalla de confirmación) y la repostería.
 * El id y el folio no sirven para abrirlo, así que no se puede adivinar ni recorrer.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const limited = await enforceIpLimit(request, "pedido-pdf", 30, 600);
  if (limited) return limited;
  const admin = createAdminClient();
  if (!admin) return new NextResponse("No disponible", { status: 503 });
  const found = await orderByToken(admin, token);
  if (!found || found.order.status === "cancelado") return new NextResponse("Este enlace no es válido", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  const buf = await renderOrderPdf(found.order, found.profile, new URL(request.url).origin);
  const name = orderPdfName(found.order, found.profile.business_name);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="pedido.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
