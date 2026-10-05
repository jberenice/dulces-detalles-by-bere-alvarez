/**
 * Normaliza la URL de Supabase: acepta errores comunes al copiarla
 * (".../rest/v1", diagonal final, espacios) y deja solo el origen https://<ref>.supabase.co.
 * Una URL con ruta extra provoca el error "Invalid path specified in request URL".
 */
function normalizeUrl(raw: string | undefined) {
  const value = (raw ?? "").trim();
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
}

// Las variables NEXT_PUBLIC_* deben leerse de forma literal para que Next las incluya en el navegador
export const SUPABASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
