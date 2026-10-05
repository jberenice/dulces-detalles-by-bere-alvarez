import { createAdminClient } from "@/lib/supabase/admin";

export type ErrorReport = {
  source: "cliente" | "servidor";
  message: string;
  stack?: string | null;
  path?: string | null;
  userId?: string | null;
  userAgent?: string | null;
};

/** Hash corto (FNV-1a de 64 bits en dos mitades); sin módulos de Node para que compile en cualquier entorno */
function hash(text: string) {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x5bd1e995) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

/** Huella para agrupar el mismo error: mensaje + primera línea del stack sin números de línea ni hashes */
export function fingerprintOf(r: Pick<ErrorReport, "source" | "message" | "stack">) {
  const firstFrame = (r.stack ?? "").split("\n").find((l) => /at |@/.test(l)) ?? "";
  const clean = (s: string) => s.replace(/\?[^)\s]*/g, "").replace(/:\d+(:\d+)?/g, "").replace(/[0-9a-f]{8,}/gi, "#").trim();
  return hash(`${r.source}|${clean(r.message).slice(0, 300)}|${clean(firstFrame).slice(0, 300)}`);
}

/**
 * Guarda el error en la tabla app_errors (panel de administración → Errores)
 * y, si está configurado SENTRY_DSN, también lo manda a Sentry.
 */
export async function logError(r: ErrorReport) {
  const admin = createAdminClient();
  const tasks: Promise<unknown>[] = [];
  if (admin) {
    tasks.push(
      admin.rpc("log_app_error", {
        p_fingerprint: fingerprintOf(r),
        p_source: r.source,
        p_message: r.message.slice(0, 1000),
        p_stack: r.stack?.slice(0, 6000) ?? null,
        p_path: r.path?.slice(0, 300) ?? null,
        p_user: r.userId ?? null,
        p_ua: r.userAgent?.slice(0, 300) ?? null,
      }),
    );
  }
  tasks.push(sendToSentry(r));
  await Promise.allSettled(tasks);
}

/** Envío mínimo a Sentry por HTTP (sin instalar su SDK). Opcional: solo si existe SENTRY_DSN. */
async function sendToSentry(r: ErrorReport) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  let u: URL;
  try {
    u = new URL(dsn);
  } catch {
    return;
  }
  const projectId = u.pathname.replace(/\//g, "");
  const key = u.username;
  if (!projectId || !key) return;
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tags: { source: r.source },
    request: r.path ? { url: r.path, headers: r.userAgent ? { "User-Agent": r.userAgent } : undefined } : undefined,
    user: r.userId ? { id: r.userId } : undefined,
    exception: { values: [{ type: "Error", value: r.message, stacktrace: undefined }] },
    extra: r.stack ? { stack: r.stack } : undefined,
  };
  const body = `${JSON.stringify({ event_id: eventId, dsn, sent_at: new Date().toISOString() })}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}`;
  await fetch(`${u.protocol}//${u.host}/api/${projectId}/envelope/?sentry_key=${key}&sentry_version=7`, {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body,
  }).catch(() => {});
}
