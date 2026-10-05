import type { Season } from "./types";

/** Fechas especiales sugeridas (mes-día). Se pueden editar o crear otras a mano. */
export const SEASON_PRESETS: { name: string; emoji: string; start: string; end: string; banner: string }[] = [
  { name: "Día de Reyes", emoji: "👑", start: "12-28", end: "01-06", banner: "¡Ya tenemos roscas de Reyes! Apártala con tiempo." },
  { name: "San Valentín", emoji: "💘", start: "02-01", end: "02-14", banner: "Endulza el 14 de febrero: pide tu detalle con anticipación." },
  { name: "Flores amarillas (primavera)", emoji: "🌻", start: "03-12", end: "03-21", banner: "Regala flores amarillas… ¡en versión postre! 🌻" },
  { name: "Día del niño", emoji: "🎈", start: "04-20", end: "04-30", banner: "Postres para celebrar a los peques." },
  { name: "Día de las Madres", emoji: "💐", start: "04-28", end: "05-10", banner: "Sorprende a mamá este 10 de mayo." },
  { name: "Día del maestro", emoji: "🍎", start: "05-08", end: "05-15", banner: "Un dulce detalle para tu maestra o maestro." },
  { name: "Día del Padre", emoji: "👔", start: "06-08", end: "06-21", banner: "Celebra a papá con su postre favorito." },
  { name: "Graduaciones", emoji: "🎓", start: "06-01", end: "07-15", banner: "Celebra la graduación con un pastel especial." },
  { name: "Día del abuelo", emoji: "👵", start: "08-20", end: "08-28", banner: "Consiente a los abuelitos este 28 de agosto." },
  { name: "Fiestas patrias", emoji: "🇲🇽", start: "09-01", end: "09-16", banner: "¡Viva México! Postres para tu noche mexicana." },
  { name: "Flores amarillas (otoño)", emoji: "🌼", start: "09-12", end: "09-21", banner: "21 de septiembre: regala flores amarillas dulces." },
  { name: "Día del novio", emoji: "💙", start: "09-25", end: "10-03", banner: "3 de octubre: consiente a tu novio con algo dulce." },
  { name: "Halloween", emoji: "🎃", start: "10-15", end: "10-31", banner: "Postres de miedo… ¡de ricos! 🎃" },
  { name: "Día de Muertos", emoji: "💀", start: "10-20", end: "11-02", banner: "Pan de muerto y postres para tu ofrenda." },
  { name: "Navidad", emoji: "🎄", start: "12-01", end: "12-25", banner: "Pide tus postres navideños con anticipación." },
  { name: "Año Nuevo", emoji: "🥂", start: "12-26", end: "12-31", banner: "Cierra el año con algo dulce." },
];

const mmdd = (iso: string) => iso.slice(5, 10);

/** Igual que season_on() en la base de datos */
export function seasonOn(s: Pick<Season, "active" | "yearly" | "start_date" | "end_date">, today: string) {
  if (!s.active) return false;
  if (!s.yearly) return today >= s.start_date && today <= s.end_date;
  const a = mmdd(s.start_date);
  const b = mmdd(s.end_date);
  const x = mmdd(today);
  return a <= b ? x >= a && x <= b : x >= a || x <= b;
}

/** Próxima fecha (ISO) en que empieza la temporada, o null si ya no se repite */
export function nextStart(s: Pick<Season, "yearly" | "start_date" | "end_date">, today: string) {
  if (!s.yearly) return s.start_date > today ? s.start_date : null;
  const y = Number(today.slice(0, 4));
  const cand = `${y}-${mmdd(s.start_date)}`;
  return cand > today ? cand : `${y + 1}-${mmdd(s.start_date)}`;
}

export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400_000);

/** "28 oct – 2 nov" */
export function seasonRange(s: Pick<Season, "start_date" | "end_date" | "yearly">) {
  const f = (iso: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC", ...(s.yearly ? {} : { year: "numeric" }) }).format(new Date(iso + "T12:00:00Z"));
  return `${f(s.start_date)} – ${f(s.end_date)}`;
}

/** Fecha de una sugerencia para el año que viene primero */
export function presetDates(p: { start: string; end: string }, today: string) {
  const y = Number(today.slice(0, 4));
  let start = `${y}-${p.start}`;
  let end = `${p.start <= p.end ? y : y + 1}-${p.end}`;
  // Si ya pasó este año, se propone el siguiente
  if (end < today) {
    start = `${y + 1}-${p.start}`;
    end = `${p.start <= p.end ? y + 1 : y + 2}-${p.end}`;
  }
  return { start, end };
}

/** Código de cupón al azar, fácil de dictar (sin 0/O ni 1/I) */
export function randomCode(prefix = "") {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return (prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) + s).slice(0, 20);
}
