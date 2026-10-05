"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { claimDevice } from "@/lib/session";
import { safeNext } from "@/lib/safe-redirect";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      toast.error(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : error.message);
      return;
    }
    await claimDevice();
    const next = params.get("next");
    router.replace(safeNext(next));
    router.refresh();
  }

  return (
    <>
      <p className="font-script text-2xl text-rose-500">¡Qué gusto verte!</p>
      <h1 className="mt-1 text-[34px] font-semibold">Inicia sesión</h1>
      <p className="mt-2 text-[15px] text-cocoa-400">Entra a tu panel para cotizar, revisar pedidos y más.</p>

      {params.get("error") && (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">El enlace expiró o no es válido. Intenta de nuevo.</p>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input label="Correo electrónico" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} prefix={<Mail className="h-4 w-4" />} placeholder="tucorreo@ejemplo.com" />
        <Input label="Contraseña" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} prefix={<Lock className="h-4 w-4" />} placeholder="••••••••" />
        <div className="flex justify-end">
          <Link href="/recuperar" className="text-sm font-semibold text-rose-500 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Entrar
        </Button>
      </form>

      <div className="mt-8 rounded-3xl border border-dashed border-mint-300 bg-mint-50/60 p-5 text-center">
        <p className="text-sm text-cocoa-500">¿Tienes un código de licencia?</p>
        <Link href="/registro" className="mt-1 inline-block font-bold text-mint-600 hover:underline">
          Crea tu cuenta y actívala →
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-cocoa-400">
        Tu licencia funciona en un dispositivo a la vez. Al entrar aquí se cerrará la sesión en cualquier otro equipo.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
