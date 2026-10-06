import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** IP del visitante (Vercel la pone en x-real-ip / x-forwarded-for) */
export function clientIp(request: Request) {
  return (request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim().slice(0, 64) || "desconocida";
}

/** Límite de intentos por IP con la tabla rate_limits de Supabase. Regresa una respuesta 429 si se pasó. */
export async function enforceIpLimit(request: Request, name: string, max: number, windowSeconds: number) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { error } = await admin.rpc("enforce_rate_limit", { p_key: `${name}:${clientIp(request)}`, p_max: max, p_window: `${windowSeconds} seconds` });
  if (error?.code === "P0429") return new NextResponse("Demasiados intentos. Espera unos minutos.", { status: 429 });
  return null;
}
