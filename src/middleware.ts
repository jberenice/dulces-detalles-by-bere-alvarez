import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { RESERVED_SLUGS, ROOT_DOMAIN } from "@/lib/domains";

// Rutas que usan la sesión de Supabase (panel y páginas de acceso)
const SESSION_PATHS = [/^\/dashboard(\/|$)/, /^\/admin(\/|$)/, /^\/login$/, /^\/registro$/];

// En una tienda (subdominio o dominio propio) solo se sirven estas rutas; lo demás se manda al dominio principal
const STORE_PASSTHROUGH = [
  /^\/tienda\//,
  /^\/c\//,
  /^\/api\/push\/pedido$/,
  /^\/api\/(errores|tienda\/foto)$/,
  /^\/r\//,
  /^\/(aviso-de-privacidad|terminos-y-condiciones|politica-de-cookies)$/,
  /^\/(sw\.js|manifest\.webmanifest|robots\.txt|icon\.png|apple-icon\.png|logo\.png|logo-transparent\.png)$/,
  /^\/icons\//,
];

// Caché corta de dominios propios → tienda (evita consultar la base en cada visita)
const domainCache = new Map<string, { slug: string | null; exp: number }>();

async function slugForCustomDomain(host: string): Promise<string | null> {
  const hit = domainCache.get(host);
  if (hit && hit.exp > Date.now()) return hit.slug;
  let slug: string | null = null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/store_slug_for_domain`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_domain: host }),
    });
    if (r.ok) slug = ((await r.json()) as string | null) || null;
  } catch {}
  if (domainCache.size > 500) domainCache.clear();
  domainCache.set(host, { slug, exp: Date.now() + (slug ? 5 : 1) * 60_000 });
  return slug;
}

/** ¿Este host es una tienda? Devuelve su slug, o null si es el sitio principal */
async function storeForHost(host: string): Promise<string | null> {
  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (/\.(netlify\.app|vercel\.app|netlify\.live)$/.test(host)) return null;
  if (ROOT_DOMAIN) {
    if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null;
    if (host.endsWith(`.${ROOT_DOMAIN}`)) {
      const label = host.slice(0, -(ROOT_DOMAIN.length + 1));
      if (label.includes(".") || RESERVED_SLUGS.has(label)) return null;
      return label;
    }
  }
  // Sin dominio principal configurado no se buscan dominios propios
  if (!ROOT_DOMAIN) return null;
  return slugForCustomDomain(host);
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].split(":")[0].trim().toLowerCase();
  const path = request.nextUrl.pathname;
  const slug = await storeForHost(host);

  if (slug) {
    // Portada de la tienda y su imagen para compartir
    if (path === "/" || path.startsWith("/opengraph-image")) {
      const url = request.nextUrl.clone();
      url.pathname = `/tienda/${slug}${path === "/" ? "" : path}`;
      return NextResponse.rewrite(url);
    }
    if (STORE_PASSTHROUGH.some((r) => r.test(path))) return NextResponse.next();
    // Panel, acceso, etc. viven en el dominio principal
    if (ROOT_DOMAIN) return NextResponse.redirect(new URL(`${path}${request.nextUrl.search}`, `https://${ROOT_DOMAIN}`));
    return NextResponse.next();
  }

  if (SESSION_PATHS.some((r) => r.test(path))) return updateSession(request);
  return NextResponse.next();
}

export const config = {
  // Todo excepto archivos internos de Next e imágenes estáticas
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml|woff2?)$).*)"],
};
