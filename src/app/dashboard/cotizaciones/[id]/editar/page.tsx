"use client";
import { use } from "react";
import { QuoteForm } from "@/components/dashboard/QuoteForm";

export default function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <QuoteForm quoteId={id} />;
}
