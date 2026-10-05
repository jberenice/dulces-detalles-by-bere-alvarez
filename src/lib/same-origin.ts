import { NextResponse } from "next/server";

/** Rechaza peticiones POST que vienen de otro sitio (protección CSRF adicional a las cookies SameSite). */
export function rejectCrossSite(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return null;
  try {
    if (new URL(origin).host === host) return null;
  } catch {}
  return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
}
