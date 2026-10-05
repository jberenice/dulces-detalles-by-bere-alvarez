import { Skeleton } from "@/components/ui/Card";

/** Silueta mientras carga una sección del panel (en lugar de una pantalla en blanco) */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[116px] rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card space-y-3 p-5">
          <Skeleton className="h-5 w-48" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
        <div className="card space-y-3 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
