import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  Nunito_Sans,
  Dancing_Script,
  Pacifico,
  Fredoka,
  Mountains_of_Christmas,
  Cinzel_Decorative,
  Great_Vibes,
  Lobster,
  Gochi_Hand,
  Rye,
  Sancreek,
  Creepster,
  Alfa_Slab_One,
} from "next/font/google";
import { Toaster } from "sonner";
import { CookieNotice } from "@/components/legal/CookieNotice";
import { ErrorReporter } from "@/components/ErrorReporter";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/components/theme/ThemeToggle";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display-serif", display: "swap" });
const body = Nunito_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const script = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing", display: "swap", weight: ["500", "700"] });
// Letras extra para tarjetas y stickers (solo se descargan cuando se usan)
const playful = Pacifico({ subsets: ["latin"], variable: "--font-pacifico", display: "swap", weight: "400", preload: false });
const rounded = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap", weight: ["500", "600"], preload: false });
// Letras de temporada y de la tienda (solo se descargan cuando una página las usa)
const xmas = Mountains_of_Christmas({ subsets: ["latin"], variable: "--ff-xmas", display: "swap", weight: ["700"], preload: false });
const royal = Cinzel_Decorative({ subsets: ["latin"], variable: "--ff-royal", display: "swap", weight: ["700"], preload: false });
const vibes = Great_Vibes({ subsets: ["latin"], variable: "--ff-vibes", display: "swap", weight: "400", preload: false });
const lobster = Lobster({ subsets: ["latin"], variable: "--ff-lobster", display: "swap", weight: "400", preload: false });
const chalk = Gochi_Hand({ subsets: ["latin"], variable: "--ff-chalk", display: "swap", weight: "400", preload: false });
const rye = Rye({ subsets: ["latin"], variable: "--ff-rye", display: "swap", weight: "400", preload: false });
const sancreek = Sancreek({ subsets: ["latin"], variable: "--ff-sancreek", display: "swap", weight: "400", preload: false });
const creepster = Creepster({ subsets: ["latin"], variable: "--ff-creepster", display: "swap", weight: "400", preload: false });
const slab = Alfa_Slab_One({ subsets: ["latin"], variable: "--ff-slab", display: "swap", weight: "400", preload: false });
const seasonal = [xmas, royal, vibes, lobster, chalk, rye, sancreek, creepster, slab].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Dulces Detalles by Bere Álvarez",
    template: "%s · Dulces Detalles",
  },
  description:
    "Cotizador de postres, control de costos, pedidos, clientes y minitienda en línea para reposterías. Hechos con amor de hogar.",
  applicationName: "Dulces Detalles",
  openGraph: {
    title: "Dulces Detalles by Bere Álvarez",
    description: "Cotiza, costea y vende tus postres desde un solo lugar.",
    images: ["/logo.png"],
    locale: "es_MX",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fffaef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" suppressHydrationWarning className={`${display.variable} ${body.variable} ${script.variable} ${playful.variable} ${rounded.variable} ${seasonal}`}>
      <head>
        {/* Tema oscuro guardado: se aplica antes de pintar para que no parpadee */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh font-sans">
        <ErrorReporter />
        {children}
        <CookieNotice />
        <Toaster
          position="top-center"
          closeButton
          visibleToasts={3}
          duration={3500}
          toastOptions={{
            style: {
              borderRadius: "18px",
              background: "#fff",
              color: "#3f250d",
              border: "1px solid rgba(63,37,13,.08)",
              fontFamily: "var(--font-body)",
            },
          }}
        />
      </body>
    </html>
  );
}
