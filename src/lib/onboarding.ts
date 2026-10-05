"use client";
import { createClient } from "./supabase/client";
import type { Profile } from "./types";

/** Marca un paso de la guía de primeros pasos (p. ej. "shared" al compartir la tienda) */
export async function markOnboarding(profile: Profile, key: string, setProfile?: (p: Profile) => void) {
  if (profile.onboarding?.[key]) return;
  const onboarding = { ...(profile.onboarding ?? {}), [key]: true };
  const { data } = await createClient().from("profiles").update({ onboarding }).eq("id", profile.id).select().single();
  if (data && setProfile) setProfile(data as Profile);
}
