"use client";
import { createClient } from "./supabase/client";

/** Descarga todas las filas de una tabla (de 1000 en 1000) — RLS garantiza que solo son de la usuaria */
async function fetchAll<T>(table: string, select = "*", order = "created_at") {
  const sb = createClient();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(select).range(from, from + 999);
    if (order) q = q.order(order, { ascending: true });
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

type Row = Record<string, unknown>;
type Col = { header: string; key: string; width?: number; type?: "money" | "number" | "date" | "datetime" | "bool" };
type SheetDef = { name: string; columns: Col[]; rows: Row[] };

const STATUS: Record<string, string> = {
  pendiente: "Pendiente", confirmado: "Confirmado", en_preparacion: "En preparación", listo: "Listo", entregado: "Entregado", cancelado: "Cancelado",
  borrador: "Borrador", enviada: "Enviada", aceptada: "Aceptada", rechazada: "Rechazada", vencida: "Vencida",
};

export async function loadBackupData() {
  const [profile] = await fetchAll<Row>("profiles", "*", "");
  const [clients, desserts, items, ingredients, fixed, quotes, quoteItems, orders, orderItems, movements, payments] = await Promise.all([
    fetchAll<Row>("clients"),
    fetchAll<Row>("desserts"),
    fetchAll<Row>("dessert_items", "*", "position"),
    fetchAll<Row>("ingredients"),
    fetchAll<Row>("fixed_costs"),
    fetchAll<Row>("quotes"),
    fetchAll<Row>("quote_items", "*", "position"),
    fetchAll<Row>("orders"),
    fetchAll<Row>("order_items", "*", "position"),
    fetchAll<Row>("inventory_movements").catch(() => [] as Row[]),
    fetchAll<Row>("order_payments", "*", "paid_at").catch(() => [] as Row[]),
  ]);
  return { profile, clients, desserts, items, ingredients, fixed, quotes, quoteItems, orders, orderItems, movements, payments };
}

/** Respaldo completo en Excel con una hoja por tipo de información */
export async function exportExcel() {
  const d = await loadBackupData();
  const mod = await import("exceljs");
  // exceljs es CommonJS: según el empaquetador las clases vienen en .default o directo
  const ExcelJS = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Dulces Detalles";
  wb.created = new Date();

  const byId = <T extends Row>(rows: T[]) => new Map(rows.map((r) => [r.id as string, r]));
  const clientById = byId(d.clients);
  const dessertById = byId(d.desserts);
  const ingById = byId(d.ingredients);
  const quoteById = byId(d.quotes);
  const orderById = byId(d.orders);
  const folio = (p: string, n: unknown) => (n ? `${p}-${String(n).padStart(4, "0")}` : "");

  const sheets: SheetDef[] = [
    {
      name: "Pedidos",
      columns: [
        { header: "Folio", key: "folio", width: 10 }, { header: "Fecha entrega", key: "delivery_date", type: "date", width: 13 }, { header: "Hora", key: "delivery_time", width: 8 },
        { header: "Cliente", key: "cliente", width: 26 }, { header: "Teléfono", key: "customer_phone", width: 14 }, { header: "Estado", key: "estado", width: 14 },
        { header: "Origen", key: "source", width: 11 }, { header: "Entrega", key: "delivery_type", width: 10 }, { header: "Dirección", key: "delivery_address", width: 30 },
        { header: "Subtotal", key: "subtotal", type: "money" }, { header: "Descuento", key: "discount", type: "money" }, { header: "Envío", key: "shipping", type: "money" },
        { header: "IVA", key: "iva", type: "money" }, { header: "Total", key: "total", type: "money" }, { header: "Pagado", key: "deposit", type: "money" },
        { header: "Pago", key: "payment_status", width: 11 }, { header: "Notas", key: "notes", width: 40 }, { header: "Creado", key: "created_at", type: "datetime", width: 17 },
      ],
      rows: d.orders.map((o) => ({ ...o, folio: folio("P", o.folio), cliente: (clientById.get(o.client_id as string)?.name as string) ?? o.customer_name, estado: STATUS[o.status as string] ?? o.status })),
    },
    {
      name: "Partidas de pedidos",
      columns: [
        { header: "Pedido", key: "pedido", width: 10 }, { header: "Postre / concepto", key: "description", width: 34 }, { header: "Cantidad", key: "quantity", type: "number" },
        { header: "Precio unitario", key: "unit_price", type: "money" }, { header: "Importe", key: "total", type: "money" }, { header: "Costo unitario", key: "unit_cost", type: "money" },
      ],
      rows: d.orderItems.map((i) => ({ ...i, pedido: folio("P", orderById.get(i.order_id as string)?.folio) })),
    },
    {
      name: "Cotizaciones",
      columns: [
        { header: "Folio", key: "folio", width: 10 }, { header: "Cliente", key: "cliente", width: 26 }, { header: "Título", key: "title", width: 30 }, { header: "Estado", key: "estado", width: 12 },
        { header: "Evento", key: "event_date", type: "date", width: 13 }, { header: "Vigencia", key: "valid_until", type: "date", width: 13 },
        { header: "Subtotal", key: "subtotal", type: "money" }, { header: "Descuento", key: "discount", type: "money" }, { header: "Envío", key: "shipping", type: "money" },
        { header: "IVA", key: "iva", type: "money" }, { header: "Total", key: "total", type: "money" }, { header: "Creada", key: "created_at", type: "datetime", width: 17 },
      ],
      rows: d.quotes.map((q) => ({ ...q, folio: folio("C", q.folio), cliente: clientById.get(q.client_id as string)?.name, estado: STATUS[q.status as string] ?? q.status })),
    },
    {
      name: "Partidas de cotizaciones",
      columns: [
        { header: "Cotización", key: "cotizacion", width: 11 }, { header: "Postre / concepto", key: "description", width: 34 }, { header: "Cantidad", key: "quantity", type: "number" },
        { header: "Precio unitario", key: "unit_price", type: "money" }, { header: "Importe", key: "total", type: "money" },
      ],
      rows: d.quoteItems.map((i) => ({ ...i, cotizacion: folio("C", quoteById.get(i.quote_id as string)?.folio) })),
    },
    {
      name: "Clientes",
      columns: [
        { header: "Nombre", key: "name", width: 28 }, { header: "Teléfono", key: "phone", width: 15 }, { header: "Correo", key: "email", width: 28 },
        { header: "Dirección", key: "address", width: 34 }, { header: "Cumpleaños", key: "birthday", type: "date", width: 12 }, { header: "Notas", key: "notes", width: 34 },
        { header: "Origen", key: "source", width: 10 }, { header: "Alta", key: "created_at", type: "datetime", width: 17 },
      ],
      rows: d.clients,
    },
    {
      name: "Postres",
      columns: [
        { header: "Nombre", key: "name", width: 30 }, { header: "Categoría", key: "category", width: 16 }, { header: "Rinde", key: "yield_units", type: "number" }, { header: "Unidad", key: "unit_label", width: 10 },
        { header: "Horas de trabajo", key: "labor_hours", type: "number" }, { header: "% Ganancia", key: "profit_pct", type: "number" }, { header: "% Desgaste", key: "wear_pct", type: "number" },
        { header: "Envío", key: "shipping", type: "money" }, { header: "IVA", key: "apply_iva", type: "bool" }, { header: "Comisión tarjeta", key: "apply_card_fee", type: "bool" },
        { header: "Precio de venta", key: "sale_price", type: "money" }, { header: "En tienda", key: "store_visible", type: "bool" }, { header: "Activo", key: "active", type: "bool" },
        { header: "Descripción", key: "description", width: 40 },
      ],
      rows: d.desserts,
    },
    {
      name: "Recetas",
      columns: [
        { header: "Postre", key: "postre", width: 30 }, { header: "Sección", key: "section", width: 18 }, { header: "Ingrediente / empaque", key: "ingrediente", width: 30 },
        { header: "Cantidad", key: "quantity", type: "number" }, { header: "Unidad", key: "unidad", width: 8 },
      ],
      rows: d.items.map((i) => {
        const ing = ingById.get(i.ingredient_id as string);
        return { ...i, postre: dessertById.get(i.dessert_id as string)?.name, ingrediente: ing?.name, unidad: ing?.unit };
      }),
    },
    {
      name: "Ingredientes",
      columns: [
        { header: "Tipo", key: "kind", width: 12 }, { header: "Nombre", key: "name", width: 30 }, { header: "Unidad", key: "unit", width: 8 },
        { header: "Cantidad del paquete", key: "package_qty", type: "number" }, { header: "Precio del paquete", key: "package_price", type: "money" },
        { header: "Costo por unidad", key: "unit_cost", type: "number" }, { header: "Existencia", key: "stock", type: "number" }, { header: "Mínimo", key: "min_stock", type: "number" },
        { header: "Proveedor", key: "supplier", width: 20 },
      ],
      rows: d.ingredients,
    },
    {
      name: "Gastos fijos",
      columns: [{ header: "Concepto", key: "name", width: 30 }, { header: "Monto mensual", key: "monthly_amount", type: "money" }],
      rows: d.fixed,
    },
    {
      name: "Movimientos inventario",
      columns: [
        { header: "Fecha", key: "created_at", type: "datetime", width: 17 }, { header: "Ingrediente", key: "ingrediente", width: 30 }, { header: "Cantidad", key: "quantity", type: "number" },
        { header: "Motivo", key: "reason", width: 18 }, { header: "Pedido", key: "pedido", width: 10 }, { header: "Nota", key: "note", width: 30 },
      ],
      rows: d.movements.map((m) => ({ ...m, ingrediente: ingById.get(m.ingredient_id as string)?.name, pedido: folio("P", orderById.get(m.order_id as string)?.folio) })),
    },
    {
      name: "Pagos",
      columns: [
        { header: "Fecha", key: "paid_at", type: "datetime", width: 17 }, { header: "Pedido", key: "pedido", width: 10 }, { header: "Cliente", key: "cliente", width: 26 },
        { header: "Monto", key: "amount", type: "money" }, { header: "Forma de pago", key: "method", width: 16 }, { header: "Nota", key: "note", width: 30 },
      ],
      rows: d.payments.map((p) => {
        const o = orderById.get(p.order_id as string);
        return { ...p, pedido: folio("P", o?.folio as number | undefined), cliente: (clientById.get(o?.client_id as string)?.name as string | undefined) ?? (o?.customer_name as string | undefined) };
      }),
    },
  ];

  for (const def of sheets) {
    const ws = wb.addWorksheet(def.name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = def.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? (c.type === "money" || c.type === "number" ? 13 : 16) }));
    for (const r of def.rows) {
      const row: Row = {};
      for (const c of def.columns) {
        const v = r[c.key];
        if (v === null || v === undefined || v === "") row[c.key] = null;
        else if (c.type === "money" || c.type === "number") row[c.key] = Number(v);
        else if (c.type === "date") row[c.key] = new Date(String(v) + "T12:00:00");
        else if (c.type === "datetime") row[c.key] = new Date(String(v));
        else if (c.type === "bool") row[c.key] = v ? "Sí" : "No";
        else row[c.key] = String(v);
      }
      ws.addRow(row);
    }
    def.columns.forEach((c, i) => {
      const col = ws.getColumn(i + 1);
      if (c.type === "money") col.numFmt = '"$"#,##0.00';
      if (c.type === "date") col.numFmt = "dd/mm/yyyy";
      if (c.type === "datetime") col.numFmt = "dd/mm/yyyy hh:mm";
    });
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEB5473" } };
    header.alignment = { vertical: "middle" };
    header.height = 22;
    if (def.rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: def.columns.length } };
  }

  // Hoja de resumen del negocio
  const info = wb.addWorksheet("Mi negocio");
  info.columns = [{ width: 28 }, { width: 50 }];
  const p = d.profile ?? {};
  [
    ["Negocio", p.business_name], ["Responsable", p.owner_name], ["Correo", p.email], ["WhatsApp", p.whatsapp], ["Dirección", p.address],
    ["Instagram", p.instagram], ["Facebook", p.facebook], ["Tienda", p.store_slug ? `/tienda/${p.store_slug}` : ""], ["Zona horaria", p.timezone],
    ["% Ganancia por defecto", p.default_profit_pct], ["% Desgaste por defecto", p.default_wear_pct], ["% IVA", p.iva_pct], ["% Comisión tarjeta", p.card_fee_pct],
    ["Días de trabajo al mes", p.days_per_month], ["Horas por día", p.hours_per_day], ["Respaldo generado", new Date().toLocaleString("es-MX")],
  ].forEach(([k, v]) => {
    const r = info.addRow([k, v ?? ""]);
    r.getCell(1).font = { bold: true, color: { argb: "FF6F4318" } };
  });
  wb.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: 0, visibility: "visible" }];

  const buf = await wb.xlsx.writeBuffer();
  const counts = Object.fromEntries(sheets.map((s) => [s.name, s.rows.length]));
  return { blob: new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), counts };
}

/** Respaldo técnico completo en JSON (todas las columnas, para restaurar o migrar) */
export async function exportJson() {
  const d = await loadBackupData();
  const payload = { app: "Dulces Detalles", version: 1, exported_at: new Date().toISOString(), data: d };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}
