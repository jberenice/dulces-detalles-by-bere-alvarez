import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de cookies" };

const ROWS = [
  { name: "sb-…-auth-token", type: "Cookie propia", purpose: "Mantener tu sesión iniciada de forma segura (Supabase Auth).", duration: "Mientras la sesión esté activa" },
  { name: "dd_device_session", type: "Cookie propia (httpOnly)", purpose: "Identificar el dispositivo activo de tu licencia (un dispositivo a la vez).", duration: "1 año o hasta cerrar sesión" },
  { name: "dd-cart-[tienda]", type: "Almacenamiento local", purpose: "Recordar los postres que agregaste al carrito de una minitienda.", duration: "Hasta que lo vacíes o borres los datos del navegador" },
  { name: "dd-cookie-notice", type: "Almacenamiento local", purpose: "Recordar que ya viste el aviso de cookies.", duration: "1 año" },
];

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Solo las galletas necesarias"
      title="Política de cookies"
      intro={
        <p>
          Las cookies son pequeños archivos que un sitio guarda en tu navegador. En <strong>{LEGAL.brand}</strong> usamos solo las indispensables
          para que la plataforma funcione y sea segura. <strong>No usamos cookies de publicidad ni de rastreo de terceros.</strong>
        </p>
      }
      sections={[
        {
          title: "Cookies que usamos",
          body: (
            <div className="overflow-x-auto rounded-2xl ring-1 ring-cocoa-800/8">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-cream-200/70 text-xs tracking-wider text-cocoa-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Para qué sirve</th>
                    <th className="px-4 py-3">Duración</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {ROWS.map((r) => (
                    <tr key={r.name} className="border-t border-cocoa-800/5 align-top">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-cocoa-700">{r.name}</td>
                      <td className="px-4 py-3">{r.type}</td>
                      <td className="px-4 py-3">{r.purpose}</td>
                      <td className="px-4 py-3">{r.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
        {
          title: "Servicios de terceros",
          body: (
            <p>
              Las fotografías y documentos se cargan desde nuestro proveedor de almacenamiento (Supabase) y el sitio se aloja en Vercel; estos servicios
              pueden registrar datos técnicos (como la dirección IP) para seguridad y funcionamiento. Al abrir un enlace de WhatsApp se aplican las
              políticas de Meta.
            </p>
          ),
        },
        {
          title: "Cómo desactivarlas",
          body: (
            <p>
              Puedes borrar o bloquear las cookies desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge). Si bloqueas las cookies
              necesarias no podrás iniciar sesión ni usar el panel, y el carrito de las tiendas no se guardará.
            </p>
          ),
        },
        {
          title: "Cambios y contacto",
          body: (
            <p>
              Si en el futuro usamos cookies distintas (por ejemplo, de estadísticas), actualizaremos esta política y te pediremos tu consentimiento
              cuando corresponda. Dudas: <a href={`mailto:${LEGAL.email}`} className="font-semibold text-rose-500 hover:underline">{LEGAL.email}</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
