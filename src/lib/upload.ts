"use client";
import { createClient } from "./supabase/client";

/** Reduce la imagen (máx. `max` px) y la convierte a JPEG antes de subirla. */
async function compress(file: File, max = 1400, quality = 0.85, type = "image/jpeg"): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), type, quality));
}

export async function uploadImage(file: File, folder: "postres" | "logo" | "tienda") {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Sesión expirada");
  if (file.size > 12 * 1024 * 1024) throw new Error("La imagen es muy pesada (máx. 12 MB)");
  // El logo se guarda en PNG (con transparencia) para los PDF; las fotos en JPEG para que
  // se vean en la tarjeta al compartir el enlace por WhatsApp y redes sociales
  const blob = await compress(file, folder === "logo" ? 600 : 1400, 0.82, folder === "logo" ? "image/png" : "image/jpeg");
  const ext = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("media").upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl as string;
}
