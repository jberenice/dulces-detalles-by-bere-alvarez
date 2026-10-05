import { LEGAL } from "@/lib/legal";

export type LegalSection = { title: string; body: React.ReactNode };

export function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: React.ReactNode; sections: LegalSection[] }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="font-script text-2xl text-rose-500">{eyebrow}</p>
      <h1 className="mt-1 text-[34px] leading-tight font-semibold sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-cocoa-400">Última actualización: {LEGAL.updatedAt}</p>
      <div className="mt-6 text-[15px] leading-relaxed text-cocoa-600">{intro}</div>

      <nav className="mt-8 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-cocoa-800/5">
        <p className="text-xs font-bold tracking-widest text-cocoa-300 uppercase">Contenido</p>
        <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.title}>
              <a href={`#s${i + 1}`} className="text-cocoa-600 hover:text-rose-500">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-9">
        {sections.map((s, i) => (
          <section key={s.title} id={`s${i + 1}`} className="scroll-mt-24">
            <h2 className="text-2xl font-semibold">
              <span className="text-rose-400">{i + 1}.</span> {s.title}
            </h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-cocoa-600 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:text-cocoa-800 [&_ul]:space-y-1.5">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
