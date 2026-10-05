import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SESSION_COOKIE } from "@/lib/supabase/middleware";

/** Confirmación de correo y recuperación de contraseña. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const session = crypto.randomUUID();
      await supabase.rpc("claim_session", { p_session: session, p_device: "Enlace de correo" });
      const res = NextResponse.redirect(`${origin}${safeNext}`);
      res.cookies.set(SESSION_COOKIE, session, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      return res;
    }
  }
  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
