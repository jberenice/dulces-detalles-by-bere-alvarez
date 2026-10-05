"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Db } from "./db";

/**
 * No usamos tipos generados de la base de datos: cada consulta tipa sus filas con `as Tipo`
 * (ver src/lib/types.ts). Si generas tipos con `supabase gen types`, cámbialo por SupabaseClient<Database>.
 */

let client: Db | null = null;

export function createClient(): Db {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
