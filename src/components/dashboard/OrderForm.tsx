"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ShoppingBag, Truck, User, Wallet } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCatalog } from "@/hooks/useCatalog";
import { must, useAsync } from "@/hooks/useAsync";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { ClientPicker } from "./ClientPicker";
import { LineItemsEditor, TotalsBox, lineKey, type EditableLine } from "./LineItemsEditor";
import { calcTotals } from "@/lib/totals";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { addDays, toISODate } from "@/lib/format";
import type { Client, Order, OrderStatus, PaymentStatus } from "@/lib/types";

export function OrderForm({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const sb = createClient();
  const catalog = useCatalog();
  const { profile } = catalog;
  const clientsQ = useAsync(async () => must(await sb.from("clients").select("*").order("name")) as Client[]);
  const orderQ = useAsync(async () => (orderId ? (must(await sb.from("orders").select("*, order_items(*)").eq("id", orderId).single()) as Order) : null));

  const [ready, setReady] = useState(false);
  const [f, setF] = useState({
    client_id: null as string | null,
    status: "confirmado" as OrderStatus,
    delivery_date: toISODate(addDays(new Date(), 3)),
    delivery_time: "",
    delivery_type: "recoger" as "recoger" | "envio",
    delivery_address: "",
    notes: "",
    deposit: 0 as number | string,
    payment_status: "pendiente" as PaymentStatus,
    payment_method: "",
  });
  const [items, setItems] = useState<EditableLine[]>([]);
  const [discount, setDiscount] = useState<number | string>(0);
  const [shipping, setShipping] = useState<number | string>(0);
  const [applyIva, setApplyIva] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready || orderQ.loading) return;
    const o = orderQ.data;
    if (o) {
      setF({
        client_id: o.client_id,
        status: o.status,
        delivery_date: o.delivery_date ?? "",
        delivery_time: o.delivery_time ?? "",
        delivery_type: o.delivery_type,
        delivery_address: o.delivery_address ?? "",
        notes: o.notes ?? "",
        deposit: o.deposit,
        payment_status: o.payment_status,
        payment_method: o.payment_method ?? "",
      });
      setDiscount(o.discount);
      setShipping(o.shipping);
      setApplyIva(Number(o.iva) > 0);
      setItems([...(o.order_items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => ({ ...i, key: lineKey() })));
    } else {
      setItems([{ key: lineKey(), dessert_id: "", description: "", quantity: 1, unit_price: 0, unit_cost: 0 }]);
    }
    setReady(true);
  }, [ready, orderQ.loading, orderQ.data]);

  const totals = useMemo(() => calcTotals(items, { discount, shipping, applyIva, ivaPct: profile.iva_pct }), [items, discount, shipping, applyIva, profile.iva_pct]);
  const client = clientsQ.data?.find((c) => c.id === f.client_id);

  async function save() {
    const valid = items.filter((i) => i.description.trim() && Number(i.quantity) > 0);
    if (!valid.length) return toast.error("Agrega al menos un postre");
    setSaving(true);
    try {
      const deposit = Number(f.deposit) || 0;
      const payload = {
        ...f,
        delivery_date: f.delivery_date || null,
        delivery_time: f.delivery_time || null,
        delivery_address: f.delivery_address || client?.address || null,
        notes: f.notes || null,
        payment_method: f.payment_method || null,
        deposit,
        payment_status: deposit >= totals.total && totals.total > 0 ? "pagado" : deposit > 0 && f.payment_status === "pendiente" ? "anticipo" : f.payment_status,
        customer_name: client?.name ?? null,
        customer_phone: client?.phone ?? null,
        customer_email: client?.email ?? null,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        iva: totals.iva,
        total: totals.total,
      };
      let id = orderId;
      if (id) {
        must(await sb.from("orders").update(payload).eq("id", id));
        must(await sb.from("order_items").delete().eq("order_id", id));
      } else {
        id = (must(await sb.from("orders").insert({ ...payload, source: "manual" }).select("id").single()) as { id: string }).id;
      }
      must(
        await sb.from("order_items").insert(
          valid.map((i, idx) => ({
            order_id: id,
            dessert_id: i.dessert_id || null,
            description: i.description.trim(),
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price) || 0,
            unit_cost: Number(i.unit_cost) || 0,
            position: idx,
          })),
        ),
      );
      toast.success("Pedido guardado");
      router.replace(`/dashboard/pedidos/${id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setSaving(false);
    }
  }

  if (!ready || clientsQ.loading || catalog.loading)
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-80" />
      </div>
    );

  return (
    <>
      <Link href="/dashboard/pedidos" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-cocoa-400 hover:text-rose-500">
        <ArrowLeft className="h-4 w-4" /> Pedidos
      </Link>
      <PageHeader eyebrow={orderId ? "Editando" : "Nuevo"} title={orderId ? "Editar pedido" : "Pedido"} subtitle="Registra la fecha de entrega, los postres y los pagos." />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Cliente y entrega" icon={<User className="h-5 w-5" />} />
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="sm:col-span-2">
                <label className="label">Cliente</label>
                <ClientPicker clients={clientsQ.data ?? []} value={f.client_id} onChange={(v) => setF({ ...f, client_id: v })} onCreated={(c) => clientsQ.setData((p) => [...(p ?? []), c])} />
              </div>
              <Input label="Fecha de entrega" type="date" value={f.delivery_date} onChange={(e) => setF({ ...f, delivery_date: e.target.value })} />
              <Input label="Hora" type="time" value={f.delivery_time} onChange={(e) => setF({ ...f, delivery_time: e.target.value })} />
              <div className="sm:col-span-2">
                <label className="label">Modalidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["recoger", "envio"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setF({ ...f, delivery_type: t })}
                      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${f.delivery_type === t ? "border-rose-300 bg-rose-50 text-rose-600" : "border-cocoa-800/10 text-cocoa-500 hover:bg-cream-100"}`}
                    >
                      {t === "envio" ? <Truck className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      {t === "envio" ? "Envío a domicilio" : "Recoge en tienda"}
                    </button>
                  ))}
                </div>
              </div>
              {f.delivery_type === "envio" && (
                <Input className="sm:col-span-2" label="Dirección de entrega" value={f.delivery_address} onChange={(e) => setF({ ...f, delivery_address: e.target.value })} placeholder={client?.address ?? "Calle, número, colonia, referencias"} />
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Postres" icon={<ShoppingBag className="h-5 w-5" />} />
            <div className="p-5 sm:p-6">
              <LineItemsEditor items={items} setItems={setItems} desserts={catalog.data?.desserts ?? []} costs={catalog.costs} />
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <Textarea label="Notas del pedido" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Texto del pastel, colores, alergias, referencias de entrega…" />
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold">Resumen</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Input label="Descuento" type="number" min={0} step="any" prefix="$" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              <Input label="Envío" type="number" min={0} step="any" prefix="$" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </div>
            <Toggle className="mt-4" checked={applyIva} onChange={setApplyIva} label={`Agregar IVA (${profile.iva_pct}%)`} />
            <div className="mt-5"><TotalsBox totals={totals} /></div>
          </Card>
          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Wallet className="h-5 w-5 text-mint-500" /> Pago y estado</h3>
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Anticipo" type="number" min={0} step="any" prefix="$" value={f.deposit} onChange={(e) => setF({ ...f, deposit: e.target.value })} />
                <Select label="Método" value={f.payment_method} onChange={(e) => setF({ ...f, payment_method: e.target.value })}>
                  <option value="">—</option>
                  <option>Efectivo</option>
                  <option>Transferencia</option>
                  <option>Tarjeta</option>
                </Select>
              </div>
              <Select label="Pago" value={f.payment_status} onChange={(e) => setF({ ...f, payment_status: e.target.value as PaymentStatus })}>
                {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
              <Select label="Estado del pedido" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as OrderStatus })}>
                {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </div>
            <Button size="lg" className="mt-6 w-full" onClick={save} loading={saving}>
              <Save className="h-4 w-4" /> Guardar pedido
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
