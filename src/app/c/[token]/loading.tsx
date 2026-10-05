import { Skeleton } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 py-10" aria-busy="true" aria-label="Cargando cotización">
      <div className="card space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
