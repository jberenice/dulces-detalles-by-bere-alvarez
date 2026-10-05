"use client";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarOff,
  MapPin,
  Plus,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Monitor,
  Paintbrush,
  Save,
  Settings2,
  Smartphone,
  Star,
  Store,
  GalleryHorizontalEnd,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCatalog } from "@/hooks/useCatalog";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Textarea, Toggle } from "@/components/ui/Field";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { priceFor } from "@/components/dashboard/LineItemsEditor";
import { Storefront, type StoreData } from "@/components/store/Storefront";
import { date, money, siteUrl, slugify, toISODate } from "@/lib/format";
import { StoreQrCard } from "@/components/dashboard/StoreQrCard";
import { PRESETS, SECTION_LABELS, normalizeTheme, type StoreTheme } from "@/lib/storeTheme";
import { cn } from "@/lib/cn";
import type { DeliveryZone, Dessert, Profile } from "@/lib/types";

type Tab = "general" | "diseno" | "productos";

export default function StoreSettingsPage() {
  const sb = createClient();
  const { profile, setProfile } = useBusiness();
  const catalog = useCatalog();
  const [tab, setTab] = useState<Tab>("diseno");
  const [p, setP] = useState<Profile>({ ...profile, store_slug: profile.store_slug ?? slugify(profile.business_name) });
  const [theme, setTheme] = useState<StoreTheme>(() => normalizeTheme(profile.store_theme));
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<"movil" | "escritorio">("movil");
  const [bigPreview, setBigPreview] = useState(false);

  const [zones, setZones] = useState<DeliveryZone[]>(() => profile.store_zones ?? []);
  const [blocked, setBlocked] = useState<string[]>(() => profile.store_blocked_dates ?? []);
  const [newBlocked, setNewBlocked] = useState("");
  const todayIso = toISODate(new Date());
  const upcomingBlocked = useMemo(() => blocked.filter((d) => d >= todayIso).sort(), [blocked, todayIso]);

  const t = (patch: Partial<StoreTheme>) => setTheme((prev) => ({ ...prev, ...patch }));
  const setColor = (k: "primary" | "accent" | "background" | "surface" | "text", v: string) => t({ [k]: v, preset: "personalizado" } as Partial<StoreTheme>);

  const desserts = useMemo(
    () =>
      [...(catalog.data?.desserts ?? [])]
        .filter((d) => d.active)
        .sort((a, b) => (a.store_position ?? 0) - (b.store_position ?? 0) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [catalog.data],
  );
  const visible = desserts.filter((d) => d.store_visible);

  // Datos para la vista previa en vivo (con lo que aún no se guarda)
  const previewData: StoreData = useMemo(
    () => ({
      store: {
        slug: p.store_slug ?? "",
        title: p.store_title || p.business_name,
        business_name: p.business_name,
        description: p.store_description,
        banner_url: p.store_banner_url,
        logo_url: p.logo_url,
        whatsapp: p.whatsapp,
        instagram: p.instagram,
        facebook: p.facebook,
        address: p.address,
        min_notice_days: Number(p.store_min_notice_days) || 0,
        delivery: p.store_delivery,
        pickup: p.store_pickup,
        shipping_fee: Number(p.store_shipping_fee) || 0,
        theme,
        about: p.store_about,
        hours: p.store_hours,
        announcement: p.store_announcement,
        zones: zones.filter((z) => z.name.trim()).map((z) => ({ name: z.name.trim(), fee: Number(z.fee) || 0 })),
        today: todayIso,
        unavailable_dates: upcomingBlocked,
      },
      products: visible.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        description: d.description,
        image_url: d.image_url,
        unit_label: d.unit_label,
        price: priceFor(d, catalog.costs.get(d.id)),
        featured: !!d.store_featured,
        variants: d.variants ?? [],
        gallery: d.gallery ?? [],
        min_notice_days: d.min_notice_days ?? null,
      })),
    }),
    [p, theme, visible, catalog.costs, zones, upcomingBlocked, todayIso],
  );

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
        store_theme: normalizeTheme(theme),
        store_about: p.store_about || null,
        store_hours: p.store_hours || null,
        store_announcement: p.store_announcement || null,
        store_daily_capacity: p.store_daily_capacity ? Math.max(1, Math.min(200, Math.round(Number(p.store_daily_capacity)))) : null,
        store_blocked_dates: upcomingBlocked,
        store_zones: zones
          .map((z) => ({ name: z.name.trim().slice(0, 60), fee: Math.max(0, Number(z.fee) || 0) }))
          .filter((z, i, all) => z.name && all.findIndex((x) => x.name.toLowerCase() === z.name.toLowerCase()) === i)
          .slice(0, 30),
      })
      .eq("id", profile.id)
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "Esa dirección ya está ocupada, prueba otra" : error.message);
    setProfile(data as Profile);
    setP(data as Profile);
    setZones((data as Profile).store_zones ?? []);
    setBlocked((data as Profile).store_blocked_dates ?? []);
    toast.success(p.store_enabled ? "¡Tu tienda está en línea! 🎉" : "Cambios guardados");
  }

  async function patchDessert(id: string, patch: Partial<Dessert>) {
    const { error } = await sb.from("desserts").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    catalog.setData((c) => (c ? { ...c, desserts: c.desserts.map((x) => (x.id === id ? { ...x, ...patch } : x)) } : c));
  }

  async function toggleVisible(d: Dessert) {
    const patch: Partial<Dessert> = { store_visible: !d.store_visible };
    if (!d.store_visible && d.sale_price == null) patch.sale_price = priceFor(d, catalog.costs.get(d.id));
    await patchDessert(d.id, patch);
  }

  /** Mueve un producto y renumera el orden de todos para que quede guardado */
  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= desserts.length) return;
    const ordered = [...desserts];
    [ordered[index], ordered[j]] = [ordered[j], ordered[index]];
    const changes = ordered.map((d, i) => ({ id: d.id, pos: i })).filter((c) => (desserts.find((d) => d.id === c.id)?.store_position ?? -1) !== c.pos);
    catalog.setData((c) => (c ? { ...c, desserts: c.desserts.map((x) => ({ ...x, store_position: ordered.findIndex((o) => o.id === x.id) })) } : c));
    const results = await Promise.all(changes.map((c) => sb.from("desserts").update({ store_position: c.pos }).eq("id", c.id)));
    if (results.some((r: { error: unknown }) => r.error)) toast.error("No se pudo guardar el orden");
  }

  function moveSection(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= theme.sections.length) return;
    const s = [...theme.sections];
    [s[i], s[j]] = [s[j], s[i]];
    t({ sections: s });
  }

  const Option = ({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border-2 p-3 text-left transition",
        active ? "border-rose-400 bg-rose-50/60 shadow-soft" : "border-cocoa-800/8 bg-white hover:border-rose-200",
        className,
      )}
    >
      {children}
    </button>
  );

  const previewFrame = (width: string, height: string) => (
    <div className="mx-auto overflow-hidden rounded-[28px] border-[6px] border-cocoa-800 bg-cocoa-800 shadow-lift" style={{ width, maxWidth: "100%" }}>
      {/* translateZ crea un contenedor: los elementos "fixed" de la tienda quedan dentro del marco */}
      <div className="overflow-y-auto overscroll-contain bg-white" style={{ height, transform: "translateZ(0)" }}>
        <Storefront data={previewData} slug={p.store_slug ?? "vista-previa"} preview />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        eyebrow="Vende en línea"
        title="Mi tienda"
        subtitle="Diseña tu tienda a tu gusto: colores, letras, acomodo y secciones. Tus clientes arman su pedido y te llega por WhatsApp y a tu panel."
        actions={
          <>
            <Button variant="outline" className="xl:hidden" onClick={() => setBigPreview(true)}><Eye className="h-4 w-4" /> Vista previa</Button>
            {profile.store_enabled && profile.store_slug && <ButtonLink variant="outline" href={`${siteUrl()}/tienda/${profile.store_slug}`}><ExternalLink className="h-4 w-4" /> Ver tienda</ButtonLink>}
            <Button onClick={save} loading={saving}><Save className="h-4 w-4" /> Guardar</Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5"
        options={[
          { value: "diseno", label: <><Paintbrush className="h-4 w-4" /> Diseño</> },
          { value: "productos", label: <><Store className="h-4 w-4" /> Productos</>, count: visible.length },
          { value: "general", label: <><Settings2 className="h-4 w-4" /> General</> },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          {/* ---------------- DISEÑO ---------------- */}
          {tab === "diseno" && (
            <>
              <Card className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Paleta de colores</h3>
                <p className="text-sm text-cocoa-400">Elige una combinación lista o personaliza cada color.</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRESETS.map((pr) => (
                    <Option key={pr.id} active={theme.preset === pr.id} onClick={() => t({ ...pr.colors, preset: pr.id })}>
                      <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-cocoa-800/10">
                        {[pr.colors.background, pr.colors.primary, pr.colors.accent, pr.colors.text].map((c, i) => (
                          <span key={i} className="flex-1" style={{ background: c }} />
                        ))}
                      </div>
                      <p className="mt-2 text-xs font-bold text-cocoa-600">{pr.name}</p>
                    </Option>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(
                    [
                      ["primary", "Principal"],
                      ["accent", "Acento"],
                      ["background", "Fondo"],
                      ["surface", "Tarjetas"],
                      ["text", "Texto"],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k} className="block">
                      <span className="label">{label}</span>
                      <span className="flex items-center gap-2 rounded-2xl border border-cocoa-800/10 bg-cream-50 p-1.5 pr-3">
                        <input type="color" value={theme[k]} onChange={(e) => setColor(k, e.target.value)} className="h-9 w-9 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0" />
                        <span className="font-mono text-xs text-cocoa-500 uppercase">{theme[k]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Tipografía de títulos</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["elegante", "Elegante", "var(--font-display-serif)"],
                      ["romantica", "Romántica", "var(--font-dancing)"],
                      ["moderna", "Moderna", "var(--font-body)"],
                    ] as const
                  ).map(([id, label, family]) => (
                    <Option key={id} active={theme.font === id} onClick={() => t({ font: id })}>
                      <p className="text-2xl text-cocoa-700" style={{ fontFamily: family, fontWeight: 600 }}>Pastel de fresa</p>
                      <p className="mt-1 text-xs font-bold text-cocoa-400">{label}</p>
                    </Option>
                  ))}
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Portada</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["centrado", "Logo al centro", "Banner arriba y tu logo redondo al centro"],
                      ["portada", "Foto de portada", "Tu foto grande con el nombre encima"],
                      ["minimal", "Minimalista", "Logo pequeño y nombre, directo al catálogo"],
                    ] as const
                  ).map(([id, label, hint]) => (
                    <Option key={id} active={theme.hero === id} onClick={() => t({ hero: id })}>
                      <HeroSketch kind={id} />
                      <p className="mt-2 text-sm font-bold text-cocoa-700">{label}</p>
                      <p className="text-xs text-cocoa-400">{hint}</p>
                    </Option>
                  ))}
                </div>
                {theme.hero !== "minimal" && (
                  <div className="mt-5">
                    <label className="label">Foto de portada</label>
                    <ImagePicker value={p.store_banner_url} onChange={(v) => setP({ ...p, store_banner_url: v })} folder="tienda" aspect="aspect-[3/1]" label="Subir portada" />
                  </div>
                )}
              </Card>

              <Card className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Acomodo de productos</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["cuadricula", "Cuadrícula", LayoutGrid, "Tarjetas en columnas, el clásico"],
                      ["lista", "Lista", List, "Foto a un lado, ideal para menús largos"],
                      ["galeria", "Galería", GalleryHorizontalEnd, "Fotos grandes, para lucir tus postres"],
                    ] as const
                  ).map(([id, label, Icon, hint]) => (
                    <Option key={id} active={theme.layout === id} onClick={() => t({ layout: id })}>
                      <Icon className="h-6 w-6 text-rose-400" />
                      <p className="mt-2 text-sm font-bold text-cocoa-700">{label}</p>
                      <p className="text-xs text-cocoa-400">{hint}</p>
                    </Option>
                  ))}
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {theme.layout === "cuadricula" && (
                    <div>
                      <span className="label">Columnas en computadora</span>
                      <div className="grid grid-cols-2 gap-2">
                        {([2, 3] as const).map((n) => (
                          <Option key={n} active={theme.columns === n} onClick={() => t({ columns: n })} className="py-2 text-center text-sm font-bold text-cocoa-600">
                            {n} columnas
                          </Option>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="label">Esquinas</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          ["redondo", "Redondas", "rounded-2xl"],
                          ["suave", "Suaves", "rounded-lg"],
                          ["recto", "Rectas", "rounded-sm"],
                        ] as const
                      ).map(([id, label, r]) => (
                        <Option key={id} active={theme.radius === id} onClick={() => t({ radius: id })} className="py-2 text-center">
                          <span className={cn("mx-auto block h-6 w-10 border-2 border-cocoa-400", r)} />
                          <span className="mt-1 block text-[11px] font-bold text-cocoa-500">{label}</span>
                        </Option>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Secciones de tu tienda</h3>
                <p className="text-sm text-cocoa-400">Ordena con las flechas y oculta las que no quieras mostrar.</p>
                <ul className="mt-4 space-y-2">
                  {theme.sections.map((s, i) => (
                    <li key={s.id} className={cn("flex items-center gap-3 rounded-2xl p-3 ring-1 ring-cocoa-800/8", s.visible ? "bg-white" : "bg-cream-50 opacity-70")}>
                      <div className="flex flex-col">
                        <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="rounded-md p-0.5 text-cocoa-400 hover:text-rose-500 disabled:opacity-30" aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
                        <button onClick={() => moveSection(i, 1)} disabled={i === theme.sections.length - 1} className="rounded-md p-0.5 text-cocoa-400 hover:text-rose-500 disabled:opacity-30" aria-label="Bajar"><ArrowDown className="h-4 w-4" /></button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-cocoa-700">{SECTION_LABELS[s.id].label}</p>
                        <p className="text-xs text-cocoa-400">{SECTION_LABELS[s.id].hint}</p>
                      </div>
                      <Toggle checked={s.visible} onChange={(v) => t({ sections: theme.sections.map((x) => (x.id === s.id ? { ...x, visible: v } : x)) })} />
                    </li>
                  ))}
                </ul>
                <div className="mt-5 grid gap-4">
                  <Input label="Barra de aviso" maxLength={160} value={p.store_announcement ?? ""} onChange={(e) => setP({ ...p, store_announcement: e.target.value })} placeholder="🎉 Envío gratis en pedidos mayores a $800 · Pedidos con 2 días de anticipación" />
                  <Textarea label="Sobre nosotros" rows={4} maxLength={2000} value={p.store_about ?? ""} onChange={(e) => setP({ ...p, store_about: e.target.value })} placeholder="Desde 2018 horneamos postres caseros con ingredientes de calidad para tus momentos especiales…" />
                  <Textarea label="Horario y entregas" rows={3} maxLength={600} value={p.store_hours ?? ""} onChange={(e) => setP({ ...p, store_hours: e.target.value })} placeholder={"Lunes a sábado de 9:00 a 19:00\nEntregas en Chetumal y alrededores"} />
                </div>
              </Card>
            </>
          )}

          {/* ---------------- PRODUCTOS ---------------- */}
          {tab === "productos" && (
            <Card>
              <CardHeader title="Productos de tu tienda" subtitle="Muestra u oculta postres, marca tus favoritos con ★ y ordénalos con las flechas." icon={<Store className="h-5 w-5" />} />
              <div className="p-3 sm:p-4">
                {catalog.loading ? (
                  <Skeleton className="h-60" />
                ) : (
                  <ul className="divide-y divide-cocoa-800/5">
                    {desserts.map((d, i) => (
                      <li key={d.id} className={cn("flex items-center gap-2 px-1 py-2.5 sm:gap-3 sm:px-2", !d.store_visible && "opacity-60")}>
                        <div className="flex flex-col">
                          <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md p-0.5 text-cocoa-400 hover:text-rose-500 disabled:opacity-30" aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
                          <button onClick={() => move(i, 1)} disabled={i === desserts.length - 1} className="rounded-md p-0.5 text-cocoa-400 hover:text-rose-500 disabled:opacity-30" aria-label="Bajar"><ArrowDown className="h-4 w-4" /></button>
                        </div>
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {d.image_url && <img src={d.image_url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-cocoa-700">{d.name}</p>
                          <p className="truncate text-xs text-cocoa-400">{d.category} · {money(priceFor(d, catalog.costs.get(d.id)))} / {d.unit_label}</p>
                        </div>
                        <button
                          onClick={() => patchDessert(d.id, { store_featured: !d.store_featured })}
                          className={cn("grid h-9 w-9 place-items-center rounded-xl transition", d.store_featured ? "bg-amber-50 text-amber-500" : "text-cocoa-200 hover:text-amber-400")}
                          aria-label={d.store_featured ? "Quitar de favoritos" : "Marcar como favorito"}
                          title="Favorito (aparece en Destacados)"
                        >
                          <Star className={cn("h-5 w-5", d.store_featured && "fill-current")} />
                        </button>
                        <button onClick={() => toggleVisible(d)} className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold sm:px-3 ${d.store_visible ? "bg-mint-100 text-mint-700" : "bg-cream-200 text-cocoa-400"}`}>
                          {d.store_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          <span className="max-sm:hidden">{d.store_visible ? "Visible" : "Oculto"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}

          {/* ---------------- GENERAL ---------------- */}
          {tab === "general" && (
            <>
              <Card className="p-5 sm:p-6">
                <Toggle checked={p.store_enabled} onChange={(v) => setP({ ...p, store_enabled: v })} label="Tienda publicada" description="Cuando está apagada nadie puede ver tu tienda." />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label">Dirección de tu tienda</label>
                    <div className="flex items-center overflow-hidden rounded-2xl border border-cocoa-800/10 bg-cream-50 focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-100">
                      <span className="pl-4 text-sm whitespace-nowrap text-cocoa-400 max-sm:hidden">{siteUrl().replace(/^https?:\/\//, "")}/tienda/</span>
                      <input className="w-full bg-transparent px-4 py-2.5 outline-none sm:pl-0.5" value={p.store_slug ?? ""} onChange={(e) => setP({ ...p, store_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
                    </div>
                  </div>
                  <Input label="Título" value={p.store_title ?? ""} onChange={(e) => setP({ ...p, store_title: e.target.value })} placeholder={p.business_name} />
                  <Input label="Días mínimos de anticipación" type="number" min={0} value={p.store_min_notice_days} onChange={(e) => setP({ ...p, store_min_notice_days: e.target.value as unknown as number })} />
                  <Textarea className="sm:col-span-2" label="Mensaje de bienvenida" rows={3} value={p.store_description ?? ""} onChange={(e) => setP({ ...p, store_description: e.target.value })} placeholder="Postres caseros hechos con amor para tus momentos especiales 💕" />
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Entrega</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Toggle checked={p.store_pickup} onChange={(v) => setP({ ...p, store_pickup: v })} label="Recoger en tienda" />
                  <Toggle checked={p.store_delivery} onChange={(v) => setP({ ...p, store_delivery: v })} label="Envío a domicilio" />
                  {p.store_delivery && !zones.length && <Input label="Costo de envío" type="number" min={0} prefix="$" value={p.store_shipping_fee} onChange={(e) => setP({ ...p, store_shipping_fee: e.target.value as unknown as number })} hint="O cobra según la zona ↓" />}
                </div>
                {p.store_delivery && (
                  <div className="mt-6 border-t border-cocoa-800/5 pt-5">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-cocoa-700"><MapPin className="h-4 w-4 text-rose-400" /> Zonas de entrega</h4>
                    <p className="mt-0.5 text-xs text-cocoa-400">Tu cliente elige su zona y el envío se cobra solo. Ej. Centro $50 · Zona Hotelera $120. Si no agregas zonas se usa el costo de envío fijo.</p>
                    <div className="mt-3 space-y-2">
                      {zones.map((z, i) => (
                        <div key={i} className="grid grid-cols-[1fr_130px_36px] items-center gap-2">
                          <input className="field py-2" placeholder="Nombre de la zona" maxLength={60} value={z.name} onChange={(e) => setZones(zones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                          <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-cocoa-400">$</span>
                            <input className="field py-2 pl-7" type="number" min={0} step="any" value={z.fee} onChange={(e) => setZones(zones.map((x, j) => (j === i ? { ...x, fee: e.target.value as unknown as number } : x)))} />
                          </div>
                          <button type="button" onClick={() => setZones(zones.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-xl text-cocoa-300 hover:bg-rose-50 hover:text-rose-500" aria-label="Quitar zona"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                    {zones.length < 30 && (
                      <button type="button" onClick={() => setZones([...zones, { name: "", fee: 0 }])} className="mt-3 flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:text-rose-600">
                        <Plus className="h-4 w-4" /> Agregar zona
                      </button>
                    )}
                  </div>
                )}
                {!p.whatsapp && <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">Agrega tu WhatsApp en Ajustes para recibir los pedidos de la tienda.</p>}
              </Card>
              <Card className="p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold"><CalendarOff className="h-5 w-5 text-rose-400" /> Fechas y cupo</h3>
                <p className="text-sm text-cocoa-400">Evita que te pidan más de lo que puedes hornear: los días llenos se ven tachados en el calendario de tu tienda.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Pedidos máximos por día"
                    type="number"
                    min={1}
                    max={200}
                    placeholder="Sin límite"
                    value={p.store_daily_capacity ?? ""}
                    onChange={(e) => setP({ ...p, store_daily_capacity: e.target.value === "" ? null : (e.target.value as unknown as number) })}
                    hint="Cuenta todos tus pedidos del día (tienda y manuales), excepto cancelados."
                  />
                  <div>
                    <label className="label">Bloquear un día</label>
                    <div className="flex gap-2">
                      <input type="date" className="field" min={todayIso} value={newBlocked} onChange={(e) => setNewBlocked(e.target.value)} />
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (!newBlocked) return;
                          if (!blocked.includes(newBlocked)) setBlocked([...blocked, newBlocked]);
                          setNewBlocked("");
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-cocoa-400">Vacaciones, días con agenda llena o festivos.</p>
                  </div>
                </div>
                {upcomingBlocked.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {upcomingBlocked.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 rounded-full bg-rose-50 py-1 pr-1 pl-3 text-xs font-bold text-rose-600">
                        {date(d, { weekday: "short", day: "numeric", month: "short" })}
                        <button type="button" onClick={() => setBlocked(blocked.filter((x) => x !== d))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-rose-100" aria-label="Desbloquear">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Card>
              {profile.store_slug ? (
                <StoreQrCard url={`${siteUrl()}/tienda/${profile.store_slug}`} enabled={profile.store_enabled} slug={profile.store_slug} />
              ) : (
                <p className="rounded-2xl bg-cream-200 p-4 text-sm text-cocoa-500">Guarda la dirección de tu tienda para generar tu código QR.</p>
              )}
            </>
          )}
        </div>

        {/* ---------------- VISTA PREVIA ---------------- */}
        <div className="max-xl:hidden xl:sticky xl:top-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-cocoa-500">Vista previa en vivo</p>
            <button onClick={() => setBigPreview(true)} className="flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:underline">
              <Monitor className="h-4 w-4" /> Ampliar
            </button>
          </div>
          {previewFrame("360px", "min(720px, calc(100dvh - 140px))")}
          <p className="mt-2 text-center text-xs text-cocoa-400">Los cambios se ven aquí al instante; recuerda Guardar.</p>
        </div>
      </div>

      <Modal open={bigPreview} onClose={() => setBigPreview(false)} title="Vista previa" size="xl">
        <div className="mb-4 flex justify-center">
          <Tabs
            value={device}
            onChange={setDevice}
            options={[
              { value: "movil", label: <><Smartphone className="h-4 w-4" /> Celular</> },
              { value: "escritorio", label: <><Monitor className="h-4 w-4" /> Computadora</> },
            ]}
          />
        </div>
        {previewFrame(device === "movil" ? "380px" : "100%", "70dvh")}
      </Modal>
    </>
  );
}

/** Mini dibujo de cada tipo de portada */
function HeroSketch({ kind }: { kind: StoreTheme["hero"] }) {
  if (kind === "portada")
    return (
      <div className="relative h-16 overflow-hidden rounded-lg bg-gradient-to-br from-rose-200 to-cocoa-300">
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
          <span className="h-5 w-5 rounded-full bg-white" />
          <span className="h-2 w-16 rounded bg-white/90" />
        </div>
      </div>
    );
  if (kind === "minimal")
    return (
      <div className="flex h-16 items-center gap-2 rounded-lg bg-cream-100 px-2">
        <span className="h-7 w-7 rounded-md bg-rose-200" />
        <span className="space-y-1">
          <span className="block h-2 w-16 rounded bg-cocoa-300" />
          <span className="block h-1.5 w-10 rounded bg-cocoa-200" />
        </span>
      </div>
    );
  return (
    <div className="relative h-16 overflow-hidden rounded-lg bg-cream-100">
      <div className="h-7 bg-rose-100" />
      <span className="absolute top-3 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-white ring-2 ring-rose-200" />
      <span className="absolute bottom-1.5 left-1/2 h-1.5 w-14 -translate-x-1/2 rounded bg-cocoa-300" />
    </div>
  );
}
