import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicQuote, type PublicQuoteData } from "@/components/store/PublicQuote";

async function getQuote(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_quote", { p_token: token });
  return (data as PublicQuoteData | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const d = await getQuote(token);
  return { title: d ? `Cotización ${d.business.business_name}` : "Cotización", robots: { index: false } };
}

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getQuote(token);
  if (!data) notFound();
  return <PublicQuote data={data} token={token} />;
}
