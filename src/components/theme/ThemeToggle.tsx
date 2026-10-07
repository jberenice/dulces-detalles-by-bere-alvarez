"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

const KEY = "dd-tema";

/** ¿Está activo el tema oscuro? (se guarda por dispositivo) */
export function isDark() {
  return typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";
}

/** Escucha los cambios de tema claro / oscuro */
export function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const load = () => setDark(isDark());
    load();
    window.addEventListener("dd-tema", load);
    return () => window.removeEventListener("dd-tema", load);
  }, []);
  return dark;
}

export function setDarkMode(on: boolean) {
  const root = document.documentElement;
  if (on) root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    localStorage.setItem(KEY, on ? "oscuro" : "claro");
  } catch {}
  window.dispatchEvent(new Event("dd-tema"));
}

/** Botón para prender y apagar el tema oscuro: sol = claro, luna = oscuro */
export function ThemeToggle({ className }: { className?: string }) {
  const dark = useDarkMode();
  return (
    <button
      type="button"
      onClick={() => setDarkMode(!dark)}
      aria-label={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={dark ? "Tema claro" : "Tema oscuro"}
      className={cn(
        "relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ring-1 transition-colors",
        dark ? "bg-[#2a2140] text-amber-200 ring-white/15 hover:bg-[#352a52]" : "bg-amber-50 text-amber-500 ring-amber-200 hover:bg-amber-100",
        className,
      )}
    >
      <Sun className={cn("absolute h-[18px] w-[18px] transition-all duration-500", dark ? "translate-y-6 rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100")} />
      <Moon className={cn("absolute h-[18px] w-[18px] transition-all duration-500", dark ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-6 -rotate-90 opacity-0")} />
    </button>
  );
}

/** Script que se pone en el <head> para aplicar el tema antes de pintar (evita el parpadeo) */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem('${KEY}')==='oscuro')document.documentElement.dataset.theme='dark'}catch(e){}`;
