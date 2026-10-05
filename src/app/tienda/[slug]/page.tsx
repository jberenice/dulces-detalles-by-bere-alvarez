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
  const description = data.store.description ?? `Pide tus postres favoritos de ${data.store.business_name}`;
  // La imagen para compartir la genera opengraph-image.tsx (logo + foto de un postre)
  return {
    title: { absolute: data.store.title },
    description,
    alternates: { canonical: `/tienda/${slug}` },
    openGraph: { title: data.store.title, description, url: `/tienda/${slug}`, siteName: data.store.business_name, type: "website", locale: "es_MX" },
    twitter: { card: "summary_large_image", title: data.store.title, description },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStore(slug);
  if (!data) notFound();
  return <Storefront data={data} slug={slug} />;
}
