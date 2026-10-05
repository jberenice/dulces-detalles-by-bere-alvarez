import { Skeleton } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-cream-100" aria-busy="true" aria-label="Cargando tienda">
      <Skeleton className="h-40 rounded-none sm:h-60" />
      <div className="mx-auto -mt-16 flex max-w-3xl flex-col items-center px-4">
        <Skeleton className="h-32 w-32 rounded-full ring-4 ring-cream-100" />
        <Skeleton className="mt-4 h-8 w-64 max-w-full" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="mx-auto mt-10 max-w-6xl px-4">
        <div className="mb-5 flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl bg-white">
              <Skeleton className="aspect-square rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
