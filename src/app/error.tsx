"use client";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { reportError } from "@/lib/report-error";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportError(error, { digest: error.digest }), [error]);
  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <p className="text-5xl">🧁</p>
        <h1 className="mt-4 text-3xl font-semibold">Algo no salió bien</h1>
        <p className="mt-2 text-cocoa-500">Ya nos llegó el aviso y lo vamos a revisar. Intenta de nuevo en un momento.</p>
        <button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 font-bold text-white hover:bg-rose-600">
          <RotateCcw className="h-4 w-4" /> Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
