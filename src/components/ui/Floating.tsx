"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * Panel flotante (menús y listas desplegables) que se dibuja encima de todo con un portal.
 * Así ninguna tarjeta con "overflow" lo corta, y se abre hacia arriba si no cabe abajo
 * (por ejemplo en la última fila o detrás de la barra inferior del celular).
 */
export function FloatingPanel({
  anchor,
  open,
  onClose,
  children,
  className,
  align = "end",
  matchWidth = false,
  width,
  gap = 6,
  maxHeight,
}: {
  anchor: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end";
  matchWidth?: boolean;
  width?: number;
  gap?: number;
  /** Alto máximo deseado (px); además nunca pasa del espacio libre en pantalla */
  maxHeight?: number;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const hidden: React.CSSProperties = { position: "fixed", top: 0, left: 0, width: width ?? 224, visibility: "hidden" };
  const [style, setStyle] = useState<React.CSSProperties>(hidden);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const a = anchor.current?.getBoundingClientRect();
    const p = panel.current;
    if (!a || !p) return;
    const vw = window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    // Margen inferior extra en celular por la barra de navegación fija
    const bottomSafe = vw < 1024 ? 84 : 12;
    const w = Math.min(matchWidth ? Math.max(a.width, width ?? 0) : (width ?? p.offsetWidth), vw - 16);
    const below = vh - a.bottom - gap - bottomSafe;
    const above = a.top - gap - 12;
    const natural = Math.min(p.scrollHeight, maxHeight ?? Infinity);
    const openUp = natural > below && above > below;
    const maxH = Math.min(maxHeight ?? Infinity, Math.max(140, openUp ? above : below));
    let left = align === "end" ? a.right - w : a.left;
    left = Math.min(Math.max(8, left), vw - w - 8);
    setStyle({
      position: "fixed",
      left,
      width: w,
      maxHeight: maxH,
      ...(openUp ? { bottom: (window.innerHeight - a.top) + gap } : { top: a.bottom + gap }),
      visibility: "visible",
    });
  }, [anchor, align, matchWidth, width, gap, maxHeight]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(hidden);
      return;
    }
    place();
    // Si cambia el contenido (p. ej. al filtrar), se vuelve a acomodar
    const ro = typeof ResizeObserver !== "undefined" && panel.current ? new ResizeObserver(() => place()) : null;
    if (ro && panel.current) ro.observe(panel.current);
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    // Al hacer scroll de la página se reacomoda; si el ancla sale de la pantalla, se cierra
    const onScroll = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return;
      const a = anchor.current?.getBoundingClientRect();
      if (!a || a.bottom < 0 || a.top > window.innerHeight) onClose();
      else place();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onClose, place, anchor]);

  if (!open || !mounted) return null;
  return createPortal(
    <div
      ref={panel}
      style={style}
      className={cn("z-[200] overflow-y-auto overscroll-contain rounded-2xl border border-cocoa-800/8 bg-white p-1.5 shadow-lift animate-fade-in", className)}
    >
      {children}
    </div>,
    document.body,
  );
}
