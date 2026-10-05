"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { claimDevice } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Input, Toggle } from "@/components/ui/Field";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ owner_name: "", business_name: "", phone: "", email: "", password: "", code: "" });
  const [seed, setSeed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres");
    setLoading(true);
    const supabase = createClient();
    const code = form.code.trim().toUpperCase();
    const { data: available, error: checkError } = await supabase.rpc("check_license_code", { p_code: code });
    if (checkError) {
      setLoading(false);
      return toast.error(`No se pudo validar el código: ${checkError.message}. Revisa que hayas ejecutado las migraciones en Supabase.`);
    }
    if (!available) {
      setLoading(false);
      return toast.error("El código de licencia no es válido o ya fue utilizado");
    }
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        data: {
          owner_name: form.owner_name,
          business_name: form.business_name || "Mi repostería",
          phone: form.phone,
          license_code: code,
          seed,
        },
      },
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message.includes("registered") ? "Ese correo ya tiene una cuenta" : error.message);
    }
    if (data.session) {
      await claimDevice();
      toast.success("¡Bienvenida! Tu licencia está activa 🎉");
      router.replace("/dashboard");
      router.refresh();
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent)
    return (
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint-100 text-mint-600">
          <MailCheck className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Revisa tu correo</h1>
        <p className="mt-2 text-cocoa-400">
          Te enviamos un enlace a <b className="text-cocoa-600">{form.email}</b> para confirmar tu cuenta. Tu licencia ya quedó reservada.
        </p>
        <Link href="/login" className="mt-6 inline-block font-bold text-rose-500 hover:underline">
          Ir a iniciar sesión
        </Link>
      </div>
    );

  return (
    <>
      <p className="font-script text-2xl text-rose-500">Bienvenida a la familia</p>
      <h1 className="mt-1 text-[34px] font-semibold">Crea tu cuenta</h1>
      <p className="mt-2 text-[15px] text-cocoa-400">Necesitas un código de licencia para activar tu panel.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <Input
          label="Código de licencia"
          required
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          prefix={<KeyRound className="h-4 w-4" />}
          placeholder="DD-XXXX-XXXX-XXXX-XXXX"
          className="[&_input]:font-mono [&_input]:tracking-wider"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Tu nombre" required value={form.owner_name} onChange={set("owner_name")} placeholder="Bere Álvarez" />
          <Input label="Nombre del negocio" value={form.business_name} onChange={set("business_name")} placeholder="Dulces Detalles" />
        </div>
        <Input label="WhatsApp" type="tel" value={form.phone} onChange={set("phone")} placeholder="998 123 4567" />
        <Input label="Correo electrónico" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
        <Input label="Contraseña" type="password" required autoComplete="new-password" value={form.password} onChange={set("password")} hint="Mínimo 8 caracteres" />
        <Toggle
          checked={seed}
          onChange={setSeed}
          label="Precargar recetario de ejemplo"
          description="Ingredientes, empaques, gastos fijos y 30 recetas costeadas para empezar más rápido."
          className="rounded-2xl bg-cream-200/60 p-4"
        />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Activar mi licencia
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-cocoa-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-rose-500 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
