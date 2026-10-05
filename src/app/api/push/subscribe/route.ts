import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rejectCrossSite } from "@/lib/same-origin";

export const runtime = "nodejs";

type Body = { endpoint?: string; keys?: { p256dh?: string; auth?: string }; device?: string };

/** Guarda la suscripción push de este dispositivo */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const b = (await request.json().catch(() => ({}))) as Body;
  if (!b.endpoint?.startsWith("https://") || !b.keys?.p256dh || !b.keys?.auth || b.endpoint.length > 1000)
    return NextResponse.json({ ok: false, error: "Suscripción inválida" }, { status: 400 });

  // Si el mismo navegador estaba ligado a otra cuenta, se reasigna a la actual
  const admin = createAdminClient();
  if (admin) await admin.from("push_subscriptions").delete().eq("endpoint", b.endpoint).neq("user_id", user.id);

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: b.endpoint, p256dh: b.keys.p256dh, auth: b.keys.auth, device: (b.device ?? "").slice(0, 200), user_id: user.id }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const supabase = await createClient();
  const b = (await request.json().catch(() => ({}))) as Body;
  if (b.endpoint) await supabase.from("push_subscriptions").delete().eq("endpoint", b.endpoint);
  return NextResponse.json({ ok: true });
}
