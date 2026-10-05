/**
 * Alérgenos principales (NOM-051) y ayuda para armar la lista de ingredientes de la etiqueta.
 */
export const ALLERGENS: { id: string; label: string; words: RegExp }[] = [
  { id: "gluten", label: "Trigo (gluten)", words: /harina|trigo|galleta|pan molido|pan |bizcocho|avena|cebada|centeno|maicena de trigo|oreo|mar[ií]a|graham|hojaldre|wafer|barquillo/i },
  { id: "huevo", label: "Huevo", words: /huevo|clara|yema|merengue|mayonesa/i },
  { id: "leche", label: "Leche", words: /leche|crema|queso|mantequilla|yogur|lechera|condensada|evaporada|nata|suero|chocolate blanco|cajeta|dulce de leche|media crema|ganache|buttercream|philadelphia/i },
  { id: "nueces", label: "Nueces y frutos secos", words: /nuez|almendra|avellana|pistache|pistacho|macadamia|nutella|pecana|pi[ñn][oó]n|marañ[oó]n|praline/i },
  { id: "cacahuate", label: "Cacahuate", words: /cacahuate|man[ií]|crema de cacahuate|mazap[aá]n/i },
  { id: "soya", label: "Soya", words: /soya|soja|lecitina/i },
  { id: "ajonjoli", label: "Ajonjolí", words: /ajonjol[ií]|s[eé]samo/i },
  { id: "sulfitos", label: "Sulfitos", words: /vino|sulfito|fruta seca|pasas|ar[aá]ndano seco/i },
  { id: "pescado", label: "Pescado", words: /pescado|gelatina de pescado/i },
  { id: "crustaceos", label: "Crustáceos y mariscos", words: /camar[oó]n|marisco|langosta|cangrejo/i },
];

export const allergenLabel = (id: string) => ALLERGENS.find((a) => a.id === id)?.label ?? id;

/** Detecta alérgenos por el nombre de los ingredientes */
export function detectAllergens(names: string[]) {
  return ALLERGENS.filter((a) => names.some((n) => a.words.test(` ${n} `))).map((a) => a.id);
}

/** Cantidad aproximada en gramos para ordenar ingredientes de mayor a menor (como pide la etiqueta) */
function grams(qty: number, unit: string) {
  const u = unit.toLowerCase();
  if (u === "kg" || u === "l" || u === "lt") return qty * 1000;
  if (u === "g" || u === "ml" || u === "gr") return qty;
  if (u === "pz" || u === "pza" || u === "pieza") return qty * 50;
  return qty;
}

/** "Harina de trigo, azúcar, huevo, leche…" en orden de mayor a menor cantidad */
export function ingredientsText(items: { name: string; quantity: number; unit: string }[]) {
  const sum = new Map<string, number>();
  for (const it of items) {
    const name = it.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    sum.set(key, (sum.get(key) ?? 0) + grams(Number(it.quantity) || 0, it.unit));
  }
  const names = new Map(items.map((i) => [i.name.trim().toLowerCase(), i.name.trim()]));
  const list = [...sum.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => names.get(k)!);
  if (!list.length) return "";
  const text = list.map((n, i) => (i === 0 ? n.charAt(0).toUpperCase() + n.slice(1) : n.toLowerCase())).join(", ");
  return `${text}.`;
}

/** "Contiene: leche, huevo y trigo (gluten)." */
export function containsText(ids: string[]) {
  const labels = ids.map((id) => allergenLabel(id).toLowerCase());
  if (!labels.length) return "";
  return labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

/** Fecha de consumo preferente a partir de la fecha de elaboración */
export function bestBefore(madeOn: string, days: number) {
  const d = new Date(madeOn + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}
