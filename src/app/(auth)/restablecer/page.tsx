"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Mínimo 8 caracteres");
    if (password !== confirm) return toast.error("Las contraseñas no coinciden");
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada");
    router.replace("/dashboard");
  }

  return (
    <>
      <h1 className="text-[32px] font-semibold">Nueva contraseña</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <PasswordInput label="Contraseña nueva" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Mínimo 8 caracteres" />
        <PasswordInput label="Confirma la contraseña" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={confirm && confirm !== password ? "Las contraseñas no coinciden" : undefined} />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Guardar
        </Button>
      </form>
    </>
  );
}
