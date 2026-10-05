"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MonitorSmartphone } from "lucide-react";
import { claimDevice, signOutDevice } from "@/lib/session";
import { Button } from "@/components/ui/Button";

function Content() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function useHere() {
    setLoading(true);
    await claimDevice();
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <div className="text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-600">
        <MonitorSmartphone className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-[30px] font-semibold">Tu licencia está en uso en otro dispositivo</h1>
      <p className="mt-3 text-[15px] text-cocoa-400">
        Cada licencia permite <b className="text-cocoa-600">un dispositivo a la vez</b>. Si continúas aquí, la sesión del otro equipo se cerrará automáticamente.
      </p>
      <div className="mt-8 space-y-3">
        <Button size="lg" className="w-full" loading={loading} onClick={useHere}>
          Usar en este dispositivo
        </Button>
        <Button size="lg" variant="ghost" className="w-full" onClick={signOutDevice}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

export default function ActiveSessionPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
