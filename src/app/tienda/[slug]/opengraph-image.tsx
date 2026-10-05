import { ImageResponse } from "next/og";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { normalizeTheme } from "@/lib/storeTheme";
import type { StoreData } from "@/components/store/Storefront";

/**
 * Tarjeta que aparece al compartir el enlace de la tienda en WhatsApp, Facebook, etc.
 * Muestra el logo, el nombre de la repostería y la foto de un postre destacado.
 */
export const runtime = "nodejs";
export const alt = "Tienda en línea";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

async function getStore(slug: string): Promise<StoreData | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_store`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: slug }),
      next: { revalidate: 3600 },
    });
    if (!r.ok) return null;
    return (await r.json()) as StoreData | null;
  } catch {
    return null;
  }
}

/**
 * Descarga una imagen y la entrega como data URI que el generador entiende (PNG/JPEG).
 * Las fotos se guardan en WebP: si `sharp` está disponible en el servidor se convierten, si no se omiten.
 */
async function toDataUri(url: string | null | undefined, width: number): Promise<string | null> {
  if (!url || !/^https:\/\//.test(url)) return null;
  try {
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) return null;
    const type = r.headers.get("content-type") ?? "";
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return null;
    try {
      const name = "sharp";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sharp = (await import(/* webpackIgnore: true */ name)).default as any;
      const out: Buffer = await sharp(buf).resize({ width, withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 78 }).toBuffer();
      return `data:image/jpeg;base64,${out.toString("base64")}`;
    } catch {
      if (/image\/(png|jpe?g)/.test(type)) return `data:${type};base64,${buf.toString("base64")}`;
      return null;
    }
  } catch {
    return null;
  }
}

// En Next 15 `params` llega como objeto (en Next 16 como promesa): se aceptan ambos
export default async function OgImage({ params }: { params: { slug: string } | Promise<{ slug: string }> }) {
  const { slug } = await Promise.resolve(params);
  const data = await getStore(slug);
  const theme = normalizeTheme(data?.store.theme);
  const store = data?.store;
  const pick = data?.products.find((p) => p.featured && p.image_url) ?? data?.products.find((p) => p.image_url);
  const [photo, logo] = await Promise.all([toDataUri(pick?.image_url ?? store?.banner_url, 640), toDataUri(store?.logo_url, 240)]);
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const fallbackLogo = site ? `${site}/logo-transparent.png` : null;
  const title = store?.title ?? "Tienda en línea";
  const count = data?.products.length ?? 0;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: theme.background, color: theme.text, fontFamily: "sans-serif" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 48px 56px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {(logo || fallbackLogo) && <img src={(logo || fallbackLogo)!} width={120} height={120} style={{ borderRadius: 999, background: "#fff", objectFit: "contain", padding: 8 }} alt="" />}
            <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: theme.primary, letterSpacing: 2, textTransform: "uppercase" }}>Tienda en línea</div>
          </div>
          <div style={{ display: "flex", marginTop: 32, fontSize: title.length > 26 ? 60 : 74, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          {store?.description && (
            <div style={{ display: "flex", marginTop: 18, fontSize: 28, opacity: 0.75, lineHeight: 1.3, maxHeight: 76, overflow: "hidden" }}>{store.description.slice(0, 110)}</div>
          )}
          <div style={{ display: "flex", marginTop: 36, alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", background: theme.primary, color: "#fff", fontSize: 28, fontWeight: 700, padding: "14px 30px", borderRadius: 999 }}>Haz tu pedido aquí</div>
            {count > 0 && <div style={{ display: "flex", fontSize: 24, opacity: 0.7 }}>{count} postres</div>}
          </div>
        </div>
        {photo ? (
          <div style={{ display: "flex", width: 470, height: "100%", padding: 36, paddingLeft: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} width={434} height={558} style={{ objectFit: "cover", borderRadius: 40 }} alt="" />
          </div>
        ) : (
          <div style={{ display: "flex", width: 300, height: "100%", background: theme.primary, opacity: 0.18 }} />
        )}
      </div>
    ),
    size,
  );
}
