"use client";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Circle, IdCard, Palette, Printer, Save, Square, Sticker, Tag, QrCode, RotateCcw } from "lucide-react";
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
  KINDS,
  LAYOUTS,
  PALETTES,
  PAPERS,
  buildSheetHtml,
  fitOnPaper,
  normalizeDesign,
  renderItem,
  sizeOf,
  type PrintData,
  type PrintDesign,
  type PrintKind,
} from "@/lib/printDesigns";
import type { Profile } from "@/lib/types";

const KIND_ICON: Record<PrintKind, typeof IdCard> = { tarjeta: IdCard, etiqueta: Tag, sticker: Sticker, qr: QrCode };
const CM = 37.8; // px por cm en pantalla

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
  const [fonts, setFonts] = useState<PrintData["fonts"]>({ elegante: "Georgia, serif", romantica: "cursive", moderna: "system-ui, sans-serif" });
  const [saving, setSaving] = useState(false);
  const d = designs[kind];
  const set = (patch: Partial<PrintDesign>) => setDesigns((x) => ({ ...x, [kind]: { ...x[kind], ...patch } }));
  const url = storeUrl(profile.store_slug);

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
    setFonts({ elegante: v("--font-display-serif", "Georgia, serif"), romantica: v("--font-dancing", "cursive"), moderna: v("--font-body", "system-ui, sans-serif") });
  }, []);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 600, errorCorrectionLevel: "M", color: { dark: d.qrColor, light: "#ffffff" } }).then(setQr);
  }, [url, d.qrColor]);

  const data: PrintData = {
    business: profile.store_title || profile.business_name,
    logo: profile.logo_url || (typeof window !== "undefined" ? `${window.location.origin}/logo-transparent.png` : null),
    qr,
    url,
    whatsapp: profile.whatsapp ? `WhatsApp ${profile.whatsapp}` : "",
    instagram: profile.instagram ? `@${profile.instagram.replace(/^@/, "")}` : "",
    fonts,
  };

  const size = sizeOf(kind, d);
  const fit = fitOnPaper(size.w, size.h, paper);
  const piece = useMemo(() => (qr ? renderItem(kind, d, data) : ""), [kind, d, qr, fonts, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    const { data: p, error } = await sb.from("profiles").update({ print_designs: designs }).eq("id", profile.id).select().single();
    setSaving(false);
    if (error) return toast.error(error.message.includes("print_designs") ? "Falta ejecutar la migración 0012 en Supabase" : error.message);
    setProfile(p as Profile);
    toast.success("Diseños guardados 💕");
  }

  function print() {
    if (!qr) return;
    if (fit.total === 0) return toast.error("Esta pieza no cabe en esa hoja, elige una hoja más grande");
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((l) => l.href);
    const w = window.open("", "_blank", "width=1000,height=1200");
    if (!w) return toast.error("Permite las ventanas emergentes para imprimir");
    w.document.write(buildSheetHtml(kind, d, data, paper, links));
    w.document.close();
    markOnboarding(profile, "shared", setProfile);
  }

  // Escala de la vista previa para que quepa en pantalla
  const previewScale = Math.min(1.6, 320 / (size.w * CM), 300 / (size.h * CM));
  const sheetScale = Math.min(300 / (fit.pageW * CM), 420 / (fit.pageH * CM));

  return (
    <>
      <PageHeader
        eyebrow="Tu marca en todos lados"
        title="Tarjetas, etiquetas y stickers"
        subtitle="Diseña tus impresos con el QR de tu tienda: elige tamaño, acomodo, colores y textos. Mira cómo quedan y cuántos caben por hoja."
        actions={
          <>
            <Button variant="outline" onClick={save} loading={saving}><Save className="h-4 w-4" /> Guardar diseños</Button>
            <Button onClick={print} disabled={!qr}><Printer className="h-4 w-4" /> Imprimir hoja</Button>
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
                  <span className="mx-auto mb-2 block border-2 border-cocoa-400" style={{ width: Math.min(60, s.w * 7), height: Math.min(60, s.h * 7), borderRadius: d.shape === "redondo" && s.shapes.includes("redondo") ? "50%" : 4 }} />
                  <span className="block text-center text-xs font-bold text-cocoa-600">{s.label}</span>
                </Opt>
              ))}
            </div>
            {size.shapes.length > 1 && (
              <div className="mt-4 flex gap-2">
                {size.shapes.map((sh) => (
                  <Opt key={sh} active={d.shape === sh} onClick={() => set({ shape: sh })} className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold text-cocoa-600">
                    {sh === "redondo" ? <Circle className="h-4 w-4" /> : <Square className="h-4 w-4" />} {sh === "redondo" ? "Redondo" : "Cuadrado"}
                  </Opt>
                ))}
              </div>
            )}
            {d.shape !== "redondo" && (
              <label className="mt-4 block">
                <span className="label">Esquinas redondeadas</span>
                <input type="range" min={0} max={1.5} step={0.1} value={d.radius} onChange={(e) => set({ radius: Number(e.target.value) })} className="w-full accent-rose-500" />
              </label>
            )}
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
            {d.shape === "redondo" && <p className="mt-3 text-xs text-cocoa-400">En piezas redondas el contenido siempre va centrado.</p>}
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
                <option value="elegante">Elegante</option>
                <option value="romantica">Romántica</option>
                <option value="moderna">Moderna</option>
              </Select>
              <Select label="Fondo decorado" value={d.pattern} onChange={(e) => set({ pattern: e.target.value as PrintDesign["pattern"] })}>
                <option value="liso">Liso</option>
                <option value="chispas">Chispas de colores</option>
                <option value="puntos">Puntitos</option>
                <option value="rayas">Rayas</option>
                <option value="ondas">Ondas</option>
              </Select>
              <Select label="Borde" value={d.border} onChange={(e) => set({ border: e.target.value as PrintDesign["border"] })}>
                <option value="ninguno">Sin borde</option>
                <option value="linea">Línea</option>
                <option value="punteado">Punteado</option>
                <option value="doble">Doble</option>
              </Select>
            </div>
          </Card>

          {/* Textos */}
          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Información</h3>
            <p className="text-sm text-cocoa-400">Déjalo vacío para usar los datos de tu negocio.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Nombre" maxLength={60} placeholder={data.business} value={d.title} onChange={(e) => set({ title: e.target.value })} />
              <Input label="Frase" maxLength={80} value={d.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Escanea y haz tu pedido" />
              <Input label="Línea 1" maxLength={60} placeholder={data.whatsapp || "WhatsApp 998 123 4567"} value={d.line1} onChange={(e) => set({ line1: e.target.value })} />
              <Input label="Línea 2" maxLength={60} placeholder={data.instagram || "@tutienda"} value={d.line2} onChange={(e) => set({ line2: e.target.value })} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Toggle checked={d.showLogo} onChange={(v) => set({ showLogo: v })} label="Mostrar logo" />
              <Toggle checked={d.showQr} onChange={(v) => set({ showQr: v })} label="Mostrar QR" />
              <Toggle checked={d.showLines} onChange={(v) => set({ showLines: v })} label="Mostrar WhatsApp e Instagram" />
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
            <CardHeader title="Vista previa" subtitle={`${size.label}${d.shape === "redondo" ? " · redondo" : ""}`} />
            <div className="sprinkles grid place-items-center bg-cream-200/60 p-6">
              <div style={{ width: size.w * CM * previewScale, height: size.h * CM * previewScale }}>
                <div id="dd-piece-preview" style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: size.w * CM, height: size.h * CM, filter: "drop-shadow(0 8px 18px rgb(63 37 13 / .18))" }} dangerouslySetInnerHTML={{ __html: piece }} />
              </div>
            </div>
            <p className="px-4 py-3 text-xs text-cocoa-400">Así se verá impresa. Los tamaños son reales en centímetros.</p>
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
                        <div style={{ transform: `scale(${sheetScale})`, transformOrigin: "top left", width: size.w * CM, height: size.h * CM }} dangerouslySetInnerHTML={{ __html: piece }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button className="mt-4 w-full" onClick={print} disabled={!qr || !fit.total}><Printer className="h-4 w-4" /> Imprimir {fit.total} {kind === "tarjeta" ? "tarjetas" : kind === "etiqueta" ? "etiquetas" : kind === "sticker" ? "stickers" : "QR"}</Button>
              <p className="mt-2 text-center text-xs text-cocoa-400">Imprime al 100 % (escala real). Para guardar como PDF, elige “Guardar como PDF” en la impresora.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
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
