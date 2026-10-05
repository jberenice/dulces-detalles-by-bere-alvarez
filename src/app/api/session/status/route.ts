import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SESSION_COOKIE } from "@/lib/supabase/middleware";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("license_status", {
    p_session: request.cookies.get(SESSION_COOKIE)?.value ?? null,
  });
  return NextResponse.json({ status: error ? "error" : data });
}
