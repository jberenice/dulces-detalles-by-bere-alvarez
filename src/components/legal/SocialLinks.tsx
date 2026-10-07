import { Facebook, Instagram } from "lucide-react";
import { SOCIAL } from "@/lib/legal";
import { cn } from "@/lib/cn";

/** Botones a las redes oficiales de Dulces Detalles */
export function SocialLinks({ variant = "pill", className }: { variant?: "pill" | "icon"; className?: string }) {
  const items = [
    { href: SOCIAL.instagram, label: "Instagram", handle: SOCIAL.instagramHandle, Icon: Instagram, tone: "from-rose-400 via-rose-500 to-amber-400" },
    { href: SOCIAL.facebook, label: "Facebook", handle: "Dulces Detalles", Icon: Facebook, tone: "from-sky-500 to-sky-600" },
  ];
  if (variant === "icon")
    return (
      <div className={cn("flex items-center justify-center gap-3", className)}>
        {items.map(({ href, label, Icon, tone }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Síguenos en ${label}`} className={cn("grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift", tone)}>
            <Icon className="h-5 w-5" />
          </a>
        ))}
      </div>
    );
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      {items.map(({ href, label, handle, Icon, tone }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="card fest-badge group flex flex-1 items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
          <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white", tone)}>
            <Icon className="h-6 w-6" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-xs font-bold tracking-wider text-cocoa-400 uppercase">{label}</span>
            <span className="block truncate font-semibold text-cocoa-700 group-hover:text-rose-500">{handle}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
