/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";

/** Iniciales del negocio (para cuando la repostería aún no sube su logo) */
export const bizInitials = (name: string) =>
  name
    .replace(/\b(by|de|del|la|las|los|y)\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "•";

/**
 * Logo de la repostería en círculo. Si no tiene logo se muestran sus iniciales con sus colores,
 * nunca el logo de otra tienda ni el de la plataforma.
 */
export function BizLogo({ src, name, className }: { src: string | null | undefined; name: string; className?: string }) {
  if (src) return <img src={src} alt={name} className={cn("rounded-full object-cover", className)} />;
  return (
    <span
      role="img"
      aria-label={name}
      className={cn("grid place-items-center rounded-full font-semibold", className)}
      style={{ background: "var(--st-primary, #eb5473)", color: "var(--st-on-primary, #fff)", fontFamily: "var(--st-heading, var(--font-display-serif))" }}
    >
      <span style={{ fontSize: "0.4em" }}>{bizInitials(name)}</span>
    </span>
  );
}
