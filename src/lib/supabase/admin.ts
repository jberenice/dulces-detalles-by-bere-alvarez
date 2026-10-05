import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";
import type { Db } from "./db";

/** Cliente con la llave de servicio (solo en el servidor; omite RLS). Devuelve null si no está configurada. */
export function createAdminClient(): Db | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
