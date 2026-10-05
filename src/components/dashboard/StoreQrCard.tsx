"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Copy, Download, IdCard, Printer, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { markOnboarding } from "@/lib/onboarding";
import { normalizeTheme } from "@/lib/storeTheme";

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });


/** QR de la tienda: descarga en alta resolución, tarjeta para compartir y acceso al diseñador de impresos */
export function StoreQrCard({ url, enabled, slug }: { url: string; enabled: boolean; slug: string }) {
  const { profile, setProfile } = useBusiness();
  const theme = normalizeTheme(profile.store_theme);
  const [qr, setQr] = useState("");
  const shortUrl = url.replace(/^https?:\/\//, "");
  const name = profile.store_title || profile.business_name;

  useEffect(() => {
    if (slug) QRCode.toDataURL(url, { margin: 1, width: 1024, errorCorrectionLevel: "M", color: { dark: theme.text, light: "#ffffff" } }).then(setQr);
  }, [url, slug, theme.text]);

  const shared = () => markOnboarding(profile, "shared", setProfile);

  /** Tarjeta vertical (1080 × 1350) con logo, nombre y QR, ideal para estados de WhatsApp o imprimir */
  async function makeCard() {
    const W = 1080, H = 1350;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const css = getComputedStyle(document.body);
    const display = css.getPropertyValue("--font-display-serif").trim() || "Georgia, serif";
    const body = css.getPropertyValue("--font-body").trim() || "sans-serif";
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, W, H);
    // Detalle de chispitas
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = i % 2 ? theme.primary + "22" : theme.accent + "26";
      ctx.beginPath();
      ctx.arc((i * 263) % W, (i * 397) % H, 6 + (i % 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Tarjeta blanca
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(90, 300, W - 180, 900, 48);
    ctx.fill();
    try {
      const logo = await loadImg(profile.logo_url || "/logo-transparent.png");
      const s = 220;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, 260, s / 2 + 14, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
      const r = Math.min(s / logo.width, s / logo.height);
      ctx.drawImage(logo, W / 2 - (logo.width * r) / 2, 260 - (logo.height * r) / 2, logo.width * r, logo.height * r);
    } catch {}
    ctx.textAlign = "center";
    ctx.fillStyle = theme.text;
    ctx.font = `600 64px ${display}`;
    const title = name.length > 26 ? name.slice(0, 25) + "…" : name;
    ctx.fillText(title, W / 2, 470);
    ctx.fillStyle = theme.primary;
    ctx.font = `700 34px ${body}`;
    ctx.fillText("Escanea y haz tu pedido", W / 2, 530);
    const q = await loadImg(qr);
    ctx.drawImage(q, W / 2 - 280, 570, 560, 560);
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.7;
    ctx.font = `600 30px ${body}`;
    ctx.fillText(shortUrl.length > 48 ? shortUrl.slice(0, 47) + "…" : shortUrl, W / 2, 1170);
    ctx.globalAlpha = 1;
    return new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
  }

  async function downloadCard() {
    const blob = await makeCard();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Tarjeta-${slug}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    shared();
  }

  async function shareCard() {
    const blob = await makeCard();
    const file = new File([blob], `Tienda-${slug}.png`, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: `¡Haz tu pedido en ${name}! 🧁 ${url}` }).catch(() => {});
    else if (navigator.share) await navigator.share({ title: name, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
    shared();
  }

  return (
    <Card className="overflow-hidden">
      <div className="sprinkles flex flex-col items-center gap-5 bg-cream-200 p-6 text-center sm:flex-row sm:items-start sm:text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr ? <img src={qr} alt="Código QR de tu tienda" className="w-40 shrink-0 rounded-2xl bg-white p-2 shadow-soft" /> : <div className="grid h-40 w-40 place-items-center rounded-2xl bg-white"><QrCode className="h-10 w-10 text-cocoa-300" /></div>}
        <div className="min-w-0 flex-1">
          <Badge tone={enabled ? "success" : "neutral"}>{enabled ? "En línea" : "Sin publicar"}</Badge>
          <p className="mt-2 font-script text-2xl text-rose-500">¡Compártela!</p>
          <p className="text-sm text-cocoa-500">Pon tu QR en cajas, bolsas, tu mostrador o tus estados de WhatsApp.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(url).then(() => { toast.success("Enlace copiado"); shared(); })}>
              <Copy className="h-4 w-4" /> Copiar enlace
            </Button>
            <Button size="sm" variant="secondary" onClick={shareCard} disabled={!qr}>
              <Share2 className="h-4 w-4" /> Compartir tarjeta
            </Button>
            {qr && (
              <a href={qr} download={`QR-${slug}.png`} onClick={shared} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold text-cocoa-600 hover:bg-cocoa-800/5">
                <Download className="h-4 w-4" /> QR en alta
              </a>
            )}
            <Button size="sm" variant="ghost" onClick={downloadCard} disabled={!qr}>
              <IdCard className="h-4 w-4" /> Descargar tarjeta
            </Button>
          </div>
          <Link
            href="/dashboard/impresos"
            className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/80 p-3 text-left ring-1 ring-cocoa-800/5 transition hover:bg-white"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500"><Printer className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-cocoa-700">Diseña tarjetas, etiquetas y stickers</span>
              <span className="block text-xs text-cocoa-400">Elige tamaño, colores y acomodo; imprime en carta, oficio o tabloide</span>
            </span>
          </Link>
        </div>
      </div>
    </Card>
  );
}
