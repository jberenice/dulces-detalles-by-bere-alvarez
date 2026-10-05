"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Cake, Crown, FileText, Gift, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, ShoppingBag, Trash2, Users } from "lucide-react";
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
import type { Client, LoyaltySettings, Order, Profile, Quote } from "@/lib/types";
import { Tabs } from "@/components/ui/Tabs";
import { Input, Toggle } from "@/components/ui/Field";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { LoyaltyStamps } from "@/components/dashboard/LoyaltyCard";
import { birthdayWhen, nextBirthday } from "@/lib/birthdays";
import { getTemplate, renderTemplate } from "@/lib/templates";
import { storeUrl } from "@/lib/domains";
import { toISODate } from "@/lib/format";

type View = "todas" | "mejores" | "cumples";


export default function ClientsPage() {
  const sb = createClient();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [form, setForm] = useState<typeof blank | null>(null);
  const [detail, setDetail] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const { profile, setProfile } = useBusiness();
  const [view, setView] = useState<View>("todas");
  const [loyaltyForm, setLoyaltyForm] = useState<LoyaltySettings | null>(null);
  const loyalty = profile.loyalty?.enabled ? { stamps: Math.max(2, Number(profile.loyalty.stamps) || 10), reward: profile.loyalty.reward || "un premio", min: Number(profile.loyalty.min_total) || 0 } : null;
  const today = toISODate(new Date());

  const { data, loading, reload } = useAsync(async () => {
    const [c, o, qt, red] = await Promise.all([
      sb.from("clients").select("*").order("name"),
      sb.from("orders").select("id, folio, client_id, total, status, delivery_date, created_at").neq("status", "cancelado"),
      sb.from("quotes").select("id, folio, client_id, total, status, created_at"),
      sb.from("loyalty_redemptions").select("client_id, stamps"),
    ]);
    return {
      clients: must(c) as Client[],
      orders: must(o) as Pick<Order, "id" | "folio" | "client_id" | "total" | "status" | "delivery_date" | "created_at">[],
      quotes: must(qt) as Pick<Quote, "id" | "folio" | "client_id" | "total" | "status" | "created_at">[],
      // Si aún no se ejecuta la migración 0014 no hay canjes
      redemptions: (red.error ? [] : red.data ?? []) as { client_id: string; stamps: number }[],
    };
  });

  const stats = useMemo(() => {
    const m = new Map<string, { orders: number; spent: number; last: string | null; stamps: number }>();
    for (const o of data?.orders ?? []) {
      if (!o.client_id) continue;
      const s = m.get(o.client_id) ?? { orders: 0, spent: 0, last: null, stamps: 0 };
      s.orders++;
      s.spent += Number(o.total);
      if (!s.last || o.created_at > s.last) s.last = o.created_at;
      // Un sello por pedido entregado (desde el monto mínimo, si hay)
      if (o.status === "entregado" && Number(o.total) >= (loyalty?.min ?? 0)) s.stamps++;
      m.set(o.client_id, s);
    }
    for (const r of data?.redemptions ?? []) {
      const s = m.get(r.client_id);
      if (s) s.stamps -= Number(r.stamps);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loyalty?.min]);

  const base = (data?.clients ?? []).filter((c) => matches(q, c.name, c.phone, c.email));
  const list =
    view === "mejores"
      ? base.filter((c) => (stats.get(c.id)?.spent ?? 0) > 0).sort((a, b) => (stats.get(b.id)?.spent ?? 0) - (stats.get(a.id)?.spent ?? 0)).slice(0, 30)
      : view === "cumples"
        ? base.filter((c) => c.birthday).sort((a, b) => nextBirthday(a.birthday!, today).days - nextBirthday(b.birthday!, today).days)
        : base;
  const withBirthday = (data?.clients ?? []).filter((c) => c.birthday && nextBirthday(c.birthday, today).days <= 30).length;

  async function saveLoyalty() {
    if (!loyaltyForm) return;
    const value: LoyaltySettings = {
      enabled: !!loyaltyForm.enabled,
      stamps: Math.max(2, Math.min(30, Math.round(Number(loyaltyForm.stamps) || 10))),
      reward: (loyaltyForm.reward ?? "").trim().slice(0, 120) || "un premio",
      min_total: Math.max(0, Number(loyaltyForm.min_total) || 0),
    };
    setSaving(true);
    const { data: p, error } = await sb.from("profiles").update({ loyalty: value }).eq("id", profile.id).select().single();
    setSaving(false);
    if (error) return toast.error(error.message.includes("loyalty") ? "Falta ejecutar la migración 0014 en Supabase" : error.message);
    setProfile(p as Profile);
    setLoyaltyForm(null);
    toast.success(value.enabled ? "Tarjeta de sellos activada 🧁" : "Tarjeta de sellos desactivada");
  }

  async function redeem(c: Client) {
    if (!loyalty) return;
    if (!(await confirm({ title: `¿Canjear el premio de ${c.name}?`, message: `Se descuentan ${loyalty.stamps} sellos de su tarjeta (${loyalty.reward}).`, confirmText: "Canjear" }))) return;
    const { error } = await sb.from("loyalty_redemptions").insert({ client_id: c.id, stamps: loyalty.stamps, note: loyalty.reward });
    if (error) return toast.error(error.message);
    toast.success("¡Premio canjeado! 🎁");
    reload();
  }

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
        actions={
          <>
            <Button variant="outline" onClick={() => setLoyaltyForm({ enabled: true, stamps: 10, reward: "1 caja de cupcakes gratis", min_total: 0, ...(profile.loyalty ?? {}) })}>
              <Gift className="h-4 w-4" /> Tarjeta de sellos
            </Button>
            <Button onClick={() => setForm({ ...blank })}><Plus className="h-4 w-4" /> Nuevo cliente</Button>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={view}
          onChange={setView}
          options={[
            { value: "todas", label: "Todas", count: data?.clients.length ?? 0 },
            { value: "mejores", label: <><Crown className="h-4 w-4" /> Mejores clientas</> },
            { value: "cumples", label: <><Cake className="h-4 w-4" /> Cumpleaños</>, count: withBirthday || undefined },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre, teléfono o correo" className="lg:w-80" />
      </div>
      {view === "cumples" && <p className="mb-4 text-sm text-cocoa-400">Ordenadas por el próximo cumpleaños. Agrega la fecha al editar a cada clienta.</p>}
      {view === "mejores" && <p className="mb-4 text-sm text-cocoa-400">Las 30 que más te han comprado (sin pedidos cancelados).</p>}

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
            const bd = c.birthday ? nextBirthday(c.birthday, today) : null;
            return (
              <Card key={c.id} className="cursor-pointer p-4 transition hover:-translate-y-0.5 hover:shadow-lift" onClick={() => setDetail(c)}>
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-semibold ${tones[i % tones.length]}`}>{initials(c.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-cocoa-700">{c.name}</p>
                    <p className="truncate text-sm text-cocoa-400">{c.phone || c.email || "Sin contacto"}</p>
                  </div>
                  {view === "mejores" && i < 3 ? <span className="text-2xl">{["🥇", "🥈", "🥉"][i]}</span> : c.source === "tienda" && <Badge tone="mint">Tienda</Badge>}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-cream-100 px-3 py-2 text-sm">
                  <span className="text-cocoa-500"><b className="text-cocoa-700">{s?.orders ?? 0}</b> pedidos</span>
                  <span className="font-semibold text-cocoa-700 tabular-nums">{money(s?.spent ?? 0)}</span>
                </div>
                {bd && bd.days <= 30 && (
                  <p className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${bd.days <= 7 ? "text-rose-500" : "text-cocoa-400"}`}>
                    <Cake className="h-3.5 w-3.5" /> Cumpleaños: {birthdayWhen(bd.days).toLowerCase()} ({date(bd.date, { day: "numeric", month: "short" })})
                  </p>
                )}
                {loyalty && (s?.stamps ?? 0) > 0 && (
                  <div className="mt-3">
                    <LoyaltyStamps compact stamps={s?.stamps ?? 0} needed={loyalty.stamps} reward={loyalty.reward} />
                  </div>
                )}
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
            {loyalty && (
              <LoyaltyStamps
                stamps={stats.get(detail.id)?.stamps ?? 0}
                needed={loyalty.stamps}
                reward={loyalty.reward}
                onRedeem={() => redeem(detail)}
                waHref={
                  detail.phone && (stats.get(detail.id)?.stamps ?? 0) > 0
                    ? waLink(detail.phone, renderTemplate(getTemplate(profile, "sellos"), { cliente: detail.name.split(" ")[0], sellos: `${Math.min(stats.get(detail.id)?.stamps ?? 0, loyalty.stamps)} de ${loyalty.stamps}`, premio: loyalty.reward, negocio: profile.business_name }))
                    : null
                }
              />
            )}
            {detail.birthday && detail.phone && nextBirthday(detail.birthday, today).days <= 14 && (
              <a
                href={waLink(detail.phone, renderTemplate(getTemplate(profile, "cumpleanos"), { cliente: detail.name.split(" ")[0], negocio: profile.business_name, tienda: profile.store_enabled && profile.store_slug ? storeUrl(profile.store_slug) : "" }))}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-600 hover:bg-rose-100"
              >
                🎂 Felicitar por su cumpleaños ({birthdayWhen(nextBirthday(detail.birthday, today).days).toLowerCase()})
              </a>
            )}
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

      {/* Tarjeta de sellos */}
      <Modal
        open={!!loyaltyForm}
        onClose={() => setLoyaltyForm(null)}
        title="Tarjeta de sellos"
        description="Cada pedido entregado suma un sello. Al completar la tarjeta, tu clienta gana su premio."
        footer={<><Button variant="ghost" onClick={() => setLoyaltyForm(null)}>Cancelar</Button><Button onClick={saveLoyalty} loading={saving}>Guardar</Button></>}
      >
        {loyaltyForm && (
          <div className="space-y-4">
            <Toggle checked={!!loyaltyForm.enabled} onChange={(v) => setLoyaltyForm({ ...loyaltyForm, enabled: v })} label="Usar tarjeta de sellos" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Sellos para el premio" type="number" min={2} max={30} value={loyaltyForm.stamps ?? 10} onChange={(e) => setLoyaltyForm({ ...loyaltyForm, stamps: e.target.value as unknown as number })} />
              <Input label="Pedido mínimo para sellar" type="number" min={0} prefix="$" value={loyaltyForm.min_total ?? 0} onChange={(e) => setLoyaltyForm({ ...loyaltyForm, min_total: e.target.value as unknown as number })} hint="0 = cualquier pedido" />
            </div>
            <Input label="Premio" maxLength={120} value={loyaltyForm.reward ?? ""} onChange={(e) => setLoyaltyForm({ ...loyaltyForm, reward: e.target.value })} placeholder="1 caja de cupcakes gratis" />
            <p className="rounded-2xl bg-cream-100 p-3 text-xs text-cocoa-500">Los sellos se cuentan solos con los pedidos <b>entregados</b> de cada clienta. Al canjear, se descuentan de su tarjeta.</p>
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
