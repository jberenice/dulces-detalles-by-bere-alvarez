/* Plantilla PDF de cotización / nota de pedido (se genera en el navegador con @react-pdf/renderer) */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { FestiveId } from "@/lib/festive";
import { PdfGarland, PdfHeaderBg, PdfLogoGlow, PdfLogoPoster, PdfWatermark, pdfPalette, type PdfPalette } from "./PdfDecor";

export type PdfDoc = {
  kind: "cotizacion" | "pedido";
  folio: string;
  /** Código de verificación derivado del token secreto del documento */
  verify?: string | null;
  issuedAt: string;
  title?: string | null;
  business: {
    name: string;
    owner?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    bank?: string | null;
    logo: string | null;
  };
  client?: { name: string; phone?: string | null; email?: string | null; address?: string | null } | null;
  meta: { label: string; value: string }[];
  items: { description: string; quantity: number; unit_price: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  iva: number;
  total: number;
  deposit?: number;
  notes?: string | null;
  terms?: string | null;
  link?: string | null;
  /** Temporada (Navidad, Día de Muertos…): cambia colores y adornos del PDF */
  festive?: FestiveId | null;
};

/** Iniciales del negocio para cuando no tiene logo */
const initialsOf = (name: string) =>
  name
    .replace(/\b(by|de|del|la|las|los|y)\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "•";

/** Estilos a partir de la paleta (normal o de temporada) */
function makeStyles(P: PdfPalette) {
  const C = { rose: P.primary, sage: P.accent, mint: P.accent, mintSoft: P.soft2, cream: P.soft, cocoa: P.ink, cocoaSoft: P.muted, ink: "#2a1909", line: "#efe5d3" };
  return {
    C,
    s: StyleSheet.create({
      page: { fontFamily: "Helvetica", fontSize: 9.5, color: C.ink, paddingBottom: 70, backgroundColor: "#ffffff" },
      garland: { backgroundColor: C.cream },
      header: { backgroundColor: C.cream, paddingHorizontal: 40, paddingTop: 10, paddingBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", position: "relative", minHeight: 156 },
      logoWrap: { width: 150, height: 150, position: "relative", alignItems: "center", justifyContent: "center", marginLeft: -6, marginVertical: -8 },
      logo: { width: 104, height: 104, objectFit: "contain", marginTop: -10, position: "relative" },
      initials: { position: "relative", width: 88, height: 88, borderRadius: 44, backgroundColor: C.rose, alignItems: "center", justifyContent: "center" },
      initialsText: { fontFamily: "Times-BoldItalic", fontSize: 30, color: "#ffffff" },
      bizBlock: { position: "relative", alignItems: "flex-end", maxWidth: 290, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.86)" },
      bizName: { fontFamily: "Times-BoldItalic", fontSize: 20, color: C.cocoa },
      bizLine: { fontSize: 8.5, color: C.cocoaSoft, marginTop: 2 },
      season: { marginTop: 6, backgroundColor: C.rose, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
      ribbon: { height: 5, flexDirection: "row" },
      body: { paddingHorizontal: 40, paddingTop: 22 },
      titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
      docTitle: { fontFamily: "Times-BoldItalic", fontSize: 32, color: C.rose },
      folioPill: { backgroundColor: C.mintSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: "flex-end" },
      folio: { fontSize: 10, color: C.cocoa, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
      folioSub: { fontSize: 8, color: C.cocoaSoft, marginTop: 2 },
      subtitle: { fontFamily: "Times-Italic", fontSize: 12, color: C.cocoa, marginTop: 4 },
      cards: { flexDirection: "row", marginTop: 18, gap: 12 },
      card: { flex: 1, backgroundColor: C.cream, borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: C.rose },
      card2: { flex: 1, backgroundColor: C.cream, borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: C.sage },
      cardLabel: { fontSize: 7.5, color: C.sage, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 },
      cardStrong: { fontFamily: "Helvetica-Bold", fontSize: 11, color: C.cocoa },
      cardLine: { fontSize: 9, color: C.cocoa, marginTop: 2 },
      metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
      metaLabel: { fontSize: 8.5, color: C.cocoaSoft },
      metaValue: { fontSize: 9, color: C.cocoa, fontFamily: "Helvetica-Bold" },
      table: { marginTop: 22 },
      th: { flexDirection: "row", backgroundColor: C.rose, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 8 },
      thText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1, textTransform: "uppercase" },
      tr: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 0.7, borderBottomColor: C.line, alignItems: "center" },
      trAlt: { backgroundColor: C.cream },
      cDesc: { flex: 1, paddingRight: 8 },
      cQty: { width: 50, textAlign: "center" },
      cPrice: { width: 80, textAlign: "right" },
      cTotal: { width: 86, textAlign: "right" },
      totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
      totals: { width: 240, backgroundColor: C.cream, borderRadius: 12, padding: 10 },
      tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
      tLabel: { color: C.cocoaSoft },
      tValue: { color: C.cocoa, fontFamily: "Helvetica-Bold" },
      grand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.rose, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8 },
      grandLabel: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 1 },
      grandValue: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 16 },
      section: { marginTop: 18 },
      sectionTitle: { fontFamily: "Times-BoldItalic", fontSize: 13, color: C.rose, marginBottom: 4 },
      para: { fontSize: 9, color: C.cocoa, lineHeight: 1.45 },
      bank: { marginTop: 14, backgroundColor: C.mintSoft, borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: C.sage },
      footer: { position: "absolute", left: 40, right: 40, bottom: 26, borderTopWidth: 1.5, borderTopColor: C.rose, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
      footerText: { fontSize: 8, color: C.cocoaSoft },
      footerScript: { fontFamily: "Times-BoldItalic", fontSize: 11, color: C.rose },
    }),
  };
}

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(n) || 0);
const qty = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(Number(n) || 0);

export function DocumentPDF({ doc }: { doc: PdfDoc }) {
  const P = pdfPalette(doc.festive);
  const { C, s } = makeStyles(P);
  const isQuote = doc.kind === "cotizacion";
  const balance = doc.deposit ? doc.total - doc.deposit : 0;
  return (
    <Document title={`${isQuote ? "Cotización" : "Pedido"} ${doc.folio} — ${doc.business.name}`} author={doc.business.name} creator="Dulces Detalles">
      <Page size="LETTER" style={s.page}>
        {/* guirnalda de la temporada (o glaseado) arriba de cada hoja */}
        <View fixed style={s.garland}>
          <PdfGarland p={P} />
        </View>
        <PdfWatermark p={P} />
        <View style={s.header}>
          {P.poster ? <PdfHeaderBg p={P} height={186} /> : null}
          <View style={s.logoWrap}>
            {P.poster ? <PdfLogoPoster p={P} size={150} /> : <PdfLogoGlow p={P} />}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {doc.business.logo ? (
              <Image src={doc.business.logo} style={s.logo} />
            ) : (
              <View style={s.initials}>
                <Text style={s.initialsText}>{initialsOf(doc.business.name)}</Text>
              </View>
            )}
          </View>
          <View style={s.bizBlock}>
            <Text style={s.bizName}>{doc.business.name}</Text>
            {doc.business.owner ? <Text style={s.bizLine}>{doc.business.owner}</Text> : null}
            {doc.business.phone ? <Text style={s.bizLine}>WhatsApp: {doc.business.phone}</Text> : null}
            {doc.business.email ? <Text style={s.bizLine}>{doc.business.email}</Text> : null}
            {doc.business.instagram ? <Text style={s.bizLine}>Instagram: @{doc.business.instagram.replace(/^@/, "")}</Text> : null}
            {doc.business.facebook ? <Text style={s.bizLine}>Facebook: {doc.business.facebook}</Text> : null}
            {doc.business.address ? <Text style={s.bizLine}>{doc.business.address}</Text> : null}
            {P.message ? <Text style={s.season}>{P.message}</Text> : null}
          </View>
        </View>
        <View style={s.ribbon}>
          <View style={{ flex: 3, backgroundColor: C.rose }} />
          <View style={{ flex: 2, backgroundColor: C.mint }} />
          <View style={{ flex: 1, backgroundColor: C.sage }} />
        </View>

        <View style={s.body}>
          <View style={s.titleRow}>
            <View>
              <Text style={s.docTitle}>{isQuote ? "Cotización" : "Nota de pedido"}</Text>
              {doc.title ? <Text style={s.subtitle}>{doc.title}</Text> : null}
            </View>
            <View style={s.folioPill}>
              <Text style={s.folio}>FOLIO {doc.folio}</Text>
              <Text style={s.folioSub}>{doc.issuedAt}</Text>
              {doc.verify ? <Text style={s.folioSub}>VERIFICACIÓN {doc.verify}</Text> : null}
            </View>
          </View>

          <View style={s.cards}>
            <View style={s.card}>
              <Text style={s.cardLabel}>{isQuote ? "Preparada para" : "Cliente"}</Text>
              <Text style={s.cardStrong}>{doc.client?.name ?? "Cliente"}</Text>
              {doc.client?.phone ? <Text style={s.cardLine}>{doc.client.phone}</Text> : null}
              {doc.client?.email ? <Text style={s.cardLine}>{doc.client.email}</Text> : null}
              {doc.client?.address ? <Text style={s.cardLine}>{doc.client.address}</Text> : null}
            </View>
            <View style={s.card2}>
              <Text style={s.cardLabel}>Detalles</Text>
              {doc.meta.map((m) => (
                <View key={m.label} style={s.metaRow}>
                  <Text style={s.metaLabel}>{m.label}</Text>
                  <Text style={s.metaValue}>{m.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.table}>
            <View style={s.th}>
              <Text style={[s.thText, s.cDesc]}>Descripción</Text>
              <Text style={[s.thText, s.cQty]}>Cant.</Text>
              <Text style={[s.thText, s.cPrice]}>Precio</Text>
              <Text style={[s.thText, s.cTotal]}>Importe</Text>
            </View>
            {doc.items.map((it, i) => (
              <View key={i} style={i % 2 ? [s.tr, s.trAlt] : s.tr} wrap={false}>
                <Text style={[s.cDesc, { color: C.cocoa, fontSize: 10 }]}>{it.description}</Text>
                <Text style={[s.cQty, { color: C.cocoa }]}>{qty(it.quantity)}</Text>
                <Text style={[s.cPrice, { color: C.cocoaSoft }]}>{fmt(it.unit_price)}</Text>
                <Text style={[s.cTotal, { color: C.cocoa, fontFamily: "Helvetica-Bold" }]}>{fmt(it.quantity * it.unit_price)}</Text>
              </View>
            ))}
          </View>

          <View style={s.totalsWrap} wrap={false}>
            <View style={s.totals}>
              <View style={s.tRow}>
                <Text style={s.tLabel}>Subtotal</Text>
                <Text style={s.tValue}>{fmt(doc.subtotal)}</Text>
              </View>
              {doc.discount > 0 ? (
                <View style={s.tRow}>
                  <Text style={s.tLabel}>Descuento</Text>
                  <Text style={[s.tValue, { color: C.rose }]}>-{fmt(doc.discount)}</Text>
                </View>
              ) : null}
              {doc.shipping > 0 ? (
                <View style={s.tRow}>
                  <Text style={s.tLabel}>Envío</Text>
                  <Text style={s.tValue}>{fmt(doc.shipping)}</Text>
                </View>
              ) : null}
              {doc.iva > 0 ? (
                <View style={s.tRow}>
                  <Text style={s.tLabel}>IVA</Text>
                  <Text style={s.tValue}>{fmt(doc.iva)}</Text>
                </View>
              ) : null}
              <View style={s.grand}>
                <Text style={s.grandLabel}>TOTAL</Text>
                <Text style={s.grandValue}>{fmt(doc.total)}</Text>
              </View>
              {doc.deposit ? (
                <>
                  <View style={[s.tRow, { marginTop: 6 }]}>
                    <Text style={s.tLabel}>Anticipo recibido</Text>
                    <Text style={[s.tValue, { color: C.sage }]}>{fmt(doc.deposit)}</Text>
                  </View>
                  <View style={s.tRow}>
                    <Text style={s.tLabel}>Saldo pendiente</Text>
                    <Text style={s.tValue}>{fmt(balance)}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {doc.notes ? (
            <View style={s.section} wrap={false}>
              <Text style={s.sectionTitle}>Notas</Text>
              <Text style={s.para}>{doc.notes}</Text>
            </View>
          ) : null}
          {doc.terms ? (
            <View style={s.section} wrap={false}>
              <Text style={s.sectionTitle}>Términos y condiciones</Text>
              <Text style={s.para}>{doc.terms}</Text>
            </View>
          ) : null}
          {doc.business.bank ? (
            <View style={s.bank} wrap={false}>
              <Text style={[s.cardLabel, { marginBottom: 3 }]}>Datos para pago</Text>
              <Text style={s.para}>{doc.business.bank}</Text>
            </View>
          ) : null}
          {doc.link ? (
            <Text style={[s.para, { marginTop: 14, color: C.cocoaSoft, fontSize: 8 }]}>Consulta y acepta esta cotización en línea: {doc.link}</Text>
          ) : null}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerScript}>{P.message ? `${P.message} · Hechos con amor de hogar` : "Hechos con amor de hogar"}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${doc.folio}${doc.verify ? ` · ${doc.verify}` : ""} · ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
