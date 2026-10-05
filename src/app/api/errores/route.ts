import { NextResponse } from "next/server";
import { rejectCrossSite } from "@/lib/same-origin";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/error-log.server";

export const runtime = "nodejs";

// Límite sencillo por IP (por instancia) para que nadie llene la tabla de errores
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 10 * 60_000) {
    hits.set(ip, { n: 1, t: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n++;
  return h.n > 30;
}

/** Recibe errores del navegador (ver components/ErrorReporter.tsx) */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ ok: false }, { status: 429 });
  const body = (await request.json().catch(() => null)) as { message?: unknown; stack?: unknown; path?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  let userId: string | null = null;
  try {
    const sb = await createClient();
    userId = (await sb.auth.getUser()).data.user?.id ?? null;
  } catch {}

  await logError({
    source: "cliente",
    message: message.slice(0, 1000),
    stack: typeof body?.stack === "string" ? body.stack.slice(0, 6000) : null,
    path: typeof body?.path === "string" ? body.path.slice(0, 300) : null,
    userId,
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ ok: true });
}
