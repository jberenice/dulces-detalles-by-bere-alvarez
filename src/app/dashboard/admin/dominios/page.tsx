"use client";
import { useState } from "react";
import { Copy, ExternalLink, Globe, Plus, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { useConfirm } from "@/components/ui/Confirm";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ROOT_DOMAIN, storeUrl } from "@/lib/domains";
import { date } from "@/lib/format";

type DomainRow = {
  id: string;
  domain: string;
  active: boolean;
  notes: string | null;
  created_at: string;
  user_id: string;
  profiles: { business_name: string; email: string | null; store_slug: string | null; store_enabled: boolean } | null;
};
type Store = { id: string; business_name: string; email: string | null; store_slug: string | null };

// Valores de DNS de Vercel. Cada proyecto puede mostrar los suyos en Settings → Domains;
// ✏️ si Vercel te da otros, ponlos en NEXT_PUBLIC_VERCEL_A y NEXT_PUBLIC_VERCEL_CNAME
const VERCEL_A = process.env.NEXT_PUBLIC_VERCEL_A || "76.76.21.21";
const VERCEL_CNAME = process.env.NEXT_PUBLIC_VERCEL_CNAME || "cname.vercel-dns.com";

export default function AdminDomainsPage() {
  const { profile } = useBusiness();
  const sb = createClient();
  const confirm = useConfirm();
  const { data, loading, reload } = useAsync(async () => {
    const [domains, stores] = await Promise.all([
      sb.from("store_domains").select("*, profiles(business_name, email, store_slug, store_enabled)").order("created_at", { ascending: false }),
      sb.from("profiles").select("id, business_name, email, store_slug").not("store_slug", "is", null).order("business_name"),
    ]);
    return { domains: must(domains) as DomainRow[], stores: must(stores) as Store[] };
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ domain: "", user_id: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState<DomainRow | null>(null);

  if (profile.role !== "admin") return <EmptyState icon={<ShieldOff className="h-8 w-8" />} title="Solo para administración" />;

  async function add() {
    if (!form.domain.trim() || !form.user_id) return toast.error("Escribe el dominio y elige la tienda");
    setBusy(true);
    const { data: row, error } = await sb.from("store_domains").insert({ domain: form.domain, user_id: form.user_id, notes: form.notes || null }).select("*, profiles(business_name, email, store_slug, store_enabled)").single();
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "Ese dominio ya está registrado" : error.code === "23514" ? "El dominio no es válido (ej. pasteleriaana.com)" : error.message);
    setOpen(false);
    setForm({ domain: "", user_id: "", notes: "" });
    reload();
    setGuide(row as DomainRow);
  }

  async function patch(id: string, values: Partial<DomainRow>, msg: string) {
    const { error } = await sb.from("store_domains").update(values).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(msg);
    reload();
  }

  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => toast.success("Copiado"));

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Dominios de tiendas"
        subtitle={`Cada tienda ya tiene su subdominio gratis (${ROOT_DOMAIN ? `tienda.${ROOT_DOMAIN}` : "configura NEXT_PUBLIC_ROOT_DOMAIN"}). Aquí conectas dominios propios como servicio extra.`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Conectar dominio
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader title="Dominios propios" subtitle="La tienda debe estar publicada y en plan Profesional o Premium" icon={<Globe className="h-5 w-5" />} />
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !data?.domains.length ? (
          <EmptyState icon={<Globe className="h-8 w-8" />} title="Aún no hay dominios propios" description="Cuando una clienta compre su dominio, conéctalo aquí y sigue la guía de configuración." />
        ) : (
          <ul className="mt-2 divide-y divide-cocoa-800/5">
            {data.domains.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-cocoa-700 hover:text-rose-500">
                      {d.domain} <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                    </a>
                    <Badge tone={d.active ? "success" : "neutral"}>{d.active ? "Activo" : "Pausado"}</Badge>
                    {d.profiles && !d.profiles.store_enabled && <Badge tone="warning">Tienda sin publicar</Badge>}
                  </div>
                  <p className="truncate text-xs text-cocoa-400">
                    {d.profiles?.business_name ?? "—"} · {d.profiles?.email} · desde {date(d.created_at)}
                    {d.notes && ` · ${d.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setGuide(d)}>Guía DNS</Button>
                  <Toggle checked={d.active} onChange={(v) => patch(d.id, { active: v }, v ? "Dominio activado" : "Dominio pausado")} />
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Eliminar"
                    onClick={async () =>
                      (await confirm({ title: `¿Quitar ${d.domain}?`, message: "La tienda seguirá funcionando en su subdominio. Quita también el dominio en Vercel.", confirmText: "Quitar", danger: true })) &&
                      sb.from("store_domains").delete().eq("id", d.id).then(({ error }: { error: { message: string } | null }) => (error ? toast.error(error.message) : (toast.success("Dominio eliminado"), reload())))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Conectar dominio propio"
        description="Primero registra el dominio aquí; después sigue la guía para agregarlo en Vercel y apuntarlo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={add} loading={busy}>Conectar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Dominio" placeholder="pasteleriaana.com" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} hint="Sin https:// ni www. Ambas versiones funcionarán." />
          <Select label="Tienda" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
            <option value="">Elige la tienda…</option>
            {(data?.stores ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.business_name} · {s.store_slug} {s.email ? `(${s.email})` : ""}
              </option>
            ))}
          </Select>
          <Input label="Nota (opcional)" placeholder="Ej. Pagó instalación $400 · renueva oct 2027" maxLength={200} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      <Modal open={!!guide} onClose={() => setGuide(null)} title={guide ? `Configurar ${guide.domain}` : ""} size="lg">
        {guide && (
          <div className="space-y-5 text-sm text-cocoa-600">
            <section>
              <p className="font-bold text-cocoa-700">1. En Vercel (lo haces tú)</p>
              <p className="mt-1">
                Tu proyecto → <b>Settings → Domains</b> → <b>Add Domain</b> → escribe <Code onCopy={copy}>{guide.domain}</Code> y acepta agregar también{" "}
                <Code onCopy={copy}>{`www.${guide.domain}`}</Code>. Vercel te mostrará los valores exactos de DNS; si son distintos a los de abajo, usa los de Vercel.
              </p>
            </section>
            <section>
              <p className="font-bold text-cocoa-700">2. En donde compró el dominio (Hostinger, GoDaddy…) → DNS</p>
              <p className="mt-1">Borra los registros A o CNAME que ya existan para @ y www, y agrega estos:</p>
              <div className="mt-2 overflow-x-auto rounded-2xl ring-1 ring-cocoa-800/10">
                <table className="table-base min-w-[480px]">
                  <thead>
                    <tr><th>Tipo</th><th>Nombre</th><th>Valor</th><th>TTL</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>A</td><td>@</td><td><Code onCopy={copy}>{VERCEL_A}</Code></td><td>3600</td></tr>
                    <tr><td>CNAME</td><td>www</td><td><Code onCopy={copy}>{VERCEL_CNAME}</Code></td><td>3600</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section>
              <p className="font-bold text-cocoa-700">3. Esperar</p>
              <p className="mt-1">
                Los cambios tardan de minutos a unas horas. Vercel pone el candado <b>https</b> solo. Prueba en{" "}
                <a href={`https://${guide.domain}`} target="_blank" rel="noopener noreferrer" className="font-bold text-rose-500 hover:underline">https://{guide.domain}</a>. Mientras tanto la tienda sigue en{" "}
                <span className="font-semibold">{storeUrl(guide.profiles?.store_slug)}</span>.
              </p>
            </section>
            <p className="rounded-2xl bg-cream-100 p-3 text-xs text-cocoa-500">
              Recomendación: que el dominio esté a nombre de tu clienta. Si deja de pagar el servicio, solo pausas el dominio aquí y lo quitas en Vercel.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}

function Code({ children, onCopy }: { children: string; onCopy: (t: string) => void }) {
  return (
    <button type="button" onClick={() => onCopy(children)} className="inline-flex items-center gap-1 rounded-lg bg-cream-200 px-2 py-0.5 font-mono text-[12.5px] font-semibold text-cocoa-700 hover:bg-rose-50">
      {children} <Copy className="h-3 w-3 opacity-50" />
    </button>
  );
}
