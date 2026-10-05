import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectCrossSite } from "@/lib/same-origin";
import { SESSION_COOKIE } from "@/lib/supabase/middleware";

/** Registra este navegador como el único dispositivo activo de la licencia. */
export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const session = crypto.randomUUID();
  const ua = request.headers.get("user-agent") ?? "";
  const device = describeDevice(ua);
  const { data, error } = await supabase.rpc("claim_session", { p_session: session, p_device: device });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  const res = NextResponse.json({ ok: true, hasLicense: !!data });
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

function describeDevice(ua: string) {
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Otro";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Navegador";
  return `${browser} · ${os}`;
}
