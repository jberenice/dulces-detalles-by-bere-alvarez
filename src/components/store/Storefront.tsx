"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { CakeSlice, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Facebook, Instagram, Loader2, MapPin, Megaphone, MessageCircle, Minus, Plus, ShoppingBag, Sparkles, Star, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { DeliveryCalendar, firstAvailable } from "./DeliveryCalendar";
import { Modal } from "@/components/ui/Modal";
import { dateLong, facebookLabel, facebookUrl, folio, money, toISODate, waLink } from "@/lib/format";
import { normalizeTheme, themeVars, type StoreTheme } from "@/lib/storeTheme";
import { cn } from "@/lib/cn";
import type { DeliveryZone, VariantGroup } from "@/lib/types";

export type StoreProduct = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  unit_label: string;
  price: number;
  featured?: boolean;
  variants?: VariantGroup[];
  gallery?: string[];
  min_notice_days?: number | null;
};
export type StoreData = {
  store: {
    slug: string;
    title: string;
    business_name: string;
    description: string | null;
    banner_url: string | null;
    logo_url: string | null;
    whatsapp: string | null;
    instagram: string | null;
    facebook?: string | null;
    address: string | null;
    min_notice_days: number;
    delivery: boolean;
    pickup: boolean;
    shipping_fee: number;
    theme?: unknown;
    about?: string | null;
    hours?: string | null;
    announcement?: string | null;
    zones?: DeliveryZone[];
    today?: string;
    unavailable_dates?: string[];
  };
  products: StoreProduct[];
};

type Choice = { group: string; option: string };
type CartLine = { id: string; qty: number; options: Choice[] };

const lineKey = (id: string, options: Choice[]) => (options.length ? `${id}|${options.map((o) => `${o.group}=${o.option}`).join("|")}` : id);
/** Igual que en la base de datos: un grupo sin "required" se considera obligatorio */
const isRequired = (g: VariantGroup) => g.required !== false;
const hasVariants = (p: StoreProduct) => (p.variants ?? []).some((g) => g.options?.length);
const optionPrice = (p: StoreProduct, choices: Choice[]) =>
  choices.reduce((a, c) => a + Number(p.variants?.find((g) => g.name === c.group)?.options.find((o) => o.name === c.option)?.price ?? 0), 0);
/** Precio mínimo con las opciones obligatorias más baratas */
const fromPrice = (p: StoreProduct) =>
  Number(p.price) + (p.variants ?? []).filter((g) => isRequired(g) && g.options?.length).reduce((a, g) => a + Math.min(...g.options.map((o) => Number(o.price) || 0)), 0);
const variesPrice = (p: StoreProduct) => (p.variants ?? []).some((g) => g.options?.some((o) => Number(o.price) > 0));
const photos = (p: StoreProduct) => [p.image_url, ...(p.gallery ?? [])].filter(Boolean) as string[];

const price = (n: number) => money(n).replace(".00", "");

/**
 * Minitienda pública. Usa container queries (@container) para que la vista previa del panel
 * se vea igual que en un celular o una computadora real.
 */
export function Storefront({ data, slug, preview = false }: { data: StoreData; slug: string; preview?: boolean }) {
  const { store, products } = data;
  const theme: StoreTheme = useMemo(() => normalizeTheme(store.theme), [store.theme]);
  const vars = useMemo(() => themeVars(theme), [theme]);
  const storageKey = `dd-cart-${slug}`;
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cat, setCat] = useState("Todo");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<StoreProduct | null>(null);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [detailQty, setDetailQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [done, setDone] = useState<{ folio: number; total: number; wa: string } | null>(null);
  const today = store.today ?? toISODate(new Date());
  const unavailable = useMemo(() => store.unavailable_dates ?? [], [store.unavailable_dates]);
  const zones = useMemo(() => (store.zones ?? []).filter((z) => z?.name), [store.zones]);
  const [f, setF] = useState({
    name: "", phone: "", email: "", date: firstAvailable(today, store.min_notice_days, unavailable), time: "",
    type: store.pickup ? "recoger" : "envio", address: "", notes: "", zone: "",
  });
  const [sending, setSending] = useState(false);

  // Carrito persistente en este navegador (no en la vista previa)
  useEffect(() => {
    if (preview) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, CartLine | number>;
        const next: Record<string, CartLine> = {};
        // Compatibilidad con el carrito anterior ({ id: cantidad })
        for (const [k, v] of Object.entries(parsed)) next[k] = typeof v === "number" ? { id: k, qty: v, options: [] } : v;
        setCart(next);
      }
    } catch {}
  }, [storageKey, preview]);
  useEffect(() => {
    if (preview) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {}
  }, [cart, storageKey, preview]);

  // Los modales se abren fuera de la tienda (portal): les pasamos los colores por <body>
  useEffect(() => {
    if (preview) return;
    const body = document.body;
    const prevBg = body.style.background;
    Object.entries(vars).forEach(([k, v]) => body.style.setProperty(k, String(v)));
    body.style.background = theme.background;
    return () => {
      Object.keys(vars).forEach((k) => body.style.removeProperty(k));
      body.style.background = prevBg;
    };
  }, [vars, theme.background, preview]);

  const categories = useMemo(() => ["Todo", ...new Set(products.map((p) => p.category))], [products]);
  const featured = products.filter((p) => p.featured);
  const list = products.filter((p) => cat === "Todo" || p.category === cat);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const lines = Object.entries(cart)
    .map(([key, l]) => {
      const p = byId.get(l.id);
      if (!p || l.qty <= 0) return null;
      // Descarta opciones que ya no existen
      const valid =
        l.options.every((c) => p.variants?.find((g) => g.name === c.group)?.options.some((o) => o.name === c.option)) &&
        // Si después se agregó un grupo obligatorio (p. ej. Tamaño), la línea vieja ya no es válida
        (p.variants ?? []).every((g) => !isRequired(g) || !g.options?.length || l.options.some((c) => c.group === g.name));
      if (!valid) return null;
      const unit = Number(p.price) + optionPrice(p, l.options);
      return { key, p, qty: l.qty, options: l.options, unit, label: l.options.map((c) => c.option).join(" · ") };
    })
    .filter(Boolean) as { key: string; p: StoreProduct; qty: number; options: Choice[]; unit: number; label: string }[];
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.qty * l.unit, 0);
  const zone = zones.find((z) => z.name === f.zone);
  const shipping = f.type === "envio" ? (zones.length ? Number(zone?.fee ?? 0) : Number(store.shipping_fee)) : 0;
  const minNotice = Math.max(store.min_notice_days, ...lines.map((l) => Number(l.p.min_notice_days ?? 0)));
  const qtyOf = (id: string) => lines.filter((l) => l.p.id === id).reduce((a, l) => a + l.qty, 0);

  // Si un postre pide más anticipación, se mueve la fecha al primer día posible
  useEffect(() => {
    const first = firstAvailable(today, minNotice, unavailable);
    if (!f.date || f.date < first || unavailable.includes(f.date)) setF((x) => ({ ...x, date: first }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minNotice, today, unavailable]);

  const addLine = (id: string, options: Choice[] = [], d = 1) =>
    setCart((c) => {
      const key = lineKey(id, options);
      const n = Math.max(0, (c[key]?.qty ?? 0) + d);
      const next = { ...c, [key]: { id, qty: n, options } };
      if (!n) delete next[key];
      return next;
    });
  const add = (id: string, d = 1) => addLine(id, [], d);

  function openDetail(p: StoreProduct) {
    setDetail(p);
    setPhoto(0);
    setDetailQty(1);
    setSel(Object.fromEntries((p.variants ?? []).filter((g) => isRequired(g) && g.options?.length).map((g) => [g.name, g.options[0].name])));
  }
  const detailChoices: Choice[] = detail
    ? (detail.variants ?? []).filter((g) => sel[g.name]).map((g) => ({ group: g.name, option: sel[g.name] }))
    : [];
  const detailUnit = detail ? Number(detail.price) + optionPrice(detail, detailChoices) : 0;
  const missing = detail ? (detail.variants ?? []).find((g) => isRequired(g) && g.options?.length && !sel[g.name]) : undefined;

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (!lines.length) return;
    if (f.type === "envio" && !f.address.trim()) return toast.error("Escribe la dirección de entrega");
    if (f.type === "envio" && zones.length && !zone) return toast.error("Elige tu zona de entrega");
    if (!f.date) return toast.error("Elige la fecha de entrega");
    setSending(true);
    // Se abre la ventana antes de esperar al servidor: los celulares bloquean ventanas abiertas después
    const popup = window.open("", "_blank");
    const { data: res, error } = await createClient().rpc("place_store_order", {
      p_slug: slug,
      p_name: f.name,
      p_phone: f.phone,
      p_email: f.email,
      p_delivery_date: f.date || null,
      p_delivery_time: f.time || null,
      p_delivery_type: f.type,
      p_address: f.address,
      p_notes: f.notes,
      p_items: lines.map((l) => ({ dessert_id: l.p.id, quantity: l.qty, options: l.options })),
      p_zone: f.type === "envio" && zone ? zone.name : null,
    });
    setSending(false);
    if (error) {
      popup?.close();
      return toast.error(error.message);
    }
    const text =
      `¡Hola ${store.business_name}! 🧁 Quiero hacer un pedido (${folio("P", res.folio)}):\n\n` +
      lines.map((l) => `• ${l.qty} × ${l.p.name}${l.label ? ` (${l.label})` : ""} — ${money(l.qty * l.unit)}`).join("\n") +
      `\n\n${shipping ? `Envío: ${money(shipping)}\n` : ""}*Total: ${money(res.total)}*\n\n` +
      `📅 ${f.date ? dateLong(f.date) : "Fecha por confirmar"}${f.time ? ` a las ${f.time}` : ""}\n` +
      `${f.type === "envio" ? `🚚 Envío${zone ? ` (${zone.name})` : ""} a: ${f.address}` : "🏠 Paso a recoger"}\n` +
      `👤 ${f.name} · ${f.phone}` +
      (f.notes ? `\n📝 ${f.notes}` : "");
    const wa = waLink(store.whatsapp, text);
    setDone({ folio: res.folio, total: res.total, wa });
    // Aviso push a la repostería (si tiene la app con notificaciones activas)
    fetch("/api/push/pedido", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: res.order_id }) }).catch(() => {});
    setCart({});
    if (popup && !popup.closed) popup.location.href = wa;
  }

  const btnPrimary = "bg-[var(--st-primary)] text-[var(--st-on-primary)] transition hover:brightness-95 active:scale-95";
  const card = "overflow-hidden rounded-[var(--st-radius)] bg-[var(--st-surface)] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_10px_28px_-12px_rgb(0_0_0/0.18)] ring-1 ring-[var(--st-line)]";

  const qtyControl = (p: StoreProduct, size: "sm" | "md" = "md") => {
    const n = qtyOf(p.id);
    // Con variantes se elige en el detalle (tamaño, sabor, relleno…)
    if (hasVariants(p))
      return (
        <button
          onClick={() => openDetail(p)}
          className={cn("relative grid shrink-0 place-items-center rounded-full shadow-md", btnPrimary, size === "sm" ? "h-9 w-9" : "h-10 w-10")}
          aria-label={`Elegir opciones de ${p.name}`}
        >
          <Plus className="h-5 w-5" />
          {n > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--st-text)] px-1 text-[10px] font-bold text-[var(--st-bg)]">{n}</span>
          )}
        </button>
      );
    return n ? (
      <div className="flex items-center gap-1 rounded-full bg-[var(--st-soft)] p-1">
        <button onClick={() => add(p.id, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-[var(--st-surface)] text-[var(--st-primary)] shadow-sm" aria-label="Quitar uno">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-bold text-[var(--st-text)]">{n}</span>
        <button onClick={() => add(p.id)} className={cn("grid h-7 w-7 place-items-center rounded-full", btnPrimary)} aria-label="Agregar uno">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : (
      <button
        onClick={() => {
          add(p.id);
          if (!preview) toast.success(`${p.name} agregado`, { duration: 1200 });
        }}
        className={cn("grid shrink-0 place-items-center rounded-full shadow-md", btnPrimary, size === "sm" ? "h-9 w-9" : "h-10 w-10")}
        aria-label={`Agregar ${p.name}`}
      >
        <Plus className="h-5 w-5" />
      </button>
    );
  };

  /** "$350" o "Desde $350" si el precio cambia según las opciones */
  const priceLabel = (p: StoreProduct) => (variesPrice(p) ? `Desde ${price(fromPrice(p))}` : price(fromPrice(p)));

  const productImg = (p: StoreProduct, className?: string) =>
    p.image_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={p.image_url} alt={p.name} className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-105", className)} loading="lazy" />
    ) : (
      <div className="grid h-full w-full place-items-center bg-[var(--st-soft)]">
        <CakeSlice className="h-10 w-10 text-[var(--st-primary)] opacity-50" />
      </div>
    );

  const productCard = (p: StoreProduct) => {
    if (theme.layout === "lista")
      return (
        <article className={cn(card, "group flex gap-3 p-2.5 @xl:gap-4 @xl:p-3")}>
          <button onClick={() => openDetail(p)} className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[calc(var(--st-radius)*0.7)] @xl:w-32">
            {productImg(p)}
          </button>
          <div className="flex min-w-0 flex-1 flex-col py-1">
            <p className="text-[11px] font-bold tracking-wider text-[var(--st-accent)] uppercase">{p.category}</p>
            <h3 className="truncate text-lg leading-tight font-semibold">{p.name}</h3>
            {p.description && <p className="mt-0.5 line-clamp-2 text-sm text-[var(--st-muted)]">{p.description}</p>}
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <p className="text-lg font-bold text-[var(--st-primary)]">
                {priceLabel(p)} <span className="text-xs font-normal text-[var(--st-muted)]">/ {p.unit_label}</span>
              </p>
              {qtyControl(p, "sm")}
            </div>
          </div>
        </article>
      );
    if (theme.layout === "galeria")
      return (
        <article className={cn(card, "group relative aspect-[4/5]")}>
          <button onClick={() => openDetail(p)} className="absolute inset-0">
            {productImg(p)}
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-4 pt-16 text-white">
            <p className="text-[11px] font-bold tracking-wider uppercase opacity-85">{p.category}</p>
            <h3 className="text-xl leading-tight font-semibold !text-white">{p.name}</h3>
            <div className="pointer-events-auto mt-2 flex items-center justify-between gap-2">
              <p className="text-lg font-bold">
                {priceLabel(p)} <span className="text-xs font-normal opacity-80">/ {p.unit_label}</span>
              </p>
              {qtyControl(p)}
            </div>
          </div>
        </article>
      );
    return (
      <article className={cn(card, "group flex flex-col")}>
        <button onClick={() => openDetail(p)} className="relative aspect-square overflow-hidden">
          {productImg(p)}
          {p.featured && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-[var(--st-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--st-on-accent)]">
              <Star className="h-3 w-3 fill-current" /> Favorito
            </span>
          )}
          {photos(p).length > 1 && (
            <span className="absolute right-2 bottom-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">{photos(p).length} fotos</span>
          )}
        </button>
        <div className="flex flex-1 flex-col p-3 @xl:p-4">
          <p className="text-[11px] font-bold tracking-wider text-[var(--st-accent)] uppercase">{p.category}</p>
          <h3 className="mt-0.5 text-base leading-tight font-semibold @xl:text-lg">{p.name}</h3>
          {p.description && <p className="mt-1 line-clamp-2 text-sm text-[var(--st-muted)] @max-xl:hidden">{p.description}</p>}
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <p className="text-lg font-bold text-[var(--st-primary)] @xl:text-xl">
              {priceLabel(p)}
              <span className="block text-[11px] font-normal text-[var(--st-muted)] @xl:inline @xl:pl-1">/ {p.unit_label}</span>
            </p>
            {qtyControl(p)}
          </div>
        </div>
      </article>
    );
  };

  const gridCols =
    theme.layout === "lista"
      ? "grid-cols-1 @4xl:grid-cols-2"
      : theme.layout === "galeria"
        ? "grid-cols-1 @lg:grid-cols-2 @4xl:grid-cols-3"
        : theme.columns === 2
          ? "grid-cols-2"
          : "grid-cols-2 @3xl:grid-cols-3";

  // ---------- Secciones ----------
  const sections: Record<string, React.ReactNode> = {
    destacados: featured.length ? (
      <section key="destacados" className="pt-8">
        <div className="mb-3 flex items-center gap-2 px-4">
          <Sparkles className="h-5 w-5 text-[var(--st-accent)]" />
          <h2 className="text-2xl font-semibold">Los favoritos</h2>
        </div>
        <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
          {featured.map((p) => (
            <div key={p.id} className="w-[46%] shrink-0 snap-start @xl:w-[31%] @4xl:w-[23%]">
              <article className={cn(card, "group flex h-full flex-col")}>
                <button onClick={() => openDetail(p)} className="relative aspect-[4/5] overflow-hidden">
                  {productImg(p)}
                </button>
                <div className="flex flex-1 items-end justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{p.name}</h3>
                    <p className="font-bold text-[var(--st-primary)]">{priceLabel(p)}</p>
                  </div>
                  {qtyControl(p, "sm")}
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>
    ) : null,
    catalogo: (
      <section key="catalogo" className="pt-8">
        <div className="sticky top-0 z-20 border-y border-[var(--st-line)] bg-[color-mix(in_srgb,var(--st-bg)_90%,transparent)] backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition",
                  cat === c ? btnPrimary : "bg-[var(--st-surface)] text-[var(--st-muted)] ring-1 ring-[var(--st-line)]",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 pt-5">
          {products.length === 0 ? (
            <div className="py-16 text-center text-[var(--st-muted)]">
              <CakeSlice className="mx-auto mb-3 h-10 w-10 text-[var(--st-primary)] opacity-60" />
              Muy pronto verás aquí nuestros postres.
            </div>
          ) : (
            <div className={cn("grid gap-3 @xl:gap-5", gridCols)}>
              {list.map((p) => (
                <Fragment key={p.id}>{productCard(p)}</Fragment>
              ))}
            </div>
          )}
        </div>
      </section>
    ),
    nosotros: store.about ? (
      <section key="nosotros" className="px-4 pt-10">
        <div className={cn(card, "p-6 @2xl:p-8")}>
          <p className="text-xs font-bold tracking-widest text-[var(--st-accent)] uppercase">Nuestra historia</p>
          <h2 className="mt-1 text-2xl font-semibold @2xl:text-3xl">Sobre {store.business_name}</h2>
          <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-[var(--st-muted)]">{store.about}</p>
        </div>
      </section>
    ) : null,
    horario: store.hours || store.delivery || store.pickup ? (
      <section key="horario" className="px-4 pt-6">
        <div className={cn(card, "grid gap-4 p-6 @2xl:grid-cols-2")}>
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Clock className="h-5 w-5 text-[var(--st-primary)]" /> Horario</h2>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-[var(--st-muted)]">{store.hours || "Consulta disponibilidad por WhatsApp."}</p>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Truck className="h-5 w-5 text-[var(--st-primary)]" /> Entregas</h2>
            <ul className="mt-2 space-y-1 text-sm text-[var(--st-muted)]">
              <li>Pedidos con {store.min_notice_days} día{store.min_notice_days === 1 ? "" : "s"} de anticipación</li>
              {store.pickup && <li>Recoge en tienda{store.address ? ` · ${store.address}` : ""}</li>}
              {store.delivery && !zones.length && <li>Envío a domicilio{Number(store.shipping_fee) ? ` · ${money(store.shipping_fee)}` : ""}</li>}
              {store.delivery && zones.length > 0 && (
                <li>
                  Envío a domicilio:
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {zones.map((z) => (
                      <span key={z.name} className="rounded-full bg-[var(--st-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--st-text)]">
                        {z.name} · {Number(z.fee) ? price(z.fee) : "gratis"}
                      </span>
                    ))}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    ) : null,
    contacto: (
      <section key="contacto" className="px-4 pt-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {store.whatsapp && (
            <a href={waLink(store.whatsapp, "¡Hola! Tengo una pregunta 🧁")} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold", btnPrimary)}>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {store.instagram && (
            <a href={`https://instagram.com/${store.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-[var(--st-surface)] px-4 py-2 font-semibold text-[var(--st-text)] ring-1 ring-[var(--st-line)]">
              <Instagram className="h-4 w-4" /> @{store.instagram.replace(/^@/, "")}
            </a>
          )}
          {store.facebook && (
            <a href={facebookUrl(store.facebook)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-[var(--st-surface)] px-4 py-2 font-semibold text-[var(--st-text)] ring-1 ring-[var(--st-line)]">
              <Facebook className="h-4 w-4" /> {facebookLabel(store.facebook)}
            </a>
          )}
          {store.address && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(store.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-[var(--st-surface)] px-4 py-2 text-[var(--st-muted)] ring-1 ring-[var(--st-line)]">
              <MapPin className="h-4 w-4" /> {store.address}
            </a>
          )}
        </div>
      </section>
    ),
  };

  const announcementVisible = !!store.announcement && theme.sections.find((s) => s.id === "anuncio")?.visible !== false;
  const logo = store.logo_url || "/logo-transparent.png";

  // ---------- Portada ----------
  const hero =
    theme.hero === "portada" ? (
      <header className="relative">
        <div className="relative h-72 overflow-hidden @2xl:h-96">
          {store.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.banner_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="sprinkles h-full w-full bg-[var(--st-soft)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 @2xl:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" className="h-20 w-20 shrink-0 rounded-full bg-white object-contain p-1.5 shadow-lg @2xl:h-24 @2xl:w-24" />
            <div className="min-w-0 text-white">
              <h1 className="text-3xl leading-tight font-semibold !text-white @2xl:text-5xl">{store.title}</h1>
              {store.description && <p className="mt-1 line-clamp-2 text-sm opacity-90 @2xl:text-base">{store.description}</p>}
            </div>
          </div>
        </div>
      </header>
    ) : theme.hero === "minimal" ? (
      <header className="flex items-center gap-4 px-4 pt-6 pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="h-16 w-16 shrink-0 rounded-[calc(var(--st-radius)*0.8)] bg-[var(--st-surface)] object-contain p-1 ring-1 ring-[var(--st-line)]" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl leading-tight font-semibold @2xl:text-3xl">{store.title}</h1>
          {store.description && <p className="line-clamp-2 text-sm text-[var(--st-muted)]">{store.description}</p>}
        </div>
      </header>
    ) : (
      <header className="relative">
        <div className={cn("relative h-40 overflow-hidden @2xl:h-60", !store.banner_url && "sprinkles bg-[var(--st-soft)]")}>
          {store.banner_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.banner_url} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--st-bg)]" />
        </div>
        <div className="relative mx-auto -mt-16 max-w-3xl px-4 text-center @2xl:-mt-20">
          <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-[var(--st-surface)] p-2 shadow-lg ring-4 ring-[var(--st-surface)] @2xl:h-40 @2xl:w-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={store.business_name} className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold @2xl:text-4xl">{store.title}</h1>
          {store.description && <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--st-muted)]">{store.description}</p>}
        </div>
      </header>
    );

  return (
    <div className={cn("st-root @container relative bg-[var(--st-bg)] text-[var(--st-text)]", preview ? "min-h-full" : "min-h-dvh")} style={vars}>
      {announcementVisible && (
        <div className="flex items-center justify-center gap-2 bg-[var(--st-primary)] px-4 py-2 text-center text-[13px] font-semibold text-[var(--st-on-primary)]">
          <Megaphone className="h-4 w-4 shrink-0" /> {store.announcement}
        </div>
      )}
      {hero}

      <main className="mx-auto max-w-6xl pb-32">
        {theme.sections.filter((s) => s.visible && s.id !== "anuncio").map((s) => sections[s.id])}
        <footer className="mt-14 px-4 text-center">
          <p className="font-script text-2xl text-[var(--st-primary)]">Hechos con amor de hogar</p>
          <p className="mt-1 text-xs text-[var(--st-muted)]">Tienda creada con Dulces Detalles</p>
          {!preview && <SiteFooter compact social={false} className="pb-2" />}
        </footer>
      </main>

      {/* Barra de carrito */}
      {count > 0 && (
        <div className={cn("inset-x-0 bottom-0 z-40 p-4 pb-safe", preview ? "sticky" : "fixed")}>
          <button
            onClick={() => (preview ? toast.info("Vista previa: así verán tus clientes el carrito") : setOpen(true))}
            className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-[var(--st-text)] py-3 pr-3 pl-6 text-[var(--st-bg)] shadow-lift animate-fade-up"
          >
            <span className="flex items-center gap-3 font-bold">
              <ShoppingBag className="h-5 w-5" /> {count} {count === 1 ? "postre" : "postres"}
            </span>
            <span className={cn("rounded-full px-5 py-2.5 font-bold", btnPrimary)}>Ver pedido · {price(subtotal)}</span>
          </button>
        </div>
      )}

      {!preview && (
        <>
          {/* Detalle */}
          <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} size="md"
            footer={detail && (
              <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-center justify-center gap-1 rounded-full bg-cream-200 p-1">
                  <button type="button" onClick={() => setDetailQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-full bg-white text-cocoa-600 shadow-sm" aria-label="Menos"><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center font-bold">{detailQty}</span>
                  <button type="button" onClick={() => setDetailQty((q) => Math.min(99, q + 1))} className="grid h-9 w-9 place-items-center rounded-full bg-white text-cocoa-600 shadow-sm" aria-label="Más"><Plus className="h-4 w-4" /></button>
                </div>
                <button
                  className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 font-bold disabled:opacity-50 sm:w-auto", btnPrimary)}
                  disabled={!!missing}
                  onClick={() => {
                    addLine(detail.id, detailChoices, detailQty);
                    setDetail(null);
                    toast.success("Agregado a tu pedido");
                  }}
                >
                  <Plus className="h-4 w-4" /> {missing ? `Elige ${missing.name.toLowerCase()}` : `Agregar · ${money(detailUnit * detailQty)}`}
                </button>
              </div>
            )}
          >
            {detail && (
              <div>
                {photos(detail).length > 0 && (
                  <div className="relative mb-4 overflow-hidden rounded-3xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photos(detail)[photo] ?? photos(detail)[0]} alt={detail.name} className="aspect-[4/3] w-full object-cover" />
                    {photos(detail).length > 1 && (
                      <>
                        <button type="button" onClick={() => setPhoto((i) => (i - 1 + photos(detail).length) % photos(detail).length)} className="absolute top-1/2 left-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-cocoa-700 shadow" aria-label="Foto anterior"><ChevronLeft className="h-5 w-5" /></button>
                        <button type="button" onClick={() => setPhoto((i) => (i + 1) % photos(detail).length)} className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-cocoa-700 shadow" aria-label="Foto siguiente"><ChevronRight className="h-5 w-5" /></button>
                        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                          {photos(detail).map((_, i) => (
                            <button key={i} type="button" onClick={() => setPhoto(i)} className={cn("h-1.5 rounded-full transition-all", i === photo ? "w-5 bg-white" : "w-1.5 bg-white/60")} aria-label={`Foto ${i + 1}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {photos(detail).length > 1 && (
                  <div className="-mt-2 mb-4 flex gap-2 overflow-x-auto scrollbar-none">
                    {photos(detail).map((src, i) => (
                      <button key={src + i} type="button" onClick={() => setPhoto(i)} className={cn("h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2", i === photo ? "ring-[var(--st-primary)]" : "ring-transparent opacity-70")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-cocoa-500">{detail.description || "Delicioso postre hecho en casa con ingredientes de calidad."}</p>
                {Number(detail.min_notice_days ?? 0) > store.min_notice_days && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1 text-xs font-semibold text-cocoa-500">
                    <CalendarDays className="h-3.5 w-3.5" /> Pídelo con {detail.min_notice_days} días de anticipación
                  </p>
                )}
                {(detail.variants ?? []).filter((g) => g.options?.length).map((g) => (
                  <fieldset key={g.name} className="mt-5">
                    <legend className="mb-2 flex items-center gap-2 text-sm font-bold text-cocoa-700">
                      {g.name}
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", isRequired(g) ? "bg-rose-50 text-rose-600" : "bg-cream-200 text-cocoa-400")}>
                        {isRequired(g) ? "Obligatorio" : "Opcional"}
                      </span>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {g.options.map((o) => {
                        const on = sel[g.name] === o.name;
                        return (
                          <button
                            key={o.name}
                            type="button"
                            onClick={() => setSel((x) => {
                              const next = { ...x };
                              if (on && !isRequired(g)) delete next[g.name];
                              else next[g.name] = o.name;
                              return next;
                            })}
                            className={cn(
                              "rounded-2xl border px-3.5 py-2 text-left text-sm font-semibold transition",
                              on ? "border-[var(--st-primary)] bg-[var(--st-soft)] text-[var(--st-text)]" : "border-cocoa-800/10 text-cocoa-500 hover:border-cocoa-800/25",
                            )}
                          >
                            {o.name}
                            {Number(o.price) > 0 && <span className="ml-1.5 text-xs font-bold text-[var(--st-primary)]">+{price(o.price)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
                <p className="mt-5 font-display text-2xl font-semibold text-[var(--st-primary)]">
                  {money(detailUnit)} <span className="text-sm font-normal text-cocoa-400">/ {detail.unit_label}</span>
                </p>
              </div>
            )}
          </Modal>

          {/* Checkout */}
          <Modal open={open} onClose={() => { setOpen(false); setDone(null); }} title={done ? "¡Pedido enviado!" : "Tu pedido"} size="lg">
            {done ? (
              <div className="py-6 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-100 text-mint-600"><Check className="h-8 w-8" /></span>
                <p className="mt-4 font-display text-2xl font-semibold">Folio {folio("P", done.folio)}</p>
                <p className="mt-2 text-cocoa-500">Recibimos tu pedido por {money(done.total)}. Termina de enviarlo por WhatsApp para confirmar tu fecha y forma de pago.</p>
                <a href={done.wa} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-mint-500 px-6 py-3 font-bold text-white">
                  <MessageCircle className="h-5 w-5" /> Abrir WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={checkout} className="space-y-5">
                <ul className="divide-y divide-cocoa-800/5 rounded-3xl bg-cream-50 px-4 ring-1 ring-cocoa-800/5">
                  {lines.map((l) => (
                    <li key={l.key} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-cocoa-700">{l.p.name}</p>
                        {l.label && <p className="truncate text-xs font-semibold text-[var(--st-primary)]">{l.label}</p>}
                        <p className="text-xs text-cocoa-400">{money(l.unit)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
                        <button type="button" onClick={() => addLine(l.p.id, l.options, -1)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--st-primary)]" aria-label="Quitar uno">{l.qty === 1 ? <X className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}</button>
                        <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                        <button type="button" onClick={() => addLine(l.p.id, l.options)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--st-primary)]" aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="w-20 text-right font-semibold tabular-nums">{money(l.qty * l.unit)}</p>
                    </li>
                  ))}
                </ul>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Tu nombre" required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                  <Input label="WhatsApp" type="tel" required maxLength={20} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="998 123 4567" />
                  <div className="sm:col-span-2">
                    <p className="label">Fecha de entrega {f.date && <span className="font-normal text-cocoa-400">· {dateLong(f.date)}</span>}</p>
                    <DeliveryCalendar value={f.date} onChange={(v) => setF({ ...f, date: v })} today={today} minNotice={minNotice} unavailable={unavailable} />
                  </div>
                  <Input label="Hora aproximada" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
                  {store.pickup && store.delivery && (
                    <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                      {(["recoger", "envio"] as const).map((t) => (
                        <button key={t} type="button" onClick={() => setF({ ...f, type: t })} className={cn("flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold", f.type === t ? "border-[var(--st-primary)] bg-[var(--st-soft)] text-[var(--st-primary)]" : "border-cocoa-800/10 text-cocoa-500")}>
                          {t === "envio" ? <Truck className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                          {t === "envio" ? `Envío${!zones.length && Number(store.shipping_fee) ? ` (+${money(store.shipping_fee)})` : ""}` : "Paso a recoger"}
                        </button>
                      ))}
                    </div>
                  )}
                  {f.type === "envio" && zones.length > 0 && (
                    <Select className="sm:col-span-2" label="Zona de entrega" required value={f.zone} onChange={(e) => setF({ ...f, zone: e.target.value })}>
                      <option value="">Elige tu zona…</option>
                      {zones.map((z) => (
                        <option key={z.name} value={z.name}>
                          {z.name} · {Number(z.fee) ? money(z.fee) : "Envío gratis"}
                        </option>
                      ))}
                    </Select>
                  )}
                  {f.type === "envio" && <Input className="sm:col-span-2" label="Dirección de entrega" required maxLength={300} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}
                  <Textarea className="sm:col-span-2" label="Notas (opcional)" rows={2} maxLength={1000} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Mensaje para el pastel, alergias, colores…" />
                </div>
                <div className="rounded-3xl bg-cocoa-800 p-5 text-cream-100">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div>
                  {f.type === "envio" && (shipping > 0 || zone) && <div className="mt-1 flex justify-between text-sm"><span>Envío{zone ? ` · ${zone.name}` : ""}</span><span className="tabular-nums">{shipping ? money(shipping) : "Gratis"}</span></div>}
                  <div className="mt-2 flex items-end justify-between border-t border-white/10 pt-3">
                    <span className="font-bold">Total</span>
                    <span className="font-display text-3xl font-semibold text-white tabular-nums">{money(subtotal + shipping)}</span>
                  </div>
                </div>
                <button type="submit" disabled={sending} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 font-bold text-white transition hover:bg-mint-600 disabled:opacity-60">
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />} Enviar pedido por WhatsApp
                </button>
                <p className="text-center text-xs text-cocoa-400">Confirmaremos disponibilidad y forma de pago por WhatsApp.</p>
              </form>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
