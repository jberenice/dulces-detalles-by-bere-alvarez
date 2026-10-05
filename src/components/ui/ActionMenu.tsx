"use client";
import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/cn";

export type Action = { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; hidden?: boolean };

/** Menú de acciones por fila (ver, editar, enviar, compartir, eliminar…) */
export function ActionMenu({ actions, label = "Acciones" }: { actions: Action[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="grid h-10 w-10 place-items-center rounded-xl text-cocoa-400 transition hover:bg-cream-200 hover:text-cocoa-700"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div role="menu" className="absolute top-11 right-0 z-50 w-56 overflow-hidden rounded-2xl border border-cocoa-800/8 bg-white p-1.5 shadow-lift animate-fade-up">
          {actions
            .filter((a) => !a.hidden)
            .map((a) => (
              <button
                key={a.label}
                role="menuitem"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  a.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                  a.danger ? "text-rose-600 hover:bg-rose-50" : "text-cocoa-600 hover:bg-cream-100",
                )}
              >
                <span className="text-current opacity-70 [&_svg]:h-4 [&_svg]:w-4">{a.icon}</span>
                {a.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
