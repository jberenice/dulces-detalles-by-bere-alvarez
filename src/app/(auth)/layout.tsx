import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <aside className="sprinkles relative hidden overflow-hidden bg-cream-200 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-mint-200/50 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-rose-200/50 blur-3xl" />
        <Link href="/" className="relative z-10 text-sm font-bold text-cocoa-500 hover:text-rose-500">
          ← Volver al inicio
        </Link>
        <div className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center">
          <Image src="/logo-transparent.png" alt="Dulces Detalles" width={340} height={340} className="animate-float drop-shadow-xl" priority />
          <p className="mt-2 font-script text-3xl text-rose-500">Cada postre, un detalle</p>
          <p className="mt-3 text-[15px] leading-relaxed text-cocoa-500">
            Cotiza en segundos, conoce el costo real de cada receta y lleva tus pedidos y tu tienda en línea desde un solo lugar.
          </p>
        </div>
        <p className="relative z-10 flex items-center gap-1.5 text-xs text-cocoa-400">
          Hecho con <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" /> de hogar · Desde 2018
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px] animate-fade-up">
          <div className="mb-8 flex justify-center lg:hidden">
            <Image src="/logo-transparent.png" alt="Dulces Detalles" width={150} height={150} priority />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
