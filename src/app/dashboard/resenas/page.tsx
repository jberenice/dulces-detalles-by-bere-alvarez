"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Eye, EyeOff, MessageCircle, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useConfirm } from "@/components/ui/Confirm";
import { Badge, Card, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { reviewPhotoUrl } from "@/lib/public-photos";
import { date, folio, num, siteUrl } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Review } from "@/lib/types";

type Row = Review & { orders: { folio: number; customer_phone: string | null } | null };
type Tab = "nuevas" | "tienda" | "ocultas" | "pendientes";

export default function ReviewsPage() {
  const sb = createClient();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("nuevas");
  const q = useAsync(async () => must(await sb.from("reviews").select("*, orders(folio, customer_phone)").order("created_at", { ascending: false }).limit(300)) as Row[]);
  const all = q.data ?? [];
  const received = all.filter((r) => r.submitted_at);
  const groups: Record<Tab, Row[]> = {
    nuevas: received.filter((r) => !r.moderated_at),
    tienda: received.filter((r) => r.approved),
    ocultas: received.filter((r) => r.moderated_at && !r.approved),
    pendientes: all.filter((r) => !r.submitted_at),
  };
  const avg = useMemo(() => (received.length ? received.reduce((a, r) => a + Number(r.rating), 0) / received.length : 0), [received]);
  const list = groups[tab];

  async function moderate(r: Row, approved: boolean) {
    const moderated_at = new Date().toISOString();
    const { error } = await sb.from("reviews").update({ approved, moderated_at }).eq("id", r.id);
    if (error) return toast.error(error.message);
    q.setData((x) => (x ?? []).map((y) => (y.id === r.id ? { ...y, approved, moderated_at } : y)));
    toast.success(approved ? "Ya se ve en tu tienda ⭐" : "Reseña oculta");
  }
  async function remove(r: Row) {
    if (!(await confirm({ title: "¿Eliminar esta reseña?", message: "Se borra también su foto. No se puede deshacer.", confirmText: "Eliminar", danger: true }))) return;
    if (r.photo_path) await sb.storage.from("resenas").remove([r.photo_path]);
    const { error } = await sb.from("reviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    q.setData((x) => (x ?? []).filter((y) => y.id !== r.id));
  }
  const link = (r: Row) => `${siteUrl()}/r/${r.token}`;

  return (
    <>
      <PageHeader
        eyebrow="Lo que dicen de ti"
        title="Reseñas"
        subtitle="Pídelas desde un pedido entregado (botón “Pedir reseña”). Tu clienta califica y sube foto; tú eliges cuáles se ven en tu tienda."
      />
      {q.error ? (
        <Card className="p-6 text-sm text-rose-600">Falta ejecutar la migración 0014_growth.sql en Supabase.</Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Calificación" value={received.length ? `${num(avg, 1)} ★` : "—"} hint={`${received.length} reseña${received.length === 1 ? "" : "s"}`} icon={<Star className="h-5 w-5" />} tone="rose" />
            <StatCard label="En tu tienda" value={groups.tienda.length} hint="Aprobadas por ti" icon={<Eye className="h-5 w-5" />} tone="mint" />
            <StatCard label="Por revisar" value={groups.nuevas.length} hint="Nuevas" icon={<Star className="h-5 w-5" />} tone="cream" />
            <StatCard label="Esperando" value={groups.pendientes.length} hint="Enlaces sin responder" icon={<MessageCircle className="h-5 w-5" />} tone="cocoa" />
          </div>
          <Tabs
            value={tab}
            onChange={setTab}
            className="mb-5"
            options={[
              { value: "nuevas", label: "Nuevas", count: groups.nuevas.length },
              { value: "tienda", label: "En tu tienda", count: groups.tienda.length },
              { value: "ocultas", label: "Ocultas", count: groups.ocultas.length },
              { value: "pendientes", label: "Esperando respuesta", count: groups.pendientes.length },
            ]}
          />
          {q.loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
          ) : list.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Star className="h-8 w-8" />}
                title={tab === "pendientes" ? "No hay enlaces esperando" : "Nada por aquí todavía"}
                description="Cuando entregues un pedido, ábrelo y toca “Pedir reseña”: se abre WhatsApp con el enlace listo para tu clienta."
                action={<Link href="/dashboard/pedidos" className="font-bold text-rose-500 hover:underline">Ir a pedidos</Link>}
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((r) => {
                const photo = reviewPhotoUrl(r.photo_path);
                return (
                  <Card key={r.id} className="flex flex-col overflow-hidden">
                    {photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="aspect-[4/3] w-full object-cover" />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-2">
                        {r.submitted_at ? (
                          <p className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-4 w-4", n <= Number(r.rating) ? "fill-amber-400 text-amber-400" : "text-cocoa-800/15")} />)}</p>
                        ) : (
                          <Badge tone="warning">Sin responder</Badge>
                        )}
                        {r.orders && <span className="text-xs font-bold text-cocoa-300">{folio("P", r.orders.folio)}</span>}
                      </div>
                      {r.comment && <p className="mt-3 flex-1 text-[15px] leading-relaxed text-cocoa-700">“{r.comment}”</p>}
                      <p className="mt-3 text-sm font-semibold text-cocoa-500">— {r.customer_name || "Clienta"} <span className="font-normal text-cocoa-300">· {date(r.submitted_at ?? r.created_at)}</span></p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {r.submitted_at ? (
                          <>
                            {!r.approved && <Button size="sm" variant="mint" onClick={() => moderate(r, true)}><Eye className="h-4 w-4" /> Mostrar en tienda</Button>}
                            {(r.approved || !r.moderated_at) && <Button size="sm" variant="ghost" onClick={() => moderate(r, false)}><EyeOff className="h-4 w-4" /> Ocultar</Button>}
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(link(r)).then(() => toast.success("Enlace copiado"))}><Copy className="h-4 w-4" /> Copiar enlace</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => remove(r)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
