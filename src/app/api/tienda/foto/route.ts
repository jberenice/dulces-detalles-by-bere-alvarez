import { NextResponse } from "next/server";
import { rejectCrossSite } from "@/lib/same-origin";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX = 3 * 1024 * 1024;
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 10 * 60_000) {
    hits.set(ip, { n: 1, t: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  return ++h.n > 12;
}

/** Tipo real del archivo por sus primeros bytes (no confiamos en el nombre ni en el navegador) */
function sniff(b: Uint8Array): { ext: string; type: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}

/**
 * Sube una foto de una clienta (sin cuenta):
 *  · kind=solicitud: foto de referencia para un pastel personalizado (privada, solo la ve la repostería)
 *  · kind=resena: foto de su reseña (pública cuando la repostería la aprueba)
 * La foto se guarda en la carpeta de la repostería con nombre aleatorio y se regresa su ruta.
 */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "Demasiadas fotos, espera unos minutos" }, { status: 429 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Subida de fotos no disponible" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "");
  if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ ok: false, error: "Falta la foto" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ ok: false, error: "La foto es muy pesada (máx. 3 MB)" }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const t = sniff(bytes);
  if (!t) return NextResponse.json({ ok: false, error: "Solo fotos JPG, PNG o WebP" }, { status: 415 });

  let owner: string | null = null;
  let bucket = "";
  if (kind === "solicitud") {
    const slug = String(form?.get("slug") ?? "").toLowerCase();
    if (!/^[a-z0-9-]{3,63}$/.test(slug)) return NextResponse.json({ ok: false }, { status: 400 });
    const { data } = await admin.from("profiles").select("id, custom_cake, store_enabled").eq("store_slug", slug).maybeSingle();
    if (!data?.store_enabled || !(data.custom_cake as { enabled?: boolean } | null)?.enabled) return NextResponse.json({ ok: false, error: "Tienda no disponible" }, { status: 404 });
    owner = data.id;
    bucket = "solicitudes";
  } else if (kind === "resena") {
    const token = String(form?.get("token") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ ok: false }, { status: 400 });
    const { data } = await admin.from("reviews").select("user_id, submitted_at, created_at").eq("token", token).maybeSingle();
    if (!data || data.submitted_at || Date.parse(data.created_at) < Date.now() - 120 * 86400_000) return NextResponse.json({ ok: false, error: "Este enlace ya no es válido" }, { status: 404 });
    owner = data.user_id;
    bucket = "resenas";
  } else {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = `${owner}/${crypto.randomUUID()}.${t.ext}`;
  const { error } = await admin.storage.from(bucket).upload(path, bytes, { contentType: t.type, upsert: false, cacheControl: "31536000" });
  if (error) return NextResponse.json({ ok: false, error: "No se pudo guardar la foto" }, { status: 500 });
  return NextResponse.json({ ok: true, path });
}
