"use client";
import { createClient } from "./supabase/client";
import type { Order } from "./types";

export type SaleOrder = Order & { day: string };

/** Pedidos no cancelados cuya fecha (entrega o, si no hay, creación) cae en el rango [from, to] (YYYY-MM-DD). */
export async function fetchSales(from: string, to: string): Promise<SaleOrder[]> {
  const sb = createClient();
  const sel = "*, clients(id, name, phone, email, address), order_items(*)";
  const [a, b] = await Promise.all([
    sb.from("orders").select(sel).neq("status", "cancelado").gte("delivery_date", from).lte("delivery_date", to),
    sb
      .from("orders")
      .select(sel)
      .neq("status", "cancelado")
      .is("delivery_date", null)
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`),
  ]);
  if (a.error) throw new Error(a.error.message);
  if (b.error) throw new Error(b.error.message);
  return [...(a.data as Order[]), ...(b.data as Order[])].map((o) => ({ ...o, day: o.delivery_date ?? o.created_at.slice(0, 10) }));
}

export function summarize(orders: SaleOrder[], categoryOf: (dessertId: string | null) => string = () => "Otros") {
  let revenue = 0,
    cost = 0,
    pieces = 0,
    collected = 0;
  const byDay = new Map<string, number>();
  const byProduct = new Map<string, { name: string; qty: number; revenue: number; profit: number }>();
  const byCategory = new Map<string, { qty: number; revenue: number }>();
  const bySource = new Map<string, number>();

  for (const o of orders) {
    revenue += Number(o.total);
    collected += Math.min(Number(o.deposit), Number(o.total));
    byDay.set(o.day, (byDay.get(o.day) ?? 0) + Number(o.total));
    bySource.set(o.source, (bySource.get(o.source) ?? 0) + Number(o.total));
    for (const i of o.order_items ?? []) {
      const q = Number(i.quantity);
      const rev = q * Number(i.unit_price);
      const c = q * Number(i.unit_cost);
      pieces += q;
      cost += c;
      // Las cajas cuentan como su paquete, sin importar qué sabores llevaron
      const key = i.package_id ? `paquete:${i.package_id}` : i.dessert_id ?? `libre:${i.description}`;
      const p = byProduct.get(key) ?? { name: i.package_id ? i.description.split(":")[0] : i.description, qty: 0, revenue: 0, profit: 0 };
      p.qty += q;
      p.revenue += rev;
      p.profit += c > 0 ? rev - c : 0;
      byProduct.set(key, p);
      const cat = i.package_id ? "Paquetes y cajas" : categoryOf(i.dessert_id);
      const cc = byCategory.get(cat) ?? { qty: 0, revenue: 0 };
      cc.qty += q;
      cc.revenue += rev;
      byCategory.set(cat, cc);
    }
  }
  const subtotalNet = orders.reduce((a, o) => a + Number(o.subtotal) - Number(o.discount), 0);
  return {
    revenue,
    cost,
    profit: subtotalNet - cost,
    pieces,
    collected,
    pending: revenue - collected,
    count: orders.length,
    avgTicket: orders.length ? revenue / orders.length : 0,
    byDay,
    products: [...byProduct.values()],
    categories: [...byCategory.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue),
    sources: bySource,
  };
}
