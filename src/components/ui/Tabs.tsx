"use client";
import { cn } from "@/lib/cn";

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-cream-200/80 p-1 scrollbar-none", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap transition",
            value === o.value ? "bg-white text-cocoa-700 shadow-soft" : "text-cocoa-400 hover:text-cocoa-600",
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={cn("rounded-full px-2 text-[11px]", value === o.value ? "bg-rose-100 text-rose-600" : "bg-cocoa-800/5")}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
