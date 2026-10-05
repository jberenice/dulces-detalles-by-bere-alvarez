"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, CalendarClock, Check, Clock, MessageCircle, Moon, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { getTemplate, renderTemplate } from "@/lib/templates";
import { date, dateLong, folio, money, parseDate, siteUrl, waLink } from "@/lib/format";
import type { Profile, Quote } from "@/lib/types";

const DAY = 86_400_000;

/** Fecha del último contacto con el cliente sobre esta cotización */
const lastTouch = (q: Quote) => new Date(q.followed_up_at ?? q.sent_at ?? q.created_at);

export default function FollowUpPage() {
  const sb = createClient();
  const { profile, setProfile } = useBusiness();
  const days = profile.followup_days ?? 3;
  const [tab, setTab] = useState<"seguir" | "esperando" | "vencen">("seguir");
  const { data, loading, setData } = useAsync(
    async () =>
      must(
        await sb
          .from("quotes")
          .select("*, clients(id, name, phone, email, address), quote_items(description, quantity)")
          .eq("status", "enviada")
          .order("created_at", { ascending: true }),
      ) as Quote[],
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups = useMemo(() => {
    const open = (data ?? []).filter((q) => !q.valid_until || parseDate(q.valid_until)! >= today);
    const now = Date.now();
    return {
      seguir: open.filter((q) => now - lastTouch(q).getTime() >= days * DAY),
      esperando: open.filter((q) => now - lastTouch(q).getTime() < days * DAY),
      vencen: open.filter((q) => q.valid_until && parseDate(q.valid_until)!.getTime() - today.getTime() <= 3 * DAY),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, days]);

  const list = groups[tab];
  const pendingValue = groups.seguir.reduce((a, q) => a + Number(q.total), 0);

  async function patch(q: Quote, values: Partial<Quote>, msg?: string) {
    const { error } = await sb.from("quotes").update(values).eq("id", q.id);
    if (error) return toast.error(error.message);
    if (values.status && values.status !== "enviada") setData((d) => (d ?? []).filter((x) => x.id !== q.id));
    else setData((d) => (d ?? []).map((x) => (x.id === q.id ? { ...x, ...values } : x)));
    if (msg) toast.success(msg);
  }

  function followUp(q: Quote) {
    const name = (q.clients?.name ?? "").split(" ")[0];
    const text = renderTemplate(getTemplate(profile, "seguimiento_cotizacion"), {
      cliente: name,
      folio: folio("C", q.folio),
      total: money(q.total),
      titulo: q.title ? ` de "${q.title}"` : "",
      vigencia: q.valid_until ? dateLong(q.valid_until) : "",
      enlace: q.share_enabled !== false ? `${siteUrl()}/c/${q.public_token}` : "",
      fecha: q.event_date ? dateLong(q.event_date) : "",
      negocio: profile.business_name,
      tu_nombre: profile.owner_name ?? profile.business_name,
    });
    window.open(waLink(q.clients?.phone, text), "_blank", "noopener");
    patch(q, { followed_up_at: new Date().toISOString(), follow_up_count: (q.follow_up_count ?? 0) + 1 }, "Seguimiento registrado 💌");
  }

  async function changeDays(v: number) {
    const { data: p, error } = await sb.from("profiles").update({ followup_days: v }).eq("id", profile.id).select().single();
    if (error) return toast.error(error.message);
    setProfile(p as Profile);
    toast.success(`Te avisaremos a los ${v} días sin respuesta`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Que ninguna venta se enfríe"
        title="Cotizaciones por seguir"
        subtitle="Las cotizaciones enviadas que llevan días sin respuesta aparecen aquí con un mensaje amable listo para enviar por WhatsApp."
        actions={
          <Select aria-label="Días sin respuesta" value={days} onChange={(e) => changeDays(Number(e.target.value))} className="w-auto">
            {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
              <option key={d} value={d}>
                Avisarme a los {d} {d === 1 ? "día" : "días"}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Por seguir" value={groups.seguir.length} icon={<BellRing />} tone="rose" hint={`${days}+ días sin respuesta`} />
        <StatCard label="En juego" value={money(pendingValue)} icon={<CalendarClock />} tone="mint" hint="Valor de las cotizaciones por seguir" />
        <div className="col-span-2 lg:col-span-1">
          <StatCard label="Vencen pronto" value={groups.vencen.length} icon={<Clock />} tone="cream" hint="En los próximos 3 días" />
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        options={[
          { value: "seguir", label: "Por seguir", count: groups.seguir.length },
          { value: "esperando", label: "Esperando respuesta", count: groups.esperando.length },
          { value: "vencen", label: "Vencen pronto", count: groups.vencen.length },
        ]}
      />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Check className="h-8 w-8" />}
            title={tab === "seguir" ? "¡Todo al día!" : "Nada por aquí"}
            description={tab === "seguir" ? "No tienes cotizaciones esperando seguimiento. Cuando envíes una y pasen los días sin respuesta, aparecerá aquí." : undefined}
          />
        ) : (
          <ul className="divide-y divide-cocoa-800/5">
            {list.map((q) => {
              const waited = Math.floor((Date.now() - lastTouch(q).getTime()) / DAY);
              return (
                <li key={q.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
                  <Link href={`/dashboard/cotizaciones/${q.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-cocoa-300">{folio("C", q.folio)}</span>
                      <Badge tone={waited >= days ? "warning" : "neutral"}>
                        {waited === 0 ? "Hoy" : `Hace ${waited} ${waited === 1 ? "día" : "días"}`}
                      </Badge>
                      {(q.follow_up_count ?? 0) > 0 && <Badge tone="info">{q.follow_up_count} seguimiento{q.follow_up_count === 1 ? "" : "s"}</Badge>}
                    </div>
                    <p className="mt-1 truncate font-semibold text-cocoa-700">
                      {q.clients?.name ?? "Sin cliente"}
                      {q.title && <span className="font-normal text-cocoa-400"> · {q.title}</span>}
                    </p>
                    <p className="text-xs text-cocoa-400">
                      {money(q.total)}
                      {q.event_date && <> · Evento {date(q.event_date)}</>}
                      {q.valid_until && <> · Vigente hasta {date(q.valid_until)}</>}
                    </p>
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="mint" onClick={() => followUp(q)} disabled={!q.clients?.phone} title={q.clients?.phone ? "" : "El cliente no tiene WhatsApp"}>
                      <MessageCircle className="h-4 w-4" /> Dar seguimiento
                    </Button>
                    <Button size="sm" variant="ghost" title="Posponer" onClick={() => patch(q, { followed_up_at: new Date().toISOString() }, `Te la recordamos en ${days} días`)}>
                      <Moon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => patch(q, { status: "aceptada", accepted_at: new Date().toISOString() }, "¡Cotización aceptada! 🎉")}>
                      <Check className="h-4 w-4" /> Aceptó
                    </Button>
                    <Button size="sm" variant="danger" title="No le interesó" onClick={() => patch(q, { status: "rechazada" }, "Marcada como rechazada")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <p className="mt-4 text-center text-xs text-cocoa-400">
        Edita el mensaje de seguimiento en <Link href="/dashboard/mensajes" className="font-semibold text-rose-500 hover:underline">Mensajes</Link>.
      </p>
    </>
  );
}
