"use client";
import { Gift, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Tarjeta de sellos de una clienta: círculos llenos, premio y canje */
export function LoyaltyStamps({
  stamps,
  needed,
  reward,
  onRedeem,
  waHref,
  compact = false,
}: {
  stamps: number;
  needed: number;
  reward: string;
  onRedeem?: () => void;
  waHref?: string | null;
  compact?: boolean;
}) {
  const filled = Math.min(stamps, needed);
  const ready = stamps >= needed;
  if (compact)
    return (
      <div className="flex items-center gap-1" title={`${filled} de ${needed} sellos`}>
        {Array.from({ length: needed }, (_, i) => (
          <span key={i} className={cn("h-2 flex-1 rounded-full", i < filled ? (ready ? "bg-mint-400" : "bg-rose-400") : "bg-cocoa-800/10")} />
        ))}
      </div>
    );
  return (
    <div className={cn("rounded-3xl p-4 ring-1", ready ? "bg-mint-50 ring-mint-200" : "bg-rose-50/60 ring-rose-100")}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold text-cocoa-700"><Gift className="h-4 w-4 text-rose-400" /> Tarjeta de sellos</p>
        <p className="text-sm font-bold text-cocoa-600 tabular-nums">{filled} / {needed}</p>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: needed }, (_, i) => (
          <span key={i} className={cn("grid aspect-square place-items-center rounded-full border-2 text-base", i < filled ? "border-rose-300 bg-white" : "border-dashed border-cocoa-800/15")}>
            {i < filled ? "🧁" : i === needed - 1 ? "🎁" : ""}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-cocoa-500">{ready ? <>¡Completó su tarjeta! Premio: <b>{reward}</b></> : <>Le faltan {needed - filled} para {reward}</>}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ready && onRedeem && <Button size="sm" variant="mint" onClick={onRedeem}><Gift className="h-4 w-4" /> Canjear premio</Button>}
        {waHref && (
          <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-bold text-mint-700 ring-1 ring-mint-200 hover:bg-mint-50">
            <MessageCircle className="h-4 w-4" /> Avisarle sus sellos
          </a>
        )}
      </div>
    </div>
  );
}
