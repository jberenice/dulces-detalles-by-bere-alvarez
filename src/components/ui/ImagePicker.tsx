"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/cn";

export function ImagePicker({
  value,
  onChange,
  folder,
  className,
  label = "Subir foto",
  aspect = "aspect-[4/3]",
  fit = "cover",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: "postres" | "logo" | "tienda";
  className?: string;
  label?: string;
  aspect?: string;
  fit?: "cover" | "contain";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f, folder));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className={cn("group relative overflow-hidden rounded-3xl border-2 border-dashed border-cocoa-800/10 bg-cream-50", aspect, className)}>
      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain p-3")} />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-cocoa-600 shadow hover:text-rose-500"
            aria-label="Quitar imagen"
          >
            <X className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => ref.current?.click()} className="absolute inset-x-2 bottom-2 rounded-xl bg-white/90 py-1.5 text-xs font-bold text-cocoa-600 opacity-0 shadow transition group-hover:opacity-100">
            Cambiar
          </button>
        </>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-cocoa-400 hover:text-rose-500">
          {busy ? <Loader2 className="h-7 w-7 animate-spin" /> : <ImagePlus className="h-7 w-7" />}
          <span className="text-sm font-semibold">{busy ? "Subiendo…" : label}</span>
        </button>
      )}
      {busy && value && (
        <div className="absolute inset-0 grid place-items-center bg-white/60">
          <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}
