import Link from "next/link";
import Image from "next/image";
import { LEGAL, LEGAL_LINKS, SOCIAL } from "@/lib/legal";
import { cn } from "@/lib/cn";
import { SocialLinks } from "./SocialLinks";
import { FestiveFooterArt, FestiveFooterDecor, FooterLogoFrame } from "@/components/festive/LandingFestive";

/** Pie de página con enlaces legales. `compact` para pantallas de acceso, tienda y cotización. */
export function SiteFooter({ compact, className, social = true }: { compact?: boolean; className?: string; social?: boolean }) {
  if (compact)
    return (
      <footer className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-6 text-xs text-cocoa-400", className)}>
        {social && (
          <>
            <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 hover:underline">Instagram</a>
            <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 hover:underline">Facebook</a>
          </>
        )}
        {LEGAL_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-rose-500 hover:underline">
            {l.label}
          </Link>
        ))}
      </footer>
    );
  return (
    <footer className={cn("relative overflow-hidden border-t border-cocoa-800/5 bg-cream-50", className)}>
      <FestiveFooterDecor />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6">
        <FestiveFooterArt />
        <span className="relative block h-[100px] w-[100px] sm:h-[150px] sm:w-[150px]">
          <FooterLogoFrame />
          <Image src="/logo-transparent.svg" unoptimized alt="Dulces Detalles" width={150} height={150} className="relative h-full w-full" />
        </span>
        <p className="font-script text-2xl text-rose-500">Hechos con amor de hogar</p>
        <div>
          <p className="mb-2 text-xs font-bold tracking-widest text-cocoa-400 uppercase">Síguenos</p>
          <SocialLinks variant="icon" />
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-cocoa-500">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-rose-500">
              {l.label}
            </Link>
          ))}
          <a href={`mailto:${LEGAL.email}`} className="hover:text-rose-500">
            Contacto
          </a>
        </nav>
        <p className="text-xs text-cocoa-400">© {new Date().getFullYear()} {LEGAL.brand} · Desde 2018</p>
      </div>
    </footer>
  );
}
