/* Plantilla PDF de cotización / nota de pedido (se genera en el navegador con @react-pdf/renderer) */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

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
    logo: string;
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
};

const C = {
  rose: "#eb5473",
  roseSoft: "#fdf0f3",
  mint: "#7fcaa6",
  sage: "#6aa68a",
  mintSoft: "#effaf4",
  cream: "#fffaef",
  cream2: "#fbf1dc",
  cocoa: "#5a3512",
  cocoaSoft: "#a87b55",
  ink: "#2a1909",
  line: "#efe5d3",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9.5, color: C.ink, paddingBottom: 70, backgroundColor: "#ffffff" },
  header: { backgroundColor: C.cream, paddingHorizontal: 40, paddingTop: 30, paddingBottom: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { width: 92, height: 92, objectFit: "contain" },
  bizBlock: { alignItems: "flex-end", maxWidth: 260 },
  bizName: { fontFamily: "Times-BoldItalic", fontSize: 18, color: C.cocoa },
  bizLine: { fontSize: 8.5, color: C.cocoaSoft, marginTop: 2 },
  ribbon: { height: 5, flexDirection: "row" },
  body: { paddingHorizontal: 40, paddingTop: 24 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  docTitle: { fontFamily: "Times-BoldItalic", fontSize: 30, color: C.rose },
  folio: { fontSize: 10, color: C.cocoaSoft, marginTop: 2, letterSpacing: 1 },
  subtitle: { fontFamily: "Times-Italic", fontSize: 12, color: C.cocoa, marginTop: 4 },
  cards: { flexDirection: "row", marginTop: 18, gap: 12 },
  card: { flex: 1, backgroundColor: C.cream, borderRadius: 10, padding: 12 },
  cardLabel: { fontSize: 7.5, color: C.sage, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 },
  cardStrong: { fontFamily: "Helvetica-Bold", fontSize: 11, color: C.cocoa },
  cardLine: { fontSize: 9, color: C.cocoa, marginTop: 2 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  metaLabel: { fontSize: 8.5, color: C.cocoaSoft },
  metaValue: { fontSize: 9, color: C.cocoa, fontFamily: "Helvetica-Bold" },
  table: { marginTop: 22 },
  th: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.rose, paddingBottom: 6 },
  thText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.rose, letterSpacing: 1, textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.7, borderBottomColor: C.line, alignItems: "center" },
  cDesc: { flex: 1, paddingRight: 8 },
  cQty: { width: 50, textAlign: "center" },
  cPrice: { width: 80, textAlign: "right" },
  cTotal: { width: 86, textAlign: "right" },
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totals: { width: 230 },
  tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  tLabel: { color: C.cocoaSoft },
  tValue: { color: C.cocoa, fontFamily: "Helvetica-Bold" },
  grand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.rose, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8 },
  grandLabel: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 1 },
  grandValue: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 16 },
  section: { marginTop: 18 },
  sectionTitle: { fontFamily: "Times-BoldItalic", fontSize: 13, color: C.cocoa, marginBottom: 4 },
  para: { fontSize: 9, color: C.cocoa, lineHeight: 1.45 },
  bank: { marginTop: 14, backgroundColor: C.mintSoft, borderRadius: 10, padding: 12 },
  footer: { position: "absolute", left: 40, right: 40, bottom: 26, borderTopWidth: 1, borderTopColor: C.mint, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: C.cocoaSoft },
  footerScript: { fontFamily: "Times-BoldItalic", fontSize: 10, color: C.rose },
});

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(n) || 0);
const qty = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(Number(n) || 0);

export function DocumentPDF({ doc }: { doc: PdfDoc }) {
  const isQuote = doc.kind === "cotizacion";
  const balance = doc.deposit ? doc.total - doc.deposit : 0;
  return (
    <Document title={`${isQuote ? "Cotización" : "Pedido"} ${doc.folio} — ${doc.business.name}`} author={doc.business.name} creator="Dulces Detalles">
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={doc.business.logo} style={s.logo} />
          <View style={s.bizBlock}>
            <Text style={s.bizName}>{doc.business.name}</Text>
            {doc.business.owner ? <Text style={s.bizLine}>{doc.business.owner}</Text> : null}
            {doc.business.phone ? <Text style={s.bizLine}>WhatsApp: {doc.business.phone}</Text> : null}
            {doc.business.email ? <Text style={s.bizLine}>{doc.business.email}</Text> : null}
            {doc.business.instagram ? <Text style={s.bizLine}>Instagram: @{doc.business.instagram.replace(/^@/, "")}</Text> : null}
            {doc.business.facebook ? <Text style={s.bizLine}>Facebook: {doc.business.facebook}</Text> : null}
            {doc.business.address ? <Text style={s.bizLine}>{doc.business.address}</Text> : null}
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
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.folio}>FOLIO {doc.folio}</Text>
              <Text style={[s.folio, { fontSize: 9 }]}>{doc.issuedAt}</Text>
              {doc.verify ? <Text style={[s.folio, { fontSize: 8 }]}>VERIFICACIÓN {doc.verify}</Text> : null}
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
            <View style={s.card}>
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
              <View key={i} style={s.tr} wrap={false}>
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
          <Text style={s.footerScript}>Hechos con amor de hogar</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${doc.folio}${doc.verify ? ` · ${doc.verify}` : ""} · ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
