import { salesLink } from "@/lib/legal";

/** Botón flotante de WhatsApp para dudas y ventas (solo en la página principal) */
export function WhatsAppFloat() {
  return (
    <a
      href={salesLink("¡Hola! Tengo dudas sobre Dulces Detalles 🧁")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="group fixed right-4 bottom-4 z-[80] flex items-center gap-2 rounded-full bg-[#25d366] py-3 pr-3 pl-3 text-white shadow-[0_12px_30px_-8px_rgb(37_211_102/0.7)] transition hover:pr-5 sm:right-6 sm:bottom-6"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.33 4 14.9c0 2.1.56 4.15 1.62 5.95L4 29l8.39-2.18A12.2 12.2 0 0 0 16.04 27C22.67 27 28 21.67 28 15.1 28 8.33 22.67 3 16.04 3Zm0 21.9c-1.85 0-3.66-.5-5.24-1.43l-.38-.22-4.98 1.3 1.33-4.8-.25-.4A9.6 9.6 0 0 1 6.4 14.9c0-5.24 4.33-9.5 9.64-9.5 5.3 0 9.56 4.26 9.56 9.7 0 5.24-4.27 9.8-9.56 9.8Zm5.29-7.18c-.29-.15-1.71-.84-1.98-.93-.27-.1-.46-.15-.65.14-.19.29-.75.93-.92 1.12-.17.2-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.43-.86-.76-1.44-1.7-1.6-1.99-.17-.29-.02-.44.12-.59.13-.13.29-.34.44-.5.14-.18.19-.3.29-.5.1-.19.05-.36-.03-.5-.07-.15-.65-1.55-.89-2.13-.23-.56-.47-.48-.65-.49h-.55c-.2 0-.5.07-.77.36-.27.29-1 .98-1 2.38s1.03 2.77 1.17 2.96c.15.2 2.02 3.08 4.9 4.32.68.29 1.22.47 1.63.6.69.22 1.31.19 1.8.12.55-.08 1.71-.7 1.95-1.37.24-.68.24-1.26.17-1.38-.07-.12-.27-.19-.56-.34Z" />
      </svg>
      <span className="max-w-0 overflow-hidden text-sm font-bold whitespace-nowrap transition-all duration-300 group-hover:max-w-[160px]">¿Dudas? Escríbenos</span>
    </a>
  );
}
