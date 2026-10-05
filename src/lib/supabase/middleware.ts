import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Db } from "./db";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export const SESSION_COOKIE = "dd_device_session";

const PROTECTED = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/registro"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase: Db = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));

  const redirect = (to: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user) {
    if (isProtected) return redirect("/login", { next: path });
    return response;
  }

  if (AUTH_PAGES.includes(path)) return redirect("/dashboard");

  if (isProtected) {
    const deviceSession = request.cookies.get(SESSION_COOKIE)?.value ?? null;
    const { data: status } = await supabase.rpc("license_status", { p_session: deviceSession });
    switch (status) {
      case "ok":
        break;
      case "no_license":
        return redirect("/activar");
      case "suspended":
        return redirect("/licencia-inactiva", { motivo: "suspendida" });
      case "expired":
        return redirect("/licencia-inactiva", { motivo: "vencida" });
      case "demo_expired":
        return redirect("/demo", { expirada: "1" });
      case "other_device":
        return redirect("/sesion-activa", { next: path });
      default:
        return redirect("/login");
    }
  }

  return response;
}
