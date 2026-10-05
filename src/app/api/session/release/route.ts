import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SESSION_COOKIE } from "@/lib/supabase/middleware";

/** Cierra sesión y libera el dispositivo de la licencia. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) await supabase.rpc("release_session", { p_session: session });
  await supabase.auth.signOut();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
