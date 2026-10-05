"use client";
/** Notificaciones push en el navegador / app instalada */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export async function registerServiceWorker() {
  if (!pushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/**
 * Pide permiso y suscribe este dispositivo a las notificaciones push.
 * Devuelve "push" si quedó suscrito, "local" si solo hay avisos con la app abierta, o el motivo del fallo.
 */
export async function enableNotifications(): Promise<"push" | "local" | "denied" | "unsupported" | "ios-install"> {
  if (typeof window === "undefined" || !("Notification" in window)) return isIOS() && !isStandalone() ? "ios-install" : "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  if (!pushSupported() || !PUBLIC_KEY) return "local";
  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) });
  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, device: navigator.userAgent.slice(0, 180) }),
  });
  return res.ok ? "push" : "local";
}

export async function disableNotifications() {
  const sub = await currentSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
  await sub.unsubscribe();
}

export async function sendTestPush() {
  const r = await fetch("/api/push/test", { method: "POST" });
  return (await r.json()) as { ok: boolean; sent?: number; error?: string };
}
