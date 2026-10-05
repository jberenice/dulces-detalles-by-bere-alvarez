"use client";
import { useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, MessageCircle, ShoppingBag, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { DeliveryCalendar, firstAvailable } from "./DeliveryCalendar";
import { uploadPublicPhoto } from "@/lib/public-photos";
import { dateLong, folio, money, waLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CustomCakeSettings, DeliveryZone } from "@/lib/types";

export const DEFAULT_OCCASIONS = ["Cumpleaños", "Boda", "XV años", "Bautizo", "Baby shower", "Aniversario", "Graduación", "Otro"];

type Props = {
  slug: string;
  cfg: CustomCakeSettings;
  store: {
    business_name: string;
    whatsapp: string | null;
    min_notice_days: number;
    delivery: boolean;
    pickup: boolean;
    zones?: DeliveryZone[];
  };
  today: string;
  unavailable: string[];
  btnPrimary: string;
  onDone?: () => void;
};

/** Formulario público: la clienta describe su pastel y se crea una cotización en borrador para la repostería */
export function CustomCakeForm({ slug, cfg, store, today, unavailable, btnPrimary, onDone }: Props) {
  const minNotice = Math.max(store.min_notice_days, Number(cfg.min_notice_days ?? 0));
  const zones = (store.zones ?? []).filter((z) => z?.name);
  const [f, setF] = useState({
    people: String(cfg.min_people ?? ""),
    occasion: "",
    flavor: "",
    filling: "",
    topping: "",
    shape: "",
    design: "",
    message: "",
    budget: "",
    date: firstAvailable(today, minNotice, unavailable),
    time: "",
    delivery_type: store.pickup ? "recoger" : "envio",
    zone: "",
    address: "",
    name: "",
    phone: "",
    email: "",
  });
  const [photos, setPhotos] = useState<{ path: string; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ folio: number; wa: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = 3 - photos.length;
    const list = [...files].slice(0, room);
    if (!room) return toast.info("Máximo 3 fotos");
    setUploading(true);
    try {
      for (const file of list) {
        const path = await uploadPublicPhoto(file, { kind: "solicitud", slug });
        setPhotos((p) => [...p, { path, preview: URL.createObjectURL(file) }]);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!(Number(f.people) > 0)) return toast.error("¿Para cuántas personas es?");
    if (!f.date) return toast.error("Elige la fecha");
    if (f.delivery_type === "envio" && !f.address.trim()) return toast.error("Escribe la dirección de entrega");
    if (f.delivery_type === "envio" && zones.length && !f.zone) return toast.error("Elige tu zona de entrega");
    setSending(true);
    const popup = window.open("", "_blank");
    const { data, error } = await createClient().rpc("place_custom_request", {
      p_slug: slug,
      p_request: { ...f, people: Number(f.people), budget: f.budget ? String(Number(f.budget)) : "" },
      p_images: photos.map((p) => p.path),
    });
    setSending(false);
    if (error) {
      popup?.close();
      return toast.error(error.message);
    }
    const res = data as { folio: number; quote_id: string };
    const text =
      `¡Hola ${store.business_name}! 🎂 Quiero cotizar un pastel personalizado (${folio("C", res.folio)}):\n\n` +
      [
        `👥 ${f.people} personas${f.occasion ? ` · ${f.occasion}` : ""}`,
        f.flavor && `🍰 Pan: ${f.flavor}`,
        f.filling && `🍓 Relleno: ${f.filling}`,
        f.topping && `🧁 Cubierta: ${f.topping}`,
        f.shape && `🔷 Forma: ${f.shape}`,
        f.design && `🎨 Diseño: ${f.design}`,
        f.message && `✍️ Mensaje: “${f.message}”`,
        `📅 ${dateLong(f.date)}${f.time ? ` a las ${f.time}` : ""}`,
        f.delivery_type === "envio" ? `🚚 Envío${f.zone ? ` (${f.zone})` : ""} a: ${f.address}` : "🏠 Paso a recoger",
        f.budget && `💰 Presupuesto aprox.: ${money(Number(f.budget))}`,
        photos.length ? `📷 Adjunté ${photos.length} foto${photos.length > 1 ? "s" : ""} de referencia` : "",
        `👤 ${f.name} · ${f.phone}`,
      ]
        .filter(Boolean)
        .join("\n");
    const wa = waLink(store.whatsapp, text);
    setDone({ folio: res.folio, wa });
    fetch("/api/push/pedido", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quote_id: res.quote_id }) }).catch(() => {});
    if (popup && !popup.closed) popup.location.href = wa;
  }

  if (done)
    return (
      <div className="py-6 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-100 text-mint-600"><Check className="h-8 w-8" /></span>
        <p className="mt-4 font-display text-2xl font-semibold">¡Recibimos tu idea! 🎂</p>
        <p className="mt-2 text-cocoa-500">Solicitud {folio("C", done.folio)}. Te enviaremos la cotización por WhatsApp. Termina de enviar el mensaje para que te atendamos más rápido.</p>
        <a href={done.wa} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-mint-500 px-6 py-3 font-bold text-white">
          <MessageCircle className="h-5 w-5" /> Abrir WhatsApp
        </a>
        <div>
          <button type="button" onClick={onDone} className="mt-3 text-sm font-semibold text-cocoa-400 hover:underline">Cerrar</button>
        </div>
      </div>
    );

  const choice = (label: string, key: "flavor" | "filling" | "topping" | "shape", options?: string[]) =>
    options?.length ? (
      <Select label={label} value={options.includes(f[key]) || !f[key] ? f[key] : "__otro"} onChange={(e) => set(key, e.target.value === "__otro" ? " " : e.target.value)}>
        <option value="">Elige…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value="__otro">Otro (lo escribo)</option>
      </Select>
    ) : (
      <Input label={label} maxLength={80} value={f[key]} onChange={(e) => set(key, e.target.value)} />
    );
  const otherInput = (key: "flavor" | "filling" | "topping" | "shape", options?: string[]) =>
    options?.length && f[key] && !options.includes(f[key]) ? (
      <Input label="¿Cuál?" maxLength={80} value={f[key].trim()} onChange={(e) => set(key, e.target.value || " ")} autoFocus />
    ) : null;

  return (
    <form onSubmit={submit} className="space-y-5">
      {cfg.intro && <p className="rounded-2xl bg-cream-100 px-4 py-3 text-sm leading-relaxed text-cocoa-600">{cfg.intro}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="¿Para cuántas personas?" type="number" min={Math.max(1, Number(cfg.min_people ?? 1))} max={1000} required value={f.people} onChange={(e) => set("people", e.target.value)} placeholder="Ej. 20" />
        <Select label="Ocasión" value={f.occasion} onChange={(e) => set("occasion", e.target.value)}>
          <option value="">Elige…</option>
          {(cfg.occasions?.length ? cfg.occasions : DEFAULT_OCCASIONS).map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
        {choice("Sabor del pan", "flavor", cfg.flavors)}
        {otherInput("flavor", cfg.flavors)}
        {choice("Relleno", "filling", cfg.fillings)}
        {otherInput("filling", cfg.fillings)}
        {choice("Cubierta", "topping", cfg.toppings)}
        {otherInput("topping", cfg.toppings)}
        {(cfg.shapes?.length ?? 0) > 0 && choice("Forma", "shape", cfg.shapes)}
        {otherInput("shape", cfg.shapes)}
      </div>
      <Textarea label="Cuéntanos tu idea" rows={3} maxLength={1000} value={f.design} onChange={(e) => set("design", e.target.value)} placeholder="Tema, colores, personajes, decoración, número de pisos…" />
      <Input label="Mensaje en el pastel (opcional)" maxLength={120} value={f.message} onChange={(e) => set("message", e.target.value)} placeholder="¡Feliz cumpleaños, Sofi!" />

      <div>
        <p className="label">Fotos de referencia (opcional, hasta 3)</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <span key={p.path} className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-cocoa-800/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setPhotos((x) => x.filter((_, j) => j !== i))} className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white" aria-label="Quitar foto">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {photos.length < 3 && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-cocoa-800/15 text-cocoa-400 hover:border-[var(--st-primary)] hover:text-[var(--st-primary)]">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : photos.length ? <ImagePlus className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        </div>
      </div>

      <div>
        <p className="label">Fecha del evento {f.date && <span className="font-normal text-cocoa-400">· {dateLong(f.date)}</span>}</p>
        <DeliveryCalendar value={f.date} onChange={(v) => set("date", v)} today={today} minNotice={minNotice} unavailable={unavailable} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Hora aproximada" type="time" value={f.time} onChange={(e) => set("time", e.target.value)} />
        <Input label="Presupuesto aproximado (opcional)" type="number" min={0} step="any" prefix="$" value={f.budget} onChange={(e) => set("budget", e.target.value)} />
        {store.pickup && store.delivery && (
          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            {(["recoger", "envio"] as const).map((t) => (
              <button key={t} type="button" onClick={() => set("delivery_type", t)} className={cn("flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold", f.delivery_type === t ? "border-[var(--st-primary)] bg-[var(--st-soft)] text-[var(--st-primary)]" : "border-cocoa-800/10 text-cocoa-500")}>
                {t === "envio" ? <Truck className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />} {t === "envio" ? "Envío" : "Paso a recoger"}
              </button>
            ))}
          </div>
        )}
        {f.delivery_type === "envio" && zones.length > 0 && (
          <Select className="sm:col-span-2" label="Zona de entrega" value={f.zone} onChange={(e) => set("zone", e.target.value)}>
            <option value="">Elige tu zona…</option>
            {zones.map((z) => <option key={z.name} value={z.name}>{z.name}</option>)}
          </Select>
        )}
        {f.delivery_type === "envio" && <Input className="sm:col-span-2" label="Dirección de entrega" maxLength={300} value={f.address} onChange={(e) => set("address", e.target.value)} />}
        <Input label="Tu nombre" required maxLength={120} value={f.name} onChange={(e) => set("name", e.target.value)} />
        <Input label="WhatsApp" type="tel" required maxLength={20} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="998 123 4567" />
        <Input className="sm:col-span-2" label="Correo (opcional)" type="email" maxLength={120} value={f.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <button type="submit" disabled={sending || uploading} className={cn("flex h-13 w-full items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-60", btnPrimary)}>
        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />} Pedir cotización
      </button>
      <p className="text-center text-xs text-cocoa-400">Te responderemos con el precio por WhatsApp. Pedir la cotización no te compromete a nada.</p>
    </form>
  );
}
