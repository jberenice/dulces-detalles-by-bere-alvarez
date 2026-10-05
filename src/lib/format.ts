export const money = (n: number | null | undefined, currency = "MXN") =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(n) || 0);

export const money0 = (n: number | null | undefined, currency = "MXN") =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(n) || 0);

export const num = (n: number | null | undefined, digits = 2) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: digits }).format(Number(n) || 0);

/** Fechas tipo 'YYYY-MM-DD' se interpretan en hora local (evita el corrimiento de zona horaria) */
export function parseDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(d);
}

export const date = (d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => {
  const v = parseDate(d);
  return v ? new Intl.DateTimeFormat("es-MX", opts).format(v) : "—";
};

export const dateLong = (d: string | Date | null | undefined) =>
  date(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const addDays = (d: Date, days: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};

export const folio = (prefix: string, n: number | null | undefined) => `${prefix}-${String(n ?? 0).padStart(4, "0")}`;

/** Normaliza un teléfono mexicano para wa.me (agrega 52 si son 10 dígitos) */
export function waPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return "52" + digits;
  return digits;
}

export function waLink(phone: string | null | undefined, text: string) {
  const p = waPhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

/** Acepta "mipagina", "@mipagina" o la URL completa de Facebook */
export function facebookUrl(v: string | null | undefined) {
  const s = (v ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://facebook.com/${s.replace(/^@/, "").replace(/^(www\.)?facebook\.com\//i, "")}`;
}
export const facebookLabel = (v: string | null | undefined) =>
  (v ?? "").trim().replace(/^https?:\/\/(www\.|m\.)?facebook\.com\//i, "").replace(/^@/, "").replace(/\/$/, "");

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const siteUrl = () =>
  (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL) ?? "";
