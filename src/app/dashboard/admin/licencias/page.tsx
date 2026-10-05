"use client";
import { useState } from "react";
import { Copy, KeyRound, MonitorSmartphone, Plus, RefreshCw, ShieldCheck, ShieldOff, Unplug } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsync, must } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/Confirm";
import { date, money, money0 } from "@/lib/format";
import { BILLING_LABEL, PLANS, planName, type Billing, type PlanId } from "@/lib/plans";

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
  plan: PlanId;
  billing: Billing;
  term_days: number | null;
  price: number;
  paid_total: number;
};

const priceOf = (plan: PlanId, billing: Billing) => PLANS.find((p) => p.id === plan)?.prices[billing] ?? 0;

export default function LicensesPage() {
  const { profile } = useBusiness();
  const confirm = useConfirm();
  const sb = createClient();
  const { data, loading, reload } = useAsync(async () => must(await sb.rpc("admin_list_licenses")) as Row[]);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [expires, setExpires] = useState("");
  const [plan, setPlan] = useState<PlanId>("profesional");
  const [billing, setBilling] = useState<Billing>("mensual");
  const [price, setPrice] = useState<string>(String(priceOf("profesional", "mensual")));
  const [renew, setRenew] = useState<Row | null>(null);
  const [renewAmount, setRenewAmount] = useState("");
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
      p_plan: plan,
      p_billing: billing,
      p_price: Number(price) || 0,
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

  async function doRenew() {
    if (!renew) return;
    setBusy(true);
    const { error } = await sb.rpc("admin_renew_license", { p_id: renew.id, p_amount: Number(renewAmount) || 0, p_note: null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Licencia renovada (${BILLING_LABEL[renew.billing].toLowerCase()}) 💕`);
    setRenew(null);
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
            <table className="table-base min-w-[1040px]">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Plan</th>
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
                      <select
                        className="rounded-lg border border-cocoa-800/10 bg-cream-50 px-2 py-1 text-[13px] font-semibold text-cocoa-700"
                        value={r.plan}
                        onChange={(e) => update(r.id, { plan: e.target.value }, `Plan cambiado a ${planName(e.target.value as PlanId)}`)}
                        aria-label="Plan"
                      >
                        {PLANS.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <p className="mt-0.5 text-xs text-cocoa-400">
                        {BILLING_LABEL[r.billing]}{Number(r.paid_total) > 0 && ` · ${money0(r.paid_total)}`}
                      </p>
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
                    <td className="text-[13px]">
                      {r.expires_at ? (
                        <span className={new Date(r.expires_at) < new Date() ? "font-bold text-rose-600" : ""}>{date(r.expires_at)}</span>
                      ) : r.term_days && r.status === "disponible" ? (
                        <span className="text-cocoa-400">{r.term_days} días al activarse</span>
                      ) : (
                        "De por vida"
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {r.billing !== "vitalicia" && r.status === "activa" && (
                          <Button
                            size="sm"
                            variant="mint"
                            title="Renovar"
                            onClick={() => {
                              setRenew(r);
                              setRenewAmount(String(priceOf(r.plan, r.billing) ?? ""));
                            }}
                          >
                            <RefreshCw className="h-4 w-4" /> Renovar
                          </Button>
                        )}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Plan"
              value={plan}
              onChange={(e) => {
                const v = e.target.value as PlanId;
                setPlan(v);
                const b = PLANS.find((p) => p.id === v)!.prices[billing] == null ? "anual" : billing;
                setBilling(b);
                setPrice(String(priceOf(v, b) ?? 0));
              }}
            >
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Select
              label="Periodo"
              value={billing}
              onChange={(e) => {
                const b = e.target.value as Billing;
                setBilling(b);
                setPrice(String(priceOf(plan, b) ?? 0));
              }}
            >
              {(Object.keys(BILLING_LABEL) as Billing[])
                .filter((b) => PLANS.find((p) => p.id === plan)!.prices[b] != null)
                .map((b) => (
                  <option key={b} value={b}>{BILLING_LABEL[b]}</option>
                ))}
            </Select>
            <Input label="Cantidad" type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            <Input label="Precio cobrado (c/u)" type="number" min={0} prefix="$" value={price} onChange={(e) => setPrice(e.target.value)} hint="Se suma a tus ingresos. Pon 0 si es de cortesía." />
          </div>
          <p className="rounded-2xl bg-cream-100 p-3 text-xs text-cocoa-500">
            {billing === "vitalicia"
              ? "Licencia de por vida: no vence."
              : `La vigencia (${billing === "mensual" ? "30" : "365"} días) empieza a contar cuando la usuaria activa su código. Para renovarla usa el botón “Renovar”.`}
          </p>
          <Input label="Nota (opcional)" placeholder="Ej. Venta a Repostería Luna" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Input label="Fecha límite para activar (opcional)" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} hint="Si no se activa antes de esta fecha, el código deja de funcionar." />
        </div>
      </Modal>

      <Modal
        open={!!renew}
        onClose={() => setRenew(null)}
        title="Renovar licencia"
        description={renew ? `${renew.business_name ?? renew.email ?? renew.code} · ${planName(renew.plan)} ${BILLING_LABEL[renew.billing].toLowerCase()}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenew(null)}>Cancelar</Button>
            <Button variant="mint" onClick={doRenew} loading={busy}>Renovar</Button>
          </>
        }
      >
        {renew && (
          <div className="space-y-4">
            <p className="text-sm text-cocoa-500">
              Se suma {renew.billing === "mensual" ? "1 mes" : "1 año"} a partir de {renew.expires_at && new Date(renew.expires_at) > new Date() ? `su vencimiento actual (${date(renew.expires_at)})` : "hoy"}.
            </p>
            <Input label="Monto cobrado" type="number" min={0} prefix="$" value={renewAmount} onChange={(e) => setRenewAmount(e.target.value)} hint={`Pagado hasta hoy: ${money(renew.paid_total)}`} />
          </div>
        )}
      </Modal>
    </>
  );
}
