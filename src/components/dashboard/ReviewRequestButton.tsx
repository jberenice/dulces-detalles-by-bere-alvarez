"use client";
import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { getTemplate, renderTemplate } from "@/lib/templates";
import { folio, siteUrl, waLink } from "@/lib/format";
import type { Order } from "@/lib/types";

/** Crea (o reutiliza) el enlace de reseña del pedido y abre WhatsApp con el mensaje listo */
export function ReviewRequestButton({ order, phone, name }: { order: Pick<Order, "id" | "folio" | "client_id">; phone: string | null; name: string }) {
  const { profile } = useBusiness();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!phone) return toast.error("Este pedido no tiene teléfono");
    setBusy(true);
    // Se abre antes de esperar al servidor: los celulares bloquean ventanas abiertas después
    const popup = window.open("", "_blank");
    const sb = createClient();
    let token: string | null = null;
    const { data: existing, error: e1 } = await sb.from("reviews").select("token, submitted_at").eq("order_id", order.id).maybeSingle();
    if (e1) {
      popup?.close();
      setBusy(false);
      return toast.error(e1.message.includes("reviews") ? "Falta ejecutar la migración 0014 en Supabase" : e1.message);
    }
    if (existing?.submitted_at) {
      popup?.close();
      setBusy(false);
      return toast.info("Tu clienta ya dejó su reseña de este pedido 💕");
    }
    token = existing?.token ?? null;
    if (!token) {
      const { data, error } = await sb.from("reviews").insert({ order_id: order.id, client_id: order.client_id, customer_name: name || null }).select("token").single();
      if (error) {
        popup?.close();
        setBusy(false);
        return toast.error(error.message);
      }
      token = data.token;
    }
    setBusy(false);
    const text = renderTemplate(getTemplate(profile, "pedir_resena"), {
      cliente: name.split(" ")[0],
      folio: folio("P", order.folio),
      enlace_resena: `${siteUrl()}/r/${token}`,
      negocio: profile.business_name,
      tu_nombre: profile.owner_name ?? profile.business_name,
    });
    const url = waLink(phone, text);
    if (popup && !popup.closed) popup.location.href = url;
    else window.open(url, "_blank");
  }

  return (
    <button onClick={go} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} Pedir reseña
    </button>
  );
}
