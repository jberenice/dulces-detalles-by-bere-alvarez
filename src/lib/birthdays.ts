/** Próximo cumpleaños a partir de una fecha de nacimiento (el año puede ser cualquiera) */
export function nextBirthday(birthday: string, today: string) {
  const [, m, d] = birthday.split("-").map(Number);
  const y = Number(today.slice(0, 4));
  const iso = (yy: number) => {
    // 29 de febrero en año no bisiesto → 28
    const leap = (yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0;
    const day = m === 2 && d === 29 && !leap ? 28 : d;
    return `${yy}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  let next = iso(y);
  if (next < today) next = iso(y + 1);
  const days = Math.round((Date.parse(next + "T12:00:00Z") - Date.parse(today + "T12:00:00Z")) / 86400_000);
  const born = Number(birthday.slice(0, 4));
  const age = born > 1900 && born < y ? Number(next.slice(0, 4)) - born : null;
  return { date: next, days, age };
}

export const birthdayWhen = (days: number) => (days === 0 ? "¡Hoy!" : days === 1 ? "Mañana" : `En ${days} días`);
