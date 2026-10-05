"use client";
import { useState } from "react";
import { Copy, KeyRound, MonitorSmartphone, Plus, ShieldCheck, ShieldOff, Unplug } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsync, must } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { date } from "@/lib/format";

type Row = {
  id: string;
  code: string;
  status: "disponible" | "activa" | "suspendida";
  email: string | null;
  business_name: string | null;
  holder_name: string | null;
  notes: string | null;
  expires_at: string | null;
  session_device: string | null;
  session_seen_at: string | null;
  has_session: boolean;
  activated_at: string | null;
  created_at: string;
};

export default function LicensesPage() {
  const { profile } = useBusiness();
  const confirm = useConfirm();
  const sb = createClient();
  const { data, loading, reload } = useAsync(async () => must(await sb.rpc("admin_list_licenses")) as Row[]);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"todas" | Row["status"]>("todas");

  if (profile.role !== "admin")
    return <EmptyState icon={<ShieldOff className="h-8 w-8" />} title="Solo para administración" />;

  async function generate() {
    setBusy(true);
    const { data: created, error } = await sb.rpc("admin_generate_licenses", {
      p_count: count,
      p_notes: notes || null,
      p_expires: expires ? new Date(expires + "T23:59:59").toISOString() : null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    const codes = (created as Row[]).map((r) => r.code).join("\n");
    await navigator.clipboard?.writeText(codes).catch(() => {});
    toast.success(`${(created as Row[]).length} licencia(s) generadas y copiadas`);
    setOpen(false);
    setNotes("");
    reload();
  }

  async function update(id: string, patch: Record<string, unknown>, msg: string) {
    const { error } = await sb.from("licenses").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(msg);
    reload();
  }

  const rows = (data ?? []).filter((r) => filter === "todas" || r.status === filter);
  const stats = {
    total: data?.length ?? 0,
    activa: data?.filter((r) => r.status === "activa").length ?? 0,
    disponible: data?.filter((r) => r.status === "disponible").length ?? 0,
    online: data?.filter((r) => r.has_session).length ?? 0,
  };

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Licencias"
        subtitle="Genera códigos de acceso. Cada licencia se liga a una sola cuenta y funciona en un dispositivo a la vez."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Generar licencias
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<KeyRound className="h-5 w-5" />} tone="cocoa" />
        <StatCard label="Activas" value={stats.activa} icon={<ShieldCheck className="h-5 w-5" />} tone="mint" />
        <StatCard label="Disponibles" value={stats.disponible} icon={<KeyRound className="h-5 w-5" />} tone="rose" />
        <StatCard label="Con sesión" value={stats.online} icon={<MonitorSmartphone className="h-5 w-5" />} tone="cream" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex gap-2 overflow-x-auto p-4 scrollbar-none">
          {(["todas", "disponible", "activa", "suspendida"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${filter === f ? "bg-cocoa-800 text-cream-100" : "bg-cream-200 text-cocoa-500"}`}
            >
              {f}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<KeyRound className="h-8 w-8" />} title="Sin licencias" description="Genera tu primer código para compartirlo con una nueva usuaria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[880px]">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Usuario</th>
                  <th>Dispositivo</th>
                  <th>Vence</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <button
                        className="flex items-center gap-2 font-mono text-[13px] font-semibold text-cocoa-700 hover:text-rose-500"
                        onClick={() => navigator.clipboard.writeText(r.code).then(() => toast.success("Código copiado"))}
                      >
                        {r.code} <Copy className="h-3.5 w-3.5 opacity-50" />
                      </button>
                      {r.notes && <p className="text-xs text-cocoa-400">{r.notes}</p>}
                    </td>
                    <td>
                      <Badge tone={r.status === "activa" ? "success" : r.status === "disponible" ? "info" : "danger"}>{r.status}</Badge>
                    </td>
                    <td>
                      {r.email ? (
                        <>
                          <p className="font-semibold">{r.business_name}</p>
                          <p className="text-xs text-cocoa-400">{r.email}</p>
                        </>
                      ) : (
                        <span className="text-cocoa-300">—</span>
                      )}
                    </td>
                    <td>
                      {r.has_session ? (
                        <>
                          <p className="flex items-center gap-1.5 text-[13px]">
                            <span className="h-2 w-2 rounded-full bg-mint-400" /> {r.session_device ?? "Dispositivo"}
                          </p>
                          <p className="text-xs text-cocoa-400">Visto {date(r.session_seen_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                        </>
                      ) : (
                        <span className="text-cocoa-300">Sin sesión</span>
                      )}
                    </td>
                    <td className="text-[13px]">{r.expires_at ? date(r.expires_at) : "Sin vencimiento"}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {r.has_session && (
                          <Button size="sm" variant="ghost" title="Liberar dispositivo" onClick={() => update(r.id, { active_session: null }, "Dispositivo liberado")}>
                            <Unplug className="h-4 w-4" />
                          </Button>
                        )}
                        {r.status === "activa" && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () =>
                              (await confirm({ title: "¿Suspender licencia?", message: "La usuaria no podrá entrar a su panel hasta que la reactives.", confirmText: "Suspender", danger: true })) &&
                              update(r.id, { status: "suspendida", active_session: null }, "Licencia suspendida")
                            }
                          >
                            Suspender
                          </Button>
                        )}
                        {r.status === "suspendida" && (
                          <Button size="sm" variant="mint" onClick={() => update(r.id, { status: r.email ? "activa" : "disponible" }, "Licencia reactivada")}>
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Generar licencias"
        description="Los códigos se copian automáticamente al portapapeles."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={generate} loading={busy}>
              Generar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Cantidad" type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          <Input label="Nota (opcional)" placeholder="Ej. Venta a Repostería Luna" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Input label="Vence el (opcional)" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} hint="Déjalo vacío para una licencia de por vida." />
        </div>
      </Modal>
    </>
  );
}
