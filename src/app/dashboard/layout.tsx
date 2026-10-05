import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessProvider } from "@/components/layout/BusinessProvider";
import { Shell } from "@/components/layout/Shell";
import { ConfirmProvider } from "@/components/ui/Confirm";
import type { Profile } from "@/lib/types";
import type { PlanInfo } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");
  // Si la migración 0010 aún no se ejecuta, no se bloquea nada
  const { data: planData, error: planError } = await supabase.rpc("my_plan");
  const plan: PlanInfo = planError
    ? { plan: "premium", billing: null, expires_at: null }
    : { plan: "basico", billing: null, expires_at: null, ...((planData as Partial<PlanInfo>) ?? {}) };

  return (
    <BusinessProvider initial={profile as Profile} plan={plan}>
      <ConfirmProvider>
        <Shell>{children}</Shell>
      </ConfirmProvider>
    </BusinessProvider>
  );
}
