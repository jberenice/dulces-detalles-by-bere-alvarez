"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BarChart3, CakeSlice, CalendarDays, ChefHat, ChevronLeft, ChevronRight, FileText, Store } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { welcomeSeenKey } from "@/lib/tutorial";
import { cn } from "@/lib/cn";

const SLIDES = [
  { icon: null, title: "¡Bienvenida a Dulces Detalles!", text: "Tu repostería organizada en un solo lugar: costos, cotizaciones, pedidos, producción y tu propia tienda en línea. Te mostramos lo esencial en 1 minuto." },
  { icon: CakeSlice, title: "Costea cada receta", text: "Registra ingredientes, empaques y gastos fijos. Cada postre te dice cuánto cuesta realmente y a cuánto venderlo con tu margen de ganancia." },
  { icon: FileText, title: "Cotiza en segundos", text: "Elige postres y el precio se llena solo. Envía un PDF precioso con tu logo por WhatsApp o correo; tu cliente puede aceptarlo en línea." },
  { icon: CalendarDays, title: "Pedidos y calendario", text: "Lleva tus entregas, anticipos y saldos. Te avisamos el día de cada entrega con notificaciones y un resumen por correo." },
  { icon: ChefHat, title: "Producción e inventario", text: "Sabe exactamente qué hornear y qué comprar cada semana. Tus existencias se descuentan solas al entregar un pedido." },
  { icon: Store, title: "Tu tienda en línea", text: "Diseña tu tienda con tus colores. Tus clientes eligen sus postres y el pedido te llega a WhatsApp y a tu panel." },
  { icon: BarChart3, title: "¡Listo para empezar!", text: "Sigue el tutorial paso a paso: se va palomeando solo conforme exploras cada sección." },
];

/** Carrusel de bienvenida: aparece la primera vez (o con ?tutorial=1) y se puede volver a abrir desde el Tutorial */
export function WelcomeTour() {
  const { profile } = useBusiness();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    const force = new URLSearchParams(window.location.search).get("tutorial") === "1";
    let seen = false;
    try {
      seen = !!localStorage.getItem(welcomeSeenKey(profile.id));
    } catch {}
    if (force || !seen) {
      setOpen(true);
      if (force) window.history.replaceState(null, "", window.location.pathname);
    }
    const reopen = () => {
      setI(0);
      setOpen(true);
    };
    window.addEventListener("dd-welcome", reopen);
    return () => window.removeEventListener("dd-welcome", reopen);
  }, [profile.id]);

  function close() {
    try {
      localStorage.setItem(welcomeSeenKey(profile.id), "1");
    } catch {}
    setOpen(false);
  }

  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  const Icon = s.icon;

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      footer={
        <>
          <Button variant="ghost" className="sm:mr-auto" onClick={close}>Omitir</Button>
          {i > 0 && <Button variant="outline" onClick={() => setI(i - 1)}><ChevronLeft className="h-4 w-4" /> Atrás</Button>}
          {last ? (
            <Button
              onClick={() => {
                close();
                router.push("/dashboard/tutorial");
              }}
            >
              Empezar el tutorial
            </Button>
          ) : (
            <Button onClick={() => setI(i + 1)}>Siguiente <ChevronRight className="h-4 w-4" /></Button>
          )}
        </>
      }
    >
      <div className="sprinkles -mx-6 -mt-5 flex flex-col items-center px-6 pt-8 pb-2 text-center">
        <div key={i} className="animate-fade-up">
          {Icon ? (
            <span className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-rose-50 text-rose-500 shadow-soft">
              <Icon className="h-11 w-11" />
            </span>
          ) : (
            <Image src="/logo-transparent.png" alt="Dulces Detalles" width={140} height={140} className="mx-auto" />
          )}
          <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">{s.title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-cocoa-500">{s.text}</p>
        </div>
        <div className="mt-6 flex gap-1.5">
          {SLIDES.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Paso ${k + 1}`} className={cn("h-2 rounded-full transition-all", k === i ? "w-6 bg-rose-500" : "w-2 bg-cocoa-800/15")} />
          ))}
        </div>
      </div>
    </Modal>
  );
}
