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
} from "lucide-react";
import { cn } from "@/lib/cn";
import { signOutDevice } from "@/lib/session";
import { useBusiness } from "./BusinessProvider";

const NAV = [
  { group: "Principal", items: [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: FileText },
    { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingBag },
    { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  ]},
  { group: "Recetario y costos", items: [
    { href: "/dashboard/postres", label: "Postres", icon: CakeSlice },
    { href: "/dashboard/ingredientes", label: "Ingredientes", icon: Wheat },
    { href: "/dashboard/costos-fijos", label: "Gastos fijos", icon: Receipt },
  ]},
  { group: "Negocio", items: [
    { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/dashboard/tienda", label: "Mi tienda", icon: Store },
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
  const { profile } = useBusiness();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  useEffect(() => setOpen(false), [pathname]);

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
    ? [...NAV, { group: "Administración", items: [{ href: "/dashboard/admin/licencias", label: "Licencias", icon: KeyRound }] }]
    : NAV;

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-3 px-6 pt-6 pb-5">
        <Image src={profile.logo_url || "/logo-transparent.png"} alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-2xl object-contain" unoptimized={!!profile.logo_url} />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-[17px] font-semibold text-cocoa-700">{profile.business_name}</p>
          <p className="truncate text-xs text-cocoa-400">{profile.owner_name ?? profile.email}</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {nav.map((g) => (
          <div key={g.group}>
            <p className="px-3 pb-1.5 text-[10.5px] font-bold tracking-[0.14em] text-cocoa-300 uppercase">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(it.href, "exact" in it ? it.exact : false);
                const Icon = it.icon;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14.5px] font-semibold transition-all",
                        active ? "bg-rose-500 text-white shadow-rose" : "text-cocoa-500 hover:bg-cream-200 hover:text-cocoa-700",
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-cocoa-300 group-hover:text-rose-400")} />
                      {it.label}
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
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo-transparent.png" alt="Dulces Detalles" width={40} height={40} />
          <span className="font-script text-2xl font-bold text-cocoa-600">Dulces Detalles</span>
        </Link>
        <span className="w-10" />
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">{children}</main>

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
