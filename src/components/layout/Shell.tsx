"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Users,
  CakeSlice,
  Wheat,
  Receipt,
  BarChart3,
  Store,
  Settings,
  KeyRound,
  Menu,
  X,
  Plus,
  LogOut,
  MoreHorizontal,
  CalendarDays,
  ChefHat,
  MessageSquareText,
  DatabaseBackup,
  GraduationCap,
  BellRing,
  Wallet,
  TrendingDown,
  Lock,
  Gauge,
  Globe,
  IdCard,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { signOutDevice } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
import { browserTimeZone } from "@/lib/timezones";
import { registerServiceWorker } from "@/lib/push-client";
import { trackVisit } from "@/lib/tutorial";
import { WelcomeTour } from "@/components/tutorial/WelcomeTour";
import { DemoBanner } from "./DemoBanner";
import type { Profile } from "@/lib/types";
import { useBusiness } from "./BusinessProvider";
import { NotificationBell } from "./NotificationBell";
import { UpgradeCard } from "./UpgradeCard";
import { planAllows, routePlan, PLANS } from "@/lib/plans";

const NAV = [
  { group: "Principal", items: [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: FileText },
    { href: "/dashboard/seguimiento", label: "Por seguir", icon: BellRing },
    { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingBag },
    { href: "/dashboard/saldos", label: "Saldos", icon: Wallet },
    { href: "/dashboard/calendario", label: "Calendario", icon: CalendarDays },
    { href: "/dashboard/produccion", label: "Producción", icon: ChefHat },
    { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  ]},
  { group: "Recetario y costos", items: [
    { href: "/dashboard/postres", label: "Postres", icon: CakeSlice },
    { href: "/dashboard/ingredientes", label: "Ingredientes e inventario", icon: Wheat },
    { href: "/dashboard/costos-fijos", label: "Gastos fijos", icon: Receipt },
    { href: "/dashboard/margenes", label: "Alerta de margen", icon: TrendingDown },
  ]},
  { group: "Negocio", items: [
    { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/dashboard/tienda", label: "Mi tienda", icon: Store },
    { href: "/dashboard/impresos", label: "Tarjetas y etiquetas", icon: IdCard },
    { href: "/dashboard/mensajes", label: "Mensajes", icon: MessageSquareText },
    { href: "/dashboard/respaldo", label: "Respaldo", icon: DatabaseBackup },
    { href: "/dashboard/tutorial", label: "Tutorial", icon: GraduationCap },
    { href: "/dashboard/ajustes", label: "Ajustes", icon: Settings },
  ]},
];

const MOBILE = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/dashboard/cotizaciones/nueva", label: "Cotizar", icon: Plus, primary: true },
  { href: "/dashboard/postres", label: "Postres", icon: CakeSlice },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { profile, setProfile, plan } = useBusiness();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  useEffect(() => setOpen(false), [pathname]);

  // Tutorial: marca como visto el paso de la sección actual
  useEffect(() => {
    trackVisit(profile.id, pathname);
  }, [pathname, profile.id]);

  // Service worker: app instalable y notificaciones push
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Detecta la zona horaria del dispositivo la primera vez (luego se cambia en Ajustes)
  useEffect(() => {
    if (profile.timezone_confirmed) return;
    const tz = browserTimeZone();
    createClient()
      .from("profiles")
      .update({ timezone: tz, timezone_confirmed: true })
      .eq("id", profile.id)
      .select()
      .single()
      .then(({ data }: { data: Profile | null }) => data && setProfile(data));
  }, [profile.timezone_confirmed, profile.id, setProfile]);

  // Verifica periódicamente que esta sesión siga siendo el dispositivo activo de la licencia
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const r = await fetch("/api/session/status", { cache: "no-store" });
        const { status } = await r.json();
        if (!alive) return;
        if (status === "other_device") router.replace("/sesion-activa");
        else if (status === "suspended" || status === "expired") router.replace(`/licencia-inactiva?motivo=${status === "expired" ? "vencida" : "suspendida"}`);
        else if (status === "no_auth") router.replace("/login");
        else if (status === "demo_expired") router.replace("/demo?expirada=1");
      } catch {}
    };
    const id = setInterval(check, 60_000);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  const nav = profile.role === "admin"
    ? [...NAV, { group: "Administración", items: [
        { href: "/dashboard/admin", label: "Métricas", icon: Gauge, exact: true },
        { href: "/dashboard/admin/licencias", label: "Licencias", icon: KeyRound },
        { href: "/dashboard/admin/dominios", label: "Dominios", icon: Globe },
      ] }]
    : NAV;

  const gate = routePlan(pathname);
  const locked = gate && !planAllows(plan.plan, gate.min) ? gate : null;

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 pt-6 pr-2 pb-5 pl-5">
      <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-3">
        <Image src={profile.logo_url || "/logo-transparent.png"} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-2xl object-contain" unoptimized={!!profile.logo_url} />
        <div className="min-w-0 leading-tight">
          <p className="line-clamp-2 font-display text-[15px] leading-tight font-semibold break-words text-cocoa-700" title={profile.business_name}>{profile.business_name}</p>
          <p className="truncate text-xs text-cocoa-400">{profile.owner_name ?? profile.email}</p>
        </div>
      </Link>
      <NotificationBell className="max-lg:hidden" />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {nav.map((g) => (
          <div key={g.group}>
            <p className="px-3 pb-1.5 text-[10.5px] font-bold tracking-[0.14em] text-cocoa-300 uppercase">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(it.href, "exact" in it ? it.exact : false);
                const Icon = it.icon;
                const need = routePlan(it.href);
                const needLabel = need && !planAllows(plan.plan, need.min) ? PLANS.find((p) => p.id === need.min)?.name : null;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14.5px] font-semibold transition-all",
                        active ? "bg-rose-500 text-white shadow-rose" : "text-cocoa-500 hover:bg-cream-200 hover:text-cocoa-700",
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-cocoa-300 group-hover:text-rose-400")} />
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>
                      {needLabel && (
                        <span
                          title={`Incluido en el plan ${needLabel}`}
                          className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase", active ? "bg-white/20 text-white" : "bg-cream-200 text-cocoa-400")}
                        >
                          <Lock className="h-2.5 w-2.5" /> {needLabel}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-cocoa-800/5 p-3">
        <Link href="/dashboard/cotizaciones/nueva" className="mb-2 flex items-center justify-center gap-2 rounded-2xl bg-mint-500 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgb(106_166_138/0.9)] transition hover:bg-mint-600">
          <Plus className="h-4 w-4" /> Nueva cotización
        </Link>
        <button onClick={signOutDevice} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-cocoa-400 hover:bg-rose-50 hover:text-rose-500">
          <LogOut className="h-[18px] w-[18px]" /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-[272px]">
      <DemoBanner />
      <WelcomeTour />
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] border-r border-cocoa-800/5 bg-white/80 backdrop-blur-xl lg:block">{SidebarContent}</aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-cocoa-900/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] bg-white shadow-lift animate-[fade-up_.25s_ease]">
            <button onClick={() => setOpen(false)} className="absolute top-5 right-4 rounded-xl p-2 text-cocoa-400 hover:bg-cocoa-800/5" aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Barra superior móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cocoa-800/5 bg-cream-100/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-cocoa-600 hover:bg-cocoa-800/5" aria-label="Abrir menú">
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <Image src="/logo-transparent.png" alt="Dulces Detalles" width={40} height={40} className="shrink-0" />
          <span className="truncate font-script text-xl font-bold whitespace-nowrap text-cocoa-600 max-[359px]:hidden">Dulces Detalles</span>
        </Link>
        <NotificationBell />
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
        {locked ? <UpgradeCard min={locked.min} feature={locked.feature} /> : children}
      </main>

      {/* Navegación inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cocoa-800/5 bg-white/90 pb-safe backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-5">
          {MOBILE.map((it) => {
            const active = isActive(it.href, it.exact);
            const Icon = it.icon;
            return (
              <li key={it.href} className="flex justify-center">
                {it.primary ? (
                  <Link href={it.href} className="-mt-5 flex flex-col items-center gap-1 text-[11px] font-bold text-rose-500">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-rose-500 text-white shadow-rose ring-4 ring-cream-100">
                      <Icon className="h-6 w-6" />
                    </span>
                    {it.label}
                  </Link>
                ) : (
                  <Link href={it.href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold", active ? "text-rose-500" : "text-cocoa-300")}>
                    <Icon className="h-[22px] w-[22px]" />
                    {it.label}
                  </Link>
                )}
              </li>
            );
          })}
          <li className="flex justify-center">
            <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold text-cocoa-300">
              <MoreHorizontal className="h-[22px] w-[22px]" />
              Más
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
