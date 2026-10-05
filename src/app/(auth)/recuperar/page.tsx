"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/restablecer`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  return (
    <>
      <h1 className="text-[32px] font-semibold">Recupera tu acceso</h1>
      {sent ? (
        <p className="mt-3 text-cocoa-500">Listo. Si el correo existe, recibirás un enlace para crear una nueva contraseña.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input label="Correo electrónico" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Enviar enlace
          </Button>
        </form>
      )}
      <Link href="/login" className="mt-6 inline-block text-sm font-bold text-rose-500 hover:underline">
        ← Volver a iniciar sesión
      </Link>
    </>
  );
}
