"use client";
import { FestiveCluster, FestiveParticles, useFestive, useFestiveDecor } from "@/components/festive/Festive";
import { FestiveSwags, SeasonLogo } from "@/components/festive/Decor";
import { storeSkinCss } from "@/lib/festiveSkin";
import type { FestiveId } from "@/lib/festive";
import { BizLogo } from "./BizLogo";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CakeSlice, CalendarDays, Check, FileText, Mail, ChevronLeft, ChevronRight, Clock, Facebook, Gift, Instagram, Loader2, ShieldAlert, Ticket, Wand2, Quote as QuoteIcon, MapPin, Megaphone, MessageCircle, Minus, Plus, ShoppingBag, Sparkles, Star, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { DeliveryCalendar, firstAvailable } from "./DeliveryCalendar";
import { LocationPicker, mapsUrl, type LatLng } from "./LocationPicker";
import { Modal } from "@/components/ui/Modal";
import { dateLong, facebookLabel, facebookUrl, folio, money, toISODate, waLink } from "@/lib/format";
import { normalizeTheme, themeVars, type StoreTheme } from "@/lib/storeTheme";
import { decorTiles } from "@/lib/storeDecor";
import { cn } from "@/lib/cn";
import type { CustomCakeSettings, DeliveryZone, VariantGroup } from "@/lib/types";
import { CustomCakeForm } from "./CustomCakeForm";
import { reviewPhotoUrl } from "@/lib/public-photos";
import { allergenLabel, containsText } from "@/lib/allergens";

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
  season_id?: string | null;
  allergens?: string[];
  may_contain?: string[];
  shelf_life_days?: number | null;
  storage_note?: string | null;
  ingredients_label?: string | null;
};
export type StoreSeason = { id: string; name: string; emoji: string | null; banner: string | null; end_date: string };
export type StoreReview = { id: string; name: string | null; rating: number; comment: string | null; photo_path: string | null; date: string };
export type StorePackage = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  mode: "fijo" | "surtido";
  pieces: number;
  price: number;
  min_notice_days?: number | null;
  /** cupcakes · pastel (pastel mini + cupcakes) · postres (fijo) */
  kind?: "cupcakes" | "pastel" | "postres";
  /** Pasteles mini por paquete (solo pastel) */
  cakes?: number | null;
  /** fijo: lo que trae (qty) · surtido: sabores para elegir (con su categoría) */
  options: { dessert_id: string; name: string; image_url: string | null; qty: number | null; price: number | null; group?: string | null }[];
  /** Sabores de pastel mini (solo pastel) */
  cake_options?: { dessert_id: string; name: string; image_url: string | null; price: number | null }[];
  /** Caja o empaque (ya viene incluida en price) */
  box_price?: number | null;
  /** Extras que se ofrecen con este paquete */
  extras?: string[];
};
export type StoreExtra = { id: string; name: string; description: string | null; image_url: string | null; price: number };
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
    custom_cake?: CustomCakeSettings | null;
    has_coupons?: boolean;
  };
  products: StoreProduct[];
  packages?: StorePackage[];
  extras?: StoreExtra[];
  seasons?: StoreSeason[];
  reviews?: StoreReview[];
  rating?: { avg: number | null; count: number } | null;
};

type Choice = { group: string; option: string };
type CartLine = { id: string; qty: number; options: Choice[] };
type BoxChoice = { dessert_id: string; qty: number };
type PackLine = { id: string; qty: number; choices: BoxChoice[] };

const packKey = (id: string, choices: BoxChoice[]) =>
  `${id}|${[...choices].sort((a, b) => a.dessert_id.localeCompare(b.dessert_id)).map((c) => `${c.dessert_id}x${c.qty}`).join(",")}`;
/** Lo que costarían las piezas sueltas (si se venden sueltas en la tienda) */
function regularOf(k: StorePackage) {
  if (k.mode === "fijo") {
    if (k.options.some((o) => o.price == null)) return 0;
    return k.options.reduce((a, o) => a + Number(o.qty ?? 0) * Number(o.price), 0);
  }
  const prices = k.options.map((o) => o.price).filter((x): x is number => x != null).map(Number);
  if (!prices.length) return 0;
  if (!isCakePack(k)) return Math.max(...prices) * k.pieces;
  const cakes = (k.cake_options ?? []).map((o) => o.price).filter((x): x is number => x != null).map(Number);
  return cakes.length ? Math.max(...prices) * k.pieces + Math.max(...cakes) * cakesOf(k) : 0;
}
const isCakePack = (k: StorePackage) => k.kind === "pastel";
const cakesOf = (k: StorePackage) => (isCakePack(k) ? Number(k.cakes) || 1 : 0);
/** Cuántos pasteles mini y cupcakes lleva una elección */
function splitChoice(k: StorePackage, choices: { dessert_id: string; qty: number }[]) {
  const cakeIds = new Set((isCakePack(k) ? k.cake_options ?? [] : []).map((o) => o.dessert_id));
  let cakes = 0;
  let cups = 0;
  for (const c of choices) (cakeIds.has(c.dessert_id) ? (cakes += c.qty) : (cups += c.qty));
  return { cakes, cups };
}
/** Sabores agrupados por categoría, en el orden que llegan */
function byGroup<T extends { group?: string | null }>(opts: T[]) {
  const out: { name: string; items: T[] }[] = [];
  for (const o of opts) {
    const name = o.group ?? "";
    const last = out[out.length - 1];
    if (last && last.name === name) last.items.push(o);
    else out.push({ name, items: [o] });
  }
  return out;
}

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
  const packages = useMemo(() => (data.packages ?? []).filter((k) => k.options?.length && (!isCakePack(k) || k.cake_options?.length)), [data.packages]);
  const seasons = data.seasons ?? [];
  const seasonById = useMemo(() => new Map((data.seasons ?? []).map((x) => [x.id, x])), [data.seasons]);
  const reviews = data.reviews ?? [];
  const [cakeOpen, setCakeOpen] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const theme: StoreTheme = useMemo(() => normalizeTheme(store.theme), [store.theme]);
  // Fechas especiales (Navidad, 14 de febrero, Día de Muertos…)
  const fest = useFestive(theme.festive);
  // Ilustraciones de temporada en las esquinas de las tarjetas de la tienda
  const rootRef = useRef<HTMLDivElement>(null);
  useFestiveDecor(fest, rootRef);
  const vars = useMemo(() => themeVars(fest && theme.festiveColors ? { ...theme, ...fest.colors } : theme), [theme, fest]);
  const decor = useMemo(() => decorTiles(theme), [theme]);
  const storageKey = `dd-cart-${slug}`;
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [packCart, setPackCart] = useState<Record<string, PackLine>>({});
  const [box, setBox] = useState<StorePackage | null>(null);
  // Cada caja que pide la clienta lleva sus propios sabores
  const [boxes, setBoxes] = useState<Record<string, number>[]>([{}]);
  const [boxIdx, setBoxIdx] = useState(0);
  const [boxExtras, setBoxExtras] = useState<Record<string, number>>({});
  const [extrasCart, setExtrasCart] = useState<Record<string, number>>({});
  const storeExtras = useMemo(() => data.extras ?? [], [data.extras]);
  const [cat, setCat] = useState("Todo");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<StoreProduct | null>(null);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [detailQty, setDetailQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [done, setDone] = useState<{ folio: number; total: number; wa: string; token: string | null; email: string | null } | null>(null);
  const today = store.today ?? toISODate(new Date());
  const unavailable = useMemo(() => store.unavailable_dates ?? [], [store.unavailable_dates]);
  const zones = useMemo(() => (store.zones ?? []).filter((z) => z?.name), [store.zones]);
  const [f, setF] = useState({
    name: "", phone: "", email: "", date: firstAvailable(today, store.min_notice_days, unavailable), time: "",
    type: store.pickup ? "recoger" : "envio", address: "", notes: "", zone: "",
  });
  const [sending, setSending] = useState(false);
  const [loc, setLoc] = useState<LatLng | null>(null);

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
      const rawPacks = localStorage.getItem(`${storageKey}-cajas`);
      if (rawPacks) setPackCart(JSON.parse(rawPacks) as Record<string, PackLine>);
      const rawExtras = localStorage.getItem(`${storageKey}-extras`);
      if (rawExtras) setExtrasCart(JSON.parse(rawExtras) as Record<string, number>);
    } catch {}
  }, [storageKey, preview]);
  useEffect(() => {
    if (preview) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
      localStorage.setItem(`${storageKey}-cajas`, JSON.stringify(packCart));
      localStorage.setItem(`${storageKey}-extras`, JSON.stringify(extrasCart));
    } catch {}
  }, [cart, packCart, extrasCart, storageKey, preview]);

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
  const seasonal = products.filter((p) => p.season_id && seasonById.has(p.season_id));
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
  const packsById = useMemo(() => new Map(packages.map((k) => [k.id, k])), [packages]);
  const packLines = Object.entries(packCart)
    .map(([key, l]) => {
      const k = packsById.get(l.id);
      if (!k || l.qty <= 0) return null;
      // Descarta cajas cuyo contenido ya no es válido (cambió el paquete)
      const nameOf = (id: string) => k.options.find((o) => o.dessert_id === id)?.name ?? k.cake_options?.find((o) => o.dessert_id === id)?.name ?? "";
      if (k.mode === "surtido") {
        const { cakes, cups } = splitChoice(k, l.choices);
        if (cakes !== cakesOf(k) || cups !== k.pieces || !l.choices.every((c) => nameOf(c.dessert_id))) return null;
      }
      const label =
        k.mode === "surtido"
          ? l.choices.map((c) => `${c.qty} ${isCakePack(k) && k.cake_options?.some((o) => o.dessert_id === c.dessert_id) ? "Pastel mini " : ""}${nameOf(c.dessert_id)}`).join(", ")
          : k.options.map((o) => `${Number(o.qty)} ${o.name}`).join(", ");
      return { key, k, qty: l.qty, choices: l.choices, unit: Number(k.price), label };
    })
    .filter(Boolean) as { key: string; k: StorePackage; qty: number; choices: BoxChoice[]; unit: number; label: string }[];
  const count = lines.reduce((a, l) => a + l.qty, 0) + packLines.reduce((a, l) => a + l.qty, 0);
  const extraLines = storeExtras
    .filter((x) => (extrasCart[x.id] ?? 0) > 0)
    .map((x) => ({ x, qty: extrasCart[x.id], unit: Number(x.price) }));
  const subtotal =
    lines.reduce((a, l) => a + l.qty * l.unit, 0) + packLines.reduce((a, l) => a + l.qty * l.unit, 0) + extraLines.reduce((a, l) => a + l.qty * l.unit, 0);
  const addExtra = (id: string, d = 1) =>
    setExtrasCart((c) => {
      const n = Math.max(0, Math.min(99, (c[id] ?? 0) + d));
      const next = { ...c, [id]: n };
      if (!n) delete next[id];
      return next;
    });
  // El cupón se recalcula si cambia el carrito (el servidor vuelve a validar al enviar)
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const zone = zones.find((z) => z.name === f.zone);
  const shipping = f.type === "envio" ? (zones.length ? Number(zone?.fee ?? 0) : Number(store.shipping_fee)) : 0;
  const minNotice = Math.max(store.min_notice_days, ...lines.map((l) => Number(l.p.min_notice_days ?? 0)), ...packLines.map((l) => Number(l.k.min_notice_days ?? 0)));
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
  const addPack = (id: string, choices: BoxChoice[] = [], d = 1) =>
    setPackCart((c) => {
      const key = packKey(id, choices);
      const n = Math.max(0, (c[key]?.qty ?? 0) + d);
      const next = { ...c, [key]: { id, qty: n, choices } };
      if (!n) delete next[key];
      return next;
    });

  function openBox(k: StorePackage) {
    if (preview) return toast.info("Vista previa: aquí tu clienta arma su caja");
    setBox(k);
    setBoxes([{}]);
    setBoxIdx(0);
    setBoxExtras({});
  }
  const toChoices = (x: Record<string, number>) => Object.entries(x).map(([dessert_id, qty]) => ({ dessert_id, qty }));
  const boxChoices = boxes[boxIdx] ?? {};
  const boxCakes = box ? cakesOf(box) : 0;
  const isBoxReady = (x: Record<string, number>) => {
    if (!box) return false;
    const sp = splitChoice(box, toChoices(x));
    return sp.cups === box.pieces && sp.cakes === boxCakes;
  };
  const boxSplit = box ? splitChoice(box, toChoices(boxChoices)) : { cakes: 0, cups: 0 };
  const boxTotal = boxSplit.cups;
  const boxReady = isBoxReady(boxChoices);
  const pendingBox = boxes.findIndex((x) => !isBoxReady(x));
  const boxExtrasTotal = Object.entries(boxExtras).reduce((a, [id, n]) => a + n * Number(storeExtras.find((x) => x.id === id)?.price ?? 0), 0);
  const setBoxCount = (n: number) => {
    setBoxes((b) => (n > b.length ? [...b, ...Array.from({ length: n - b.length }, () => ({}))] : b.slice(0, n)));
    setBoxIdx((i) => (n > boxes.length ? boxes.length : Math.min(i, n - 1)));
  };
  const setCurrentBox = (fn: (x: Record<string, number>) => Record<string, number>) => setBoxes((b) => b.map((x, i) => (i === boxIdx ? fn(x) : x)));
  const setFlavor = (id: string, d: number) =>
    setCurrentBox((x) => {
      if (!box) return x;
      const { cakes, cups } = splitChoice(box, Object.entries(x).map(([dessert_id, qty]) => ({ dessert_id, qty })));
      const isCake = isCakePack(box) && (box.cake_options ?? []).some((o) => o.dessert_id === id);
      // Con un solo pastel, tocar otro sabor lo cambia en lugar de bloquearse
      if (d > 0 && isCake && cakes >= cakesOf(box)) {
        if (cakesOf(box) !== 1) return x;
        const next = { ...x };
        for (const o of box.cake_options ?? []) delete next[o.dessert_id];
        return { ...next, [id]: 1 };
      }
      if (d > 0 && !isCake && cups >= box.pieces) return x;
      const n = Math.max(0, (x[id] ?? 0) + d);
      const next = { ...x, [id]: n };
      if (!n) delete next[id];
      return next;
    });

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

  async function applyCoupon(code: string, quiet = false) {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setCheckingCoupon(true);
    const { data: r, error } = await createClient().rpc("check_store_coupon", { p_slug: slug, p_code: c, p_subtotal: subtotal });
    setCheckingCoupon(false);
    if (error) return quiet ? setCoupon(null) : toast.error(error.message);
    if (!r?.ok) {
      setCoupon(null);
      if (!quiet) toast.error(r?.message ?? "Cupón no válido");
      return;
    }
    setCoupon({ code: r.code, discount: Number(r.discount), label: r.label });
    if (!quiet) toast.success(`Cupón aplicado: ${r.label} 🎉`);
  }
  // Si cambia el carrito, se vuelve a calcular el descuento del cupón
  useEffect(() => {
    if (coupon && !preview) applyCoupon(coupon.code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (!lines.length && !packLines.length) return toast.error("Agrega al menos un postre o una caja");
    if (f.type === "envio" && !f.address.trim()) return toast.error("Escribe la dirección de entrega");
    if (f.type === "envio" && zones.length && !zone) return toast.error("Elige tu zona de entrega");
    if (!f.date) return toast.error("Elige la fecha de entrega");
    const email = f.email.trim();
    if (email && !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) return toast.error("Revisa tu correo electrónico");
    setSending(true);
    // Se abre la ventana antes de esperar al servidor: los celulares bloquean ventanas abiertas después
    const popup = window.open("", "_blank");
    const { data: res, error } = await createClient().rpc("place_store_order", {
      p_slug: slug,
      p_name: f.name,
      p_phone: f.phone,
      p_email: email,
      p_delivery_date: f.date || null,
      p_delivery_time: f.time || null,
      p_delivery_type: f.type,
      p_address: f.address,
      p_notes: f.notes,
      p_items: [
        ...lines.map((l) => ({ dessert_id: l.p.id, quantity: l.qty, options: l.options })),
        ...packLines.map((l) => ({ package_id: l.k.id, quantity: l.qty, choices: l.choices })),
        ...extraLines.map((l) => ({ extra_id: l.x.id, quantity: l.qty })),
      ],
      p_zone: f.type === "envio" && zone ? zone.name : null,
      ...(coupon ? { p_coupon: coupon.code } : {}),
      // Ubicación marcada en el mapa (migración 0019)
      ...(f.type === "envio" && loc ? { p_coupon: coupon?.code ?? null, p_lat: loc.lat, p_lng: loc.lng } : {}),
    });
    setSending(false);
    if (error) {
      popup?.close();
      return toast.error(error.message);
    }
    const text =
      `¡Hola ${store.business_name}! 🧁 Quiero hacer un pedido (${folio("P", res.folio)}):\n\n` +
      [
        ...lines.map((l) => `• ${l.qty} × ${l.p.name}${l.label ? ` (${l.label})` : ""} — ${money(l.qty * l.unit)}`),
        ...packLines.map((l) => `• ${l.qty} × 🎁 ${l.k.name} (${l.label}) — ${money(l.qty * l.unit)}`),
        ...extraLines.map((l) => `• ${l.qty} × 🎀 ${l.x.name} — ${money(l.qty * l.unit)}`),
      ].join("\n") +
      `\n\n${res.discount ? `Cupón ${res.coupon}: -${money(res.discount)}\n` : ""}${shipping ? `Envío: ${money(shipping)}\n` : ""}*Total: ${money(res.total)}*\n\n` +
      `📅 ${f.date ? dateLong(f.date) : "Fecha por confirmar"}${f.time ? ` a las ${f.time}` : ""}\n` +
      `${f.type === "envio" ? `🚚 Envío${zone ? ` (${zone.name})` : ""} a: ${f.address}` : "🏠 Paso a recoger"}\n` +
      (f.type === "envio" && loc ? `📍 Ubicación: ${mapsUrl(loc)}\n` : "") +
      `👤 ${f.name} · ${f.phone}` +
      (f.notes ? `\n📝 ${f.notes}` : "") +
      (res.token ? `\n\n🔎 Sigue mi pedido: ${window.location.origin}/seguimiento/${res.token}` : "");
    const wa = waLink(store.whatsapp, text);
    setDone({ folio: res.folio, total: res.total, wa, token: res.token ?? null, email: email || null });
    // Copia del pedido en PDF al correo de la clienta (si lo escribió)
    if (email && res.token) {
      fetch("/api/tienda/pedido-correo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: res.token }) }).catch(() => {});
    }
    // Aviso push a la repostería (si tiene la app con notificaciones activas)
    fetch("/api/push/pedido", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: res.order_id }) }).catch(() => {});
    setCart({});
    setPackCart({});
    setExtrasCart({});
    setLoc(null);
    setCoupon(null);
    setCouponInput("");
    if (popup && !popup.closed) popup.location.href = wa;
  }

  const btnPrimary = "bg-[var(--st-primary)] text-[var(--st-on-primary)] transition hover:brightness-95 active:scale-95";
  const card = "fest-card overflow-hidden rounded-[var(--st-radius)] bg-[var(--st-surface)] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_10px_28px_-12px_rgb(0_0_0/0.18)] ring-1 ring-[var(--st-line)]";

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
        {seasonal.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 px-4">
              <span className="text-2xl">{seasonById.get(seasonal[0].season_id!)?.emoji || "✨"}</span>
              <h2 className="text-2xl font-semibold">{seasons.length === 1 ? `Especial de ${seasons[0].name}` : "De temporada"}</h2>
            </div>
            <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
              {seasonal.map((p) => (
                <div key={p.id} className="w-[46%] shrink-0 snap-start @xl:w-[31%] @4xl:w-[23%]">
                  <article className={cn(card, "group flex h-full flex-col")}>
                    <button onClick={() => openDetail(p)} className="relative aspect-[4/5] overflow-hidden">
                      {productImg(p)}
                      <span className="absolute top-2 left-2 rounded-full bg-[var(--st-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--st-on-accent)]">
                        {seasonById.get(p.season_id!)?.emoji} Solo por temporada
                      </span>
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
          </div>
        )}
        {packages.length > 0 && (
          <div className="mb-8 px-4">
            <div className="mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-[var(--st-accent)]" />
              <h2 className="text-2xl font-semibold">Cajas y paquetes</h2>
            </div>
            <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
              {packages.map((k) => {
                const regular = regularOf(k);
                const save = regular - Number(k.price);
                const inCart = packLines.filter((l) => l.k.id === k.id).reduce((a, l) => a + l.qty, 0);
                return (
                  <article key={k.id} className={cn(card, "group flex gap-3 p-2.5 @xl:p-3")}>
                    <button onClick={() => (k.mode === "surtido" ? openBox(k) : undefined)} className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[calc(var(--st-radius)*0.7)] @xl:w-32">
                      {k.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={k.image_url} alt={k.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="sprinkles grid h-full w-full place-items-center bg-[var(--st-soft)]"><Gift className="h-10 w-10 text-[var(--st-primary)] opacity-60" /></div>
                      )}
                      {save > 0.5 && (
                        <span className="absolute top-1.5 left-1.5 rounded-full bg-[var(--st-accent)] px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-[var(--st-on-accent)]">Ahorra {k.mode === "surtido" ? "hasta " : ""}{price(save)}</span>
                      )}
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col py-1">
                      <h3 className="text-lg leading-tight font-semibold">{k.name}</h3>
                      <p className="mt-0.5 line-clamp-2 text-sm text-[var(--st-muted)]">
                        {k.description || (isCakePack(k) ? `${cakesOf(k) === 1 ? "Pastel mini" : `${cakesOf(k)} pasteles mini`} + ${k.pieces} cupcakes a elegir` : k.mode === "surtido" ? `Elige ${k.pieces} piezas: ${k.options.map((o) => o.name).join(", ")}` : k.options.map((o) => `${Number(o.qty)} ${o.name}`).join(" + "))}
                      </p>
                      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                        <p className="text-lg font-bold text-[var(--st-primary)]">
                          {price(k.price)}
                          <span className="block text-[11px] font-normal text-[var(--st-muted)]">
                            {isCakePack(k) ? `${cakesOf(k)} pastel${cakesOf(k) === 1 ? "" : "es"} + ${k.pieces} cupcakes` : k.mode === "surtido" ? `${k.pieces} piezas · ${price(Number(k.price) / k.pieces)} c/u` : `${k.pieces} piezas`}
                            {k.mode === "fijo" && regular > Number(k.price) + 0.5 ? <> · <s>{price(regular)}</s></> : null}
                          </span>
                        </p>
                        {k.mode === "surtido" ? (
                          <button onClick={() => openBox(k)} className={cn("relative shrink-0 rounded-full px-4 py-2 text-sm font-bold shadow-md", btnPrimary)}>
                            {isCakePack(k) ? "Armar" : "Armar caja"}
                            {inCart > 0 && <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--st-text)] px-1 text-[10px] font-bold text-[var(--st-bg)]">{inCart}</span>}
                          </button>
                        ) : inCart ? (
                          <div className="flex items-center gap-1 rounded-full bg-[var(--st-soft)] p-1">
                            <button onClick={() => addPack(k.id, [], -1)} className="grid h-7 w-7 place-items-center rounded-full bg-[var(--st-surface)] text-[var(--st-primary)] shadow-sm" aria-label="Quitar uno"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="w-5 text-center text-sm font-bold text-[var(--st-text)]">{inCart}</span>
                            <button onClick={() => addPack(k.id)} className={cn("grid h-7 w-7 place-items-center rounded-full", btnPrimary)} aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              addPack(k.id);
                              if (!preview) toast.success(`${k.name} agregado`, { duration: 1200 });
                            }}
                            className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-md", btnPrimary)}
                            aria-label={`Agregar ${k.name}`}
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
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
          {products.length === 0 && packages.length === 0 ? (
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
    pastel: store.custom_cake?.enabled ? (
      <section key="pastel" className="px-4 pt-10">
        <div className={cn(card, "sprinkles relative overflow-hidden p-6 text-center @2xl:p-10")}>
          <p className="text-4xl">🎂</p>
          <h2 className="mt-2 text-2xl font-semibold @2xl:text-3xl">¿Buscas un pastel personalizado?</h2>
          <p className="mx-auto mt-2 max-w-lg text-[15px] text-[var(--st-muted)]">
            Cuéntanos tu idea (personas, sabor, decoración y fotos de referencia) y te mandamos la cotización por WhatsApp.
          </p>
          <button onClick={() => (preview ? toast.info("Vista previa: aquí tus clientas piden su pastel") : setCakeOpen(true))} className={cn("mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold shadow-md", btnPrimary)}>
            <Wand2 className="h-4 w-4" /> Cotizar mi pastel
          </button>
        </div>
      </section>
    ) : null,
    resenas: reviews.length ? (
      <section key="resenas" className="pt-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-4">
          <h2 className="text-2xl font-semibold">Lo que dicen nuestras clientas</h2>
          {data.rating && data.rating.count >= 3 && data.rating.avg != null && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--st-muted)]">
              <Star className="h-4 w-4 fill-[var(--st-accent)] text-[var(--st-accent)]" /> {Number(data.rating.avg).toFixed(1)} · {data.rating.count} reseñas
            </p>
          )}
        </div>
        <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
          {reviews.map((r) => {
            const photo = reviewPhotoUrl(r.photo_path);
            return (
              <article key={r.id} className={cn(card, "flex w-[80%] shrink-0 snap-start flex-col @xl:w-[45%] @4xl:w-[31%]")}>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <p className="flex gap-0.5" aria-label={`${r.rating} de 5 estrellas`}>
                    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-4 w-4", n <= r.rating ? "fill-[var(--st-accent)] text-[var(--st-accent)]" : "text-[var(--st-line)]")} />)}
                  </p>
                  {r.comment && (
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--st-text)]">
                      <QuoteIcon className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 text-[var(--st-primary)] opacity-60" />
                      {r.comment}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-[var(--st-muted)]">— {r.name || "Clienta"}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    ) : null,
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
  const logo = store.logo_url || null;

  // ---------- Portada ----------
  const hero =
    theme.hero === "portada" ? (
      <header className="relative">
        <div className="relative h-72 overflow-hidden @2xl:h-96">
          {store.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.banner_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div data-fs={fest ? "sbanner" : undefined} className="sprinkles h-full w-full bg-[var(--st-soft)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 @2xl:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {fest && logo ? (
              <SeasonLogo theme={fest} src={logo} alt={store.business_name} className="h-28 w-28 @2xl:h-32 @2xl:w-32" />
            ) : (
              <BizLogo src={logo} name={store.business_name} className="h-20 w-20 shrink-0 bg-white text-[80px] shadow-lg ring-4 ring-white/80 @2xl:h-24 @2xl:w-24 @2xl:text-[96px]" />
            )}
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
        {fest && logo ? (
          <SeasonLogo theme={fest} src={logo} alt={store.business_name} className="h-20 w-20" />
        ) : (
          <BizLogo src={logo} name={store.business_name} className="h-16 w-16 shrink-0 bg-[var(--st-surface)] text-[64px] ring-1 ring-[var(--st-line)]" />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl leading-tight font-semibold @2xl:text-3xl">{store.title}</h1>
          {store.description && <p className="line-clamp-2 text-sm text-[var(--st-muted)]">{store.description}</p>}
        </div>
      </header>
    ) : (
      <header className="relative">
        <div data-fs={fest && !store.banner_url ? "sbanner" : undefined} className={cn("relative h-40 overflow-hidden @2xl:h-60", !store.banner_url && "sprinkles bg-[var(--st-soft)]")}>
          {store.banner_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.banner_url} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--st-bg)]" />
        </div>
        <div className="relative mx-auto -mt-16 max-w-3xl px-4 text-center @2xl:-mt-20">
          {fest && logo ? (
            // En temporada: logo sin círculo, fundido con un resplandor y con los adornos de la temporada alrededor
            <SeasonLogo theme={fest} src={logo} alt={store.business_name} className="mx-auto h-44 w-44 @2xl:h-56 @2xl:w-56" compact={false} />
          ) : (
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-[var(--st-surface)] shadow-lg ring-4 ring-[var(--st-surface)] @2xl:h-40 @2xl:w-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <BizLogo src={logo} name={store.business_name} className="h-full w-full text-[128px] @2xl:text-[160px]" />
            </div>
          )}
          <h1 className="mt-4 text-3xl font-semibold @2xl:text-4xl">{store.title}</h1>
          {store.description && <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--st-muted)]">{store.description}</p>}
        </div>
      </header>
    );

  return (
    <div
      ref={rootRef}
      data-fs={fest ? "store" : undefined}
      className={cn("st-root @container relative bg-[var(--st-bg)] text-[var(--st-text)]", preview ? "min-h-full" : "min-h-dvh")}
      style={decor.pattern ? { ...vars, backgroundImage: decor.pattern.image, backgroundSize: `${decor.pattern.width}px ${decor.pattern.height}px` } : vars}
    >
      {announcementVisible && (
        <div className="flex items-center justify-center gap-2 bg-[var(--st-primary)] px-4 py-2 text-center text-[13px] font-semibold text-[var(--st-on-primary)]">
          <Megaphone className="h-4 w-4 shrink-0" /> {store.announcement}
        </div>
      )}
      {fest && !seasons.length && (
        <div className="flex items-center justify-center gap-2 bg-[var(--st-accent)] px-4 py-2 text-center text-[13px] font-semibold text-[var(--st-on-accent)]">{fest.store}</div>
      )}
      {seasons.filter((x) => x.banner || x.name).slice(0, 2).map((x) => (
        <div key={x.id} className="flex items-center justify-center gap-2 bg-[var(--st-accent)] px-4 py-2 text-center text-[13px] font-semibold text-[var(--st-on-accent)]">
          <span>{x.emoji || "✨"}</span>
          <span>{x.banner || `Temporada de ${x.name}`} · hasta el {dateLong(x.end_date).replace(/^[a-záéíóúñ]+, /i, "")}</span>
        </div>
      ))}
      <div className={cn("relative", (decor.edge || fest) && theme.hero === "minimal" && "pt-10")}>
        {fest ? <FestiveSwags theme={fest} /> : decor.edge && <DecorEdge tile={decor.edge} />}
        {fest && (
          <>
            <FestiveCluster theme={fest} corner="bl" size={170} />
            <FestiveCluster theme={fest} corner="br" size={170} />
          </>
        )}
        {hero}
      </div>

      {fest && <FestiveParticles theme={fest} count={preview ? 10 : 14} contained={preview} />}
      {fest && <StoreSkinStyle id={fest.id} />}
      <main className="relative mx-auto max-w-6xl pb-32">
        {fest && (
          <>
            <FestiveCluster theme={fest} corner="bl" size={160} />
            <FestiveCluster theme={fest} corner="br" size={160} />
          </>
        )}
        {theme.sections
          .filter((s) => s.visible && s.id !== "anuncio")
          .map((s, i) => (
            <Fragment key={s.id}>
              {decor.edge && i > 0 && sections[s.id] && <DecorDivider tile={decor.edge} />}
              {sections[s.id]}
            </Fragment>
          ))}
        {decor.edge && <DecorDivider tile={decor.edge} wide />}
        <footer className="mt-14 px-4 text-center">
          <p className="font-script text-2xl text-[var(--st-primary)]">Hechos con amor de hogar</p>
          <p className="mt-1 text-xs text-[var(--st-muted)]">Tienda creada con Dulces Detalles</p>
          {!preview && <SiteFooter compact social={false} className="pb-2" />}
        </footer>
      </main>

      {/* Barra de carrito */}
      {count > 0 && (
        <div className={cn("inset-x-0 bottom-0 z-40 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]", preview ? "sticky" : "fixed")}>
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
                <QtyStepper label="Cantidad" value={detailQty} max={99} onChange={setDetailQty} />
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
                {((detail.allergens?.length ?? 0) > 0 || (detail.may_contain?.length ?? 0) > 0 || detail.shelf_life_days != null || detail.storage_note || detail.ingredients_label) && (
                  <details className="mt-4 rounded-2xl bg-cream-100 px-4 py-3 text-sm text-cocoa-600">
                    <summary className="flex cursor-pointer items-center gap-2 font-bold text-cocoa-700">
                      <ShieldAlert className="h-4 w-4 text-[var(--st-primary)]" /> Ingredientes y alérgenos
                    </summary>
                    <div className="mt-2 space-y-1.5">
                      {(detail.allergens?.length ?? 0) > 0 && <p><b>Contiene:</b> {containsText(detail.allergens!)}.</p>}
                      {(detail.may_contain?.length ?? 0) > 0 && <p><b>Puede contener:</b> {detail.may_contain!.map((x) => allergenLabel(x).toLowerCase()).join(", ")}.</p>}
                      {detail.ingredients_label && <p><b>Ingredientes:</b> {detail.ingredients_label}</p>}
                      {detail.shelf_life_days != null && <p><b>Consumir en:</b> {detail.shelf_life_days === 0 ? "el mismo día" : `${detail.shelf_life_days} ${detail.shelf_life_days === 1 ? "día" : "días"}`}{detail.storage_note ? ` · ${detail.storage_note}` : ""}</p>}
                      {detail.shelf_life_days == null && detail.storage_note && <p>{detail.storage_note}</p>}
                    </div>
                  </details>
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

          {/* Armar caja surtida */}
          <Modal open={!!box} onClose={() => setBox(null)} title={box?.name}
            description={box ? (isCakePack(box) ? `Elige tu pastel mini y ${box.pieces} cupcakes · ${money(box.price)}` : `Elige ${box.pieces} piezas · ${money(box.price)} la caja`) : undefined} size="md"
            footer={box && (
              <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <QtyStepper label={isCakePack(box) ? "Paquetes" : "Cajas"} value={boxes.length} max={20} onChange={setBoxCount} />
                <button
                  className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 font-bold disabled:opacity-50 sm:w-auto", btnPrimary)}
                  disabled={!boxReady}
                  onClick={() => {
                    // Si falta armar otra caja, el botón lleva a ella
                    if (pendingBox >= 0) return setBoxIdx(pendingBox);
                    for (const x of boxes) addPack(box.id, toChoices(x));
                    for (const [id, n] of Object.entries(boxExtras)) addExtra(id, n);
                    setBox(null);
                    toast.success(boxes.length === 1 ? "Caja agregada a tu pedido 🎁" : `${boxes.length} cajas agregadas a tu pedido 🎁`);
                  }}
                >
                  <Gift className="h-4 w-4" />{" "}
                  {boxSplit.cakes !== boxCakes
                    ? "Elige tu pastel mini"
                    : boxTotal !== box.pieces
                      ? box.pieces - boxTotal === 1 ? "Falta 1 pieza" : `Faltan ${box.pieces - boxTotal} piezas`
                      : pendingBox >= 0
                        ? `Sigue con la ${isCakePack(box) ? "#" : "caja "}${pendingBox + 1} →`
                        : `Agregar${boxes.length === 1 ? "" : ` ${boxes.length}`} · ${money(Number(box.price) * boxes.length + boxExtrasTotal)}`}
                </button>
              </div>
            )}
          >
            {box && (
              <div>
                {box.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={box.image_url} alt={box.name} className="mb-4 aspect-[16/9] w-full rounded-3xl object-cover" />
                )}
                {box.description && <p className="mb-4 text-[15px] leading-relaxed text-cocoa-500">{box.description}</p>}
                {boxes.length > 1 && (
                  <div className="mb-4">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {boxes.map((x, i) => {
                        const ok = isBoxReady(x);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setBoxIdx(i)}
                            className={cn(
                              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 transition",
                              i === boxIdx ? "bg-[var(--st-primary)] text-[var(--st-on-primary)] ring-[var(--st-primary)]" : ok ? "bg-[var(--st-soft)] text-[var(--st-primary)] ring-[var(--st-primary)]/30" : "bg-white text-cocoa-500 ring-cocoa-800/10",
                            )}
                          >
                            {ok && <Check className="h-3.5 w-3.5" />} {isCakePack(box) ? "Paquete" : "Caja"} {i + 1}
                          </button>
                        );
                      })}
                    </div>
                    {boxIdx > 0 && !Object.keys(boxChoices).length && isBoxReady(boxes[boxIdx - 1]) && (
                      <button type="button" onClick={() => setCurrentBox(() => ({ ...boxes[boxIdx - 1] }))} className="mt-2 text-xs font-bold text-[var(--st-primary)] hover:underline">
                        Repetir los sabores de la {isCakePack(box) ? "#" : "caja "}{boxIdx}
                      </button>
                    )}
                  </div>
                )}
                {isCakePack(box) && (
                  <>
                    <StepTitle n={1} done={boxSplit.cakes === boxCakes}>
                      {boxCakes === 1 ? "Elige el sabor de tu pastel mini" : `Elige ${boxCakes} pasteles mini`}
                    </StepTitle>
                    <ul className="mb-5 space-y-2">
                      {(box.cake_options ?? []).map((o) => (
                        <FlavorRow key={o.dessert_id} o={o} n={boxChoices[o.dessert_id] ?? 0} full={boxCakes !== 1 && boxSplit.cakes >= boxCakes} onChange={(d) => setFlavor(o.dessert_id, d)} />
                      ))}
                    </ul>
                    <StepTitle n={2} done={boxTotal === box.pieces}>Elige tus {box.pieces} cupcakes</StepTitle>
                  </>
                )}
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                    <div className="h-full rounded-full bg-[var(--st-primary)] transition-all" style={{ width: `${(boxTotal / box.pieces) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-cocoa-600 tabular-nums">{boxTotal} de {box.pieces}</span>
                </div>
                <div className="space-y-4">
                  {byGroup(box.options).map((g) => (
                    <div key={g.name || "_"}>
                      {g.name && <p className="mb-2 text-xs font-bold tracking-wider text-cocoa-400 uppercase">{g.name}</p>}
                      <ul className="space-y-2">
                        {g.items.map((o) => (
                          <FlavorRow key={o.dessert_id} o={o} n={boxChoices[o.dessert_id] ?? 0} full={boxTotal >= box.pieces} onChange={(d) => setFlavor(o.dessert_id, d)} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {(() => {
                  const offered = storeExtras.filter((x) => (box.extras ?? []).includes(x.id));
                  if (!offered.length) return null;
                  return (
                    <div className="mt-6">
                      <p className="mb-2 flex items-center gap-2 font-semibold text-cocoa-700"><Sparkles className="h-4 w-4 text-[var(--st-primary)]" /> Agrega un detalle</p>
                      <ul className="space-y-2">
                        {offered.map((x) => (
                          <ExtraRow key={x.id} x={x} n={boxExtras[x.id] ?? 0} onChange={(d) => setBoxExtras((e) => { const n = Math.max(0, Math.min(99, (e[x.id] ?? 0) + d)); const next = { ...e, [x.id]: n }; if (!n) delete next[x.id]; return next; })} />
                        ))}
                      </ul>
                    </div>
                  );
                })()}
                {Number(box.min_notice_days ?? 0) > store.min_notice_days && (
                  <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1 text-xs font-semibold text-cocoa-500">
                    <CalendarDays className="h-3.5 w-3.5" /> Pídela con {box.min_notice_days} días de anticipación
                  </p>
                )}
              </div>
            )}
          </Modal>

          {/* Pastel personalizado */}
          {store.custom_cake?.enabled && (
            <Modal open={cakeOpen} onClose={() => setCakeOpen(false)} title="Cotiza tu pastel personalizado" size="lg">
              <CustomCakeForm
                slug={slug}
                cfg={store.custom_cake}
                store={store}
                today={today}
                unavailable={unavailable}
                btnPrimary={btnPrimary}
                onDone={() => setCakeOpen(false)}
              />
            </Modal>
          )}

          {/* Checkout */}
          <Modal open={open} onClose={() => { setOpen(false); setDone(null); }} title={done ? "¡Pedido enviado!" : "Tu pedido"} size="lg">
            {done ? (
              <div className="py-6 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-100 text-mint-600"><Check className="h-8 w-8" /></span>
                <p className="mt-4 font-display text-2xl font-semibold">Folio {folio("P", done.folio)}</p>
                <p className="mt-2 text-cocoa-500">Recibimos tu pedido por {money(done.total)}. Termina de enviarlo por WhatsApp para confirmar tu fecha y forma de pago.</p>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <a href={done.wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl bg-mint-500 px-6 py-3 font-bold text-white">
                    <MessageCircle className="h-5 w-5" /> Abrir WhatsApp
                  </a>
                  {done.token && (
                    <a href={`/pedido/${done.token}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-[var(--st-primary)] ring-1 ring-[var(--st-primary)]/30 hover:bg-[var(--st-soft)]">
                      <FileText className="h-4 w-4" /> Descargar mi pedido en PDF
                    </a>
                  )}
                  {done.token && (
                    <a href={`/seguimiento/${done.token}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--st-primary)] hover:underline">
                      <Truck className="h-4 w-4" /> Seguir mi pedido
                    </a>
                  )}
                  {done.email && <p className="flex items-center gap-1.5 text-sm text-cocoa-400"><Mail className="h-4 w-4" /> También te enviamos una copia a {done.email}</p>}
                </div>
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
                  {packLines.map((l) => (
                    <li key={l.key} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-start gap-1.5 font-semibold leading-snug text-cocoa-700"><Gift className="mt-0.5 h-4 w-4 shrink-0 text-[var(--st-primary)]" /> {l.k.name}</p>
                        <p className="text-xs font-semibold text-[var(--st-primary)]">{l.label}</p>
                        <p className="text-xs text-cocoa-400">{money(l.unit)} la caja</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
                        <button type="button" onClick={() => addPack(l.k.id, l.choices, -1)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--st-primary)]" aria-label="Quitar uno">{l.qty === 1 ? <X className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}</button>
                        <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                        <button type="button" onClick={() => addPack(l.k.id, l.choices)} className="grid h-7 w-7 place-items-center rounded-full text-[var(--st-primary)]" aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="w-20 text-right font-semibold tabular-nums">{money(l.qty * l.unit)}</p>
                    </li>
                  ))}
                </ul>
                {storeExtras.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-2 font-semibold text-cocoa-700"><Sparkles className="h-4 w-4 text-[var(--st-primary)]" /> ¿Le agregamos un detalle?</p>
                    <ul className="space-y-2">
                      {storeExtras.map((x) => (
                        <ExtraRow key={x.id} x={x} n={extrasCart[x.id] ?? 0} onChange={(d) => addExtra(x.id, d)} />
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Tu nombre" required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                  <Input label="WhatsApp" type="tel" required maxLength={20} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="998 123 4567" />
                  <Input
                    className="sm:col-span-2"
                    label="Correo electrónico (opcional)"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={120}
                    value={f.email}
                    onChange={(e) => setF({ ...f, email: e.target.value })}
                    placeholder="tucorreo@gmail.com"
                    hint="Te enviamos una copia de tu pedido en PDF."
                  />
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
                  {f.type === "envio" && <Input className="sm:col-span-2" label="Dirección de entrega" required maxLength={300} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Calle, número, colonia y referencias" />}
                  {f.type === "envio" && (
                    <div className="sm:col-span-2">
                      <p className="label">Marca en el mapa dónde entregamos</p>
                      <LocationPicker value={loc} onChange={setLoc} />
                    </div>
                  )}
                  <Textarea className="sm:col-span-2" label="Notas (opcional)" rows={2} maxLength={1000} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Mensaje para el pastel, alergias, colores…" />
                </div>
                {store.has_coupons && (
                  coupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-mint-50 px-4 py-3 text-sm ring-1 ring-mint-200">
                      <span className="flex items-center gap-2 font-semibold text-mint-700"><Ticket className="h-4 w-4" /> {coupon.code} · {coupon.label}</span>
                      <button type="button" onClick={() => { setCoupon(null); setCouponInput(""); }} className="text-xs font-bold text-cocoa-400 hover:underline">Quitar</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input className="field flex-1 uppercase" placeholder="¿Tienes un cupón?" maxLength={30} value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase().replace(/\s/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(couponInput); } }} />
                      <button type="button" onClick={() => applyCoupon(couponInput)} disabled={!couponInput || checkingCoupon} className={cn("rounded-2xl px-4 text-sm font-bold disabled:opacity-50", btnPrimary)}>
                        {checkingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                      </button>
                    </div>
                  )
                )}
                <div className="rounded-3xl bg-cocoa-800 p-5 text-cream-100">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span className="tabular-nums">{money(subtotal)}</span></div>
                  {discount > 0 && <div className="mt-1 flex justify-between text-sm text-mint-300"><span>Cupón {coupon?.code}</span><span className="tabular-nums">-{money(discount)}</span></div>}
                  {f.type === "envio" && (shipping > 0 || zone) && <div className="mt-1 flex justify-between text-sm"><span>Envío{zone ? ` · ${zone.name}` : ""}</span><span className="tabular-nums">{shipping ? money(shipping) : "Gratis"}</span></div>}
                  <div className="mt-2 flex items-end justify-between border-t border-white/10 pt-3">
                    <span className="font-bold">Total</span>
                    <span className="font-display text-3xl font-semibold text-white tabular-nums">{money(subtotal - discount + shipping)}</span>
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

/** Contador con etiqueta (ej. "Cajas  – 1 +") */
function QtyStepper({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm font-bold text-cocoa-500">{label}</span>
      <div className="flex items-center gap-1 rounded-full bg-cream-200 p-1">
        <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} className="grid h-9 w-9 place-items-center rounded-full bg-white text-cocoa-600 shadow-sm disabled:opacity-40" aria-label={`Menos ${label.toLowerCase()}`}><Minus className="h-4 w-4" /></button>
        <span className="w-8 text-center font-bold tabular-nums" aria-label={`${value} ${label.toLowerCase()}`}>{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="grid h-9 w-9 place-items-center rounded-full bg-white text-cocoa-600 shadow-sm" aria-label={`Más ${label.toLowerCase()}`}><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function StepTitle({ n, done, children }: { n: number; done: boolean; children: React.ReactNode }) {
  return (
    <p className="mb-2.5 flex items-center gap-2 font-semibold text-cocoa-700">
      <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs font-bold", done ? "bg-[var(--st-primary)] text-[var(--st-on-primary)]" : "bg-cream-200 text-cocoa-500")}>{done ? "✓" : n}</span>
      {children}
    </p>
  );
}

function FlavorRow({ o, n, full, onChange }: { o: { name: string; image_url: string | null }; n: number; full: boolean; onChange: (d: number) => void }) {
  return (
    <li className={cn("flex items-center gap-3 rounded-2xl p-2 ring-1 transition", n ? "bg-[var(--st-soft)] ring-[var(--st-primary)]" : "ring-cocoa-800/8")}>
      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-200">
        {o.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={o.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="grid h-full w-full place-items-center"><CakeSlice className="h-5 w-5 text-[var(--st-primary)] opacity-60" /></span>
        )}
      </span>
      <span className="min-w-0 flex-1 font-semibold text-cocoa-700">{o.name}</span>
      <span className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
        <button type="button" onClick={() => onChange(-1)} disabled={!n} className="grid h-8 w-8 place-items-center rounded-full text-[var(--st-primary)] disabled:opacity-30" aria-label={`Quitar ${o.name}`}><Minus className="h-4 w-4" /></button>
        <span className="w-6 text-center font-bold tabular-nums">{n}</span>
        <button type="button" onClick={() => onChange(1)} disabled={full} className="grid h-8 w-8 place-items-center rounded-full text-[var(--st-primary)] disabled:opacity-30" aria-label={`Agregar ${o.name}`}><Plus className="h-4 w-4" /></button>
      </span>
    </li>
  );
}

type Tile = { image: string; width: number; height: number };

/** Borde repostero que cuelga sobre la portada (glaseado, helado, galleta…) */
function DecorEdge({ tile }: { tile: Tile }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10"
      style={{ height: tile.height, backgroundImage: tile.image, backgroundSize: `${tile.width}px ${tile.height}px`, backgroundRepeat: "repeat-x", filter: "drop-shadow(0 2px 2px rgb(0 0 0 / .08))" }}
    />
  );
}

/** Separador entre secciones con el mismo motivo, difuminado a los lados */
function DecorDivider({ tile, wide = false }: { tile: Tile; wide?: boolean }) {
  const mask = "linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent)";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none mx-auto my-8 opacity-80", wide ? "max-w-2xl" : "max-w-xs")}
      style={{
        height: Math.round(tile.height * 0.6),
        backgroundImage: tile.image,
        backgroundSize: `${Math.round(tile.width * 0.6)}px ${Math.round(tile.height * 0.6)}px`,
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center top",
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
}

function ExtraRow({ x, n, onChange }: { x: StoreExtra; n: number; onChange: (d: number) => void }) {
  return (
    <li className={cn("flex items-center gap-3 rounded-2xl p-2.5 pl-3.5 ring-1 transition", n ? "bg-[var(--st-soft)] ring-[var(--st-primary)]" : "ring-cocoa-800/8")}>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-cocoa-700">{x.name}</span>
        {x.description && <span className="block text-xs text-cocoa-400">{x.description}</span>}
      </span>
      <span className="text-sm font-bold text-[var(--st-primary)] tabular-nums">+{money(x.price)}</span>
      <span className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
        <button type="button" onClick={() => onChange(-1)} disabled={!n} className="grid h-8 w-8 place-items-center rounded-full text-[var(--st-primary)] disabled:opacity-30" aria-label={`Quitar ${x.name}`}><Minus className="h-4 w-4" /></button>
        <span className="w-6 text-center font-bold tabular-nums">{n}</span>
        <button type="button" onClick={() => onChange(1)} className="grid h-8 w-8 place-items-center rounded-full text-[var(--st-primary)]" aria-label={`Agregar ${x.name}`}><Plus className="h-4 w-4" /></button>
      </span>
    </li>
  );
}

/** Estilos de temporada de la tienda (fondo con patrón, portada y tarjetas) */
function StoreSkinStyle({ id }: { id: FestiveId }) {
  const css = useMemo(() => storeSkinCss(id), [id]);
  // marca la temporada en la página para usar sus letras
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.festive) return;
    root.dataset.festive = id;
    return () => {
      if (root.dataset.festive === id) delete root.dataset.festive;
    };
  }, [id]);
  return <style data-fest-store={id} dangerouslySetInnerHTML={{ __html: css }} />;
}
