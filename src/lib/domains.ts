/**
 * Direcciones de las tiendas.
 * Con NEXT_PUBLIC_ROOT_DOMAIN configurado (p. ej. "dulcesdetallesbyberealvarez.com") cada tienda
 * vive en su subdominio: https://<tienda>.dulcesdetallesbyberealvarez.com
 * Sin esa variable se usa la ruta clásica: https://<sitio>/tienda/<tienda>
 */
function normalizeRoot(raw: string | undefined) {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/:].*$/, "");
}

// Las variables NEXT_PUBLIC_* deben leerse de forma literal para que Next las incluya en el navegador
export const ROOT_DOMAIN = normalizeRoot(process.env.NEXT_PUBLIC_ROOT_DOMAIN);

/** Subdominios que no pueden ser tiendas (deben coincidir con is_reserved_slug en 0011_domains.sql) */
export const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "administracion", "mail", "correo", "email", "smtp", "imap", "pop", "ftp", "ns", "ns1", "ns2", "dns",
  "tienda", "tiendas", "dashboard", "panel", "login", "registro", "demo", "soporte", "ayuda", "help", "blog", "static", "cdn",
  "assets", "img", "media", "dev", "staging", "test", "pruebas", "status", "docs", "cuenta", "pagos", "legal", "dulcesdetalles",
]);

const siteBase = () =>
  (ROOT_DOMAIN ? `https://${ROOT_DOMAIN}` : typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

/** Dirección pública de una tienda (dominio propio > subdominio > ruta /tienda/...) */
export function storeUrl(slug: string | null | undefined, customDomain?: string | null) {
  if (customDomain) return `https://${customDomain}`;
  if (!slug) return siteBase();
  if (ROOT_DOMAIN && !RESERVED_SLUGS.has(slug)) return `https://${slug}.${ROOT_DOMAIN}`;
  return `${siteBase()}/tienda/${slug}`;
}

/** Validación de la dirección de la tienda (sirve también como subdominio) */
export function slugProblem(slug: string) {
  if (slug.length < 3) return "Usa al menos 3 letras o números";
  if (slug.length > 63) return "Máximo 63 caracteres";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Solo letras minúsculas, números y guiones (sin guion al inicio o al final)";
  if (RESERVED_SLUGS.has(slug)) return "Ese nombre está reservado, elige otro";
  return null;
}
