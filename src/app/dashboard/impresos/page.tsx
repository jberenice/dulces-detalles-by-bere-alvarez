"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { AlertTriangle, CakeSlice, Circle, Cookie, IdCard, Palette, Printer, Save, Square, Sticker, Tag, QrCode, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Card, CardHeader, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { normalizeTheme } from "@/lib/storeTheme";
import { storeUrl } from "@/lib/domains";
import { markOnboarding } from "@/lib/onboarding";
import { cn } from "@/lib/cn";
import {
  DECORS,
  FONTS,
  KINDS,
  LAYOUTS,
  PALETTES,
  PAPERS,
  SHAPE_LABEL,
  THEMES,
  buildSheetHtml,
  decorPreview,
  fitOnPaper,
  fitPieces,
  normalizeDesign,
  renderItem,
  sizeOf,
  type PrintData,
  type PrintDesign,
  type PrintKind,
  type Shape,
} from "@/lib/printDesigns";
import type { Dessert, Profile } from "@/lib/types";
import { allergenLabel, bestBefore, containsText } from "@/lib/allergens";
import { must, useAsync } from "@/hooks/useAsync";

const KIND_ICON: Record<PrintKind, typeof IdCard> = { tarjeta: IdCard, etiqueta: Tag, sticker: Sticker, qr: QrCode };
const SHAPE_ICON: Record<Shape, typeof IdCard> = { rectangulo: Square, cuadrado: Square, redondo: Circle, galleta: Cookie };
const CM = 37.8; // px por cm en pantalla
/** Debajo de este tamaño base (cm) la letra chica queda difícil de leer impresa */
const SMALL_TEXT = 0.24;

/** Ajusta los textos de un contenedor cuando cambia el diseño y otra vez cuando cargan las letras */
function useFit(ref: React.RefObject<HTMLElement | null>, html: string, onFit?: (smallest: number, el: HTMLElement) => void) {
  useLayoutEffect(() => {
    if (!ref.current || !html) return;
    let alive = true;
    const run = () => {
      if (!alive || !ref.current) return;
      const min = fitPieces(ref.current);
      onFit?.(min, ref.current);
    };
    run();
    document.fonts?.ready.then(run);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);
}

export default function PrintDesignerPage() {
  const { profile, setProfile } = useBusiness();
  const sb = createClient();
  const theme = normalizeTheme(profile.store_theme);
  const base = { bg: theme.background, primary: theme.primary, text: theme.text };
  const saved = (profile as Profile & { print_designs?: Record<string, unknown> }).print_designs ?? {};
  const [kind, setKind] = useState<PrintKind>("tarjeta");
  const [designs, setDesigns] = useState<Record<PrintKind, PrintDesign>>(() => ({
    tarjeta: normalizeDesign("tarjeta", saved.tarjeta, base),
    etiqueta: normalizeDesign("etiqueta", saved.etiqueta, base),
    sticker: normalizeDesign("sticker", saved.sticker, base),
    qr: normalizeDesign("qr", saved.qr, base),
  }));
  const [paper, setPaper] = useState("carta");
  const [qr, setQr] = useState("");
  const [fonts, setFonts] = useState<PrintData["fonts"]>({
    elegante: "Georgia, serif",
    romantica: "cursive",
    moderna: "system-ui, sans-serif",
    divertida: "cursive",
    redondita: "system-ui, sans-serif",
  });
  const [saving, setSaving] = useState(false);
  const [fitted, setFitted] = useState("");
  const [smallest, setSmallest] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);
  const d = designs[kind];
  const set = (patch: Partial<PrintDesign>) => setDesigns((x) => ({ ...x, [kind]: { ...x[kind], ...patch } }));
  const url = storeUrl(profile.store_slug);
  const dessertsQ = useAsync(async () =>
    must(await sb.from("desserts").select("id, name, allergens, may_contain, ingredients_label, shelf_life_days, storage_note").eq("active", true).order("name")) as Dessert[],
  );
  const fichaDessert = kind === "etiqueta" ? (dessertsQ.data ?? []).find((x) => x.id === d.dessertId) : undefined;

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    setFonts({
      elegante: v("--font-display-serif", "Georgia, serif"),
      romantica: v("--font-dancing", "cursive"),
      moderna: v("--font-body", "system-ui, sans-serif"),
      divertida: v("--ff-poppins", "sans-serif"),
      redondita: v("--font-fredoka", "system-ui, sans-serif"),
    });
  }, []);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 600, errorCorrectionLevel: "M", color: { dark: d.qrColor, light: "#ffffff" } }).then(setQr);
  }, [url, d.qrColor]);

  const data: PrintData = {
    business: profile.store_title || profile.business_name,
    // Solo el logo de la repostería (si no tiene, el diseño sale sin logo)
    logo: profile.logo_url || null,
    qr,
    url,
    whatsapp: profile.whatsapp ?? "",
    instagram: profile.instagram ?? "",
    facebook: profile.facebook ?? "",
    fonts,
    label: fichaDessert
      ? {
          name: fichaDessert.name,
          ingredients: fichaDessert.ingredients_label ?? "",
          contains: containsText(fichaDessert.allergens ?? []),
          mayContain: (fichaDessert.may_contain ?? []).map((x) => allergenLabel(x).toLowerCase()).join(", "),
          bestBefore:
            fichaDessert.shelf_life_days != null
              ? d.madeOn
                ? bestBefore(d.madeOn, fichaDessert.shelf_life_days)
                : "____ / ____ / ______"
              : "",
          storage: fichaDessert.storage_note ?? "",
        }
      : null,
  };

  const size = sizeOf(kind, d);
  const fit = fitOnPaper(size.w, size.h, paper);
  const piece = useMemo(() => (qr ? renderItem(kind, d, data) : ""), [kind, d, qr, fonts, profile, fichaDessert]); // eslint-disable-line react-hooks/exhaustive-deps

  // La vista previa se ajusta midiendo; la hoja y la impresión usan esa misma pieza ya ajustada
  useFit(previewRef, piece, (min, el) => {
    setSmallest(min);
    setFitted(el.innerHTML);
  });

  async function save() {
    setSaving(true);
    const { data: p, error } = await sb.from("profiles").update({ print_designs: designs }).eq("id", profile.id).select().single();
    setSaving(false);
    if (error) return toast.error(error.message.includes("print_designs") ? "Falta ejecutar la migración 0012 en Supabase" : error.message);
    setProfile(p as Profile);
    toast.success("Diseños guardados 💕");
  }

  function print() {
    if (!qr || !fitted) return;
    if (fit.total === 0) return toast.error("Esta pieza no cabe en esa hoja, elige una hoja más grande");
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((l) => l.href);
    const w = window.open("", "_blank", "width=1000,height=1200");
    if (!w) return toast.error("Permite las ventanas emergentes para imprimir");
    w.document.write(buildSheetHtml(kind, d, fitted, data.business, paper, links));
    w.document.close();
    markOnboarding(profile, "shared", setProfile);
  }

  // Escala de la vista previa para que quepa en pantalla
  const previewScale = Math.min(1.6, 320 / (size.w * CM), 300 / (size.h * CM));
  const sheetScale = Math.min(300 / (fit.pageW * CM), 420 / (fit.pageH * CM));
  const roundish = d.shape === "redondo" || d.shape === "galleta";

  return (
    <>
      <PageHeader
        eyebrow="Tu marca en todos lados"
        title="Tarjetas, etiquetas y stickers"
        subtitle="Diseña tus impresos con el QR de tu tienda: elige un diseño de repostería, tamaño, acomodo, colores y textos. Mira cómo quedan y cuántos caben por hoja."
        actions={
          <>
            <Button variant="outline" onClick={save} loading={saving}><Save className="h-4 w-4" /> Guardar diseños</Button>
            <Button onClick={print} disabled={!fitted}><Printer className="h-4 w-4" /> Imprimir hoja</Button>
          </>
        }
      />

      <Tabs
        value={kind}
        onChange={setKind}
        className="mb-5"
        options={(Object.keys(KINDS) as PrintKind[]).map((k) => {
          const Icon = KIND_ICON[k];
          return { value: k, label: <><Icon className="h-4 w-4" /> {KINDS[k].label}</> };
        })}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
          {/* Tamaño y forma */}
          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Tamaño y forma</h3>
            <p className="text-sm text-cocoa-400">{KINDS[kind].hint}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {KINDS[kind].sizes.map((s) => (
                <Opt key={s.id} active={d.size === s.id} onClick={() => set({ size: s.id, shape: s.shapes.includes(d.shape) ? d.shape : s.shapes[0] })}>
                  <span
                    className="mx-auto mb-2 block border-2 border-cocoa-400"
                    style={{ width: Math.min(60, s.w * 7), height: Math.min(60, s.h * 7), borderRadius: roundish && s.shapes.includes(d.shape) ? "50%" : 4 }}
                  />
                  <span className="block text-center text-xs font-bold text-cocoa-600">{s.label}</span>
                </Opt>
              ))}
            </div>
            {size.shapes.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {size.shapes.map((sh) => {
                  const Icon = SHAPE_ICON[sh];
                  return (
                    <Opt key={sh} active={d.shape === sh} onClick={() => set({ shape: sh })} className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-cocoa-600">
                      <Icon className="h-4 w-4" /> {SHAPE_LABEL[sh]}
                    </Opt>
                  );
                })}
              </div>
            )}
            {!roundish && (
              <label className="mt-4 block">
                <span className="label">Esquinas redondeadas</span>
                <input type="range" min={0} max={1.5} step={0.1} value={d.radius} onChange={(e) => set({ radius: Number(e.target.value) })} className="w-full accent-rose-500" />
              </label>
            )}
          </Card>

          {/* Diseños listos */}
          <Card className="p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><CakeSlice className="h-5 w-5 text-rose-400" /> Diseños de repostería</h3>
            <p className="text-sm text-cocoa-400">Toca uno para usarlo y luego ajusta colores, acomodo o textos a tu gusto.</p>
            {qr && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                {THEMES.map((t) => {
                  const td = { ...d, ...t.patch };
                  const active = (Object.keys(t.patch) as (keyof PrintDesign)[]).every((k) => d[k] === td[k]);
                  return (
                    <Opt key={t.id} active={active} onClick={() => set(t.patch)} className="p-2">
                      <Thumb html={renderItem(kind, td, data)} w={size.w} h={size.h} />
                      <span className="mt-2 block text-center text-xs font-bold text-cocoa-700">{t.name}</span>
                    </Opt>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Decoración */}
          <Card className="p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-5 w-5 text-rose-400" /> Decoración</h3>
            <p className="text-sm text-cocoa-400">Usa el color de “Acento”.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DECORS.map((x) => (
                <Opt key={x.id} active={d.decor === x.id} onClick={() => set({ decor: x.id })} className="p-2">
                  <span className="block h-14 overflow-hidden rounded-lg ring-1 ring-cocoa-800/8" dangerouslySetInnerHTML={{ __html: decorPreview(x.id, d.primary, d.bg, d.text) }} />
                  <span className="mt-2 block text-xs font-bold text-cocoa-700">{x.label}</span>
                  <span className="block text-[11px] leading-tight text-cocoa-400">{x.hint}</span>
                </Opt>
              ))}
            </div>
          </Card>

          {/* Acomodo */}
          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Acomodo</h3>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LAYOUTS.map((l) => (
                <Opt key={l.id} active={d.layout === l.id} onClick={() => set({ layout: l.id })}>
                  <LayoutSketch id={l.id} />
                  <span className="mt-2 block text-sm font-bold text-cocoa-700">{l.label}</span>
                  <span className="block text-xs text-cocoa-400">{l.hint}</span>
                </Opt>
              ))}
            </div>
            {roundish && <p className="mt-3 text-xs text-cocoa-400">En piezas redondas, Clásico pone el QR arriba e Invertido lo pone abajo.</p>}
          </Card>

          {/* Colores y estilo */}
          <Card className="p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Palette className="h-5 w-5 text-rose-400" /> Colores y estilo</h3>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Opt active={false} onClick={() => set({ ...base, qrColor: base.text })}>
                <Swatches c={[base.bg, base.primary, base.text]} />
                <span className="mt-2 block text-xs font-bold text-cocoa-600">Colores de mi tienda</span>
              </Opt>
              {PALETTES.map((p) => (
                <Opt key={p.name} active={d.bg === p.bg && d.primary === p.primary} onClick={() => set({ bg: p.bg, primary: p.primary, text: p.text, qrColor: p.qr })}>
                  <Swatches c={[p.bg, p.primary, p.text]} />
                  <span className="mt-2 block text-xs font-bold text-cocoa-600">{p.name}</span>
                </Opt>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([["bg", "Fondo"], ["primary", "Acento"], ["text", "Texto"], ["qrColor", "Color del QR"]] as const).map(([k, label]) => (
                <label key={k} className="block">
                  <span className="label">{label}</span>
                  <span className="flex items-center gap-2 rounded-2xl border border-cocoa-800/10 bg-cream-50 p-1.5 pr-3">
                    <input type="color" value={d[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<PrintDesign>)} className="h-9 w-9 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0" />
                    <span className="font-mono text-xs text-cocoa-500 uppercase">{d[k]}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Select label="Letra del nombre" value={d.font} onChange={(e) => set({ font: e.target.value as PrintDesign["font"] })}>
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </Select>
              <Select label="Fondo decorado" value={d.pattern} onChange={(e) => set({ pattern: e.target.value as PrintDesign["pattern"] })}>
                <option value="liso">Liso</option>
                <option value="chispas">Chispas de colores</option>
                <option value="puntos">Puntitos</option>
                <option value="rayas">Rayas</option>
                <option value="ondas">Ondas</option>
                <option value="waffle">Cuadritos de waffle</option>
              </Select>
              <Select label="Borde" value={d.border} onChange={(e) => set({ border: e.target.value as PrintDesign["border"] })}>
                <option value="ninguno">Sin borde</option>
                <option value="linea">Línea</option>
                <option value="punteado">Punteado</option>
                <option value="doble">Doble</option>
              </Select>
            </div>
          </Card>

          {/* Ficha del postre (etiquetas) */}
          {kind === "etiqueta" && (
            <Card className="p-5 sm:p-6">
              <h3 className="text-lg font-semibold">Ficha del postre</h3>
              <p className="text-sm text-cocoa-400">Agrega ingredientes, alérgenos y fecha de consumo a tu etiqueta. Los datos salen de la “Ficha del postre” en cada receta.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Select label="Postre" value={d.dessertId} onChange={(e) => set({ dessertId: e.target.value })}>
                  <option value="">Sin ficha (solo tu marca)</option>
                  {(dessertsQ.data ?? []).map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </Select>
                <Input label="Fecha de elaboración" type="date" value={d.madeOn} onChange={(e) => set({ madeOn: e.target.value })} hint="Vacía = deja un espacio para escribirla a mano" />
              </div>
              {fichaDessert && (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Toggle checked={d.showIngredients} onChange={(v) => set({ showIngredients: v })} label="Ingredientes" />
                    <Toggle checked={d.showAllergens} onChange={(v) => set({ showAllergens: v })} label="Alérgenos" />
                    <Toggle checked={d.showBestBefore} onChange={(v) => set({ showBestBefore: v })} label="Consumir antes de" />
                  </div>
                  {!fichaDessert.ingredients_label && !(fichaDessert.allergens ?? []).length && fichaDessert.shelf_life_days == null && (
                    <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">Este postre aún no tiene ficha. Ábrelo en Postres y llena “Ficha del postre”.</p>
                  )}
                  <p className="mt-3 text-xs text-cocoa-400">Tip: usa el tamaño “Ficha 10 × 7 cm” para que se lea cómodo.</p>
                </>
              )}
            </Card>
          )}

          {/* Textos */}
          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Información</h3>
            <p className="text-sm text-cocoa-400">Déjalo vacío para usar los datos de tu negocio. Prende o apaga cada dato con su interruptor.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Nombre" maxLength={60} placeholder={data.business} value={d.title} onChange={(e) => set({ title: e.target.value })} />
              <Input label="Frase" maxLength={80} value={d.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Escanea y haz tu pedido" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <InfoField label="Contacto (WhatsApp o teléfono)" placeholder={data.whatsapp || "998 123 4567"} value={d.contact} onChange={(v) => set({ contact: v })} on={d.showContact} onToggle={(v) => set({ showContact: v })} />
              <InfoField label="Instagram" placeholder={data.instagram ? `@${data.instagram.replace(/^@/, "")}` : "@tutienda"} value={d.instagram} onChange={(v) => set({ instagram: v })} on={d.showInstagram} onToggle={(v) => set({ showInstagram: v })} />
              <InfoField label="Facebook" placeholder={data.facebook || "tutienda"} value={d.facebook} onChange={(v) => set({ facebook: v })} on={d.showFacebook} onToggle={(v) => set({ showFacebook: v })} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Toggle checked={d.showLogo} onChange={(v) => set({ showLogo: v })} label="Mostrar logo" />
              <Toggle checked={d.showQr} onChange={(v) => set({ showQr: v })} label="Mostrar QR" />
              <Toggle checked={d.showUrl} onChange={(v) => set({ showUrl: v })} label="Mostrar dirección web" />
            </div>
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => set(normalizeDesign(kind, null, base))}>
              <RotateCcw className="h-4 w-4" /> Restablecer este diseño
            </Button>
          </Card>
        </div>

        {/* Vista previa */}
        <div className="space-y-4 xl:sticky xl:top-6">
          <Card className="overflow-hidden">
            <CardHeader title="Vista previa" subtitle={`${size.label}${roundish ? ` · ${SHAPE_LABEL[d.shape].toLowerCase()}` : ""}`} />
            <div className="sprinkles grid place-items-center bg-cream-200/60 p-6">
              <div style={{ width: size.w * CM * previewScale, height: size.h * CM * previewScale }}>
                <div
                  ref={previewRef}
                  style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: size.w * CM, height: size.h * CM, filter: "drop-shadow(0 8px 18px rgb(63 37 13 / .18))" }}
                  dangerouslySetInnerHTML={{ __html: piece }}
                />
              </div>
            </div>
            {smallest < SMALL_TEXT ? (
              <p className="flex gap-2 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Hay mucha información para este tamaño y la letra queda muy chiquita. Apaga algún dato (por ejemplo Facebook o la dirección web) o elige un tamaño más grande.
              </p>
            ) : (
              <p className="px-4 py-3 text-xs text-cocoa-400">Así se verá impresa. Los tamaños son reales en centímetros y los textos se acomodan solos para que nada se corte.</p>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Hoja para imprimir" subtitle={fit.total ? `Caben ${fit.total} por hoja (${fit.cols} × ${fit.rows})${fit.landscape ? " · horizontal" : ""}` : "No cabe en esta hoja"} />
            <div className="p-4">
              <Select aria-label="Tamaño de hoja" value={paper} onChange={(e) => setPaper(e.target.value)}>
                {PAPERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </Select>
              <div className="mt-4 grid place-items-center rounded-2xl bg-cream-200/60 p-4">
                <div className="relative bg-white shadow-lift" style={{ width: fit.pageW * CM * sheetScale, height: fit.pageH * CM * sheetScale }}>
                  <div
                    style={{
                      position: "absolute",
                      left: ((fit.pageW - (fit.cols * size.w + (fit.cols - 1) * 0.3)) / 2) * CM * sheetScale,
                      top: ((fit.pageH - (fit.rows * size.h + (fit.rows - 1) * 0.3)) / 2) * CM * sheetScale,
                      display: "grid",
                      gridTemplateColumns: `repeat(${fit.cols}, ${size.w * CM * sheetScale}px)`,
                      gridAutoRows: `${size.h * CM * sheetScale}px`,
                      gap: 0.3 * CM * sheetScale,
                    }}
                  >
                    {Array.from({ length: fit.total }, (_, i) => (
                      <div key={i} style={{ width: size.w * CM * sheetScale, height: size.h * CM * sheetScale, overflow: "hidden" }}>
                        <div style={{ transform: `scale(${sheetScale})`, transformOrigin: "top left", width: size.w * CM, height: size.h * CM }} dangerouslySetInnerHTML={{ __html: fitted }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={print} disabled={!fitted || !fit.total}><Printer className="h-4 w-4" /> Imprimir {fit.total} {kind === "tarjeta" ? "tarjetas" : kind === "etiqueta" ? "etiquetas" : kind === "sticker" ? "stickers" : "QR"}</Button>
              <p className="mt-2 text-center text-xs text-cocoa-400">Imprime al 100 % (escala real). Para guardar como PDF, elige “Guardar como PDF” en la impresora.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/** Miniatura real de un diseño (se ajusta igual que la vista previa) */
function Thumb({ html, w, h }: { html: string; w: number; h: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useFit(ref, html);
  const scale = Math.min(150 / (w * CM), 110 / (h * CM));
  return (
    <span className="grid h-[120px] place-items-center overflow-hidden rounded-xl bg-cream-100/70">
      <span style={{ width: w * CM * scale, height: h * CM * scale, display: "block" }}>
        <div ref={ref} style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: w * CM, height: h * CM, filter: "drop-shadow(0 3px 6px rgb(63 37 13 / .15))" }} dangerouslySetInnerHTML={{ __html: html }} />
      </span>
    </span>
  );
}

function InfoField({ label, placeholder, value, onChange, on, onToggle }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className={cn("rounded-2xl border border-cocoa-800/8 p-3 transition", !on && "opacity-60")}>
      <Input label={label} maxLength={80} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      <Toggle className="mt-2" checked={on} onChange={onToggle} label="Mostrar" />
    </div>
  );
}

function Opt({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-2xl border-2 p-3 text-left transition", active ? "border-rose-400 bg-rose-50/60 shadow-soft" : "border-cocoa-800/8 bg-white hover:border-rose-200", className)}>
      {children}
    </button>
  );
}

function Swatches({ c }: { c: string[] }) {
  return (
    <span className="flex h-7 overflow-hidden rounded-lg ring-1 ring-cocoa-800/10">
      {c.map((x, i) => <span key={i} className="flex-1" style={{ background: x }} />)}
    </span>
  );
}

function LayoutSketch({ id }: { id: string }) {
  const qr = <span className="block h-7 w-7 shrink-0 rounded bg-cocoa-500" />;
  const txt = (
    <span className="flex flex-1 flex-col gap-1">
      <span className="block h-1.5 w-full rounded bg-cocoa-400" />
      <span className="block h-1 w-3/4 rounded bg-rose-300" />
      <span className="block h-1 w-1/2 rounded bg-cocoa-200" />
    </span>
  );
  if (id === "clasico") return <span className="flex h-12 items-center gap-2 rounded-lg bg-cream-100 px-2">{qr}{txt}</span>;
  if (id === "invertido") return <span className="flex h-12 items-center gap-2 rounded-lg bg-cream-100 px-2">{txt}{qr}</span>;
  if (id === "banda") return <span className="flex h-12 flex-col overflow-hidden rounded-lg bg-cream-100"><span className="h-3.5 bg-rose-300" /><span className="flex flex-1 items-center gap-2 px-2"><span className="block h-5 w-5 rounded bg-cocoa-500" />{txt}</span></span>;
  if (id === "marco") return <span className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg bg-cream-100 ring-2 ring-rose-300 ring-inset"><span className="block h-1.5 w-12 rounded bg-cocoa-400" /><span className="block h-4 w-4 rounded bg-cocoa-500" /></span>;
  if (id === "minimal") return <span className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg bg-cream-100"><span className="block h-7 w-7 rounded bg-cocoa-500" /><span className="block h-1 w-10 rounded bg-cocoa-400" /></span>;
  return <span className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg bg-cream-100"><span className="block h-3 w-3 rounded-full bg-rose-300" /><span className="block h-1.5 w-12 rounded bg-cocoa-400" /><span className="block h-4 w-4 rounded bg-cocoa-500" /></span>;
}
