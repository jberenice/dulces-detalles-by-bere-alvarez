/**
 * Quita el fondo liso (blanco, crema, beige…) de un logo cuadrado para que quede "transparente".
 * Rellena desde las orillas los píxeles parecidos al color de las esquinas (sin tocar el interior del logo)
 * y suaviza la orilla. Si la imagen no se puede leer (CORS) regresa null y se usa la original.
 */
const cache = new Map<string, Promise<string | null>>();

export function cleanLogo(src: string): Promise<string | null> {
  if (/\.svg(\?|$)/i.test(src)) return Promise.resolve(null); // los SVG ya son transparentes
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const max = 600;
          const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.max(1, Math.round(img.naturalWidth * k));
          const h = Math.max(1, Math.round(img.naturalHeight * k));
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h);
          const px = data.data;
          // ¿ya tiene transparencia en las esquinas? entonces no hay que hacer nada
          const corners = [0, w - 1, (h - 1) * w, h * w - 1];
          if (corners.some((i) => px[i * 4 + 3] < 200)) return resolve(null);
          // color de fondo = promedio de las esquinas
          const bg = [0, 1, 2].map((ch) => corners.reduce((a, i) => a + px[i * 4 + ch], 0) / 4);
          const dist = (i: number) => Math.hypot(px[i * 4] - bg[0], px[i * 4 + 1] - bg[1], px[i * 4 + 2] - bg[2]);
          const TOL = 34;
          const seen = new Uint8Array(w * h);
          const stack: number[] = [];
          for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
          for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
          while (stack.length) {
            const i = stack.pop()!;
            if (seen[i]) continue;
            seen[i] = 1;
            const d = dist(i);
            if (d > TOL) continue;
            // más parecido al fondo = más transparente (orilla suave)
            px[i * 4 + 3] = Math.round(255 * Math.max(0, (d - TOL * 0.45) / (TOL * 0.55)));
            const x = i % w;
            if (x > 0) stack.push(i - 1);
            if (x < w - 1) stack.push(i + 1);
            if (i >= w) stack.push(i - w);
            if (i < w * (h - 1)) stack.push(i + w);
          }
          ctx.putImageData(data, 0, 0);
          resolve(c.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}
