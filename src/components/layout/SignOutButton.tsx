"use client";
import { LogOut } from "lucide-react";
import { signOutDevice } from "@/lib/session";
import { Button } from "@/components/ui/Button";

export function SignOutButton({ compact }: { compact?: boolean }) {
  if (compact)
    return (
      <button onClick={signOutDevice} className="rounded-xl p-2 text-cocoa-400 hover:bg-rose-50 hover:text-rose-500" aria-label="Cerrar sesión">
        <LogOut className="h-5 w-5" />
      </button>
    );
  return (
    <Button variant="outline" onClick={signOutDevice}>
      <LogOut className="h-4 w-4" /> Cerrar sesión
    </Button>
  );
}
