"use client";
import { useState } from "react";
import { Building2, Calculator, FileText, KeyRound, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { must, useAsync } from "@/hooks/useAsync";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { date } from "@/lib/format";
import type { Profile } from "@/lib/types";

export default function SettingsPage() {
  const sb = createClient();
  const { profile, setProfile } = useBusiness();
  const [p, setP] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const license = useAsync(async () => must(await sb.from("licenses").select("code, status, activated_at, expires_at, session_device").eq("user_id", profile.id).maybeSingle()) as { code: string; status: string; activated_at: string | null; expires_at: string | null; session_device: string | null } | null);

  const set = <K extends keyof Profile>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP({ ...p, [k]: e.target.value });

  async function save() {
    setSaving(true);
    const payload = {
      business_name: p.business_name || "Mi repostería",
      owner_name: p.owner_name,
      phone: p.phone,
      whatsapp: p.whatsapp,
      email: p.email,
      address: p.address,
      instagram: p.instagram,
      logo_url: p.logo_url,
      default_profit_pct: Number(p.default_profit_pct) || 0,
      default_wear_pct: Number(p.default_wear_pct) || 0,
      iva_pct: Number(p.iva_pct) || 0,
      card_fee_pct: Number(p.card_fee_pct) || 0,
      quote_validity_days: Number(p.quote_validity_days) || 15,
      quote_terms: p.quote_terms,
      bank_info: p.bank_info,
    };
    const { data, error } = await sb.from("profiles").update(payload).eq("id", profile.id).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setProfile(data as Profile);
    setP(data as Profile);
    toast.success("Ajustes guardados");
  }

  return (
    <>
      <PageHeader
        eyebrow="Tu negocio"
        title="Ajustes"
        subtitle="Estos datos aparecen en tus cotizaciones, notas de pedido y tienda en línea."
        actions={<Button onClick={save} loading={saving}><Save className="h-4 w-4" /> Guardar</Button>}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Datos del negocio" icon={<Building2 className="h-5 w-5" />} />
            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[180px_1fr]">
              <div>
                <label className="label">Logotipo</label>
                <ImagePicker value={p.logo_url} onChange={(v) => setP({ ...p, logo_url: v })} folder="logo" aspect="aspect-square" fit="contain" label="Subir logo" />
                <p className="mt-2 text-xs text-cocoa-400">PNG con fondo transparente se ve mejor en el PDF.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nombre del negocio" value={p.business_name} onChange={set("business_name")} />
                <Input label="Tu nombre" value={p.owner_name ?? ""} onChange={set("owner_name")} />
                <Input label="WhatsApp del negocio" type="tel" value={p.whatsapp ?? ""} onChange={set("whatsapp")} hint="Aquí te llegan los pedidos de tu tienda" />
                <Input label="Teléfono" type="tel" value={p.phone ?? ""} onChange={set("phone")} />
                <Input label="Correo" type="email" value={p.email ?? ""} onChange={set("email")} />
                <Input label="Instagram" value={p.instagram ?? ""} onChange={set("instagram")} prefix="@" />
                <Input className="sm:col-span-2" label="Dirección" value={p.address ?? ""} onChange={set("address")} />
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Cotizaciones" icon={<FileText className="h-5 w-5" />} />
            <div className="grid gap-4 p-5 sm:p-6">
              <Input label="Vigencia por defecto (días)" type="number" min={1} value={p.quote_validity_days} onChange={set("quote_validity_days")} className="sm:max-w-xs" />
              <Textarea label="Términos y condiciones por defecto" rows={4} value={p.quote_terms ?? ""} onChange={set("quote_terms")} />
              <Textarea label="Datos bancarios para pago" rows={3} value={p.bank_info ?? ""} onChange={set("bank_info")} placeholder={"Banco: BBVA\nCLABE: 0123 4567 8901 2345 67\nA nombre de: Berenice Álvarez"} />
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-8">
          <Card>
            <CardHeader title="Costeo por defecto" icon={<Calculator className="h-5 w-5" />} />
            <div className="grid grid-cols-2 gap-4 p-5 sm:p-6">
              <Input label="% Ganancia" type="number" value={p.default_profit_pct} onChange={set("default_profit_pct")} suffix="%" />
              <Input label="% Desgaste" type="number" value={p.default_wear_pct} onChange={set("default_wear_pct")} suffix="%" />
              <Input label="% IVA" type="number" value={p.iva_pct} onChange={set("iva_pct")} suffix="%" />
              <Input label="% Tarjeta" type="number" value={p.card_fee_pct} onChange={set("card_fee_pct")} suffix="%" />
              <p className="col-span-2 text-xs text-cocoa-400">Los % de ganancia y desgaste se usan al crear postres nuevos. IVA y tarjeta aplican en todo el recetario.</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="Tu licencia" icon={<KeyRound className="h-5 w-5" />} />
            <div className="space-y-2 p-5 text-sm sm:p-6">
              {profile.role === "admin" ? (
                <Badge tone="rose">Administradora</Badge>
              ) : license.data ? (
                <>
                  <p className="font-mono font-semibold tracking-wider text-cocoa-700">{license.data.code}</p>
                  <Badge tone={license.data.status === "activa" ? "success" : "danger"}>{license.data.status}</Badge>
                  <p className="text-cocoa-500">Activada: {date(license.data.activated_at)}</p>
                  <p className="text-cocoa-500">Vence: {license.data.expires_at ? date(license.data.expires_at) : "Sin vencimiento"}</p>
                  <p className="text-cocoa-500">Dispositivo: {license.data.session_device ?? "—"}</p>
                </>
              ) : (
                <p className="text-cocoa-400">Cargando…</p>
              )}
              <p className="pt-2 text-xs text-cocoa-400">Tu licencia funciona en un dispositivo a la vez. Si entras desde otro, este se cerrará.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
