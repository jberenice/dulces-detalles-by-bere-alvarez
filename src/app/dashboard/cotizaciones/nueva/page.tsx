"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuoteForm } from "@/components/dashboard/QuoteForm";

function NewQuote() {
  const p = useSearchParams();
  return <QuoteForm initialClientId={p.get("cliente")} initialDessertId={p.get("postre")} />;
}

export default function NewQuotePage() {
  return (
    <Suspense>
      <NewQuote />
    </Suspense>
  );
}
