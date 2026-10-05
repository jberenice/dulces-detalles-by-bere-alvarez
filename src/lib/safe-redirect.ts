/** Solo permite redirigir a rutas internas (evita open redirects como "//sitio-malicioso.com"). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || next.includes("://")) return fallback;
  return next;
}
