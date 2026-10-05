import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Storefront, type StoreData } from "@/components/store/Storefront";

async function getStore(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_store", { p_slug: slug });
  return (data as StoreData | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStore(slug);
  if (!data) return { title: "Tienda no disponible" };
  return {
    title: data.store.title,
    description: data.store.description ?? `Pide tus postres favoritos de ${data.store.business_name}`,
    openGraph: { images: [data.store.banner_url ?? data.store.logo_url ?? "/logo.png"] },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStore(slug);
  if (!data) notFound();
  return <Storefront data={data} slug={slug} />;
}
