"use client";
import { compress } from "./upload";
import { SUPABASE_URL } from "./supabase/env";

/** Sube una foto de una clienta (referencia de pastel o reseña). Regresa la ruta guardada. */
export async function uploadPublicPhoto(file: File, extra: { kind: "solicitud"; slug: string } | { kind: "resena"; token: string }) {
  if (!file.type.startsWith("image/")) throw new Error("Elige una foto");
  if (file.size > 25 * 1024 * 1024) throw new Error("La foto es muy pesada");
  const blob = await compress(file, 1400, 0.8, "image/jpeg");
  const fd = new FormData();
  fd.append("file", blob, "foto.jpg");
  for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  const res = await fetch("/api/tienda/foto", { method: "POST", body: fd });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; path?: string; error?: string };
  if (!res.ok || !json.path) throw new Error(json.error ?? "No se pudo subir la foto");
  return json.path;
}

/** URL pública de una foto de reseña */
export const reviewPhotoUrl = (path: string | null | undefined) => (path ? `${SUPABASE_URL}/storage/v1/object/public/resenas/${path}` : null);
