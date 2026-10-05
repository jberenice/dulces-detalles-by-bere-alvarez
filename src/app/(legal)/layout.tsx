import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/legal/SiteFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-cocoa-800/5 bg-cream-100/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image src="/logo-transparent.png" alt="Dulces Detalles" width={44} height={44} />
            <span className="truncate font-script text-xl font-bold text-cocoa-600 sm:text-2xl">Dulces Detalles</span>
          </Link>
          <Link href="/" className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-cocoa-500 hover:text-rose-500">
            <ArrowLeft className="h-4 w-4" /> Inicio
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
