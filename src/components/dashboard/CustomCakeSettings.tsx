"use client";
import { useState } from "react";
import { Cake, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Toggle } from "@/components/ui/Field";
import type { CustomCakeSettings } from "@/lib/types";

export const DEFAULT_CAKE: CustomCakeSettings = {
  enabled: false,
  min_notice_days: 5,
  min_people: 10,
  flavors: ["Vainilla", "Chocolate", "Red velvet", "Tres leches", "Zanahoria"],
  fillings: ["Cajeta", "Nutella", "Frutos rojos", "Durazno", "Queso crema"],
  toppings: ["Buttercream", "Fondant", "Chantilly", "Ganache de chocolate"],
  shapes: [],
};

/** Limpia la configuración antes de guardarla */
export function cleanCake(c: CustomCakeSettings | null | undefined): CustomCakeSettings {
  const list = (l?: string[]) => [...new Set((l ?? []).map((x) => x.trim().slice(0, 60)).filter(Boolean))].slice(0, 25);
  return {
    enabled: !!c?.enabled,
    min_notice_days: Math.max(0, Math.min(90, Math.round(Number(c?.min_notice_days) || 0))),
    min_people: Math.max(1, Math.min(500, Math.round(Number(c?.min_people) || 1))),
    flavors: list(c?.flavors),
    fillings: list(c?.fillings),
    toppings: list(c?.toppings),
    shapes: list(c?.shapes),
    occasions: list(c?.occasions),
    intro: (c?.intro ?? "").trim().slice(0, 400) || undefined,
  };
}

/** Ajustes del formulario "Cotiza tu pastel personalizado" de la tienda */
export function CustomCakeSettingsCard({ value, onChange }: { value: CustomCakeSettings | null | undefined; onChange: (v: CustomCakeSettings) => void }) {
  const v = { ...DEFAULT_CAKE, ...(value ?? {}) };
  const set = (patch: Partial<CustomCakeSettings>) => onChange({ ...v, ...patch });
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><Cake className="h-5 w-5 text-rose-400" /> Pasteles personalizados</h3>
      <p className="text-sm text-cocoa-400">
        Tus clientas llenan un formulario (personas, sabor, relleno, decoración, fecha y fotos de referencia) y te llega como <b>cotización en borrador</b>: solo pones el precio y la mandas.
      </p>
      <Toggle className="mt-4" checked={!!v.enabled} onChange={(x) => set({ enabled: x })} label="Recibir solicitudes de pastel personalizado en mi tienda" />
      {v.enabled && (
        <div className="mt-5 space-y-5 border-t border-cocoa-800/5 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Días mínimos de anticipación" type="number" min={0} max={90} value={v.min_notice_days ?? 0} onChange={(e) => set({ min_notice_days: e.target.value as unknown as number })} />
            <Input label="Mínimo de personas" type="number" min={1} value={v.min_people ?? 1} onChange={(e) => set({ min_people: e.target.value as unknown as number })} />
          </div>
          <Textarea label="Mensaje para tus clientas (opcional)" rows={2} maxLength={400} value={v.intro ?? ""} onChange={(e) => set({ intro: e.target.value })} placeholder="Ej. Nuestros pasteles personalizados son desde $650 para 15 personas. ¡Cuéntanos tu idea!" />
          <ChipList label="Sabores de pan" value={v.flavors ?? []} onChange={(flavors) => set({ flavors })} placeholder="Ej. Moka" />
          <ChipList label="Rellenos" value={v.fillings ?? []} onChange={(fillings) => set({ fillings })} placeholder="Ej. Mermelada de fresa" />
          <ChipList label="Cubiertas" value={v.toppings ?? []} onChange={(toppings) => set({ toppings })} placeholder="Ej. Merengue suizo" />
          <ChipList label="Formas (opcional)" value={v.shapes ?? []} onChange={(shapes) => set({ shapes })} placeholder="Ej. Redondo, Corazón, 2 pisos" />
          <p className="text-xs text-cocoa-400">Si dejas una lista vacía, tu clienta lo escribe libremente. Siempre puede elegir “Otro”.</p>
        </div>
      )}
    </Card>
  );
}

function ChipList({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState("");
  const add = () => {
    const parts = text.split(",").map((x) => x.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])].slice(0, 25));
    setText("");
  };
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {value.map((x) => (
          <span key={x} className="inline-flex items-center gap-1 rounded-full bg-rose-50 py-1 pr-1 pl-3 text-sm font-semibold text-rose-600">
            {x}
            <button type="button" onClick={() => onChange(value.filter((y) => y !== x))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-rose-100" aria-label={`Quitar ${x}`}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input className="field flex-1 !py-2 text-sm" value={text} maxLength={120} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-xl bg-cream-200 px-3 text-sm font-bold text-cocoa-600 hover:bg-cream-300"><Plus className="h-4 w-4" /> Agregar</button>
      </div>
    </div>
  );
}
