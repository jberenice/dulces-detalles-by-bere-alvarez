import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, CakeSlice, Calculator, ChevronDown, FileText, Heart, KeyRound, MessageCircle, PlayCircle, Quote, ShoppingBag, Smartphone, Store, TrendingDown, Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { SocialLinks } from "@/components/legal/SocialLinks";
import { Pricing } from "@/components/marketing/Pricing";
import { WhatsAppFloat } from "@/components/marketing/WhatsAppFloat";
import { DEMO_VIDEO_ID, FAQ, TESTIMONIALS } from "@/lib/marketing";
import { LandingFestiveBadge, LandingFestiveDecor } from "@/components/festive/LandingFestive";

const FEATURES = [
  { icon: Calculator, title: "Costeo exacto", text: "Ingredientes, empaques, gastos fijos, desgaste y ganancia: el precio justo de cada postre.", tone: "bg-mint-50 text-mint-600" },
  { icon: FileText, title: "Cotizaciones en PDF", text: "Con tu logo y colores. Envíalas por WhatsApp o correo y tu cliente las acepta en línea.", tone: "bg-rose-50 text-rose-500" },
  { icon: BellRing, title: "Seguimiento automático", text: "Las cotizaciones sin respuesta te esperan con un mensaje amable listo para enviar.", tone: "bg-cream-200 text-cocoa-500" },
  { icon: ShoppingBag, title: "Pedidos y agenda", text: "Calendario de entregas, agenda de producción e inventario que se descuenta solo.", tone: "bg-mint-50 text-mint-600" },
  { icon: Wallet, title: "Saldos claros", text: "Anticipos y pagos parciales: sabes quién te debe, cuánto y le recuerdas antes de entregar.", tone: "bg-rose-50 text-rose-500" },
  { icon: TrendingDown, title: "Alerta de margen", text: "Si sube el azúcar o la mantequilla, te decimos qué postres quedaron cortos y su nuevo precio.", tone: "bg-cream-200 text-cocoa-500" },
  { icon: Store, title: "Tu minitienda", text: "Tamaños, sabores y rellenos con precio, zonas de entrega, días llenos y tu QR para imprimir.", tone: "bg-mint-50 text-mint-600" },
  { icon: BarChart3, title: "Reportes de ventas", text: "Ventas, utilidad y los postres más vendidos por periodo, exportables a Excel.", tone: "bg-rose-50 text-rose-500" },
  { icon: Smartphone, title: "App en tu celular", text: "Instálala en tu pantalla de inicio y recibe un aviso cada vez que te hacen un pedido.", tone: "bg-cream-200 text-cocoa-500" },
];

export default async function Landing({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  // Si Supabase regresa aquí con un enlace de correo vencido o inválido, lo mandamos al login con el aviso
  const sp = await searchParams;
  if (sp.error || sp.error_code) redirect("/login?error=enlace");
  if (sp.code) redirect(`/auth/callback?code=${encodeURIComponent(sp.code)}`);

  return (
    <div className="overflow-x-clip">
      {/* Navegación */}
      <header className="sticky top-0 z-40 border-b border-cocoa-800/5 bg-cream-100/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image src="/logo-transparent.svg" unoptimized alt="Dulces Detalles" width={44} height={44} className="h-11 w-11 shrink-0" />
            <span className="truncate font-script text-xl font-bold whitespace-nowrap text-cocoa-600 max-[359px]:hidden sm:text-2xl">Dulces Detalles</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2">
            <a href="#precios" className="rounded-xl px-3 py-2 text-[13px] font-bold text-cocoa-600 hover:bg-cocoa-800/5 max-md:hidden">Precios</a>
            <a href="#preguntas" className="rounded-xl px-3 py-2 text-[13px] font-bold text-cocoa-600 hover:bg-cocoa-800/5 max-lg:hidden">Preguntas</a>
            <ButtonLink href="/login" variant="ghost" size="sm" className="max-sm:hidden">Iniciar sesión</ButtonLink>
            <ButtonLink href="/demo" size="sm" variant="secondary" className="max-[389px]:hidden">Demo</ButtonLink>
            <ButtonLink href="/login" size="sm" className="sm:hidden">Entrar</ButtonLink>
            <ButtonLink href="/registro" size="sm" className="max-sm:hidden">Activar licencia</ButtonLink>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="sprinkles relative">
        <div className="absolute top-10 -left-32 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-mint-200/50 blur-3xl" />
        <LandingFestiveDecor />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-28">
          <div className="animate-fade-up text-center lg:text-left">
            <LandingFestiveBadge />
            <p className="font-script text-2xl text-rose-500 sm:text-3xl">by Bere Álvarez</p>
            <h1 className="mt-2 text-[34px] leading-[1.08] font-semibold sm:text-6xl">
              Cotiza, costea y vende tus <span className="text-rose-500 italic">postres</span> con el cariño de siempre.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cocoa-500 lg:mx-0">
              La herramienta hecha por una repostera para reposteras: conoce el costo real de cada receta, manda cotizaciones preciosas en segundos y
              recibe pedidos desde tu propia tienda en línea.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <ButtonLink href="/demo" size="lg">Probar demo gratis <ArrowRight className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="#precios" size="lg" variant="outline">Ver planes y precios</ButtonLink>
            </div>
            <p className="mt-6 flex items-center justify-center gap-4 text-sm text-cocoa-400 lg:justify-start">
              <span className="flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-mint-500" /> Celular y computadora</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-mint-500" /> WhatsApp integrado</span>
              <span className="flex items-center gap-1.5 max-sm:hidden"><Heart className="h-4 w-4 text-mint-500" /> 0 % comisiones</span>
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-6 rounded-full bg-white/70 blur-2xl" />
            <Image src="/logo-transparent.svg" unoptimized alt="Dulces Detalles by Bere Álvarez" width={520} height={520} priority fetchPriority="high" className="relative animate-float drop-shadow-2xl" />
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

      {/* Video */}
      <section id="video" className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="font-script text-2xl text-rose-500">Míralo en acción</p>
          <h2 className="mt-1 text-3xl font-semibold sm:text-4xl">Un recorrido de un minuto</h2>
        </div>
        {DEMO_VIDEO_ID ? (
          <div className="overflow-hidden rounded-[28px] bg-cocoa-800 shadow-lift ring-8 ring-white">
            <iframe
              className="aspect-video w-full"
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(DEMO_VIDEO_ID)}?rel=0&modestbranding=1`}
              title="Recorrido por Dulces Detalles"
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <Link href="/demo" className="group sprinkles relative grid aspect-video place-items-center overflow-hidden rounded-[28px] bg-cocoa-800 shadow-lift ring-8 ring-white">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 via-transparent to-mint-500/30" />
            <div className="relative text-center text-cream-100">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-500 text-white shadow-rose transition group-hover:scale-110">
                <PlayCircle className="h-10 w-10" />
              </span>
              <p className="mt-4 font-display text-2xl font-semibold text-white sm:text-3xl">Recórrela tú misma</p>
              <p className="mt-1 text-sm text-cream-200/80">Entra a la demo con datos de ejemplo · sin tarjeta</p>
            </div>
          </Link>
        )}
      </section>

      {/* Cómo funciona */}
      <section className="bg-cocoa-800 text-cream-100">
        <div className="sprinkles mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-script text-2xl text-rose-300">Así de fácil</p>
            <h2 className="mt-1 text-4xl font-semibold text-white">De la receta al pedido en 3 pasos</h2>
            <p className="mt-3 text-cream-200/70">Cada licencia es personal: una cuenta, un dispositivo activo a la vez, y tus datos siempre protegidos.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/demo" size="lg">Probar la demo</ButtonLink>
              <ButtonLink href="/registro" size="lg" variant="secondary"><KeyRound className="h-4 w-4" /> Tengo mi código</ButtonLink>
            </div>
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

      {/* Testimonios (solo reales y con permiso: se editan en src/lib/marketing.ts) */}
      {TESTIMONIALS.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-script text-2xl text-rose-500">Lo que dicen ellas</p>
            <h2 className="mt-1 text-4xl font-semibold">Reposteras que ya la usan</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name + t.business} className="card flex flex-col p-6">
                <Quote className="h-7 w-7 text-rose-300" />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-cocoa-600">“{t.text}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  {t.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-rose-100 font-bold text-rose-600">{t.name[0]}</span>
                  )}
                  <span>
                    <span className="block font-semibold text-cocoa-700">{t.name}</span>
                    <span className="block text-xs text-cocoa-400">{t.business}{t.city ? ` · ${t.city}` : ""}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Precios */}
      <section id="precios" className="scroll-mt-20 bg-cream-200/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="font-script text-2xl text-rose-500">Planes a tu medida</p>
            <h2 className="mt-1 text-4xl font-semibold">Elige cómo quieres crecer</h2>
            <p className="mt-3 text-cocoa-400">Sin comisiones por venta. Cambia de plan cuando quieras.</p>
          </div>
          <Pricing />
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="font-script text-2xl text-rose-500">Resolvemos tus dudas</p>
          <h2 className="mt-1 text-4xl font-semibold">Preguntas frecuentes</h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group card overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-cocoa-700 sm:px-6">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-rose-400 transition group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-relaxed text-cocoa-500 sm:px-6">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Redes sociales */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="font-script text-2xl text-rose-500">Endulza tu feed</p>
        <h2 className="mt-1 text-3xl font-semibold sm:text-4xl">Síguenos en nuestras redes sociales</h2>
        <p className="mx-auto mt-2 max-w-lg text-cocoa-400">Novedades, recetas, tips para tu repostería y los pedidos más bonitos de Dulces Detalles.</p>
        <SocialLinks className="mx-auto mt-8 max-w-2xl" />
      </section>

      <SiteFooter />
      <WhatsAppFloat />
    </div>
  );
}
