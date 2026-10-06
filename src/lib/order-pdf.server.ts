/** PDF de un pedido generado en el servidor (se usa para adjuntarlo al correo de la clienta). */
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { DocumentPDF } from "@/components/pdf/DocumentPDF";
import { orderToPdf } from "@/lib/pdf-docs";
import type { OrderForPdf, ProfileForPdf } from "@/lib/order-token.server";

export async function renderOrderPdf(order: OrderForPdf, profile: ProfileForPdf, origin: string) {
  const doc = orderToPdf(order, profile, origin);
  return renderToBuffer(createElement(DocumentPDF, { doc }) as unknown as Parameters<typeof renderToBuffer>[0]);
}
