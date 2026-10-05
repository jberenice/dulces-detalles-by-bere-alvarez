"use client";
import { useMemo, useState } from "react";
import { CalendarHeart, Copy, MessageCircle, Pencil, Plus, Shuffle, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { useConfirm } from "@/components/ui/Confirm";
import { SEASON_PRESETS, daysBetween, nextStart, presetDates, randomCode, seasonOn, seasonRange } from "@/lib/seasons";
import { storeUrl } from "@/lib/domains";
import { date, money, toISODate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Coupon, Season } from "@/lib/types";

type SeasonForm = Omit<Season, "id" | "created_at"> & { id?: string; desserts: string[]; packages: string[] };
type CouponForm = Omit<Coupon, "id" | "created_at" | "uses" | "value" | "min_subtotal" | "max_uses"> & { id?: string; value: string; min_subtotal: string; max_uses: string };
type Item = { id: string; name: string; season_id: string | null; category?: string };

const blankCoupon = (): CouponForm => ({ code: randomCode(), description: "", kind: "porcentaje", value: "10", min_subtotal: "", starts_on: null, ends_on: null, season_id: null, max_uses: "", active: true });

export default function SeasonsPage() {
  const sb = createClient();
  const confirm = useConfirm();
  const { profile } = useBusiness();
  const today = toISODate(new Date());
  const [tab, setTab] = useState<"temporadas" | "cupones">("temporadas");
  const seasonsQ = useAsync(async () => must(await sb.from("seasons").select("*").order("start_date")) as Season[]);
  const couponsQ = useAsync(async () => must(await sb.from("coupons").select("*").order("created_at", { ascending: false })) as Coupon[]);
  const itemsQ = useAsync(async () => {
    const [d, p] = await Promise.all([
      sb.from("desserts").select("id, name, category, season_id").eq("active", true).order("category").order("name"),
      sb.from("packages").select("id, name, season_id").eq("active", true).order("name"),
    ]);
    return { desserts: (d.data ?? []) as Item[], packages: (p.data ?? []) as Item[] };
  });
  const [sForm, setSForm] = useState<SeasonForm | null>(null);
  const [cForm, setCForm] = useState<CouponForm | null>(null);
  const [saving, setSaving] = useState(false);
  const missing = seasonsQ.error || couponsQ.error;

  const seasons = useMemo(() => {
    const list = seasonsQ.data ?? [];
    const rank = (s: Season) => (seasonOn(s, today) ? -1 : daysBetween(today, nextStart(s, today) ?? "9999-12-31"));
    return [...list].sort((a, b) => rank(a) - rank(b));
  }, [seasonsQ.data, today]);
  const countIn = (id: string) => (itemsQ.data?.desserts ?? []).filter((d) => d.season_id === id).length + (itemsQ.data?.packages ?? []).filter((p) => p.season_id === id).length;
  const usedPresets = new Set((seasonsQ.data ?? []).map((s) => s.name));

  function newSeason(p?: (typeof SEASON_PRESETS)[number]) {
    const dates = p ? presetDates(p, today) : { start: today, end: today };
    setSForm({ name: p?.name ?? "", emoji: p?.emoji ?? "", start_date: dates.start, end_date: dates.end, yearly: true, banner: p?.banner ?? "", active: true, desserts: [], packages: [] });
  }
  function editSeason(s: Season) {
    setSForm({
      ...s,
      desserts: (itemsQ.data?.desserts ?? []).filter((d) => d.season_id === s.id).map((d) => d.id),
      packages: (itemsQ.data?.packages ?? []).filter((p) => p.season_id === s.id).map((p) => p.id),
    });
  }

  async function saveSeason() {
    if (!sForm) return;
    if (!sForm.name.trim()) return toast.error("Ponle nombre a la temporada");
    if (!sForm.start_date || !sForm.end_date) return toast.error("Elige las fechas");
    if (!sForm.yearly && sForm.end_date < sForm.start_date) return toast.error("La fecha final debe ser después del inicio");
    setSaving(true);
    const payload = { name: sForm.name.trim(), emoji: sForm.emoji?.trim() || null, start_date: sForm.start_date, end_date: sForm.end_date, yearly: sForm.yearly, banner: sForm.banner?.trim() || null, active: sForm.active };
    const res = sForm.id ? await sb.from("seasons").update(payload).eq("id", sForm.id).select().single() : await sb.from("seasons").insert(payload).select().single();
    if (res.error) {
      setSaving(false);
      return toast.error(res.error.message);
    }
    const id = (res.data as Season).id;
    // Postres y paquetes de esta temporada
    const sync = async (table: "desserts" | "packages", chosen: string[], all: Item[]) => {
      const add = chosen.filter((x) => all.find((i) => i.id === x)?.season_id !== id);
      const remove = all.filter((i) => i.season_id === id && !chosen.includes(i.id)).map((i) => i.id);
      if (add.length) await sb.from(table).update({ season_id: id }).in("id", add);
      if (remove.length) await sb.from(table).update({ season_id: null }).in("id", remove);
    };
    await sync("desserts", sForm.desserts, itemsQ.data?.desserts ?? []);
    await sync("packages", sForm.packages, itemsQ.data?.packages ?? []);
    setSaving(false);
    setSForm(null);
    toast.success("Temporada guardada 🎉");
    seasonsQ.reload();
    itemsQ.reload();
  }

  async function removeSeason(s: Season) {
    if (!(await confirm({ title: `¿Eliminar “${s.name}”?`, message: "Sus postres y paquetes vuelven a mostrarse todo el año.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("seasons").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    seasonsQ.reload();
    itemsQ.reload();
  }

  async function saveCoupon() {
    if (!cForm) return;
    const code = cForm.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return toast.error("El código lleva de 3 a 30 letras o números, sin espacios");
    const value = Number(cForm.value);
    if (!(value > 0) || (cForm.kind === "porcentaje" && value > 100)) return toast.error("Revisa el valor del descuento");
    setSaving(true);
    const payload = {
      code,
      description: cForm.description?.trim() || null,
      kind: cForm.kind,
      value,
      min_subtotal: Number(cForm.min_subtotal) || 0,
      starts_on: cForm.starts_on || null,
      ends_on: cForm.ends_on || null,
      season_id: cForm.season_id || null,
      max_uses: cForm.max_uses ? Math.max(1, Math.round(Number(cForm.max_uses))) : null,
      active: cForm.active,
    };
    const { error } = cForm.id ? await sb.from("coupons").update(payload).eq("id", cForm.id) : await sb.from("coupons").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message.includes("unique") || error.code === "23505" ? "Ya tienes un cupón con ese código" : error.message);
    setCForm(null);
    toast.success("Cupón guardado 🎟️");
    couponsQ.reload();
  }

  async function toggleCoupon(c: Coupon) {
    const { error } = await sb.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    couponsQ.setData((x) => (x ?? []).map((y) => (y.id === c.id ? { ...y, active: !c.active } : y)));
  }
  async function removeCoupon(c: Coupon) {
    if (!(await confirm({ title: `¿Eliminar el cupón ${c.code}?`, message: "Los pedidos que ya lo usaron conservan su descuento.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("coupons").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    couponsQ.reload();
  }
  const couponLabel = (c: Pick<Coupon, "kind" | "value">) => (c.kind === "porcentaje" ? `${Number(c.value)}% de descuento` : `${money(c.value)} de descuento`);
  const shareText = (c: Coupon) =>
    `🎟️ Usa el cupón *${c.code}* y obtén ${couponLabel(c)}${Number(c.min_subtotal) ? ` en compras desde ${money(c.min_subtotal)}` : ""}${c.ends_on ? ` (válido hasta el ${date(c.ends_on)})` : ""}.\nPide aquí: ${storeUrl(profile.store_slug)}`;

  return (
    <>
      <PageHeader
        eyebrow="Vende más en fechas especiales"
        title="Temporadas y cupones"
        subtitle="Programa tus postres de temporada (aparecen y desaparecen solos de tu tienda) y crea cupones de descuento."
        actions={
          tab === "temporadas" ? (
            <Button onClick={() => newSeason()}><Plus className="h-4 w-4" /> Fecha especial</Button>
          ) : (
            <Button onClick={() => setCForm(blankCoupon())}><Plus className="h-4 w-4" /> Nuevo cupón</Button>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        options={[
          { value: "temporadas", label: <><CalendarHeart className="h-4 w-4" /> Temporadas</>, count: seasonsQ.data?.length },
          { value: "cupones", label: <><Ticket className="h-4 w-4" /> Cupones</>, count: couponsQ.data?.length },
        ]}
      />

      {missing ? (
        <Card className="p-6 text-sm text-rose-600">Falta ejecutar la migración 0014_growth.sql en Supabase.</Card>
      ) : tab === "temporadas" ? (
        <div className="space-y-6">
          {seasonsQ.loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
          ) : seasons.length === 0 ? (
            <Card>
              <EmptyState icon={<CalendarHeart className="h-8 w-8" />} title="Aún no tienes temporadas" description="Elige una fecha especial de abajo o crea la tuya. Luego asígnale postres o paquetes y aparecerán en tu tienda solo en esas fechas." />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {seasons.map((s) => {
                const on = seasonOn(s, today);
                const next = nextStart(s, today);
                const inDays = next ? daysBetween(today, next) : null;
                const n = countIn(s.id);
                return (
                  <Card key={s.id} className={cn("flex flex-col p-5", on && "ring-2 ring-mint-300")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cream-100 text-2xl">{s.emoji || "🎉"}</span>
                        <div>
                          <h3 className="font-display text-lg leading-tight font-semibold">{s.name}</h3>
                          <p className="text-xs text-cocoa-400">{seasonRange(s)}{s.yearly ? " · cada año" : ""}</p>
                        </div>
                      </div>
                      <ActionMenu
                        actions={[
                          { label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => editSeason(s) },
                          { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => removeSeason(s), danger: true },
                        ]}
                      />
                    </div>
                    {s.banner && <p className="mt-3 line-clamp-2 text-sm text-cocoa-500">“{s.banner}”</p>}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      {!s.active ? (
                        <Badge>Pausada</Badge>
                      ) : on ? (
                        <Badge tone="success">En curso</Badge>
                      ) : inDays !== null ? (
                        <Badge tone={inDays <= 21 ? "warning" : "neutral"}>Empieza en {inDays} {inDays === 1 ? "día" : "días"}</Badge>
                      ) : (
                        <Badge>Terminada</Badge>
                      )}
                      <button onClick={() => editSeason(s)} className="text-xs font-bold text-rose-500 hover:underline">
                        {n ? `${n} ${n === 1 ? "producto" : "productos"}` : "Asignar postres"}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Fechas especiales sugeridas</h3>
            <p className="text-sm text-cocoa-400">Toca una para agregarla. Puedes cambiar las fechas o crear tus propias fechas especiales.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SEASON_PRESETS.filter((p) => !usedPresets.has(p.name)).map((p) => (
                <button key={p.name} onClick={() => newSeason(p)} className="rounded-full border-2 border-cocoa-800/8 bg-white px-3.5 py-2 text-sm font-bold text-cocoa-600 transition hover:border-rose-300 hover:text-rose-600">
                  {p.emoji} {p.name}
                </button>
              ))}
              <button onClick={() => newSeason()} className="rounded-full border-2 border-dashed border-rose-300 px-3.5 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50">
                <Plus className="mr-1 inline h-4 w-4" /> Otra fecha
              </button>
            </div>
          </Card>
        </div>
      ) : couponsQ.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : !couponsQ.data?.length ? (
        <Card>
          <EmptyState
            icon={<Ticket className="h-8 w-8" />}
            title="Aún no tienes cupones"
            description="Crea un código como MUERTOS10 para dar 10% de descuento, o $50 en compras desde $500. Tus clientas lo escriben al pagar en tu tienda."
            action={<Button onClick={() => setCForm(blankCoupon())}><Plus className="h-4 w-4" /> Crear cupón</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {couponsQ.data.map((c) => {
            const expired = (c.ends_on && c.ends_on < today) || (c.max_uses != null && c.uses >= c.max_uses);
            const season = seasonsQ.data?.find((s) => s.id === c.season_id);
            return (
              <Card key={c.id} className={cn("relative flex flex-col overflow-hidden p-5", (!c.active || expired) && "opacity-70")}>
                <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-cream-100" />
                <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-cream-100" />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xl font-bold tracking-wider text-rose-500">{c.code}</p>
                    <p className="text-sm font-semibold text-cocoa-700">{couponLabel(c)}</p>
                  </div>
                  <ActionMenu
                    actions={[
                      { label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => setCForm({ ...c, value: String(c.value), min_subtotal: c.min_subtotal ? String(c.min_subtotal) : "", max_uses: c.max_uses ? String(c.max_uses) : "" }) },
                      { label: "Copiar mensaje", icon: <Copy className="h-4 w-4" />, onClick: () => navigator.clipboard.writeText(shareText(c)).then(() => toast.success("Mensaje copiado")) },
                      { label: "Compartir por WhatsApp", icon: <MessageCircle className="h-4 w-4" />, onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText(c))}`, "_blank") },
                      { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => removeCoupon(c), danger: true },
                    ]}
                  />
                </div>
                {c.description && <p className="mt-2 text-sm text-cocoa-500">{c.description}</p>}
                <ul className="mt-3 space-y-0.5 border-t border-dashed border-cocoa-800/15 pt-3 text-xs text-cocoa-400">
                  {Number(c.min_subtotal) > 0 && <li>En compras desde {money(c.min_subtotal)}</li>}
                  {(c.starts_on || c.ends_on) && <li>{c.starts_on ? `Del ${date(c.starts_on)} ` : ""}{c.ends_on ? `hasta el ${date(c.ends_on)}` : "en adelante"}</li>}
                  {season && <li>Solo durante {season.emoji} {season.name}</li>}
                  <li>Usado {c.uses}{c.max_uses ? ` de ${c.max_uses}` : ""} {c.uses === 1 ? "vez" : "veces"}</li>
                </ul>
                <div className="mt-auto flex items-center justify-between pt-4">
                  {expired ? <Badge>Vencido o agotado</Badge> : c.active ? <Badge tone="success">Activo</Badge> : <Badge>Pausado</Badge>}
                  <Toggle checked={c.active} onChange={() => toggleCoupon(c)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Temporada */}
      <Modal
        open={!!sForm}
        onClose={() => setSForm(null)}
        title={sForm?.id ? "Editar temporada" : "Nueva fecha especial"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSForm(null)}>Cancelar</Button>
            <Button onClick={saveSeason} loading={saving}>Guardar</Button>
          </>
        }
      >
        {sForm && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[90px_1fr]">
              <Input label="Emoji" maxLength={8} value={sForm.emoji ?? ""} onChange={(e) => setSForm({ ...sForm, emoji: e.target.value })} placeholder="🎉" className="text-center" />
              <Input label="Nombre" maxLength={80} value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} placeholder="Ej. Día de Muertos" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Se muestra desde" type="date" value={sForm.start_date} onChange={(e) => setSForm({ ...sForm, start_date: e.target.value })} />
              <Input label="Hasta" type="date" value={sForm.end_date} onChange={(e) => setSForm({ ...sForm, end_date: e.target.value })} />
            </div>
            <Toggle checked={sForm.yearly} onChange={(v) => setSForm({ ...sForm, yearly: v })} label="Repetir cada año en estas fechas" description="Así no tienes que volver a crearla el próximo año." />
            <Textarea label="Aviso en tu tienda (opcional)" rows={2} maxLength={200} value={sForm.banner ?? ""} onChange={(e) => setSForm({ ...sForm, banner: e.target.value })} placeholder="Pan de muerto y postres para tu ofrenda 💀" />
            <ItemPicker title="Postres de esta temporada" items={itemsQ.data?.desserts ?? []} chosen={sForm.desserts} onChange={(v) => setSForm({ ...sForm, desserts: v })} seasonId={sForm.id} />
            {(itemsQ.data?.packages.length ?? 0) > 0 && (
              <ItemPicker title="Paquetes de esta temporada" items={itemsQ.data?.packages ?? []} chosen={sForm.packages} onChange={(v) => setSForm({ ...sForm, packages: v })} seasonId={sForm.id} />
            )}
            <p className="text-xs text-cocoa-400">Lo que elijas aquí solo aparece en tu tienda durante la temporada. Recuerda tenerlo marcado como “Mostrar en mi tienda”.</p>
            <Toggle checked={sForm.active} onChange={(v) => setSForm({ ...sForm, active: v })} label="Activa" />
          </div>
        )}
      </Modal>

      {/* Cupón */}
      <Modal
        open={!!cForm}
        onClose={() => setCForm(null)}
        title={cForm?.id ? "Editar cupón" : "Nuevo cupón"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCForm(null)}>Cancelar</Button>
            <Button onClick={saveCoupon} loading={saving}>Guardar cupón</Button>
          </>
        }
      >
        {cForm && (
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <Input className="flex-1" label="Código" maxLength={30} value={cForm.code} onChange={(e) => setCForm({ ...cForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} placeholder="MUERTOS10" />
              <Button type="button" variant="outline" onClick={() => setCForm({ ...cForm, code: randomCode() })} title="Generar código"><Shuffle className="h-4 w-4" /></Button>
            </div>
            <Input label="Descripción (opcional)" maxLength={200} value={cForm.description ?? ""} onChange={(e) => setCForm({ ...cForm, description: e.target.value })} placeholder="Promo de Día de Muertos" />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Tipo" value={cForm.kind} onChange={(e) => setCForm({ ...cForm, kind: e.target.value as Coupon["kind"] })}>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto">Monto fijo ($)</option>
              </Select>
              <Input label="Descuento" type="number" min={0} step="any" value={cForm.value} onChange={(e) => setCForm({ ...cForm, value: e.target.value })} prefix={cForm.kind === "monto" ? "$" : undefined} suffix={cForm.kind === "porcentaje" ? "%" : undefined} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Compra mínima" type="number" min={0} step="any" prefix="$" value={cForm.min_subtotal} onChange={(e) => setCForm({ ...cForm, min_subtotal: e.target.value })} placeholder="Sin mínimo" />
              <Input label="Usos máximos" type="number" min={1} value={cForm.max_uses} onChange={(e) => setCForm({ ...cForm, max_uses: e.target.value })} placeholder="Sin límite" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Válido desde" type="date" value={cForm.starts_on ?? ""} onChange={(e) => setCForm({ ...cForm, starts_on: e.target.value || null })} />
              <Input label="Hasta" type="date" value={cForm.ends_on ?? ""} onChange={(e) => setCForm({ ...cForm, ends_on: e.target.value || null })} />
            </div>
            <Select label="Solo durante una temporada (opcional)" value={cForm.season_id ?? ""} onChange={(e) => setCForm({ ...cForm, season_id: e.target.value || null })}>
              <option value="">Cualquier fecha</option>
              {(seasonsQ.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
            </Select>
            <Toggle checked={cForm.active} onChange={(v) => setCForm({ ...cForm, active: v })} label="Activo" />
          </div>
        )}
      </Modal>
    </>
  );
}

function ItemPicker({ title, items, chosen, onChange, seasonId }: { title: string; items: Item[]; chosen: string[]; onChange: (v: string[]) => void; seasonId?: string }) {
  const [q, setQ] = useState("");
  const list = items.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <span className="label !mb-0">{title} ({chosen.length})</span>
        {items.length > 8 && <input className="field !w-44 !py-1.5 text-sm" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />}
      </div>
      <div className="mt-2 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
        {list.map((i) => {
          const on = chosen.includes(i.id);
          const other = !on && i.season_id && i.season_id !== seasonId;
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onChange(on ? chosen.filter((x) => x !== i.id) : [...chosen, i.id])}
              title={other ? "Ya está en otra temporada (se cambiará a esta)" : undefined}
              className={cn("rounded-full border-2 px-3 py-1 text-xs font-bold transition", on ? "border-rose-400 bg-rose-50 text-rose-600" : "border-cocoa-800/10 bg-white text-cocoa-500 hover:border-rose-200", other && "border-dashed")}
            >
              {i.name}
            </button>
          );
        })}
        {!list.length && <p className="text-xs text-cocoa-400">No hay nada que coincida.</p>}
      </div>
    </div>
  );
}
