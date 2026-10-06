"use client";
import { useEffect, useState } from "react";
import { Download, FileText, Loader2, Truck } from "lucide-react";
import { buildPdf, downloadBlob, orderToPdf } from "@/lib/pdf";
import type { BusinessLike } from "@/lib/pdf-docs";
import { folio, money } from "@/lib/format";
import type { Order } from "@/lib/types";

/** Muestra y descarga la nota del pedido en PDF (se genera en el navegador) */
export function PublicOrderPdf({ order, business, token }: { order: Omit<Order, "id" | "user_id" | "source">; business: BusinessLike; token: string }) {
  const [pdf, setPdf] = useState<{ url: string; blob: Blob } | null>(null);
  const [error, setError] = useState(false);
  const code = folio("P", order.folio);
  const filename = `Pedido-${code}.pdf`;

  useEffect(() => {
    let url = "";
    buildPdf(orderToPdf(order as unknown as Order, business))
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setPdf({ url, blob });
        // Se descarga sola una vez al abrir el enlace
        try {
          if (!sessionStorage.getItem(`dd-pdf-${token}`)) {
            sessionStorage.setItem(`dd-pdf-${token}`, "1");
            downloadBlob(blob, filename);
          }
        } catch {}
      })
      .catch(() => setError(true));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, business]);

  return (
    <main className="min-h-dvh bg-cream-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cocoa-400">{business.business_name}</p>
            <h1 className="font-display text-3xl font-semibold text-cocoa-700">Pedido {code}</h1>
            <p className="text-sm text-cocoa-500">Total {money(order.total)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/seguimiento/${token}`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-cocoa-600 ring-1 ring-cocoa-800/10">
              <Truck className="h-4 w-4" /> Ver estado
            </a>
            <button
              type="button"
              disabled={!pdf}
              onClick={() => pdf && downloadBlob(pdf.blob, filename)}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {pdf ? <Download className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />} Descargar PDF
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-cocoa-800/5">
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <FileText className="h-12 w-12 text-rose-400" />
            {error ? (
              <p className="text-sm text-rose-600">No pudimos generar el PDF. Recarga la página para intentarlo de nuevo.</p>
            ) : pdf ? (
              <p className="text-sm text-cocoa-500">Tu nota está lista. Si no se descargó sola, toca el botón.</p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-cocoa-500"><Loader2 className="h-4 w-4 animate-spin" /> Preparando tu nota…</p>
            )}
            <button
              type="button"
              disabled={!pdf}
              onClick={() => pdf && downloadBlob(pdf.blob, filename)}
              className="inline-flex items-center gap-2 rounded-2xl bg-cocoa-800 px-5 py-2.5 text-sm font-bold text-cream-100 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Descargar {filename}
            </button>
          </div>
          <ul className="divide-y divide-cocoa-800/5 border-t border-cocoa-800/5 text-sm">
            {[...(order.order_items ?? [])]
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((i, k) => (
                <li key={k} className="flex justify-between gap-3 px-6 py-3">
                  <span className="text-cocoa-600">{Number(i.quantity)} × {i.description}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{money(Number(i.quantity) * Number(i.unit_price))}</span>
                </li>
              ))}
            <li className="flex justify-between bg-cream-50 px-6 py-3 font-bold"><span>Total</span><span className="tabular-nums">{money(order.total)}</span></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
