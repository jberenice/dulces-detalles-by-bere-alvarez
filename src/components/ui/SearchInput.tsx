"use client";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function SearchInput({ value, onChange, placeholder = "Buscar…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-cocoa-300" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field h-11 !rounded-2xl pl-10" />
    </div>
  );
}

export const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const matches = (q: string, ...fields: (string | null | undefined)[]) => {
  const n = normalize(q.trim());
  return !n || fields.some((f) => f && normalize(f).includes(n));
};
