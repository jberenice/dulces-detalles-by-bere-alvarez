"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarHeart, FileText, Save, User } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCatalog } from "@/hooks/useCatalog";
import { must, useAsync } from "@/hooks/useAsync";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Toggle } from "@/components/ui/Field";
import { ClientPicker } from "./ClientPicker";
import { LineItemsEditor, TotalsBox, isPackageLine, lineKey, lineRow, packageLinesProblem, priceFor, type EditableLine } from "./LineItemsEditor";
import { calcTotals } from "@/lib/totals";
import { addDays, toISODate } from "@/lib/format";
import type { Client, Quote } from "@/lib/types";

export function QuoteForm({ quoteId, initialClientId, initialDessertId }: { quoteId?: string; initialClientId?: string | null; initialDessertId?: string | null }) {
  const router = useRouter();
  const sb = createClient();
  const catalog = useCatalog();
  const { profile } = catalog;
  const clientsQ = useAsync(async () => must(await sb.from("clients").select("*").order("name")) as Client[]);
  const quoteQ = useAsync(async () =>
    quoteId ? (must(await sb.from("quotes").select("*, quote_items(*)").eq("id", quoteId).single()) as Quote) : null,
  );

  const [ready, setReady] = useState(false);
  const [clientId, setClientId] = useState<string | null>(initialClientId ?? null);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [validUntil, setValidUntil] = useState(toISODate(addDays(new Date(), profile.quote_validity_days || 15)));
  const [items, setItems] = useState<EditableLine[]>([]);
  const [discount, setDiscount] = useState<number | string>(0);
  const [shipping, setShipping] = useState<number | string>(0);
  const [applyIva, setApplyIva] = useState(false);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(profile.quote_terms ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready || catalog.loading || quoteQ.loading) return;
    const q = quoteQ.data;
    if (q) {
      setClientId(q.client_id);
      setTitle(q.title ?? "");
      setEventDate(q.event_date ?? "");
      setValidUntil(q.valid_until ?? "");
      setDiscount(q.discount);
      setShipping(q.shipping);
      setApplyIva(q.apply_iva);
      setNotes(q.notes ?? "");
      setTerms(q.terms ?? "");
      setItems([...(q.quote_items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => ({ ...i, key: lineKey() })));
    } else {
      const d = initialDessertId ? catalog.data?.desserts.find((x) => x.id === initialDessertId) : null;
      setItems(
        d
          ? [{ key: lineKey(), dessert_id: d.id, description: d.name, quantity: 1, unit_price: priceFor(d, catalog.costs.get(d.id)), unit_cost: catalog.costs.get(d.id)?.unitCost ?? 0 }]
          : [{ key: lineKey(), dessert_id: "", description: "", quantity: 1, unit_price: 0, unit_cost: 0 }],
      );
    }
    setReady(true);
  }, [ready, catalog.loading, catalog.data, catalog.costs, quoteQ.loading, quoteQ.data, initialDessertId]);

  const totals = useMemo(() => calcTotals(items, { discount, shipping, applyIva, ivaPct: profile.iva_pct }), [items, discount, shipping, applyIva, profile.iva_pct]);

  async function save() {
    const problem = packageLinesProblem(items.filter((i) => Number(i.quantity) > 0), catalog.data?.packages ?? []);
    if (problem) return toast.error(problem);
    const valid = items.filter((i) => i.description.trim() && Number(i.quantity) > 0);
    if (!valid.length) return toast.error("Agrega al menos un postre");
    const withPackages = valid.some(isPackageLine);
    setSaving(true);
    try {
      const payload = {
        client_id: clientId,
        title: title || null,
        event_date: eventDate || null,
        valid_until: validUntil || null,
        discount: totals.discount,
        shipping: totals.shipping,
        apply_iva: applyIva,
        iva_pct: profile.iva_pct,
        subtotal: totals.subtotal,
        iva: totals.iva,
        total: totals.total,
        notes: notes || null,
        terms: terms || null,
      };
      let id = quoteId;
      if (id) {
        must(await sb.from("quotes").update(payload).eq("id", id));
        must(await sb.from("quote_items").delete().eq("quote_id", id));
      } else {
        id = (must(await sb.from("quotes").insert(payload).select("id").single()) as { id: string }).id;
      }
      must(
        await sb.from("quote_items").insert(
          valid.map((i, idx) => ({ quote_id: id, ...lineRow(i, withPackages), position: idx })),
        ),
      );
      toast.success("Cotización guardada");
      router.replace(`/dashboard/cotizaciones/${id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setSaving(false);
    }
  }

  if (!ready || clientsQ.loading)
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Skeleton className="h-[520px]" />
        <Skeleton className="h-80" />
      </div>
    );

  return (
    <>
      <Link href="/dashboard/cotizaciones" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-cocoa-400 hover:text-rose-500">
        <ArrowLeft className="h-4 w-4" /> Cotizaciones
      </Link>
      <PageHeader
        eyebrow={quoteId ? "Editando" : "Nueva"}
        title={quoteId ? "Editar cotización" : "Cotización"}
        subtitle="Elige los postres de tu recetario: el precio y el costo se llenan solos."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Cliente y evento" icon={<User className="h-5 w-5" />} />
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <div className="sm:col-span-2">
                <label className="label">Cliente</label>
                <ClientPicker clients={clientsQ.data ?? []} value={clientId} onChange={setClientId} onCreated={(c) => clientsQ.setData((p) => [...(p ?? []), c])} />
              </div>
              <Input className="sm:col-span-2" label="Título / ocasión" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mesa de postres XV años de Sofía" />
              <Input label="Fecha del evento" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} prefix={<CalendarHeart className="h-4 w-4" />} />
              <Input label="Vigencia hasta" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Postres" icon={<FileText className="h-5 w-5" />} />
            <div className="p-5 sm:p-6">
              <LineItemsEditor items={items} setItems={setItems} desserts={catalog.data?.desserts ?? []} costs={catalog.costs} packages={catalog.data?.packages ?? []} groups={catalog.data?.groups ?? []} extras={catalog.data?.extras ?? []} ingredientsById={catalog.ingredientsById} />
            </div>
          </Card>
          <Card className="grid gap-4 p-5 sm:p-6">
            <Textarea label="Notas para el cliente" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Decoración en tonos pastel, sin nuez, entrega a domicilio…" />
            <Textarea label="Términos y condiciones" rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </Card>
        </div>

        <Card className="p-6 lg:sticky lg:top-8">
          <h3 className="text-lg font-semibold">Resumen</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Input label="Descuento" type="number" min={0} step="any" prefix="$" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            <Input label="Envío" type="number" min={0} step="any" prefix="$" value={shipping} onChange={(e) => setShipping(e.target.value)} />
          </div>
          <Toggle className="mt-4" checked={applyIva} onChange={setApplyIva} label={`Agregar IVA (${profile.iva_pct}%)`} />
          <div className="mt-5">
            <TotalsBox totals={totals} />
          </div>
          <Button size="lg" className="mt-6 w-full" onClick={save} loading={saving}>
            <Save className="h-4 w-4" /> Guardar cotización
          </Button>
        </Card>
      </div>
    </>
  );
}
