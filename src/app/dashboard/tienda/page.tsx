"use client";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, Eye, EyeOff, Save, Store, Truck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCatalog } from "@/hooks/useCatalog";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, CardHeader, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Textarea, Toggle } from "@/components/ui/Field";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { priceFor } from "@/components/dashboard/LineItemsEditor";
import { money, siteUrl, slugify } from "@/lib/format";
import type { Dessert, Profile } from "@/lib/types";

export default function StoreSettingsPage() {
  const sb = createClient();
  const { profile, setProfile } = useBusiness();
  const catalog = useCatalog();
  const [p, setP] = useState<Profile>({ ...profile, store_slug: profile.store_slug ?? slugify(profile.business_name) });
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState<string>("");
  const url = `${siteUrl()}/tienda/${p.store_slug}`;

  useEffect(() => {
    if (p.store_slug) QRCode.toDataURL(url, { margin: 1, width: 480, color: { dark: "#5a3512", light: "#fffaef" } }).then(setQr);
  }, [url, p.store_slug]);

  const visible = useMemo(() => (catalog.data?.desserts ?? []).filter((d) => d.store_visible && d.active), [catalog.data]);

  async function save() {
    const slug = slugify(p.store_slug ?? "");
    if (!slug) return toast.error("Escribe la dirección de tu tienda");
    setSaving(true);
    const { data, error } = await sb
      .from("profiles")
      .update({
        store_slug: slug,
        store_enabled: p.store_enabled,
        store_title: p.store_title || null,
        store_description: p.store_description || null,
        store_banner_url: p.store_banner_url,
        store_min_notice_days: Number(p.store_min_notice_days) || 0,
        store_delivery: p.store_delivery,
        store_pickup: p.store_pickup,
        store_shipping_fee: Number(p.store_shipping_fee) || 0,
      })
      .eq("id", profile.id)
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "Esa dirección ya está ocupada, prueba otra" : error.message);
    setProfile(data as Profile);
    setP(data as Profile);
    toast.success(p.store_enabled ? "¡Tu tienda está en línea! 🎉" : "Cambios guardados");
  }

  async function toggleDessert(id: string, v: boolean) {
    const d = catalog.data?.desserts.find((x) => x.id === id);
    if (!d) return;
    const patch: Partial<Dessert> = { store_visible: v };
    if (v && d.sale_price == null) patch.sale_price = priceFor(d, catalog.costs.get(id));
    const { error } = await sb.from("desserts").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    catalog.setData((c) => (c ? { ...c, desserts: c.desserts.map((x) => (x.id === id ? { ...x, ...patch } : x)) } : c));
  }

  return (
    <>
      <PageHeader
        eyebrow="Vende en línea"
        title="Mi tienda"
        subtitle="Tu catálogo de postres en una página bonita. Tus clientes arman su pedido y te llega por WhatsApp y a tu panel."
        actions={
          <>
            {profile.store_enabled && profile.store_slug && <ButtonLink variant="outline" href={`${siteUrl()}/tienda/${profile.store_slug}`}><ExternalLink className="h-4 w-4" /> Ver tienda</ButtonLink>}
            <Button onClick={save} loading={saving}><Save className="h-4 w-4" /> Guardar</Button>
          </>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <Toggle checked={p.store_enabled} onChange={(v) => setP({ ...p, store_enabled: v })} label="Tienda publicada" description="Cuando está apagada nadie puede ver tu tienda." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Dirección de tu tienda</label>
                <div className="flex items-center overflow-hidden rounded-2xl border border-cocoa-800/10 bg-cream-50 focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-100">
                  <span className="hidden pl-4 text-sm whitespace-nowrap text-cocoa-400 sm:block">{siteUrl().replace(/^https?:\/\//, "")}/tienda/</span>
                  <input className="w-full bg-transparent px-4 py-2.5 outline-none sm:pl-0.5" value={p.store_slug ?? ""} onChange={(e) => setP({ ...p, store_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
                </div>
              </div>
              <Input label="Título" value={p.store_title ?? ""} onChange={(e) => setP({ ...p, store_title: e.target.value })} placeholder={p.business_name} />
              <Input label="Días mínimos de anticipación" type="number" min={0} value={p.store_min_notice_days} onChange={(e) => setP({ ...p, store_min_notice_days: e.target.value as unknown as number })} />
              <Textarea className="sm:col-span-2" label="Mensaje de bienvenida" rows={3} value={p.store_description ?? ""} onChange={(e) => setP({ ...p, store_description: e.target.value })} placeholder="Postres caseros hechos con amor para tus momentos especiales. Pedidos con 2 días de anticipación 💕" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Portada" subtitle="Una foto horizontal de tus postres (opcional)" />
            <div className="p-5 sm:p-6">
              <ImagePicker value={p.store_banner_url} onChange={(v) => setP({ ...p, store_banner_url: v })} folder="tienda" aspect="aspect-[3/1]" label="Subir portada" />
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Entrega</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Toggle checked={p.store_pickup} onChange={(v) => setP({ ...p, store_pickup: v })} label="Recoger en tienda" />
              <Toggle checked={p.store_delivery} onChange={(v) => setP({ ...p, store_delivery: v })} label="Envío a domicilio" />
              {p.store_delivery && <Input label="Costo de envío" type="number" min={0} prefix="$" value={p.store_shipping_fee} onChange={(e) => setP({ ...p, store_shipping_fee: e.target.value as unknown as number })} />}
            </div>
            {!p.whatsapp && <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">Agrega tu WhatsApp en Ajustes para recibir los pedidos de la tienda.</p>}
          </Card>
          <Card>
            <CardHeader title="Productos en tu tienda" subtitle={`${visible.length} visibles · usa el precio de venta de cada postre`} icon={<Store className="h-5 w-5" />} />
            <div className="p-3 sm:p-4">
              {catalog.loading ? (
                <Skeleton className="h-60" />
              ) : (
                <ul className="divide-y divide-cocoa-800/5">
                  {(catalog.data?.desserts ?? []).filter((d) => d.active).map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-2 py-2.5">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {d.image_url && <img src={d.image_url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-cocoa-700">{d.name}</p>
                        <p className="text-xs text-cocoa-400">{d.category} · {money(priceFor(d, catalog.costs.get(d.id)))} / {d.unit_label}</p>
                      </div>
                      <button onClick={() => toggleDessert(d.id, !d.store_visible)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${d.store_visible ? "bg-mint-100 text-mint-700" : "bg-cream-200 text-cocoa-400"}`}>
                        {d.store_visible ? <><Eye className="h-3.5 w-3.5" /> Visible</> : <><EyeOff className="h-3.5 w-3.5" /> Oculto</>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden lg:sticky lg:top-8">
          <div className="sprinkles bg-cream-200 p-6 text-center">
            <Badge tone={profile.store_enabled ? "success" : "neutral"}>{profile.store_enabled ? "En línea" : "Sin publicar"}</Badge>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr && <img src={qr} alt="Código QR de tu tienda" className="mx-auto mt-4 w-48 rounded-2xl shadow-soft" />}
            <p className="mt-4 font-script text-2xl text-rose-500">¡Compártela!</p>
            <p className="text-sm text-cocoa-500">Imprime el QR para tu mostrador o ponlo en tus cajas.</p>
          </div>
          <div className="space-y-2 p-5">
            <Button variant="secondary" className="w-full" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado"))}><Copy className="h-4 w-4" /> Copiar enlace</Button>
            {qr && <a href={qr} download={`QR-${p.store_slug}.png`} className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-cocoa-600 hover:bg-cocoa-800/5"><Download className="h-4 w-4" /> Descargar QR</a>}
            <p className="flex items-center justify-center gap-4 pt-2 text-xs text-cocoa-400">
              {p.store_pickup && <span className="flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> Recoger</span>}
              {p.store_delivery && <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Envío</span>}
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
