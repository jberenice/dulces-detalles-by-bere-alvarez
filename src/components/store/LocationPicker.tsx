"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Minus, Plus, Search } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Mapa para marcar dónde se entrega el pedido.
 * Sin librerías: mosaicos de OpenStreetMap, se arrastra el mapa y el pin queda fijo al centro (como en las apps de viajes).
 * Búsqueda de calle o colonia con Nominatim (OpenStreetMap). Funciona con el dedo (arrastrar y pellizcar) y con el mouse.
 */
export type LatLng = { lat: number; lng: number };

const TILE = 256;
const MIN_Z = 4;
const MAX_Z = 19;
const DEFAULT: LatLng & { z: number } = { lat: 23.6345, lng: -102.5528, z: 5 }; // México

const worldSize = (z: number) => TILE * 2 ** z;
function project({ lat, lng }: LatLng, z: number) {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  const w = worldSize(z);
  return { x: ((lng + 180) / 360) * w, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * w };
}
function unproject(x: number, y: number, z: number): LatLng {
  const w = worldSize(z);
  const lng = (x / w) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / w;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng: ((((lng + 180) % 360) + 360) % 360) - 180 };
}
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

export function LocationPicker({ value, onChange, className }: { value: LatLng | null; onChange: (v: LatLng) => void; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState(() => (value ? { ...value, z: 17 } : DEFAULT));
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ x: number; y: number; dist: number } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const commit = useCallback(
    (v: { lat: number; lng: number; z: number }) => {
      setView(v);
      onChange({ lat: round6(v.lat), lng: round6(v.lng) });
    },
    [onChange],
  );

  const locate = useCallback(() => {
    if (!navigator.geolocation) return setHint("Tu navegador no comparte la ubicación. Busca tu calle o mueve el mapa.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setHint(null);
        commit({ lat: p.coords.latitude, lng: p.coords.longitude, z: 17 });
      },
      () => {
        setLocating(false);
        setHint("No pudimos obtener tu ubicación. Busca tu calle o colonia, o mueve el mapa.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [commit]);

  // Al abrir por primera vez sin ubicación, se intenta usar la del celular
  useEffect(() => {
    if (!value) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const center = project(view, view.z);
  const cx = center.x - (drag?.dx ?? 0);
  const cy = center.y - (drag?.dy ?? 0);
  const n = 2 ** view.z;
  const tiles: { key: string; src: string; left: number; top: number }[] = [];
  if (size.w) {
    const x0 = Math.floor((cx - size.w / 2) / TILE);
    const x1 = Math.floor((cx + size.w / 2) / TILE);
    const y0 = Math.max(0, Math.floor((cy - size.h / 2) / TILE));
    const y1 = Math.min(n - 1, Math.floor((cy + size.h / 2) / TILE));
    for (let tx = x0; tx <= x1; tx++)
      for (let ty = y0; ty <= y1; ty++) {
        const wx = ((tx % n) + n) % n;
        tiles.push({
          key: `${view.z}/${tx}/${ty}`,
          src: `https://tile.openstreetmap.org/${view.z}/${wx}/${ty}.png`,
          left: Math.round(tx * TILE - (cx - size.w / 2)),
          top: Math.round(ty * TILE - (cy - size.h / 2)),
        });
      }
  }

  const zoomBy = (d: number) => {
    const z = Math.max(MIN_Z, Math.min(MAX_Z, view.z + d));
    if (z !== view.z) commit({ ...view, z });
  };

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    start.current = { x: pts[0].x, y: pts[0].y, dist: pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0 };
    setDrag({ dx: 0, dy: 0 });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId) || !start.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 1 && !start.current.dist) setDrag({ dx: pts[0].x - start.current.x, dy: pts[0].y - start.current.y });
  }
  function onPointerUp(e: React.PointerEvent) {
    const pts = [...pointers.current.values()];
    const s = start.current;
    pointers.current.delete(e.pointerId);
    if (!s) return;
    // Pellizco: acerca o aleja según cuánto se abrieron los dedos
    if (s.dist && pts.length > 1) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const steps = Math.round(Math.log2(d / s.dist));
      start.current = null;
      setDrag(null);
      if (steps) zoomBy(steps);
      return;
    }
    if (pointers.current.size) return;
    start.current = null;
    const dx = drag?.dx ?? 0;
    const dy = drag?.dy ?? 0;
    setDrag(null);
    if (Math.abs(dx) + Math.abs(dy) < 3) return;
    const ll = unproject(center.x - dx, Math.max(0, Math.min(worldSize(view.z), center.y - dy)), view.z);
    commit({ ...ll, z: view.z });
  }

  // Rueda del mouse (con un pequeño freno para no saltar varios niveles)
  const wheelAt = useRef(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fn = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - wheelAt.current < 250) return;
      wheelAt.current = now;
      setView((v) => {
        const z = Math.max(MIN_Z, Math.min(MAX_Z, v.z + (e.deltaY < 0 ? 1 : -1)));
        if (z !== v.z) onChange({ lat: round6(v.lat), lng: round6(v.lng) });
        return { ...v, z };
      });
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [onChange]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    const term = q.trim();
    if (term.length < 3) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=mx&accept-language=es&q=${encodeURIComponent(term)}`;
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await r.json()) as { display_name: string; lat: string; lon: string }[];
      setResults(data.map((d) => ({ name: d.display_name, lat: Number(d.lat), lng: Number(d.lon) })));
      if (!data.length) setHint("No encontramos ese lugar. Prueba con calle y colonia, o mueve el mapa.");
    } catch {
      setHint("No se pudo buscar ahora. Mueve el mapa para marcar tu ubicación.");
    }
    setSearching(false);
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl ring-1 ring-cocoa-800/10", className)}>
      <form onSubmit={search} className="flex gap-2 bg-cream-50 p-2">
        <input
          className="field !py-2 flex-1 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            // No envía el formulario del pedido
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Busca tu calle, colonia o un lugar cercano"
          maxLength={120}
          aria-label="Buscar dirección en el mapa"
        />
        <button type="button" onClick={() => search()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-cocoa-600 ring-1 ring-cocoa-800/10" aria-label="Buscar">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </form>
      {results.length > 0 && (
        <ul className="max-h-40 overflow-y-auto border-y border-cocoa-800/5 bg-white text-sm">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  commit({ lat: r.lat, lng: r.lng, z: 17 });
                  setResults([]);
                  setHint(null);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-cream-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-400" />
                <span className="line-clamp-2 text-cocoa-600">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        ref={box}
        className="relative h-64 touch-none select-none overflow-hidden bg-[#e8e4d8] sm:h-72"
        style={{ cursor: drag ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => zoomBy(1)}
      >
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={t.key} src={t.src} alt="" draggable={false} className="pointer-events-none absolute h-64 w-64 max-w-none" style={{ left: t.left, top: t.top, width: TILE, height: TILE }} />
        ))}
        {/* Pin fijo al centro */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
          <MapPin className={cn("h-10 w-10 fill-[var(--st-primary,#eb5473)] text-white drop-shadow-lg transition-transform", drag && "-translate-y-2")} strokeWidth={1.5} />
        </div>
        <span className="pointer-events-none absolute top-1/2 left-1/2 h-2 w-4 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-black/25" />
        <div className="absolute top-2 right-2 flex flex-col overflow-hidden rounded-xl bg-white shadow-md">
          <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => zoomBy(1)} className="grid h-9 w-9 place-items-center text-cocoa-600 hover:bg-cream-100" aria-label="Acercar"><Plus className="h-4 w-4" /></button>
          <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => zoomBy(-1)} className="grid h-9 w-9 place-items-center border-t border-cocoa-800/10 text-cocoa-600 hover:bg-cream-100" aria-label="Alejar"><Minus className="h-4 w-4" /></button>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={locate}
          className="absolute bottom-7 left-2 flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-cocoa-600 shadow-md"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />} Mi ubicación
        </button>
        <span className="absolute right-0 bottom-0 bg-white/80 px-1.5 text-[10px] text-cocoa-500">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" onPointerDown={(e) => e.stopPropagation()}>OpenStreetMap</a>
        </span>
      </div>
      <p className={cn("bg-cream-50 px-3 py-2 text-xs", value ? "text-mint-700" : "text-cocoa-400")}>
        {hint ?? (value ? "✓ Ubicación marcada. Mueve el mapa si el pin no quedó exacto." : "Mueve el mapa hasta que el pin quede sobre el lugar de entrega.")}
      </p>
    </div>
  );
}

export const mapsUrl = (v: LatLng) => `https://www.google.com/maps?q=${v.lat},${v.lng}`;
