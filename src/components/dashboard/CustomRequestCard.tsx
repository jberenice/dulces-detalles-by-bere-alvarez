"use client";
import { useEffect, useState } from "react";
import { Cake, MessageCircle, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { money, waLink } from "@/lib/format";
import type { Quote } from "@/lib/types";

/** Lo que pidió la clienta desde la tienda (pastel personalizado), con sus fotos de referencia */
export function CustomRequestCard({ q }: { q: Quote }) {
  const r = q.request ?? {};
  const [photos, setPhotos] = useState<string[]>([]);
  useEffect(() => {
    const paths = q.reference_images ?? [];
    if (!paths.length) return;
    createClient()
      .storage.from("solicitudes")
      .createSignedUrls(paths, 3600)
      .then(({ data }: { data: { signedUrl: string | null }[] | null }) => setPhotos((data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[]));
  }, [q.reference_images]);

  const rows: [string, string | number | undefined][] = [
    ["Personas", r.people],
    ["Ocasión", r.occasion],
    ["Pan", r.flavor],
    ["Relleno", r.filling],
    ["Cubierta", r.topping],
    ["Forma", r.shape],
    ["Mensaje en el pastel", r.message ? `“${r.message}”` : undefined],
    ["Hora", r.time],
    ["Entrega", r.delivery_type === "envio" ? `Envío${r.zone ? ` (${r.zone})` : ""}${r.address ? ` · ${r.address}` : ""}` : "Pasa a recoger"],
    ["Presupuesto aprox.", r.budget ? money(r.budget) : undefined],
  ];
  const noPrice = !Number(q.total);

  return (
    <Card className="mb-6 overflow-hidden ring-2 ring-rose-200">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-rose-500"><Cake className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold text-cocoa-700">Solicitud de pastel personalizado desde tu tienda</p>
            <p className="text-xs text-cocoa-500">{noPrice ? "Aún no tiene precio: edítala, pon el precio y envíala." : "Ya tiene precio. Envíala a tu clienta."}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {r.phone && (
            <a href={waLink(r.phone, `¡Hola ${r.name?.split(" ")[0] ?? ""}! Recibí tu solicitud de pastel 🎂 `)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-bold text-mint-700 ring-1 ring-mint-200 hover:bg-mint-50">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          {noPrice && <ButtonLink href={`/dashboard/cotizaciones/${q.id}/editar`} size="sm"><Pencil className="h-4 w-4" /> Ponerle precio</ButtonLink>}
        </div>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
        <div>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {rows.filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-dashed border-cocoa-800/10 pb-1.5">
                <dt className="text-cocoa-400">{k}</dt>
                <dd className="text-right font-semibold text-cocoa-700">{v}</dd>
              </div>
            ))}
          </dl>
          {r.design && (
            <p className="mt-4 rounded-2xl bg-cream-100 p-4 text-sm leading-relaxed whitespace-pre-line text-cocoa-600">
              <b className="text-cocoa-700">Su idea:</b> {r.design}
            </p>
          )}
        </div>
        {photos.length > 0 && (
          <div className="flex gap-2 lg:flex-col">
            {photos.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block h-28 w-28 overflow-hidden rounded-2xl ring-1 ring-cocoa-800/10 lg:h-32 lg:w-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Foto de referencia" className="h-full w-full object-cover transition hover:scale-105" />
              </a>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
