"use client";
import { useRef, useState } from "react";
import { Mail, MessageCircle, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Badge, Card, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DEFAULT_TEMPLATES, TEMPLATE_META, TEMPLATE_VARS, exampleVars, getTemplate, renderTemplate, type TemplateKey } from "@/lib/templates";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/types";

const KEYS = Object.keys(TEMPLATE_META) as TemplateKey[];

export default function TemplatesPage() {
  const { profile, setProfile } = useBusiness();
  const [active, setActive] = useState<TemplateKey>("cotizacion_whatsapp");
  const [values, setValues] = useState<Record<TemplateKey, string>>(() => Object.fromEntries(KEYS.map((k) => [k, getTemplate(profile, k)])) as Record<TemplateKey, string>);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const examples = { ...exampleVars(), negocio: profile.business_name, tu_nombre: profile.owner_name?.split(" ")[0] ?? "Bere" };

  function insertVar(key: string) {
    const el = ref.current;
    const token = `{${key}}`;
    const current = values[active];
    if (!el) return setValues({ ...values, [active]: current + token });
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setValues({ ...values, [active]: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function save() {
    setSaving(true);
    // Solo se guardan las que cambiaron respecto a la versión original
    const custom = Object.fromEntries(KEYS.filter((k) => values[k].trim() && values[k] !== DEFAULT_TEMPLATES[k]).map((k) => [k, values[k].slice(0, 2000)]));
    const { data, error } = await createClient().from("profiles").update({ message_templates: custom }).eq("id", profile.id).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setProfile(data as Profile);
    toast.success("Plantillas guardadas 💬");
  }

  const meta = TEMPLATE_META[active];
  const preview = renderTemplate(values[active], examples);

  return (
    <>
      <PageHeader
        eyebrow="Tu voz, tu estilo"
        title="Mensajes"
        subtitle="Personaliza los mensajes que envías por WhatsApp y correo. Usa las variables para que se llenen solas con los datos de cada pedido."
        actions={<Button onClick={save} loading={saving}><Save className="h-4 w-4" /> Guardar</Button>}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="p-2">
          <ul className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
            {KEYS.map((k) => (
              <li key={k} className="shrink-0">
                <button
                  onClick={() => setActive(k)}
                  className={cn("flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold whitespace-nowrap transition", active === k ? "bg-rose-500 text-white" : "text-cocoa-600 hover:bg-cream-100")}
                >
                  {TEMPLATE_META[k].channel === "Correo" ? <Mail className="h-4 w-4 shrink-0" /> : <MessageCircle className="h-4 w-4 shrink-0" />}
                  {TEMPLATE_META[k].title}
                  {values[k] !== DEFAULT_TEMPLATES[k] && <span className={cn("ml-auto h-2 w-2 rounded-full", active === k ? "bg-white" : "bg-mint-400")} title="Personalizada" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{meta.title}</h3>
                <p className="text-sm text-cocoa-400">{meta.description}</p>
              </div>
              <Badge tone={meta.channel === "Correo" ? "rose" : "mint"}>{meta.channel}</Badge>
            </div>
            <textarea
              ref={ref}
              value={values[active]}
              onChange={(e) => setValues({ ...values, [active]: e.target.value })}
              rows={10}
              maxLength={2000}
              className="field mt-4 min-h-[220px] font-[inherit] leading-relaxed"
            />
            <p className="mt-4 mb-2 text-xs font-bold tracking-wider text-cocoa-300 uppercase">Toca para insertar una variable</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <button key={v.key} type="button" onClick={() => insertVar(v.key)} title={v.label} className="rounded-full bg-cream-200 px-2.5 py-1 font-mono text-[12px] font-semibold text-cocoa-600 hover:bg-rose-100 hover:text-rose-600">
                  {`{${v.key}}`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setValues({ ...values, [active]: DEFAULT_TEMPLATES[active] })}
              className="mt-4 flex items-center gap-1.5 text-sm font-bold text-cocoa-400 hover:text-rose-500"
            >
              <RotateCcw className="h-4 w-4" /> Restaurar mensaje original
            </button>
          </Card>

          <Card className="h-fit overflow-hidden">
            <div className="bg-[#e5ddd5] px-4 py-5 sm:px-6">
              <p className="mb-3 text-center text-[11px] font-bold tracking-widest text-cocoa-500 uppercase">Así se verá</p>
              <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-line text-[#303030] shadow-sm">
                {preview}
                <p className="mt-1 text-right text-[10px] text-[#667781]">12:30 ✓✓</p>
              </div>
            </div>
            <p className="px-5 py-4 text-xs text-cocoa-400">Vista previa con datos de ejemplo. Los renglones con variables vacías (por ejemplo, sin anticipo) se ajustan solos.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
