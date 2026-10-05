"use client";
import { useState } from "react";
import { Bug, CheckCircle2, DatabaseBackup, Download, Loader2, RotateCcw, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";

type AppError = {
  id: string;
  source: "cliente" | "servidor";
  message: string;
  stack: string | null;
  path: string | null;
  user_id: string | null;
  user_agent: string | null;
  count: number;
  first_seen: string;
  last_seen: string;
  resolved: boolean;
};
type Backup = { name: string; size: number; created_at?: string };

const when = (iso: string) => new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export default function AdminErrorsPage() {
  const { profile } = useBusiness();
  const sb = createClient();
  const [tab, setTab] = useState<"abiertos" | "resueltos">("abiertos");
  const [open, setOpen] = useState<string | null>(null);
  const errorsQ = useAsync(async () => must(await sb.from("app_errors").select("*").order("last_seen", { ascending: false }).limit(200)) as AppError[]);
  const backupsQ = useAsync(async () => {
    const r = await fetch("/api/admin/respaldos").then((x) => x.json());
    if (!r.ok) throw new Error(r.error ?? "No se pudieron cargar los respaldos");
    return r.files as Backup[];
  });
  const [downloading, setDownloading] = useState<string | null>(null);

  if (profile.role !== "admin") return <EmptyState icon={<ShieldOff className="h-8 w-8" />} title="Solo para administración" />;

  const list = (errorsQ.data ?? []).filter((e) => (tab === "abiertos" ? !e.resolved : e.resolved));
  const openCount = (errorsQ.data ?? []).filter((e) => !e.resolved).length;

  async function setResolved(e: AppError, resolved: boolean) {
    const { error } = await sb.from("app_errors").update({ resolved }).eq("id", e.id);
    if (error) return toast.error(error.message);
    errorsQ.setData((x) => (x ?? []).map((y) => (y.id === e.id ? { ...y, resolved } : y)));
  }
  async function remove(e: AppError) {
    const { error } = await sb.from("app_errors").delete().eq("id", e.id);
    if (error) return toast.error(error.message);
    errorsQ.setData((x) => (x ?? []).filter((y) => y.id !== e.id));
  }
  async function download(name: string) {
    setDownloading(name);
    const r = await fetch(`/api/admin/respaldos?file=${encodeURIComponent(name)}`).then((x) => x.json()).catch(() => null);
    setDownloading(null);
    if (!r?.ok) return toast.error(r?.error ?? "No se pudo descargar");
    window.location.href = r.url;
  }

  return (
    <>
      <PageHeader eyebrow="Administración" title="Errores y respaldos" subtitle="Lo que falla en la app (en el navegador de tus clientas o en el servidor) y los respaldos diarios de la base de datos." />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <CardHeader
            title={<span className="flex items-center gap-2"><Bug className="h-5 w-5 text-rose-400" /> Errores</span>}
            subtitle="Se agrupan los iguales. Márcalo como resuelto cuando lo arregles; si vuelve a pasar, se reabre solo."
            action={<Tabs value={tab} onChange={setTab} options={[{ value: "abiertos", label: `Abiertos${openCount ? ` (${openCount})` : ""}` }, { value: "resueltos", label: "Resueltos" }]} />}
          />
          {errorsQ.loading ? (
            <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : errorsQ.error ? (
            <p className="p-5 text-sm text-rose-600">Falta ejecutar la migración 0014 en Supabase.</p>
          ) : list.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title={tab === "abiertos" ? "Sin errores pendientes 🎉" : "Nada resuelto todavía"} />
          ) : (
            <ul className="divide-y divide-cocoa-800/5">
              {list.map((e) => (
                <li key={e.id} className="p-4">
                  <button onClick={() => setOpen(open === e.id ? null : e.id)} className="w-full text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={e.source === "servidor" ? "danger" : "neutral"}>{e.source}</Badge>
                      <span className="text-xs text-cocoa-400">{e.count}× · última vez {when(e.last_seen)}</span>
                    </div>
                    <p className="mt-1.5 font-mono text-sm break-words text-cocoa-700">{e.message}</p>
                    {e.path && <p className="mt-0.5 text-xs text-cocoa-400">{e.path}</p>}
                  </button>
                  {open === e.id && (
                    <div className="mt-3 space-y-2">
                      {e.stack && <pre className="max-h-64 overflow-auto rounded-xl bg-cocoa-800 p-3 text-[11px] leading-relaxed text-cream-100">{e.stack}</pre>}
                      <p className="text-xs text-cocoa-400">Primera vez {when(e.first_seen)}{e.user_agent ? ` · ${e.user_agent}` : ""}{e.user_id ? ` · usuaria ${e.user_id.slice(0, 8)}` : ""}</p>
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    {e.resolved ? (
                      <Button size="sm" variant="ghost" onClick={() => setResolved(e, false)}><RotateCcw className="h-4 w-4" /> Reabrir</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setResolved(e, true)}><CheckCircle2 className="h-4 w-4" /> Resuelto</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(e)}><Trash2 className="h-4 w-4" /> Borrar</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title={<span className="flex items-center gap-2"><DatabaseBackup className="h-5 w-5 text-mint-500" /> Respaldos diarios</span>} subtitle="Se guardan los últimos 14 días. Cada uno trae todas las tablas en un archivo .json.gz." />
          {backupsQ.loading ? (
            <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : backupsQ.error ? (
            <p className="p-5 text-sm text-rose-600">{backupsQ.error}</p>
          ) : !backupsQ.data?.length ? (
            <p className="p-5 text-sm text-cocoa-400">Aún no hay respaldos. Se crean cada madrugada (revisa que esté programado el respaldo en cron_setup.sql).</p>
          ) : (
            <ul className="divide-y divide-cocoa-800/5">
              {backupsQ.data.map((b, i) => (
                <li key={b.name} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className={cn("font-semibold text-cocoa-700", i === 0 && "text-mint-700")}>{b.name.slice(0, 10).split("-").reverse().join("/")}</p>
                    <p className="text-xs text-cocoa-400">{Math.max(1, Math.round(b.size / 1024))} KB</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => download(b.name)} disabled={downloading === b.name}>
                    {downloading === b.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Descargar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
