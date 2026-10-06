/**
 * Datos del responsable que aparecen en los documentos legales.
 * ✏️ Completa el domicilio: la ley pide que el aviso de privacidad incluya el domicilio del responsable.
 */
export const LEGAL = {
  brand: "Dulces Detalles by Bere Álvarez",
  owner: "Berenice Álvarez",
  email: "dulcesdetallesbyberealvarez@gmail.com",
  phone: "983 197 3655",
  address: "[Calle, número, colonia, código postal, ciudad y estado]",
  updatedAt: "5 de octubre de 2026",
};

export const SOCIAL = {
  instagram: "https://www.instagram.com/dulces_detalles_by_bere/",
  instagramHandle: "@dulces_detalles_by_bere",
  facebook: "https://www.facebook.com/DulcesDetallesByBereAlvarez",
  facebookHandle: "DulcesDetallesByBereAlvarez",
};

/** WhatsApp para comprar una licencia */
export const SALES_WHATSAPP = "529831973655";
export const salesLink = (text = "¡Hola! Probé la demo de Dulces Detalles y quiero mi licencia 🧁") => `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(text)}`;

export const LEGAL_LINKS = [
  { href: "/aviso-de-privacidad", label: "Aviso de privacidad" },
  { href: "/terminos-y-condiciones", label: "Términos y condiciones" },
  { href: "/politica-de-cookies", label: "Política de cookies" },
];
