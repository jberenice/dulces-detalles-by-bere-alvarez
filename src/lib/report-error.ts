"use client";

/** Errores que no vale la pena registrar (extensiones del navegador, avisos sin importancia) */
const IGNORE = [/ResizeObserver loop/i, /chrome-extension:|moz-extension:|safari-extension:/i, /Non-Error promise rejection captured/i, /AbortError/i, /Load failed$/i, /NEXT_REDIRECT|NEXT_NOT_FOUND/];
const sent = new Set<string>();

/** Manda un error del navegador al registro de la app (una vez por error y por visita) */
export function reportError(err: unknown, extra?: { digest?: string }) {
  try {
    const e = err instanceof Error ? err : new Error(typeof err === "string" ? err : JSON.stringify(err));
    const message = `${e.message || "Error"}${extra?.digest ? ` (digest ${extra.digest})` : ""}`;
    const stack = e.stack ?? "";
    if (IGNORE.some((r) => r.test(message) || r.test(stack))) return;
    const key = message + stack.slice(0, 200);
    if (sent.has(key) || sent.size > 20) return;
    sent.add(key);
    const body = JSON.stringify({ message, stack, path: window.location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/errores", new Blob([body], { type: "application/json" }));
    else fetch("/api/errores", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}
