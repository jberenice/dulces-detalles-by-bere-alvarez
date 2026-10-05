"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, GraduationCap, Lightbulb, PlayCircle, RotateCcw } from "lucide-react";
import { useBusiness } from "@/components/layout/BusinessProvider";
import { Card, PageHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TUTORIAL_STEPS, getProgress, setProgress } from "@/lib/tutorial";
import { cn } from "@/lib/cn";

export default function TutorialPage() {
  const { profile } = useBusiness();
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const read = () => setDone(getProgress(profile.id));
    read();
    window.addEventListener("dd-tutorial", read);
    return () => window.removeEventListener("dd-tutorial", read);
  }, [profile.id]);

  const pct = Math.round((done.length / TUTORIAL_STEPS.length) * 100);
  const next = TUTORIAL_STEPS.find((s) => !done.includes(s.id));
  const toggle = (id: string) => setProgress(profile.id, done.includes(id) ? done.filter((d) => d !== id) : [...done, id]);

  return (
    <>
      <PageHeader
        eyebrow="Aprende en 10 minutos"
        title="Tutorial"
        subtitle="Sigue estos pasos para conocer todo lo que puedes hacer. Se palomean solos cuando visitas cada sección."
        actions={
          <>
            <Button variant="outline" onClick={() => window.dispatchEvent(new Event("dd-welcome"))}><PlayCircle className="h-4 w-4" /> Ver bienvenida</Button>
            {done.length > 0 && <Button variant="ghost" onClick={() => setProgress(profile.id, [])}><RotateCcw className="h-4 w-4" /> Reiniciar</Button>}
          </>
        }
      />

      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-mint-50 text-mint-600"><GraduationCap className="h-7 w-7" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-cocoa-700">{pct === 100 ? "¡Completaste el tutorial! 🎉" : `Llevas ${done.length} de ${TUTORIAL_STEPS.length} pasos`}</p>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-cream-200">
              <div className="h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-500 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {next && (
            <ButtonLink href={next.path} className="shrink-0">
              Siguiente paso <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          )}
        </div>
      </Card>

      <ol className="grid gap-3 lg:grid-cols-2">
        {TUTORIAL_STEPS.map((s, i) => {
          const ok = done.includes(s.id);
          return (
            <li key={s.id}>
              <Card className={cn("flex h-full gap-4 p-5 transition", ok ? "bg-mint-50/40" : next?.id === s.id && "ring-2 ring-rose-200")}>
                <button
                  onClick={() => toggle(s.id)}
                  className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-lg font-semibold transition", ok ? "bg-mint-500 text-white" : "bg-rose-50 text-rose-500 hover:bg-rose-100")}
                  aria-label={ok ? "Marcar como pendiente" : "Marcar como hecho"}
                >
                  {ok ? <Check className="h-5 w-5" /> : i + 1}
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className={cn("text-lg font-semibold", ok && "text-cocoa-500")}>{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-cocoa-500">{s.text}</p>
                  {s.tip && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-cocoa-400">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {s.tip}
                    </p>
                  )}
                  <Link href={s.path} className="mt-3 inline-flex items-center gap-1.5 self-start text-sm font-bold text-rose-500 hover:underline">
                    {ok ? "Volver a ver" : "Ir ahora"} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </>
  );
}
