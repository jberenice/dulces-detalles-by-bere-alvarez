"use client";
import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { FESTIVE_THEMES, type FestiveSetting } from "@/lib/festive";
import { readPanelFestive, savePanelFestive } from "./Festive";

/** Ajuste: adornos de temporada en tu panel (se guarda en este dispositivo) */
export function PanelFestiveSetting() {
  const [v, setV] = useState<FestiveSetting>("auto");
  useEffect(() => setV(readPanelFestive()), []);
  const choose = (x: FestiveSetting) => {
    setV(x);
    savePanelFestive(x);
  };
  const opts: { id: FestiveSetting; label: string }[] = [
    { id: "auto", label: "📅 Automático" },
    { id: "off", label: "Sin adornos" },
    ...FESTIVE_THEMES.map((f) => ({ id: f.id, label: `${f.emoji} ${f.name}` })),
  ];
  return (
    <Card>
      <CardHeader title="Fechas especiales en tu panel" subtitle="Guirnalda y aviso de temporada (Navidad, 10 de mayo, Día de Muertos…). Se guarda en este dispositivo." icon={<PartyPopper className="h-5 w-5" />} />
      <div className="flex flex-wrap gap-2 p-5 sm:p-6">
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => choose(o.id)}
            className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-bold transition", v === o.id ? "border-rose-400 bg-rose-50 text-rose-600" : "border-cocoa-800/10 bg-white text-cocoa-500 hover:border-rose-200")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
