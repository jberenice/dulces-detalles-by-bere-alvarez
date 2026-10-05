/** Registra los errores del servidor (páginas, API y acciones) en el panel de administración → Errores */
export async function register() {}

export async function onRequestError(err: unknown, request: { path: string; method: string; headers: Record<string, string | string[] | undefined> }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { logError } = await import("@/lib/error-log.server");
    const e = err instanceof Error ? err : new Error(String(err));
    const digest = (err as { digest?: string })?.digest;
    // Las redirecciones y "no encontrado" de Next no son errores reales
    if (/NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK/.test(e.message + (digest ?? ""))) return;
    const ua = request.headers["user-agent"];
    await logError({
      source: "servidor",
      message: `${e.message}${digest ? ` (digest ${digest})` : ""}`,
      stack: e.stack ?? null,
      path: `${request.method} ${request.path}`,
      userAgent: Array.isArray(ua) ? ua[0] : ua ?? null,
    });
  } catch {}
}
