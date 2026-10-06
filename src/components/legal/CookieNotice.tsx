"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const KEY = "dd-cookie-notice";

/** Aviso informativo: solo usamos cookies necesarias, por eso basta con informar (no hay rastreo que aceptar). */
export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(KEY);
      if (!seen || Date.now() - Number(seen) > 365 * 86400000) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-xl rounded-3xl border border-cocoa-800/8 bg-white/95 p-4 shadow-lift backdrop-blur-xl animate-fade-up sm:bottom-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cream-200 text-cocoa-500"><Cookie className="h-5 w-5" /></span>
        <p className="text-sm text-cocoa-600">
          Usamos solo cookies necesarias para tu sesión, la seguridad de tu licencia y tu carrito. Nada de publicidad.{" "}
          <Link href="/politica-de-cookies" className="font-bold text-rose-500 hover:underline">Más información sobre la política de cookies</Link>
        </p>
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={close} className="rounded-xl bg-cocoa-800 px-5 py-2 text-sm font-bold text-cream-100 hover:bg-cocoa-900">Entendido</button>
      </div>
    </div>
  );
}
