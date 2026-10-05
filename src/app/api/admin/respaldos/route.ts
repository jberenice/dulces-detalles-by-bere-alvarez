import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lista los respaldos (GET) o da un enlace temporal para descargar uno (GET ?file=AAAA-MM-DD.json.gz). Solo administración. */
export async function GET(request: Request) {
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: me } = await sb.from("profiles").select("role").eq("id", auth.user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ ok: false }, { status: 403 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor" }, { status: 500 });

  const file = new URL(request.url).searchParams.get("file");
  if (file) {
    if (!/^\d{4}-\d{2}-\d{2}\.json\.gz$/.test(file)) return NextResponse.json({ ok: false }, { status: 400 });
    const { data, error } = await admin.storage.from("respaldos").createSignedUrl(file, 120, { download: file });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    return NextResponse.json({ ok: true, url: data.signedUrl });
  }
  const { data, error } = await admin.storage.from("respaldos").list("", { limit: 100, sortBy: { column: "name", order: "desc" } });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({
    ok: true,
    files: (data ?? [])
      .filter((f: { name: string }) => /\.json\.gz$/.test(f.name))
      .map((f: { name: string; metadata?: { size?: number } | null; created_at?: string }) => ({ name: f.name, size: f.metadata?.size ?? 0, created_at: f.created_at })),
  });
}
