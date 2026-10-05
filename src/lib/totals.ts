import type { LineItem } from "./types";

export function calcTotals(items: LineItem[], opts: { discount?: number | string; shipping?: number | string; applyIva?: boolean; ivaPct?: number }) {
  const subtotal = items.reduce((a, i) => a + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const discount = Math.min(Number(opts.discount) || 0, subtotal);
  const shipping = Number(opts.shipping) || 0;
  const base = subtotal - discount + shipping;
  const iva = opts.applyIva ? base * ((opts.ivaPct ?? 16) / 100) : 0;
  const cost = items.reduce((a, i) => a + (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0), 0);
  const total = base + iva;
  return { subtotal, discount, shipping, iva, total, cost, profit: subtotal - discount - cost };
}
