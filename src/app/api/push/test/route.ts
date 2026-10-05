import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSite } from "@/lib/same-origin";
import { pushConfigured, sendPush, type PushSub } from "@/lib/push-server";

export const runtime = "nodejs";

/** Notificación de prueba a todos los dispositivos de la usuaria */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ ok: false, error: "Faltan las llaves VAPID en Vercel" }, { status: 500 });
  const { data: subs } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  const { sent, gone } = await sendPush((subs ?? []) as PushSub[], {
    title: "🧁 ¡Notificaciones activas!",
    body: "Así te avisaremos de nuevos pedidos y entregas.",
    url: "/dashboard",
    tag: "prueba",
  });
  if (gone.length) await supabase.from("push_subscriptions").delete().in("id", gone);
  return NextResponse.json({ ok: sent > 0, sent, error: sent ? undefined : "Este dispositivo no está suscrito" });
}
