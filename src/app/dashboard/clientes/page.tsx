"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Cake, FileText, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, ShoppingBag, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ClientFields, blankClient as blank } from "@/components/dashboard/ClientFields";
import { Modal } from "@/components/ui/Modal";
import { SearchInput, matches } from "@/components/ui/SearchInput";
import { useConfirm } from "@/components/ui/Confirm";
import { ORDER_STATUS, QUOTE_STATUS } from "@/lib/constants";
import { date, folio, money, waLink } from "@/lib/format";
import type { Client, Order, Quote } from "@/lib/types";


export default function ClientsPage() {
  const sb = createClient();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [form, setForm] = useState<typeof blank | null>(null);
  const [detail, setDetail] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    const [c, o, qt] = await Promise.all([
      sb.from("clients").select("*").order("name"),
      sb.from("orders").select("id, folio, client_id, total, status, delivery_date, created_at").neq("status", "cancelado"),
      sb.from("quotes").select("id, folio, client_id, total, status, created_at"),
    ]);
    return {
      clients: must(c) as Client[],
      orders: must(o) as Pick<Order, "id" | "folio" | "client_id" | "total" | "status" | "delivery_date" | "created_at">[],
      quotes: must(qt) as Pick<Quote, "id" | "folio" | "client_id" | "total" | "status" | "created_at">[],
    };
  });

  const stats = useMemo(() => {
    const m = new Map<string, { orders: number; spent: number; last: string | null }>();
    for (const o of data?.orders ?? []) {
      if (!o.client_id) continue;
      const s = m.get(o.client_id) ?? { orders: 0, spent: 0, last: null };
      s.orders++;
      s.spent += Number(o.total);
      if (!s.last || o.created_at > s.last) s.last = o.created_at;
      m.set(o.client_id, s);
    }
    return m;
  }, [data]);

  const list = (data?.clients ?? []).filter((c) => matches(q, c.name, c.phone, c.email));

  async function save() {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Escribe el nombre");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      birthday: form.birthday || null,
      notes: form.notes || null,
    };
    const res = form.id ? await sb.from("clients").update(payload).eq("id", form.id) : await sb.from("clients").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Cliente guardado");
    setForm(null);
    reload();
  }

  async function remove(c: Client) {
    if (!(await confirm({ title: `¿Eliminar a ${c.name}?`, message: "Sus pedidos y cotizaciones se conservan, sin cliente asignado.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("clients").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    setDetail(null);
    reload();
  }

  const edit = (c: Client) =>
    setForm({ id: c.id, name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", birthday: c.birthday ?? "", notes: c.notes ?? "" });

  const initials = (n: string) => n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const tones = ["bg-rose-100 text-rose-600", "bg-mint-100 text-mint-700", "bg-cream-300 text-cocoa-600", "bg-sky-100 text-sky-700"];

  return (
    <>
      <PageHeader
        eyebrow="Tu gente bonita"
        title="Clientes"
        subtitle="Guarda los datos de tus clientes y consulta su historial de pedidos y cotizaciones."
        actions={<Button onClick={() => setForm({ ...blank })}><Plus className="h-4 w-4" /> Nuevo cliente</Button>}
      />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, teléfono o correo" className="mb-4 sm:max-w-md" />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="h-8 w-8" />} title={q ? "Sin resultados" : "Aún no tienes clientes"} description="Se agregan solos cuando te compran en tu tienda, o puedes darlos de alta aquí." action={!q && <Button onClick={() => setForm({ ...blank })}><Plus className="h-4 w-4" /> Agregar cliente</Button>} />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c, i) => {
            const s = stats.get(c.id);
            return (
              <Card key={c.id} className="cursor-pointer p-4 transition hover:-translate-y-0.5 hover:shadow-lift" onClick={() => setDetail(c)}>
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-semibold ${tones[i % tones.length]}`}>{initials(c.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cocoa-700">{c.name}</p>
                    <p className="truncate text-sm text-cocoa-400">{c.phone || c.email || "Sin contacto"}</p>
                  </div>
                  {c.source === "tienda" && <Badge tone="mint">Tienda</Badge>}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-cream-100 px-3 py-2 text-sm">
                  <span className="text-cocoa-500"><b className="text-cocoa-700">{s?.orders ?? 0}</b> pedidos</span>
                  <span className="font-semibold text-cocoa-700 tabular-nums">{money(s?.spent ?? 0)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detalle */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} description={detail ? `Cliente desde ${date(detail.created_at)}` : ""} size="lg"
        footer={detail && (
          <>
            <Button variant="danger" className="sm:mr-auto" onClick={() => remove(detail)}><Trash2 className="h-4 w-4" /> Eliminar</Button>
            <Button variant="outline" onClick={() => { edit(detail); setDetail(null); }}><Pencil className="h-4 w-4" /> Editar</Button>
            <ButtonLink href={`/dashboard/cotizaciones/nueva?cliente=${detail.id}`}><FileText className="h-4 w-4" /> Cotizar</ButtonLink>
          </>
        )}
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {detail.phone && (
                <a href={waLink(detail.phone, `Hola ${detail.name.split(" ")[0]} 💕`)} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-mint-50 p-3 text-sm font-semibold text-mint-700 hover:bg-mint-100">
                  <MessageCircle className="h-5 w-5" /> {detail.phone}
                </a>
              )}
              {detail.email && (
                <a href={`mailto:${detail.email}`} className="flex items-center gap-3 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                  <Mail className="h-5 w-5" /> <span className="truncate">{detail.email}</span>
                </a>
              )}
              {detail.address && <p className="flex items-center gap-3 rounded-2xl bg-cream-100 p-3 text-sm text-cocoa-600 sm:col-span-2"><MapPin className="h-5 w-5 shrink-0 text-cocoa-400" /> {detail.address}</p>}
              {detail.birthday && <p className="flex items-center gap-3 rounded-2xl bg-cream-100 p-3 text-sm text-cocoa-600"><Cake className="h-5 w-5 text-rose-400" /> Cumpleaños: {date(detail.birthday, { day: "numeric", month: "long" })}</p>}
              {!detail.phone && !detail.email && <p className="flex items-center gap-2 text-sm text-cocoa-400"><Phone className="h-4 w-4" /> Sin datos de contacto</p>}
            </div>
            {detail.notes && <p className="rounded-2xl border border-dashed border-cocoa-800/10 p-3 text-sm text-cocoa-500">{detail.notes}</p>}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-base font-semibold"><ShoppingBag className="h-4 w-4 text-rose-400" /> Pedidos</h4>
              <ul className="divide-y divide-cocoa-800/5 rounded-2xl ring-1 ring-cocoa-800/5">
                {(data?.orders ?? []).filter((o) => o.client_id === detail.id).map((o) => (
                  <li key={o.id}>
                    <Link href={`/dashboard/pedidos/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-cream-100">
                      <span className="font-semibold">{folio("P", o.folio)}</span>
                      <span className="text-cocoa-400">{date(o.delivery_date ?? o.created_at)}</span>
                      <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                      <span className="font-semibold tabular-nums">{money(o.total)}</span>
                    </Link>
                  </li>
                ))}
                {!(data?.orders ?? []).some((o) => o.client_id === detail.id) && <li className="px-4 py-3 text-sm text-cocoa-400">Sin pedidos aún</li>}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-base font-semibold"><FileText className="h-4 w-4 text-mint-500" /> Cotizaciones</h4>
              <ul className="divide-y divide-cocoa-800/5 rounded-2xl ring-1 ring-cocoa-800/5">
                {(data?.quotes ?? []).filter((x) => x.client_id === detail.id).map((x) => (
                  <li key={x.id}>
                    <Link href={`/dashboard/cotizaciones/${x.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-cream-100">
                      <span className="font-semibold">{folio("C", x.folio)}</span>
                      <span className="text-cocoa-400">{date(x.created_at)}</span>
                      <Badge tone={QUOTE_STATUS[x.status].tone}>{QUOTE_STATUS[x.status].label}</Badge>
                      <span className="font-semibold tabular-nums">{money(x.total)}</span>
                    </Link>
                  </li>
                ))}
                {!(data?.quotes ?? []).some((x) => x.client_id === detail.id) && <li className="px-4 py-3 text-sm text-cocoa-400">Sin cotizaciones aún</li>}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Formulario */}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar cliente" : "Nuevo cliente"}
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button><Button onClick={save} loading={saving}>Guardar</Button></>}
      >
        {form && <ClientFields form={form} setForm={setForm} />}
      </Modal>
    </>
  );
}
