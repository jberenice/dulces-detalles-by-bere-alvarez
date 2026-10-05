import { ShieldAlert } from "lucide-react";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default async function InactiveLicensePage({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  return (
    <div className="text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-[30px] font-semibold">Licencia {motivo === "vencida" ? "vencida" : "suspendida"}</h1>
      <p className="mt-3 text-[15px] text-cocoa-400">
        Tu acceso al panel está pausado. Comunícate con Dulces Detalles para renovar o reactivar tu licencia. Tus datos están seguros y
        seguirán ahí.
      </p>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
