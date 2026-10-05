"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type Ctx = { profile: Profile; setProfile: (p: Profile) => void; refresh: () => Promise<void> };
const BusinessCtx = createContext<Ctx | null>(null);

export function BusinessProvider({ initial, children }: { initial: Profile; children: React.ReactNode }) {
  const [profile, setProfile] = useState(initial);
  const refresh = useCallback(async () => {
    const { data } = await createClient().from("profiles").select("*").eq("id", initial.id).single();
    if (data) setProfile(data as Profile);
  }, [initial.id]);
  return <BusinessCtx.Provider value={{ profile, setProfile, refresh }}>{children}</BusinessCtx.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessCtx);
  if (!ctx) throw new Error("useBusiness fuera de BusinessProvider");
  return ctx;
}
