"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";
import { useBusiness } from "./BusinessProvider";
import { salesLink } from "@/lib/legal";

/** Franja superior visible solo en cuentas demo */
export function DemoBanner() {
  const { profile } = useBusiness();
  const [left, setLeft] = useState("");

  useEffect(() => {
    if (!profile.is_demo || !profile.demo_expires_at) return;
    const tick = () => {
      const ms = new Date(profile.demo_expires_at!).getTime() - Date.now();
      const h = Math.max(0, Math.floor(ms / 3600000));
      setLeft(h >= 1 ? `${h} h` : `${Math.max(0, Math.floor(ms / 60000))} min`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [profile.is_demo, profile.demo_expires_at]);

  if (!profile.is_demo) return null;
  return (
    <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-cocoa-800 px-4 py-2 text-center text-[13px] text-cream-100">
      <span className="flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-rose-300" /> Estás en la <b>demo</b>{left && <> · se borra en {left}</>}
      </span>
      <span className="flex items-center gap-3">
        <Link href="/dashboard/tutorial" className="flex items-center gap-1 font-bold text-mint-300 hover:underline"><GraduationCap className="h-4 w-4" /> Tutorial</Link>
        <a href={salesLink()} target="_blank" rel="noopener noreferrer" className="rounded-full bg-rose-500 px-3 py-1 font-bold text-white hover:bg-rose-600">Quiero mi licencia</a>
      </span>
    </div>
  );
}
