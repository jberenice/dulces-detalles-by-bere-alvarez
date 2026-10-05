"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CakeSlice, Check, Instagram, MapPin, MessageCircle, Minus, Plus, ShoppingBag, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { addDays, dateLong, folio, money, toISODate, waLink } from "@/lib/format";
import { cn } from "@/lib/cn";

export type StoreProduct = { id: string; name: string; category: string; description: string | null; image_url: string | null; unit_label: string; price: number };
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
    address: string | null;
    min_notice_days: number;
    delivery: boolean;
    pickup: boolean;
    shipping_fee: number;
  };
  products: StoreProduct[];
};

export function Storefront({ data, slug }: { data: StoreData; slug: string }) {
  const { store, products } = data;
  const storageKey = `dd-cart-${slug}`;
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState("Todo");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<StoreProduct | null>(null);
  const [done, setDone] = useState<{ folio: number; total: number; wa: string } | null>(null);
  const minDate = toISODate(addDays(new Date(), store.min_notice_days));
  const [f, setF] = useState({ name: "", phone: "", email: "", date: minDate, time: "", type: store.pickup ? "recoger" : "envio", address: "", notes: "" });
  const [sending, setSending] = useState(false);

  // Carrito persistente en este navegador
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, [storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {}
  }, [cart, storageKey]);

  const categories = useMemo(() => ["Todo", ...new Set(products.map((p) => p.category))], [products]);
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

  return (
    <div className="min-h-dvh bg-cream-100 pb-28">
      {/* Encabezado */}
      <header className="relative">
        <div className={cn("relative h-44 overflow-hidden sm:h-64", !store.banner_url && "sprinkles bg-cream-200")}>
          {store.banner_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.banner_url} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream-100" />
        </div>
        <div className="relative mx-auto -mt-20 max-w-5xl px-4 text-center sm:-mt-24">
          <div className="mx-auto grid h-36 w-36 place-items-center rounded-full bg-cream-50 p-2 shadow-lift ring-4 ring-white sm:h-44 sm:w-44">
            <Image src={store.logo_url || "/logo-transparent.png"} alt={store.business_name} width={160} height={160} className="h-full w-full object-contain" unoptimized={!!store.logo_url} priority />
          </div>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{store.title}</h1>
          {store.description && <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-cocoa-500">{store.description}</p>}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            {store.whatsapp && (
              <a href={waLink(store.whatsapp, "¡Hola! Tengo una pregunta 🧁")} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-semibold text-mint-700 shadow-soft">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {store.instagram && (
              <a href={`https://instagram.com/${store.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-semibold text-rose-600 shadow-soft">
                <Instagram className="h-4 w-4" /> @{store.instagram.replace(/^@/, "")}
              </a>
            )}
            {store.address && (
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-cocoa-500 shadow-soft">
                <MapPin className="h-4 w-4" /> {store.address}
              </span>
            )}
          </div>
          <p className="mt-3 text-xs text-cocoa-400">
            Pedidos con {store.min_notice_days} día{store.min_notice_days === 1 ? "" : "s"} de anticipación
            {store.delivery ? ` · Envío ${Number(store.shipping_fee) ? money(store.shipping_fee) : "disponible"}` : ""}
          </p>
        </div>
      </header>

      {/* Categorías */}
      <nav className="sticky top-0 z-30 mt-6 border-y border-cocoa-800/5 bg-cream-100/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition", cat === c ? "bg-rose-500 text-white shadow-rose" : "bg-white text-cocoa-500 shadow-soft")}>
              {c}
            </button>
          ))}
        </div>
      </nav>

      {/* Productos */}
      <main className="mx-auto max-w-5xl px-4 pt-6">
        {products.length === 0 ? (
          <div className="py-20 text-center text-cocoa-400">
            <CakeSlice className="mx-auto mb-3 h-10 w-10 text-rose-300" />
            Muy pronto verás aquí nuestros postres.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {list.map((p, i) => (
              <article key={p.id} className="card group flex flex-col overflow-hidden animate-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                <button onClick={() => setDetail(p)} className="relative aspect-square overflow-hidden bg-cream-200">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="sprinkles grid h-full w-full place-items-center"><CakeSlice className="h-12 w-12 text-rose-300" /></div>
                  )}
                </button>
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <p className="text-[11px] font-bold tracking-wider text-mint-600 uppercase">{p.category}</p>
                  <h3 className="mt-0.5 font-display text-base leading-tight font-semibold sm:text-lg">{p.name}</h3>
                  {p.description && <p className="mt-1 line-clamp-2 hidden text-sm text-cocoa-400 sm:block">{p.description}</p>}
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <p className="font-display text-lg font-semibold text-rose-500 sm:text-xl">
                      {money(p.price).replace(".00", "")}
                      <span className="block text-[11px] font-normal text-cocoa-400 sm:inline sm:pl-1">/ {p.unit_label}</span>
                    </p>
                    {cart[p.id] ? (
                      <div className="flex items-center gap-1 rounded-full bg-rose-50 p-1">
                        <button onClick={() => add(p.id, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-white text-rose-500 shadow-sm" aria-label="Quitar uno"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-5 text-center text-sm font-bold text-rose-600">{cart[p.id]}</span>
                        <button onClick={() => add(p.id)} className="grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-white" aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => add(p.id)} className="grid h-10 w-10 place-items-center rounded-full bg-rose-500 text-white shadow-rose transition hover:bg-rose-600 active:scale-95" aria-label={`Agregar ${p.name}`}>
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <footer className="mt-16 text-center">
          <p className="font-script text-2xl text-rose-400">Hechos con amor de hogar</p>
          <p className="mt-1 text-xs text-cocoa-300">Tienda creada con Dulces Detalles</p>
        </footer>
      </main>

      {/* Barra de carrito */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 pb-safe">
          <button onClick={() => setOpen(true)} className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-cocoa-800 py-3 pr-3 pl-6 text-cream-100 shadow-lift animate-fade-up">
            <span className="flex items-center gap-3 font-bold">
              <ShoppingBag className="h-5 w-5" /> {count} {count === 1 ? "postre" : "postres"}
            </span>
            <span className="rounded-full bg-rose-500 px-5 py-2.5 font-bold text-white">Ver pedido · {money(subtotal).replace(".00", "")}</span>
          </button>
        </div>
      )}

      {/* Detalle */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} size="md"
        footer={detail && <Button className="w-full sm:w-auto" onClick={() => { add(detail.id); setDetail(null); toast.success("Agregado a tu pedido"); }}><Plus className="h-4 w-4" /> Agregar · {money(detail.price)}</Button>}
      >
        {detail && (
          <div>
            {detail.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={detail.image_url} alt={detail.name} className="mb-4 aspect-[4/3] w-full rounded-3xl object-cover" />
            )}
            <p className="text-[15px] leading-relaxed text-cocoa-500">{detail.description || "Delicioso postre hecho en casa con ingredientes de calidad."}</p>
            <p className="mt-3 font-display text-2xl font-semibold text-rose-500">{money(detail.price)} <span className="text-sm font-normal text-cocoa-400">/ {detail.unit_label}</span></p>
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
            <a href={done.wa} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-mint-500 px-6 py-3 font-bold text-white">
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
                    <button type="button" onClick={() => add(l.id, -1)} className="grid h-7 w-7 place-items-center rounded-full text-rose-500" aria-label="Quitar uno">{l.qty === 1 ? <X className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}</button>
                    <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                    <button type="button" onClick={() => add(l.id)} className="grid h-7 w-7 place-items-center rounded-full text-rose-500" aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <p className="w-20 text-right font-semibold tabular-nums">{money(l.qty * l.price)}</p>
                </li>
              ))}
            </ul>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Tu nombre" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <Input label="WhatsApp" type="tel" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="998 123 4567" />
              <Input label="Fecha de entrega" type="date" required min={minDate} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
              <Input label="Hora aproximada" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
              {store.pickup && store.delivery && (
                <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                  {(["recoger", "envio"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setF({ ...f, type: t })} className={cn("flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold", f.type === t ? "border-rose-300 bg-rose-50 text-rose-600" : "border-cocoa-800/10 text-cocoa-500")}>
                      {t === "envio" ? <Truck className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      {t === "envio" ? `Envío${Number(store.shipping_fee) ? ` (+${money(store.shipping_fee)})` : ""}` : "Paso a recoger"}
                    </button>
                  ))}
                </div>
              )}
              {f.type === "envio" && <Input className="sm:col-span-2" label="Dirección de entrega" required value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}
              <Textarea className="sm:col-span-2" label="Notas (opcional)" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Mensaje para el pastel, alergias, colores…" />
            </div>
            <div className="rounded-3xl bg-cocoa-800 p-5 text-cream-100">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div>
              {shipping > 0 && <div className="mt-1 flex justify-between text-sm"><span>Envío</span><span className="tabular-nums">{money(shipping)}</span></div>}
              <div className="mt-2 flex items-end justify-between border-t border-white/10 pt-3">
                <span className="font-bold">Total</span>
                <span className="font-display text-3xl font-semibold text-white tabular-nums">{money(subtotal + shipping)}</span>
              </div>
            </div>
            <Button type="submit" size="lg" variant="mint" className="w-full" loading={sending}>
              <MessageCircle className="h-5 w-5" /> Enviar pedido por WhatsApp
            </Button>
            <p className="text-center text-xs text-cocoa-400">Confirmaremos disponibilidad y forma de pago por WhatsApp.</p>
          </form>
        )}
      </Modal>
    </div>
  );
}
