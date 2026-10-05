"use client";
import { createClient } from "./supabase/client";
import { buildPdf, downloadBlob, orderToPdf, quoteToPdf } from "./pdf";
import { folio } from "./format";
import type { Order, Profile, Quote } from "./types";

const CLIENT_COLS = "clients(id, name, phone, email, address)";

export async function loadQuote(id: string) {
  const { data, error } = await createClient().from("quotes").select(`*, ${CLIENT_COLS}, quote_items(*)`).eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as Quote;
}

export async function loadOrder(id: string) {
  const { data, error } = await createClient().from("orders").select(`*, ${CLIENT_COLS}, order_items(*)`).eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as Order;
}

export const quoteFilename = (q: Quote) => `Cotizacion-${folio("C", q.folio)}.pdf`;
export const orderFilename = (o: Order) => `Pedido-${folio("P", o.folio)}.pdf`;

export async function downloadQuotePdf(id: string, profile: Profile) {
  const q = await loadQuote(id);
  downloadBlob(await buildPdf(quoteToPdf(q, profile)), quoteFilename(q));
}

export async function downloadOrderPdf(id: string, profile: Profile) {
  const o = await loadOrder(id);
  downloadBlob(await buildPdf(orderToPdf(o, profile)), orderFilename(o));
}

/** Comparte el PDF con el menú nativo (celular); en computadora lo descarga */
export async function sharePdf(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title }).catch(() => {});
    return "shared";
  }
  downloadBlob(blob, filename);
  return "downloaded";
}

export async function shareOrderPdf(id: string, profile: Profile) {
  const o = await loadOrder(id);
  return sharePdf(await buildPdf(orderToPdf(o, profile)), orderFilename(o), `Pedido ${folio("P", o.folio)}`);
}

/** Comparte el enlace público (menú nativo en celular; si no, lo copia) */
export async function shareLink(url: string, title: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
