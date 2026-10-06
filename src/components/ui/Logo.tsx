import Image from "next/image";
import { cn } from "@/lib/cn";

export function Logo({ size = 56, className, src }: { size?: number; className?: string; src?: string | null }) {
  return (
    <Image
      src={src || "/logo-transparent.svg"}
      alt="Dulces Detalles by Bere Álvarez"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
      unoptimized
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("leading-none", className)}>
      <p className="font-script text-[26px] font-bold text-cocoa-600">Dulces</p>
      <p className="-mt-1 text-[11px] font-bold tracking-[0.28em] text-mint-500 uppercase">Detalles</p>
    </div>
  );
}
