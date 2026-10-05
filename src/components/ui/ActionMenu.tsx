"use client";
import { useCallback, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import { FloatingPanel } from "./Floating";

export type Action = { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean; hidden?: boolean };

/** Menú de acciones por fila (ver, editar, enviar, compartir, eliminar…) — se dibuja encima de todo */
export function ActionMenu({ actions, label = "Acciones" }: { actions: Action[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-cocoa-400 transition hover:bg-cream-200 hover:text-cocoa-700",
          open && "bg-cream-200 text-cocoa-700",
        )}
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      <FloatingPanel anchor={ref} open={open} onClose={close} width={232}>
        <div role="menu">
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
      </FloatingPanel>
    </>
  );
}
