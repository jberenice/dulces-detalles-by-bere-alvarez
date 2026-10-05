import type { Metadata, Viewport } from "next";
import { Playfair_Display, Nunito_Sans, Dancing_Script } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display-serif", display: "swap" });
const body = Nunito_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const script = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing", display: "swap", weight: ["500", "700"] });

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
    <html lang="es-MX" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster
          position="top-center"
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
