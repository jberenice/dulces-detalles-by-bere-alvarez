"use client";
import type { PdfDoc } from "@/components/pdf/DocumentPDF";

/** Genera el PDF en el navegador (carga diferida de @react-pdf/renderer). */
export async function buildPdf(doc: PdfDoc): Promise<Blob> {
  const [{ pdf }, { DocumentPDF }, React, { cleanLogo }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/DocumentPDF"),
    import("react"),
    import("./cleanLogo"),
  ]);
  // el logo sin su fondo blanco, para que se funda con el diseño del PDF
  if (doc.business.logo) {
    const clean = await cleanLogo(doc.business.logo).catch(() => null);
    if (clean) doc = { ...doc, business: { ...doc.business, logo: clean } };
  }
  return pdf(React.createElement(DocumentPDF, { doc }) as unknown as Parameters<typeof pdf>[0]).toBlob();
}

export { verifyCode, quoteToPdf, orderToPdf } from "./pdf-docs";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function blobToBase64(blob: Blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

/**
 * Comparte el PDF por WhatsApp.
 * En celulares usa el menú nativo de compartir (adjunta el PDF directo a WhatsApp).
 * En computadora abre WhatsApp Web con el mensaje y el enlace, y descarga el PDF para adjuntarlo.
 */
export async function shareViaWhatsApp(opts: { blob: Blob; filename: string; phone: string; text: string }) {
  const { waLink } = await import("./format");
  const file = new File([opts.blob], opts.filename, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile && nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: opts.text });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  window.open(waLink(opts.phone, opts.text), "_blank");
  downloadBlob(opts.blob, opts.filename);
  return "link";
}
