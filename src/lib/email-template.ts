/**
 * Plantilla HTML de correo con diseño de marca (compatible con Gmail, Outlook y Apple Mail:
 * tablas y estilos en línea). En el plan Premium usa el logo y colores de la tienda de cada repostería.
 */
import { normalizeTheme } from "./storeTheme";

export type EmailBrand = {
  business: string;
  logoUrl?: string | null;
  primary: string;
  accent: string;
  background: string;
  text: string;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  /** true = logo y colores propios (Premium) */
  custom: boolean;
};

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const DEFAULT = { primary: "#eb5473", accent: "#6aa68a", background: "#fffaef", text: "#3f250d" };

type ProfileLike = {
  business_name?: string | null;
  logo_url?: string | null;
  store_theme?: unknown;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

/** Marca para el correo: con logo y colores propios solo si `custom` (plan Premium) */
export function brandFromProfile(p: ProfileLike | null | undefined, custom: boolean): EmailBrand {
  const theme = custom ? normalizeTheme(p?.store_theme) : null;
  // Con un fondo oscuro (p. ej. "Noche de cacao") el correo usa la paleta clara para leerse bien en cualquier app
  const t = theme && luminance(theme.background) >= 0.35 ? theme : null;
  return {
    business: p?.business_name || "Dulces Detalles",
    logoUrl: custom && p?.logo_url && /^https:\/\//.test(p.logo_url) ? p.logo_url : null,
    primary: t?.primary ?? DEFAULT.primary,
    accent: t?.accent ?? DEFAULT.accent,
    background: t?.background ?? DEFAULT.background,
    text: t?.text ?? DEFAULT.text,
    whatsapp: p?.whatsapp,
    instagram: p?.instagram,
    facebook: p?.facebook,
    custom,
  };
}

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const waUrl = (phone: string, text = "") => {
  const d = phone.replace(/\D/g, "");
  return `https://wa.me/${d.length === 10 ? "52" + d : d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};

/**
 * Arma el correo completo.
 * `body` es HTML ya escapado (usa `esc` y `paragraphs` para texto de usuario).
 */
export function brandedEmail({
  brand,
  preheader,
  title,
  body,
  cta,
  note,
  site,
}: {
  brand: EmailBrand;
  preheader: string;
  title?: string;
  body: string;
  cta?: { label: string; url: string } | null;
  note?: string;
  site?: string;
}) {
  const { primary, accent, background, text } = brand;
  const contact = [
    brand.whatsapp ? `<a href="${esc(waUrl(brand.whatsapp))}" style="color:${primary};text-decoration:none;font-weight:bold">WhatsApp</a>` : "",
    brand.instagram ? `<a href="https://instagram.com/${esc(brand.instagram.replace(/^@/, ""))}" style="color:${primary};text-decoration:none;font-weight:bold">Instagram</a>` : "",
    brand.facebook ? `<a href="${esc(/^https?:\/\//.test(brand.facebook) ? brand.facebook : `https://facebook.com/${brand.facebook.replace(/^@/, "")}`)}" style="color:${primary};text-decoration:none;font-weight:bold">Facebook</a>` : "",
  ].filter(Boolean);

  const header = brand.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="${esc(brand.business)}" width="88" height="88" style="display:block;margin:0 auto 10px;width:88px;height:88px;object-fit:cover;border-radius:44px;background:#ffffff">
       <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${text};text-align:center">${esc(brand.business)}</p>`
    : `<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:26px;color:${primary};text-align:center">${esc(brand.business)}</p>
       <p style="margin:4px 0 0;font-size:11px;letter-spacing:3px;color:${accent};text-transform:uppercase;text-align:center">Hechos con amor de hogar</p>`;

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title ?? brand.business)}</title></head>
<body style="margin:0;padding:0;background:${background}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${background}">
    <tr><td align="center" style="padding:28px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(0,0,0,0.06);font-family:Helvetica,Arial,sans-serif;color:${text}">
        <tr><td style="height:6px;line-height:6px;font-size:0;background:${primary}">&nbsp;</td></tr>
        <tr><td style="padding:28px 28px 8px">${header}</td></tr>
        <tr><td style="padding:12px 28px 4px">
          ${title ? `<h1 style="margin:8px 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:24px;line-height:1.25;color:${text}">${esc(title)}</h1>` : ""}
          <div style="font-size:15px;line-height:1.65;color:${text}">${body}</div>
          ${
            cta
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="border-radius:14px;background:${primary}">
                   <a href="${esc(cta.url)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:14px">${esc(cta.label)}</a>
                 </td></tr></table>`
              : ""
          }
          ${note ? `<p style="margin:22px 0 0;font-size:13px;color:${text};opacity:.65">${note}</p>` : ""}
        </td></tr>
        <tr><td style="padding:24px 28px 28px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(0,0,0,0.07)"><tr><td style="padding-top:16px;font-size:12px;color:${text};opacity:.7;text-align:center">
            ${contact.length ? `${contact.join(" &nbsp;·&nbsp; ")}<br>` : ""}
            <span style="opacity:.8">${brand.custom ? esc(brand.business) : `Enviado con ${site ? `<a href="${esc(site)}" style="color:${text}">Dulces Detalles</a>` : "Dulces Detalles"}`}</span>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Convierte texto plano (con saltos de línea y enlaces) en párrafos HTML seguros */
export function paragraphs(text: string, linkColor = "#eb5473") {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const html = esc(block)
        .replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" style="color:${linkColor};word-break:break-all">$1</a>`)
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 14px">${html}</p>`;
    })
    .join("");
}
