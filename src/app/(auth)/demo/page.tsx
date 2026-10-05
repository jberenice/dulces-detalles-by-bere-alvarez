"use client";
import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CakeSlice, Clock, FileText, MessageCircle, ShieldCheck, Sparkles, Store } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, ButtonLink } from "@/components/ui/Button";
import { salesLink } from "@/lib/legal";
import { Turnstile, captchaEnabled, type TurnstileHandle } from "@/components/ui/Turnstile";

function DemoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const expired = params.get("expirada") === "1";
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileHandle>(null);

  async function start() {
    if (captchaEnabled() && !captcha) return toast.error("Espera un momento: estamos verificando que no eres un robot");
    setLoading(true);
    const sb = createClient();
    try {
      // Si había una sesión (demo vencida u otra cuenta), se cierra para empezar limpio
      const { data: current } = await sb.auth.getUser();
      if (current.user && !current.user.is_anonymous) {
        setLoading(false);
        return toast.info("Ya tienes una sesión con tu cuenta. Cierra sesión para probar la demo.");
      }
      if (current.user) await sb.auth.signOut();

      const { error } = await sb.auth.signInAnonymously({ options: { captchaToken: captcha ?? undefined } });
      captchaRef.current?.reset();
      if (error) throw new Error(error.message.includes("Anonymous") ? "La demo no está disponible en este momento." : error.message);
      const { error: e2 } = await sb.rpc("start_demo");
      if (e2) throw new Error(e2.message);
      toast.success("¡Bienvenida a la demo! 🧁");
      router.replace("/dashboard?tutorial=1");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <>
      <p className="font-script text-2xl text-rose-500">{expired ? "Tu demo terminó" : "Pruébalo gratis"}</p>
      <h1 className="mt-1 text-[32px] leading-tight font-semibold">{expired ? "¿Te gustó Dulces Detalles?" : "Entra a la cuenta demo"}</h1>
      <p className="mt-2 text-[15px] text-cocoa-400">
        {expired
          ? "Tu demo de 48 horas terminó y sus datos de ejemplo se borraron. Consigue tu licencia para empezar con tu propia repostería."
          : "Explora una repostería de ejemplo con recetas costeadas, clientes, pedidos, cotizaciones y tienda en línea. Sin registro y sin tarjeta."}
      </p>

      {!expired && (
        <ul className="mt-6 grid gap-2 text-sm text-cocoa-600">
          {[
            [CakeSlice, "30 recetas reales con su costo y precio sugerido"],
            [FileText, "Cotizaciones en PDF y pedidos de ejemplo"],
            [Store, "Una tienda en línea que puedes personalizar"],
            [Sparkles, "Tutorial guiado paso a paso"],
            [Clock, "Dura 48 horas y luego se borra sola"],
          ].map(([Icon, text], i) => {
            const I = Icon as typeof CakeSlice;
            return (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2.5 shadow-soft ring-1 ring-cocoa-800/5">
                <I className="h-4 w-4 shrink-0 text-rose-400" /> {text as string}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-7 space-y-3">
        <Turnstile ref={captchaRef} onToken={setCaptcha} className="flex justify-center" />
        {expired ? (
          <>
            <ButtonLink href={salesLink()} size="lg" className="w-full"><MessageCircle className="h-5 w-5" /> Quiero mi licencia</ButtonLink>
            <Button size="lg" variant="outline" className="w-full" onClick={start} loading={loading}>Probar la demo otra vez</Button>
          </>
        ) : (
          <Button size="lg" className="w-full" onClick={start} loading={loading}><Sparkles className="h-5 w-5" /> Entrar a la demo</Button>
        )}
      </div>
      <p className="mt-5 flex items-start gap-2 text-xs text-cocoa-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-500" />
        En la demo no se envían correos reales ni se suben fotos. Todo lo que hagas es solo para ti y se elimina automáticamente.
      </p>
      <p className="mt-6 text-center text-sm text-cocoa-400">
        ¿Ya tienes licencia? <Link href="/login" className="font-bold text-rose-500 hover:underline">Inicia sesión</Link>
      </p>
    </>
  );
}

export default function DemoPage() {
  return (
    <Suspense>
      <DemoContent />
    </Suspense>
  );
}
