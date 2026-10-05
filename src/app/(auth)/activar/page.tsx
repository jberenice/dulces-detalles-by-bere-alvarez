"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { claimDevice, signOutDevice } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Input, Toggle } from "@/components/ui/Field";

export default function ActivatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [seed, setSeed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user: { email?: string } | null } }) => {
        if (!data.user) router.replace("/login");
        else setEmail(data.user.email ?? null);
      });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await createClient().rpc("activate_license", { p_code: code.trim().toUpperCase(), p_seed: seed });
    if (error || !data?.ok) {
      setLoading(false);
      return toast.error(data?.error ?? error?.message ?? "No se pudo activar");
    }
    await claimDevice();
    toast.success("¡Licencia activada!");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
        <KeyRound className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-[32px] font-semibold">Activa tu licencia</h1>
      <p className="mt-2 text-[15px] text-cocoa-400">
        {email ? (
          <>
            La cuenta <b className="text-cocoa-600">{email}</b> aún no tiene una licencia activa.
          </>
        ) : (
          "Tu cuenta aún no tiene una licencia activa."
        )}{" "}
        Escribe el código que recibiste.
      </p>
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <Input
          label="Código de licencia"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="DD-XXXX-XXXX-XXXX-XXXX"
          className="[&_input]:font-mono [&_input]:tracking-wider"
        />
        <Toggle checked={seed} onChange={setSeed} label="Precargar recetario de ejemplo" className="rounded-2xl bg-cream-200/60 p-4" />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Activar
        </Button>
      </form>
      <button onClick={signOutDevice} className="mt-6 w-full text-center text-sm font-semibold text-cocoa-400 hover:text-rose-500">
        Usar otra cuenta
      </button>
    </>
  );
}
