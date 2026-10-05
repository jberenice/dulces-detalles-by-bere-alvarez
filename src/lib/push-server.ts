import * as webpush from "web-push";

/** Envío de notificaciones push desde el servidor (requiere llaves VAPID) */
let configured = false;
export function pushConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:avisos@dulcesdetalles.app", pub, priv);
  configured = true;
  return true;
}

export type PushSub = { id: string; endpoint: string; p256dh: string; auth: string };
export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Envía a varias suscripciones; devuelve cuántas llegaron y las que ya no existen (para borrarlas) */
export async function sendPush(subs: PushSub[], payload: PushPayload) {
  if (!pushConfigured() || !subs.length) return { sent: 0, gone: [] as string[] };
  const gone: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 60 * 60 * 12, urgency: "high" });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id);
      }
    }),
  );
  return { sent, gone };
}
