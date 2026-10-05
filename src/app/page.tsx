import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, CakeSlice, Calculator, FileText, Heart, KeyRound, MessageCircle, ShoppingBag, Smartphone, Store, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

const FEATURES = [
  { icon: FileText, title: "Cotizaciones en PDF", text: "Con tu logo y colores. Envíalas por WhatsApp o correo y tu cliente las acepta en línea.", tone: "bg-rose-50 text-rose-500" },
  { icon: Calculator, title: "Costeo exacto", text: "Ingredientes, empaques, gastos fijos, desgaste y ganancia: el precio justo de cada postre.", tone: "bg-mint-50 text-mint-600" },
  { icon: ShoppingBag, title: "Pedidos y agenda", text: "Fechas de entrega, anticipos, saldos y estados, todo en una agenda clara.", tone: "bg-cream-200 text-cocoa-500" },
  { icon: Users, title: "Clientes", text: "Historial de compras, cumpleaños y mensajes rápidos por WhatsApp.", tone: "bg-rose-50 text-rose-500" },
  { icon: BarChart3, title: "Reportes de ventas", text: "Ventas, utilidad y los postres más vendidos por periodo, exportables a Excel.", tone: "bg-mint-50 text-mint-600" },
  { icon: Store, title: "Tu minitienda", text: "Un catálogo en línea con carrito; los pedidos te llegan a WhatsApp y a tu panel.", tone: "bg-cream-200 text-cocoa-500" },
];

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      {/* Navegación */}
      <header className="sticky top-0 z-40 border-b border-cocoa-800/5 bg-cream-100/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-transparent.png" alt="Dulces Detalles" width={48} height={48} priority />
            <span className="font-script text-2xl font-bold text-cocoa-600">Dulces Detalles</span>
          </Link>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">Iniciar sesión</ButtonLink>
            <ButtonLink href="/login" size="sm" className="sm:hidden">Entrar</ButtonLink>
            <ButtonLink href="/registro" size="sm" className="hidden sm:inline-flex">Activar licencia</ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="sprinkles relative">
        <div className="absolute top-10 -left-32 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-mint-200/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-28">
          <div className="animate-fade-up text-center lg:text-left">
            <p className="font-script text-3xl text-rose-500">by Bere Álvarez</p>
            <h1 className="mt-2 text-[42px] leading-[1.05] font-semibold sm:text-6xl">
              Cotiza, costea y vende tus <span className="text-rose-500 italic">postres</span> con el cariño de siempre.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cocoa-500 lg:mx-0">
              La herramienta hecha por una repostera para reposteras: conoce el costo real de cada receta, manda cotizaciones preciosas en segundos y
              recibe pedidos desde tu propia tienda en línea.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <ButtonLink href="/registro" size="lg">Activar mi licencia <ArrowRight className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="/login" size="lg" variant="outline">Ya tengo cuenta</ButtonLink>
            </div>
            <p className="mt-6 flex items-center justify-center gap-4 text-sm text-cocoa-400 lg:justify-start">
              <span className="flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-mint-500" /> Celular y computadora</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-mint-500" /> WhatsApp integrado</span>
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-6 rounded-full bg-white/70 blur-2xl" />
            <Image src="/logo-transparent.png" alt="Dulces Detalles by Bere Álvarez" width={520} height={520} className="relative animate-float drop-shadow-2xl" priority />
            <div className="card absolute -bottom-2 -left-2 hidden w-52 p-4 sm:block">
              <p className="text-[11px] font-bold tracking-wider text-cocoa-300 uppercase">Pastel 3 leches</p>
              <p className="font-display text-2xl font-semibold text-rose-500">$625</p>
              <p className="text-xs text-mint-600">Margen 38% ✓</p>
            </div>
            <div className="card absolute top-6 -right-2 hidden w-48 p-4 sm:block">
              <p className="flex items-center gap-1.5 text-xs font-bold text-mint-600"><MessageCircle className="h-3.5 w-3.5" /> Nuevo pedido</p>
              <p className="mt-1 text-sm font-semibold">12 cupcakes Red Velvet</p>
              <p className="text-xs text-cocoa-400">Entrega el sábado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Funciones */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-script text-2xl text-rose-500">Todo en un solo lugar</p>
          <h2 className="mt-1 text-4xl font-semibold">Tu repostería, organizada y rentable</h2>
          <p className="mt-3 text-cocoa-400">Basado en las mismas hojas de costeo que usamos en Dulces Detalles desde 2018, ahora en una app elegante y fácil.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition hover:-translate-y-1 hover:shadow-lift">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${f.tone}`}><f.icon className="h-6 w-6" /></span>
              <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-cocoa-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-cocoa-800 text-cream-100">
        <div className="sprinkles mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-script text-2xl text-rose-300">Así de fácil</p>
            <h2 className="mt-1 text-4xl font-semibold text-white">De la receta al pedido en 3 pasos</h2>
            <p className="mt-3 text-cream-200/70">Cada licencia es personal: una cuenta, un dispositivo activo a la vez, y tus datos siempre protegidos.</p>
            <ButtonLink href="/registro" size="lg" className="mt-8"><KeyRound className="h-4 w-4" /> Tengo mi código</ButtonLink>
          </div>
          <ol className="space-y-4">
            {[
              { icon: CakeSlice, t: "Registra tus recetas", d: "Ingredientes y empaques con su precio de compra. Te sugerimos el precio de venta." },
              { icon: FileText, t: "Cotiza y comparte", d: "Elige postres, ajusta cantidades y manda el PDF por WhatsApp o correo." },
              { icon: Heart, t: "Entrega y crece", d: "Sigue tus pedidos, cobra anticipos y mira qué postres te dejan más." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-500 text-white"><s.icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-bold tracking-widest text-mint-300">PASO {i + 1}</p>
                  <p className="font-display text-xl font-semibold text-white">{s.t}</p>
                  <p className="text-sm text-cream-200/70">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-12 text-center sm:px-6">
        <Image src="/logo-transparent.png" alt="Dulces Detalles" width={110} height={110} />
        <p className="font-script text-2xl text-rose-500">Hechos con amor de hogar</p>
        <p className="text-sm text-cocoa-400">© {new Date().getFullYear()} Dulces Detalles by Bere Álvarez · Desde 2018</p>
      </footer>
    </div>
  );
}
