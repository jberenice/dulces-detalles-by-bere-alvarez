/** Zonas horarias de México (IANA). Se puede elegir cualquier otra detectada por el navegador. */
export const MX_TIMEZONES = [
  { value: "America/Cancun", label: "Zona Sureste · Quintana Roo (Cancún, Chetumal)" },
  { value: "America/Mexico_City", label: "Zona Centro · CDMX, Guadalajara, Monterrey, Mérida" },
  { value: "America/Mazatlan", label: "Zona Pacífico · Sinaloa, Nayarit, BCS" },
  { value: "America/Hermosillo", label: "Sonora (Hermosillo)" },
  { value: "America/Tijuana", label: "Zona Noroeste · Baja California (Tijuana)" },
  { value: "America/Chihuahua", label: "Chihuahua" },
  { value: "America/Ciudad_Juarez", label: "Ciudad Juárez" },
  { value: "America/Matamoros", label: "Frontera noreste (Matamoros, Reynosa)" },
];

export function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";
  } catch {
    return "America/Mexico_City";
  }
}

export function timezoneLabel(tz: string) {
  return MX_TIMEZONES.find((z) => z.value === tz)?.label ?? tz.replace(/_/g, " ");
}

/** Hora actual en la zona horaria dada, p. ej. "8:15 p.m." */
export function nowIn(tz: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date());
  } catch {
    return "";
  }
}

export const hourLabel = (h: number) => new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2020, 0, 1, h)));
