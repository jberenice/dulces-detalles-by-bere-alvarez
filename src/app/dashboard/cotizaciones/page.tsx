"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarHeart, Download, Eye, FileText, Mail, MessageCircle, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { useConfirm } from "@/components/ui/Confirm";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { downloadQuotePdf, shareLink } from "@/lib/documents";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput, matches } from "@/components/ui/SearchInput";
import { QUOTE_STATUS } from "@/lib/constants";
import { date, folio, money, parseDate, siteUrl } from "@/lib/format";
import type { Quote, QuoteStatus } from "@/lib/types";

export default function QuotesPage() {
  const sb = createClient();
  const [tab, setTab] = useState<"todas" | QuoteStatus>("todas");
  const [q, setQ] = useState("");
  const router = useRouter();
  const confirm = useConfirm();
  const { profile } = useBusiness();
  const { data, loading, setData } = useAsync(
    async () => must(await sb.from("quotes").select("*, clients(id, name, phone, email, address)").order("created_at", { ascending: false })) as Quote[],
  );

  async function run(fn: () => Promise<unknown>, ok?: string) {
    try {
      await fn();
      if (ok) toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(x: Quote) {
    if (!(await confirm({ title: `¿Eliminar la cotización ${folio("C", x.folio)}?`, message: "El enlace público dejará de funcionar.", confirmText: "Eliminar", danger: true }))) return;
    const { error } = await sb.from("quotes").delete().eq("id", x.id);
    if (error) return toast.error(error.message);
    setData((d) => (d ?? []).filter((q) => q.id !== x.id));
    toast.success("Cotización eliminada");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effective = (x: Quote): QuoteStatus =>
    (x.status === "enviada" || x.status === "borrador") && x.valid_until && parseDate(x.valid_until)! < today ? "vencida" : x.status;

  const list = (data ?? []).filter((x) => (tab === "todas" || effective(x) === tab) && matches(q, x.clients?.name, x.title, String(x.folio)));
  const count = (s: QuoteStatus) => (data ?? []).filter((x) => effective(x) === s).length;

  return (
    <>
      <PageHeader
        eyebrow="Endulza tus ventas"
        title="Cotizaciones"
        subtitle="Crea cotizaciones con tu marca en PDF y envíalas por WhatsApp o correo en un clic."
        actions={<ButtonLink href="/dashboard/cotizaciones/nueva"><Plus className="h-4 w-4" /> Nueva cotización</ButtonLink>}
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "todas", label: "Todas", count: data?.length ?? 0 },
            { value: "borrador", label: "Borrador", count: count("borrador") },
            { value: "enviada", label: "Enviadas", count: count("enviada") },
            { value: "aceptada", label: "Aceptadas", count: count("aceptada") },
            { value: "vencida", label: "Vencidas", count: count("vencida") },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Cliente, título o folio" className="lg:w-72" />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : list.length === 0 ? (
          <EmptyState icon={<FileText className="h-8 w-8" />} title="No hay cotizaciones aquí" description="Arma tu primera cotización en menos de un minuto." action={<ButtonLink href="/dashboard/cotizaciones/nueva"><Plus className="h-4 w-4" /> Cotizar</ButtonLink>} />
        ) : (
          <ul className="divide-y divide-cocoa-800/5">
            {list.map((x) => {
              const st = QUOTE_STATUS[effective(x)];
              const link = `${siteUrl()}/c/${x.public_token}`;
              return (
                <li key={x.id} className="flex items-center gap-2 pr-2 transition hover:bg-cream-100/70 sm:pr-4">
                  <Link href={`/dashboard/cotizaciones/${x.id}`} className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-4 sm:pl-6">
                    <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-500 sm:grid">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cocoa-300">{folio("C", x.folio)}</span>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <p className="mt-0.5 truncate font-semibold text-cocoa-700">{x.clients?.name ?? "Sin cliente"}{x.title ? <span className="font-normal text-cocoa-400"> · {x.title}</span> : null}</p>
                      <p className="flex items-center gap-1 text-xs text-cocoa-400">
                        {x.event_date ? <><CalendarHeart className="h-3 w-3" /> Evento {date(x.event_date)}</> : <>Creada {date(x.created_at)}</>}
                      </p>
                    </div>
                    <p className="font-display text-lg font-semibold text-cocoa-700 tabular-nums">{money(x.total)}</p>
                  </Link>
                  <ActionMenu
                    actions={[
                      { label: "Ver", icon: <Eye />, onClick: () => router.push(`/dashboard/cotizaciones/${x.id}`) },
                      { label: "Modificar", icon: <Pencil />, onClick: () => router.push(`/dashboard/cotizaciones/${x.id}/editar`) },
                      { label: "Descargar PDF", icon: <Download />, onClick: () => run(() => downloadQuotePdf(x.id, profile), "PDF descargado") },
                      { label: "Enviar por WhatsApp", icon: <MessageCircle />, onClick: () => router.push(`/dashboard/cotizaciones/${x.id}?enviar=whatsapp`) },
                      { label: "Enviar por correo", icon: <Mail />, onClick: () => router.push(`/dashboard/cotizaciones/${x.id}?enviar=correo`) },
                      { label: "Compartir enlace", icon: <Share2 />, hidden: x.share_enabled === false, onClick: () => run(async () => { if ((await shareLink(link, `Cotización ${folio("C", x.folio)}`)) === "copied") toast.success("Enlace copiado"); }) },
                      { label: "Eliminar", icon: <Trash2 />, danger: true, onClick: () => remove(x) },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
