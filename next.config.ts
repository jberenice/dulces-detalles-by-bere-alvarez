import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

let supabaseOrigin = "https://*.supabase.co";
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL.trim()).origin;
} catch {}
const supabaseWs = supabaseOrigin.replace(/^https:/, "wss:");

/**
 * Content-Security-Policy: solo se cargan scripts, estilos, imágenes y conexiones de este sitio y de Supabase.
 * 'unsafe-inline' lo necesita Next para sus scripts de hidratación; 'unsafe-eval'/'wasm-unsafe-eval' los usa el
 * generador de PDF (@react-pdf) en el navegador. React escapa todo el contenido, y no se usa dangerouslySetInnerHTML.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  // tile.openstreetmap.org: mapa para marcar la ubicación de entrega
  `img-src 'self' data: blob: ${supabaseOrigin} https://*.supabase.co https://tile.openstreetmap.org`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://nominatim.openstreetmap.org`,
  "worker-src 'self' blob:",
  "frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // El PDF del pedido para la clienta se genera en el servidor
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  eslint: {
    // El lint se corre aparte con `npm run lint`; no bloquea el deploy en Vercel.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Las páginas privadas y las cotizaciones compartidas no se guardan en caché ni se indexan
      { source: "/dashboard/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      { source: "/c/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/seguimiento/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default nextConfig;
