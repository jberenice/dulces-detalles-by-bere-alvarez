import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm, type ReviewPageData } from "@/components/store/ReviewForm";

async function getReview(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_review", { p_token: token });
  return (data as ReviewPageData | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const d = await getReview(token);
  return { title: d ? `¿Qué te pareció? · ${d.business_name}` : "Reseña", robots: { index: false } };
}

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getReview(token);
  if (!data) notFound();
  return <ReviewForm data={data} token={token} />;
}
