import { NextResponse } from "next/server";
import { gzipSync } from "zlib";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandFromProfile, brandedEmail, esc } from "@/lib/email-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Tablas que se respaldan (todo lo que capturan las usuarias y las licencias) */
const TABLES = [
  "profiles", "licenses", "license_payments", "fixed_costs", "ingredients", "ingredient_price_history", "desserts", "dessert_items",
  "packages", "seasons", "coupons", "clients", "quotes", "quote_items", "orders", "order_items", "order_payments",
  "inventory_movements", "reviews", "loyalty_redemptions", "store_domains",
];
const KEEP_DAYS = 14;

/**
 * Respaldo diario: exporta todas las tablas a un archivo JSON comprimido en Supabase Storage (bucket privado "respaldos"),
 * conserva los últimos 14 días y manda un resumen por correo a la administración (con los errores nuevos del día).
 * Se ejecuta con Supabase pg_cron (ver supabase/cron_setup.sql). Requiere CRON_SECRET y SUPABASE_SERVICE_ROLE_KEY.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "Falta SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

  const started = Date.now();
  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  const failed: string[] = [];
  for (const table of TABLES) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      const { data: page, error } = await admin.from(table).select("*").range(from, from + 999);
      if (error) {
        failed.push(`${table}: ${error.message}`);
        break;
      }
      rows.push(...(page ?? []));
      if (!page || page.length < 1000) break;
    }
    data[table] = rows;
    counts[table] = rows.length;
  }

  const day = new Date().toISOString().slice(0, 10);
  const file = `${day}.json.gz`;
  const payload = gzipSync(Buffer.from(JSON.stringify({ created_at: new Date().toISOString(), counts, data })));
  const { error: upErr } = await admin.storage.from("respaldos").upload(file, payload, { contentType: "application/gzip", upsert: true });

  // Borra respaldos de hace más de 14 días
  const { data: files } = await admin.storage.from("respaldos").list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400_000).toISOString().slice(0, 10);
  const old = (files ?? []).map((f: { name: string }) => f.name).filter((n: string) => /^\d{4}-\d{2}-\d{2}\.json\.gz$/.test(n) && n.slice(0, 10) < cutoff);
  if (old.length) await admin.storage.from("respaldos").remove(old);

  // Errores nuevos o repetidos en las últimas 24 h
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { data: errors } = await admin
    .from("app_errors")
    .select("message, path, count, source, last_seen")
    .gte("last_seen", since)
    .eq("resolved", false)
    .order("count", { ascending: false })
    .limit(10);

  // Resumen a la administración
  const sizeKb = Math.round(payload.length / 1024);
  const ok = !upErr && failed.length === 0;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin");
    const to = (admins ?? []).map((a: { email: string | null }) => a.email).filter(Boolean) as string[];
    if (to.length) {
      const errList = (errors ?? []) as { message: string; path: string | null; count: number; source: string }[];
      const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
      const body = [
        ok
          ? `<p>✅ Respaldo del ${day} guardado (${sizeKb} KB): ${counts.profiles ?? 0} cuentas, ${counts.orders ?? 0} pedidos, ${counts.quotes ?? 0} cotizaciones.</p>`
          : `<p>⚠️ El respaldo del ${day} tuvo problemas: ${esc([upErr?.message, ...failed].filter(Boolean).join(" · "))}</p>`,
        errList.length
          ? `<p><b>Errores en las últimas 24 h:</b></p><ul>${errList.map((e) => `<li>${esc(e.message.slice(0, 160))} <span style="color:#8a6a4a">(${e.count}× · ${esc(e.source)}${e.path ? ` · ${esc(e.path)}` : ""})</span></li>`).join("")}</ul>`
          : `<p>Sin errores nuevos en las últimas 24 horas. 🎉</p>`,
      ].join("");
      const base = process.env.RESEND_FROM ?? "Dulces Detalles <onboarding@resend.dev>";
      const fromEmail = /<([^>]+)>/.exec(base)?.[1] ?? base;
      await new Resend(key).emails
        .send({
          from: `"Dulces Detalles" <${fromEmail}>`,
          to,
          subject: `${ok ? "Respaldo listo" : "⚠️ Revisa el respaldo"} · ${errList.length ? `${errList.length} errores` : "sin errores"} · ${day}`,
          html: brandedEmail({
            brand: brandFromProfile(null, false),
            preheader: ok ? "Respaldo diario guardado" : "El respaldo diario tuvo problemas",
            title: "Resumen diario de la app",
            body,
            cta: site ? { label: "Ver errores", url: `${site}/dashboard/admin/errores` } : null,
          }),
        })
        .catch(() => {});
    }
  }

  return NextResponse.json({ ok, file, sizeKb, counts, failed, upload: upErr?.message ?? null, deleted: old.length, ms: Date.now() - started });
}
