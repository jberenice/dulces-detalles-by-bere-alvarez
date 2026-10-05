import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dulces Detalles by Bere Álvarez",
    short_name: "Dulces Detalles",
    description: "Cotizador de postres, costos, pedidos y tienda en línea",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fffaef",
    theme_color: "#eb5473",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
