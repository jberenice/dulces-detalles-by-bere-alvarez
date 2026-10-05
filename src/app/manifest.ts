import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dulces Detalles by Bere Álvarez",
    short_name: "Dulces Detalles",
    description: "Cotizador de postres, costos, pedidos y tienda en línea",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fffaef",
    theme_color: "#eb5473",
    lang: "es-MX",
    categories: ["business", "food", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nueva cotización", url: "/dashboard/cotizaciones/nueva", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Pedidos", url: "/dashboard/pedidos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Calendario", url: "/dashboard/calendario", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
