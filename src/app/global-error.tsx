"use client";
import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/** Último recurso si falla el layout principal (no tiene estilos de la app) */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportError(error, { digest: error.digest }), [error]);
  return (
    <html lang="es-MX">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fffaef", color: "#3f250d", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0, textAlign: "center", padding: 24 }}>
        <div>
          <p style={{ fontSize: 48, margin: 0 }}>🧁</p>
          <h1>Algo no salió bien</h1>
          <p>Ya nos llegó el aviso. Intenta de nuevo en un momento.</p>
          <button onClick={reset} style={{ marginTop: 12, padding: "12px 20px", borderRadius: 16, border: 0, background: "#eb5473", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
