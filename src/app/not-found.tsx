import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="sprinkles grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Image src="/logo-transparent.svg" unoptimized alt="" width={180} height={180} className="mx-auto opacity-90" />
        <p className="mt-4 font-script text-3xl text-rose-500">¡Ups! Esta página se nos derritió</p>
        <h1 className="mt-1 text-3xl font-semibold">No encontramos lo que buscas</h1>
        <ButtonLink href="/" className="mt-6">Volver al inicio</ButtonLink>
      </div>
    </div>
  );
}
