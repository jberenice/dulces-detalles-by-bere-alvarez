"use client";
import { useEffect, useState } from "react";
import { BellOff, BellRing, Download, Send, Share, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { currentSubscription, disableNotifications, enableNotifications, isIOS, isStandalone, pushSupported, sendTestPush } from "@/lib/push-client";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Instalar la app en el celular y activar notificaciones push */
export function AppInstallCard() {
  const [installEvt, setInstallEvt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIOS());
    currentSubscription().then((s) => setSubscribed(!!s));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvt) return;
    await installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    if (outcome === "accepted") toast.success("¡App instalada! Búscala en tu pantalla de inicio 🧁");
    setInstallEvt(null);
  }

  async function enable() {
    setBusy(true);
    const r = await enableNotifications();
    setBusy(false);
    if (r === "push") {
      setSubscribed(true);
      toast.success("Notificaciones activadas en este dispositivo 🔔");
    } else if (r === "local") toast.info("Avisos activados mientras la app esté abierta (faltan las llaves VAPID para avisos con la app cerrada)");
    else if (r === "ios-install") toast.info("En iPhone primero agrega la app a tu pantalla de inicio");
    else if (r === "denied") toast.error("Bloqueaste las notificaciones: actívalas en la configuración del navegador para este sitio");
    else toast.error("Este navegador no permite notificaciones");
  }

  async function disable() {
    setBusy(true);
    await disableNotifications();
    setSubscribed(false);
    setBusy(false);
    toast.success("Notificaciones desactivadas en este dispositivo");
  }

  async function test() {
    setBusy(true);
    const r = await sendTestPush();
    setBusy(false);
    if (r.ok) toast.success("Notificación enviada, revisa tu dispositivo");
    else toast.error(r.error ?? "No se pudo enviar");
  }

  return (
    <Card>
      <CardHeader title="App y notificaciones" subtitle="Instala Dulces Detalles en tu celular y recibe avisos aunque esté cerrada" icon={<Smartphone className="h-5 w-5" />} />
      <div className="space-y-4 p-5 sm:p-6">
        <div className="rounded-2xl bg-cream-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-cocoa-700">1. Instalar la app</p>
            {installed && <Badge tone="success">Instalada</Badge>}
          </div>
          {!installed &&
            (installEvt ? (
              <Button size="sm" className="mt-3 w-full" onClick={install}>
                <Download className="h-4 w-4" /> Instalar en este dispositivo
              </Button>
            ) : ios ? (
              <p className="mt-2 text-sm text-cocoa-500">
                En iPhone abre esta página en <b>Safari</b>, toca <Share className="inline h-4 w-4" /> <b>Compartir</b> y luego <b>«Agregar a pantalla de inicio»</b>. Abre la app desde ese ícono para activar las notificaciones.
              </p>
            ) : (
              <p className="mt-2 text-sm text-cocoa-500">
                En Android/Chrome abre el menú ⋮ y elige <b>«Instalar app»</b> o <b>«Agregar a pantalla principal»</b>. En computadora, busca el ícono de instalar en la barra de direcciones.
              </p>
            ))}
        </div>

        <div className="rounded-2xl bg-cream-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-cocoa-700">2. Notificaciones</p>
            {subscribed && <Badge tone="success">Activas</Badge>}
          </div>
          <p className="mt-1 text-sm text-cocoa-500">Te avisamos al instante de pedidos nuevos de tu tienda y cada día de tus entregas.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {subscribed ? (
              <>
                <Button size="sm" variant="mint" onClick={test} loading={busy}><Send className="h-4 w-4" /> Probar</Button>
                <Button size="sm" variant="ghost" onClick={disable} disabled={busy}><BellOff className="h-4 w-4" /> Desactivar</Button>
              </>
            ) : (
              <Button size="sm" onClick={enable} loading={busy} disabled={!pushSupported() && !ios}>
                <BellRing className="h-4 w-4" /> Activar notificaciones
              </Button>
            )}
          </div>
          {ios && !installed && <p className="mt-2 text-xs text-cocoa-400">En iPhone las notificaciones funcionan solo con la app instalada (iOS 16.4 o superior).</p>}
        </div>
      </div>
    </Card>
  );
}
