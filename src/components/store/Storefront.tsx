"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { CakeSlice, Check, Clock, Facebook, Instagram, Loader2, MapPin, Megaphone, MessageCircle, Minus, Plus, ShoppingBag, Sparkles, Star, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { addDays, dateLong, facebookLabel, facebookUrl, folio, money, toISODate, waLink } from "@/lib/format";
import { normalizeTheme, themeVars, type StoreTheme } from "@/lib/storeTheme";
import { cn } from "@/lib/cn";

export type StoreProduct = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  unit_label: string;
  price: number;
  featured?: boolean;
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
  };
  products: StoreProduct[];
};

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
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState("Todo");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<StoreProduct | null>(null);
  const [done, setDone] = useState<{ folio: number; total: number; wa: string } | null>(null);
  const minDate = toISODate(addDays(new Date(), store.min_notice_days));
  const [f, setF] = useState({ name: "", phone: "", email: "", date: minDate, time: "", type: store.pickup ? "recoger" : "envio", address: "", notes: "" });
  const [sending, setSending] = useState(false);

  // Carrito persistente en este navegador (no en la vista previa)
  useEffect(() => {
    if (preview) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCart(JSON.parse(raw));
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
  const lines = products.filter((p) => cart[p.id] > 0).map((p) => ({ ...p, qty: cart[p.id] }));
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.qty * Number(l.price), 0);
  const shipping = f.type === "envio" ? Number(store.shipping_fee) : 0;

  const add = (id: string, d = 1) =>
    setCart((c) => {
      const n = Math.max(0, (c[id] ?? 0) + d);
      const next = { ...c, [id]: n };
      if (!n) delete next[id];
      return next;
    });

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (!lines.length) return;
    if (f.type === "envio" && !f.address.trim()) return toast.error("Escribe la dirección de entrega");
    setSending(true);
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
      p_items: lines.map((l) => ({ dessert_id: l.id, quantity: l.qty })),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    const text =
      `¡Hola ${store.business_name}! 🧁 Quiero hacer un pedido (${folio("P", res.folio)}):\n\n` +
      lines.map((l) => `• ${l.qty} × ${l.name} — ${money(l.qty * l.price)}`).join("\n") +
      `\n\n${shipping ? `Envío: ${money(shipping)}\n` : ""}*Total: ${money(res.total)}*\n\n` +
      `📅 ${f.date ? dateLong(f.date) : "Fecha por confirmar"}${f.time ? ` a las ${f.time}` : ""}\n` +
      `${f.type === "envio" ? `🚚 Envío a: ${f.address}` : "🏠 Paso a recoger"}\n` +
      `👤 ${f.name} · ${f.phone}` +
      (f.notes ? `\n📝 ${f.notes}` : "");
    const wa = waLink(store.whatsapp, text);
    setDone({ folio: res.folio, total: res.total, wa });
    setCart({});
    window.open(wa, "_blank");
  }

  const btnPrimary = "bg-[var(--st-primary)] text-[var(--st-on-primary)] transition hover:brightness-95 active:scale-95";
  const card = "overflow-hidden rounded-[var(--st-radius)] bg-[var(--st-surface)] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_10px_28px_-12px_rgb(0_0_0/0.18)] ring-1 ring-[var(--st-line)]";

  const qtyControl = (p: StoreProduct, size: "sm" | "md" = "md") =>
    cart[p.id] ? (
      <div className="flex items-center gap-1 rounded-full bg-[var(--st-soft)] p-1">
        <button onClick={() => add(p.id, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-[var(--st-surface)] text-[var(--st-primary)] shadow-sm" aria-label="Quitar uno">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-bold text-[var(--st-text)]">{cart[p.id]}</span>
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
          <button onClick={() => setDetail(p)} className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[calc(var(--st-radius)*0.7)] @xl:w-32">
            {productImg(p)}
          </button>
          <div className="flex min-w-0 flex-1 flex-col py-1">
            <p className="text-[11px] font-bold tracking-wider text-[var(--st-accent)] uppercase">{p.category}</p>
            <h3 className="truncate text-lg leading-tight font-semibold">{p.name}</h3>
            {p.description && <p className="mt-0.5 line-clamp-2 text-sm text-[var(--st-muted)]">{p.description}</p>}
            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
              <p className="text-lg font-bold text-[var(--st-primary)]">
                {price(p.price)} <span className="text-xs font-normal text-[var(--st-muted)]">/ {p.unit_label}</span>
              </p>
              {qtyControl(p, "sm")}
            </div>
          </div>
        </article>
      );
    if (theme.layout === "galeria")
      return (
        <article className={cn(card, "group relative aspect-[4/5]")}>
          <button onClick={() => setDetail(p)} className="absolute inset-0">
            {productImg(p)}
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-4 pt-16 text-white">
            <p className="text-[11px] font-bold tracking-wider uppercase opacity-85">{p.category}</p>
            <h3 className="text-xl leading-tight font-semibold !text-white">{p.name}</h3>
            <div className="pointer-events-auto mt-2 flex items-center justify-between gap-2">
              <p className="text-lg font-bold">
                {price(p.price)} <span className="text-xs font-normal opacity-80">/ {p.unit_label}</span>
              </p>
              {qtyControl(p)}
            </div>
          </div>
        </article>
      );
    return (
      <article className={cn(card, "group flex flex-col")}>
        <button onClick={() => setDetail(p)} className="relative aspect-square overflow-hidden">
          {productImg(p)}
          {p.featured && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-[var(--st-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--st-on-accent)]">
              <Star className="h-3 w-3 fill-current" /> Favorito
            </span>
          )}
        </button>
        <div className="flex flex-1 flex-col p-3 @xl:p-4">
          <p className="text-[11px] font-bold tracking-wider text-[var(--st-accent)] uppercase">{p.category}</p>
          <h3 className="mt-0.5 text-base leading-tight font-semibold @xl:text-lg">{p.name}</h3>
          {p.description && <p className="mt-1 line-clamp-2 text-sm text-[var(--st-muted)] @max-xl:hidden">{p.description}</p>}
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <p className="text-lg font-bold text-[var(--st-primary)] @xl:text-xl">
              {price(p.price)}
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
                <button onClick={() => setDetail(p)} className="relative aspect-[4/5] overflow-hidden">
                  {productImg(p)}
                </button>
                <div className="flex flex-1 items-end justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{p.name}</h3>
                    <p className="font-bold text-[var(--st-primary)]">{price(p.price)}</p>
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
              {store.delivery && <li>Envío a domicilio{Number(store.shipping_fee) ? ` · ${money(store.shipping_fee)}` : ""}</li>}
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
              <button
                className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 font-bold sm:w-auto", btnPrimary)}
                onClick={() => {
                  add(detail.id);
                  setDetail(null);
                  toast.success("Agregado a tu pedido");
                }}
              >
                <Plus className="h-4 w-4" /> Agregar · {money(detail.price)}
              </button>
            )}
          >
            {detail && (
              <div>
                {detail.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.image_url} alt={detail.name} className="mb-4 aspect-[4/3] w-full rounded-3xl object-cover" />
                )}
                <p className="text-[15px] leading-relaxed text-cocoa-500">{detail.description || "Delicioso postre hecho en casa con ingredientes de calidad."}</p>
                <p className="mt-3 font-display text-2xl font-semibold text-[var(--st-primary)]">
                  {money(detail.price)} <span className="text-sm font-normal text-cocoa-400">/ {detail.unit_label}</span>
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
                    <li key={l.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-cocoa-700">{l.name}</p>
                        <p className="text-xs text-cocoa-400">{money(l.price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
                        <button type="button" onClick={() => add(l.id, -1)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--st-primary)]" aria-label="Quitar uno">{l.qty === 1 ? <X className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}</button>
                        <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                        <button type="button" onClick={() => add(l.id)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--st-primary)]" aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="w-20 text-right font-semibold tabular-nums">{money(l.qty * l.price)}</p>
                    </li>
                  ))}
                </ul>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Tu nombre" required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                  <Input label="WhatsApp" type="tel" required maxLength={20} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="998 123 4567" />
                  <Input label="Fecha de entrega" type="date" required min={minDate} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
                  <Input label="Hora aproximada" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
                  {store.pickup && store.delivery && (
                    <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                      {(["recoger", "envio"] as const).map((t) => (
                        <button key={t} type="button" onClick={() => setF({ ...f, type: t })} className={cn("flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold", f.type === t ? "border-[var(--st-primary)] bg-[var(--st-soft)] text-[var(--st-primary)]" : "border-cocoa-800/10 text-cocoa-500")}>
                          {t === "envio" ? <Truck className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                          {t === "envio" ? `Envío${Number(store.shipping_fee) ? ` (+${money(store.shipping_fee)})` : ""}` : "Paso a recoger"}
                        </button>
                      ))}
                    </div>
                  )}
                  {f.type === "envio" && <Input className="sm:col-span-2" label="Dirección de entrega" required maxLength={300} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}
                  <Textarea className="sm:col-span-2" label="Notas (opcional)" rows={2} maxLength={1000} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Mensaje para el pastel, alergias, colores…" />
                </div>
                <div className="rounded-3xl bg-cocoa-800 p-5 text-cream-100">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div>
                  {shipping > 0 && <div className="mt-1 flex justify-between text-sm"><span>Envío</span><span className="tabular-nums">{money(shipping)}</span></div>}
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
