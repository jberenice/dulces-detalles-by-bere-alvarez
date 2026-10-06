"use client";
import { useMemo, useRef, useState } from "react";
import { Camera, Check, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadPublicPhoto } from "@/lib/public-photos";
import { normalizeTheme, themeVars } from "@/lib/storeTheme";
import { storeUrl } from "@/lib/domains";
import { cn } from "@/lib/cn";

export type ReviewPageData = {
  business_name: string;
  logo_url: string | null;
  theme: unknown;
  slug: string | null;
  customer_name: string | null;
  submitted: boolean;
  rating: number | null;
  items: string[];
};

const LABELS = ["", "No me gustó", "Puede mejorar", "Estuvo bien", "¡Muy rico!", "¡Me encantó!"];

/** Página pública para que la clienta califique su pedido y suba una foto */
export function ReviewForm({ data, token }: { data: ReviewPageData; token: string }) {
  const theme = useMemo(() => normalizeTheme(data.theme), [data.theme]);
  const vars = useMemo(() => themeVars(theme), [theme]);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(data.customer_name ?? "");
  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(data.submitted);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(f?: File) {
    if (!f) return;
    setUploading(true);
    try {
      const path = await uploadPublicPhoto(f, { kind: "resena", token });
      setPhoto({ path, preview: URL.createObjectURL(f) });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return toast.error("Elige de 1 a 5 estrellas");
    setSending(true);
    const { error } = await createClient().rpc("submit_review", { p_token: token, p_rating: rating, p_comment: comment, p_name: name, p_photo: photo?.path ?? null });
    setSending(false);
    if (error) return toast.error(error.message);
    setDone(true);
  }

  const btn = "bg-[var(--st-primary)] text-[var(--st-on-primary)] transition hover:brightness-95";
  return (
    <div className="min-h-dvh bg-[var(--st-bg)] px-4 py-10 text-[var(--st-text)]" style={vars}>
      <div className="mx-auto max-w-md">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logo_url || "/logo-transparent.svg"} alt={data.business_name} className="mx-auto h-24 w-24 rounded-full bg-white object-cover shadow-md ring-4 ring-white" />
          <h1 className="mt-4 text-2xl font-semibold">{done ? "¡Gracias por tu reseña! 💕" : "¿Qué te pareció tu pedido?"}</h1>
          <p className="mt-1 text-[15px] text-[var(--st-muted)]">{data.business_name}</p>
        </div>

        {done ? (
          <div className="mt-8 rounded-[var(--st-radius)] bg-[var(--st-surface)] p-6 text-center shadow-sm ring-1 ring-[var(--st-line)]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint-100 text-mint-600"><Check className="h-7 w-7" /></span>
            <p className="mt-4 text-[var(--st-muted)]">Tu opinión nos ayuda muchísimo a seguir endulzando momentos.</p>
            {data.slug && (
              <a href={storeUrl(data.slug)} className={cn("mt-6 inline-flex rounded-full px-6 py-3 font-bold", btn)}>Ver la tienda</a>
            )}
          </div>
        ) : (
          <form onSubmit={send} className="mt-8 space-y-5 rounded-[var(--st-radius)] bg-[var(--st-surface)] p-6 shadow-sm ring-1 ring-[var(--st-line)]">
            {data.items.length > 0 && (
              <ul className="rounded-2xl bg-[var(--st-soft)] px-4 py-3 text-sm text-[var(--st-text)]">
                {data.items.slice(0, 6).map((i) => <li key={i} className="truncate">🧁 {i}</li>)}
              </ul>
            )}
            <div className="text-center">
              <div className="flex justify-center gap-1.5" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} estrellas`} className="transition active:scale-90">
                    <Star className={cn("h-11 w-11", n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-cocoa-800/15")} />
                  </button>
                ))}
              </div>
              <p className="mt-1 h-5 text-sm font-semibold text-[var(--st-muted)]">{LABELS[hover || rating]}</p>
            </div>
            <label className="block">
              <span className="label">Cuéntanos (opcional)</span>
              <textarea className="field min-h-[96px]" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="¿Qué fue lo que más te gustó?" />
            </label>
            <label className="block">
              <span className="label">Tu nombre</span>
              <input className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quieres que aparezca" />
            </label>
            <div>
              <span className="label">Foto de tu postre (opcional)</span>
              {photo ? (
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt="" className="aspect-[4/3] w-full object-cover" />
                  <button type="button" onClick={() => setPhoto(null)} className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white" aria-label="Quitar foto"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-cocoa-800/15 py-6 text-sm font-semibold text-[var(--st-muted)] hover:border-[var(--st-primary)]">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />} Subir foto
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
            </div>
            <button type="submit" disabled={sending || uploading} className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold disabled:opacity-60", btn)}>
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5" />} Enviar reseña
            </button>
            <p className="text-center text-xs text-[var(--st-muted)]">{data.business_name} puede mostrar tu reseña y tu foto en su tienda.</p>
          </form>
        )}
      </div>
    </div>
  );
}
